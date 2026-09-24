/**
 * GEO 月度全站审计 Cron(GEO-08 / GEO-04)—— 分片续跑
 *
 * 每日 09:00(北京)cron 调用:每月 1 号自动开新周期,之后每天续跑一个分片,
 * 全部完成后自动为低分页生成补强补丁(DeepSeek)。
 * 分片原因:Workers 每次调用子请求上限 50(免费档),214 页必须拆 ~6 天跑完;
 * 手动触发(force)不限日期,Admin 端循环调用可一次性跑完。
 *
 * KV:geo:scores(全量评分)、geo:patches(补丁)、geo:audit:progress(分片进度)
 */

import type { Env } from '../index';
import { computeGeoScore } from '../lib/geo-score';
import { callDeepSeek } from '../lib/deepseek';
import { getJSON, setJSON } from '../lib/kv';

const SCORE_CONCURRENCY = 8;
/** 每轮生成补丁的低分页数量（DeepSeek 分两批，控制在时长与 token 限制内） */
const PATCH_TARGET_COUNT = 20;
const PATCH_BATCH = 10;

interface ScoreRow {
  page_url: string;
  title?: string;
  score: number;
  schema_completeness: number;
  citation_friendliness: number;
  fact_density: number;
  scored_at: string;
}

export interface GeoPatch {
  slug: string;
  page_url: string;
  title: string;
  definition_sentence: string;
  fact_points: Array<{ value: string; context: string }>;
  current_score: number;
  status: 'pending' | 'approved' | 'applied' | 'dismissed';
  created_at: string;
  pr_url?: string;
}

async function collectUrls(env: Env): Promise<string[]> {
  const { buildSitemap } = await import('../lib/sitemap');
  const sitemap = await buildSitemap(env);
  return [...sitemap.xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}

/**
 * 取页面 HTML:优先 ASSETS(静态页,与访客所见一致),回退 KV published:{slug}(动态文章)。
 * 不 fetch 自身公网域名——Worker 回环抓取在本环境不可靠(实测 214 页全部失败)。
 */
async function fetchPageHtml(env: Env, url: string): Promise<string | null> {
  const path = new URL(url).pathname;
  const assetPath = path === '/' ? '/index.html' : path;
  let html: string | null = null;
  try {
    const resp = await env.ASSETS.fetch(`https://www.kestrelmetal.com${assetPath}`);
    if (resp.ok) html = await resp.text();
  } catch {
    // 子请求配额耗尽等情况——继续尝试 KV
  }
  if (!html) {
    const slug = path.replace(/^\//, '').replace(/\.html$/, '');
    if (slug && !slug.includes('/') && !slug.includes('.')) {
      try {
        const published = (await env.CONTENT_QUEUE.get(`published:${slug}`, 'json')) as { html?: string } | null;
        if (published?.html) html = published.html;
      } catch {}
    }
  }
  return html || null;
}

async function fetchAndScore(env: Env, url: string): Promise<ScoreRow | null> {
  try {
    const html = await fetchPageHtml(env, url);
    if (!html) return null;
    const geo = computeGeoScore(html);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return {
      page_url: url,
      title: titleMatch ? titleMatch[1].replace(/\s*\|.*$/, '').trim() : url,
      ...geo,
      scored_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** 并发评分全站；返回成功行（失败页跳过，下轮再评） */
async function scoreAllPages(env: Env, urls: string[]): Promise<ScoreRow[]> {
  const rows: ScoreRow[] = [];
  for (let i = 0; i < urls.length; i += SCORE_CONCURRENCY) {
    const batch = urls.slice(i, i + SCORE_CONCURRENCY);
    const results = await Promise.all(batch.map((u) => fetchAndScore(env, u)));
    for (const r of results) if (r) rows.push(r);
  }
  return rows;
}

interface PatchAiOutput {
  patches: Array<{
    slug: string;
    definition_sentence: string;
    fact_points: Array<{ value: string; context: string }>;
  }>;
}

async function generatePatchBatch(env: Env, rows: ScoreRow[]): Promise<GeoPatch[]> {
  const systemPrompt =
    'You are a GEO (Generative Engine Optimization) specialist for Kestrel Metal (kestrelmetal.com), a wire mesh fence manufacturer in Anping, China. Respond ONLY with valid JSON.';
  const pageList = rows.map(
    (r) => `- slug: ${r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, "")}\n  title: ${r.title}\n  current GEO score: ${r.score} (citation ${r.citation_friendliness}, facts ${r.fact_density})`,
  );
  const userPrompt = `For each page below, write a reinforcement patch that makes it more quotable by AI search engines.

Rules:
- definition_sentence: ONE self-contained sentence ("<Product> is a <category> used for <primary use>, <key differentiator>"). It must make sense quoted out of context and must match what the page actually sells.
- fact_points: 3-5 SHORT factual data points, each written as a number with a unit plus 5-10 words of context (e.g. {value: "40-270 g/m²", context: "zinc coating weight options"}). Use realistic B2B specs for this product type (dimensions, coating, capacity, lead time, standards). Never invent certifications the company does not hold (we hold ISO 9001:2015, CE, UKCA, REACH).
- slug: echo the input slug exactly.

Pages:
${pageList.join('\n')}

JSON format: {"patches": [{"slug": "...", "definition_sentence": "...", "fact_points": [{"value": "...", "context": "..."}]}]}`;

  const resp = await callDeepSeek(
    { DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY, DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat' },
    systemPrompt,
    userPrompt,
  );
  const match = resp.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in patch response');
  const parsed = JSON.parse(match[0]) as PatchAiOutput;
  if (!Array.isArray(parsed.patches)) throw new Error('Malformed patches JSON');

  const bySlug = new Map(rows.map((r) => [r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, ''), r]));
  return parsed.patches
    .filter((p) => p.slug && p.definition_sentence && Array.isArray(p.fact_points) && p.fact_points.length > 0)
    .map((p) => {
      const row = bySlug.get(p.slug);
      return {
        slug: p.slug,
        page_url: row?.page_url ?? `https://www.kestrelmetal.com/${p.slug}.html`,
        title: row?.title ?? p.slug,
        definition_sentence: p.definition_sentence,
        fact_points: p.fact_points.slice(0, 5),
        current_score: row?.score ?? 0,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };
    });
}

export interface AuditResult {
  summary: string;
  done: boolean;
  scored: number;
  total: number;
}

/** 每次调用最多评分页数:Workers 每次调用子请求上限 50(含 1 次 sitemap 抓取),留足余量 */
const CHUNK_SIZE = 40;

interface AuditProgress {
  cycle: string; // kickoff 月份 YYYY-MM
  remaining: string[];
  total: number;
  scored: number;
  startedAt: string;
}

const PROGRESS_KEY = 'geo:audit:progress';

function beijingMonth(): string {
  const d = new Date(Date.now() + 8 * 3600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function beijingDayOfMonth(): number {
  return new Date(Date.now() + 8 * 3600_000).getUTCDate();
}

/**
 * 分片续跑的全站审计:每次调用评一批(CHUNK_SIZE),进度存 KV。
 * cron 每日 09:00(北京)调用——1 号自动开新周期,随后每天续跑至完成;
 * 手动触发(force=true)不限日期,一轮一轮点或由 Admin 循环调用。
 */
export default async function geoAudit(env: Env, opts: { force?: boolean } = {}): Promise<AuditResult> {
  let progress = await getJSON<AuditProgress>(env.SEO_DATA, PROGRESS_KEY);

  if (!progress) {
    // cron 模式:仅每月 1 号开新周期;手动模式随时可开
    if (!opts.force && beijingDayOfMonth() !== 1) {
      return { summary: `跳过:今天不是 1 号(北京 ${beijingMonth()}-${beijingDayOfMonth()}),也无未完成周期`, done: true, scored: 0, total: 0 };
    }
    const urls = await collectUrls(env);
    if (urls.length === 0) {
      return { summary: 'sitemap 为空或抓取失败,未开始', done: true, scored: 0, total: 0 };
    }
    progress = { cycle: beijingMonth(), remaining: urls, total: urls.length, scored: 0, startedAt: new Date().toISOString() };
    console.log(`[geo-audit] New cycle ${progress.cycle}: ${urls.length} pages, chunked by ${CHUNK_SIZE}`);
  }

  // ── 评分本分片(与既有 geo:scores 按 page_url 合并) ──
  const chunk = progress.remaining.splice(0, CHUNK_SIZE);
  const rows = await scoreAllPages(env, chunk);
  progress.scored += rows.length;

  if (rows.length > 0) {
    const existingRows = (await getJSON<ScoreRow[]>(env.SEO_DATA, 'geo:scores')) ?? [];
    const byUrl = new Map(existingRows.map((r) => [r.page_url, r]));
    for (const r of rows) byUrl.set(r.page_url, r);
    await setJSON(env.SEO_DATA, 'geo:scores', Array.from(byUrl.values()));
  }

  const allRows = (await getJSON<ScoreRow[]>(env.SEO_DATA, 'geo:scores')) ?? [];
  const avg = allRows.length ? Math.round(allRows.reduce((s, r) => s + r.score, 0) / allRows.length) : 0;
  console.log(`[geo-audit] Chunk done: +${rows.length} scored, cycle ${progress.scored}/${progress.total}, site avg ${avg}`);

  // ── 全部跑完 → 生成低分页补丁,清进度 ──
  if (progress.remaining.length > 0) {
    await setJSON(env.SEO_DATA, PROGRESS_KEY, progress);
    return {
      summary: `分片完成:本轮 +${rows.length},周期累计 ${progress.scored}/${progress.total},次日 cron 自动续跑(或再次手动触发)`,
      done: false,
      scored: progress.scored,
      total: progress.total,
    };
  }

  let patchSummary = '未生成补丁';
  const dynamicSlugs = new Set(
    ((await getJSON<Array<{ slug: string }>>(env.CONTENT_QUEUE, 'published:all')) ?? []).map((p) => p.slug),
  );
  const lowest = allRows
    .filter((r) => {
      const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '');
      return slug !== '' && !dynamicSlugs.has(slug); // 动态文章生成侧已 GEO,不补
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, PATCH_TARGET_COUNT);

  const existingPatches = (await getJSON<GeoPatch[]>(env.SEO_DATA, 'geo:patches')) ?? [];
  const dismissedOrApplied = new Set(
    existingPatches.filter((p) => p.status === 'applied' || p.status === 'dismissed').map((p) => p.slug),
  );
  const pendingTargets = lowest.filter((r) => {
    const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '');
    return !dismissedOrApplied.has(slug);
  });

  if (env.DEEPSEEK_API_KEY && pendingTargets.length > 0) {
    // 保留已批准待开 PR 的旧补丁,新一轮结果按 slug 覆盖
    const keptApproved = existingPatches.filter((p) => p.status === 'approved');
    const fresh: GeoPatch[] = [];
    for (let i = 0; i < pendingTargets.length; i += PATCH_BATCH) {
      const batch = pendingTargets.slice(i, i + PATCH_BATCH);
      try {
        fresh.push(...(await generatePatchBatch(env, batch)));
        console.log(`[geo-audit] Patch batch ${Math.floor(i / PATCH_BATCH) + 1}: +${batch.length} targets`);
      } catch (err) {
        console.error('[geo-audit] Patch batch failed:', err);
      }
    }
    await setJSON(env.SEO_DATA, 'geo:patches', [...keptApproved, ...fresh]);
    patchSummary = `${fresh.length} 个低分页补丁待审核`;
    console.log(`[geo-audit] ${fresh.length} patches pending review`);
  }

  await setJSON(env.SEO_DATA, PROGRESS_KEY + ':last_cycle', { ...progress, finishedAt: new Date().toISOString() });
  await env.SEO_DATA.delete(PROGRESS_KEY);
  return {
    summary: `周期完成:${allRows.length} 页,全站平均 ${avg};${patchSummary}`,
    done: true,
    scored: progress.scored,
    total: progress.total,
  };
}
