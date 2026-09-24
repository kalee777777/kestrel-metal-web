/**
 * GEO 月度全站审计 Cron（GEO-08 / GEO-04）
 *
 * 每月 1 号 09:00（北京）执行：
 * 1. 拉 sitemap 全部 URL，逐页抓取并按 GEO 模型评分（lib/geo-score.ts，与 Admin 一致）
 *    → KV SEO_DATA `geo:scores`（Admin 评分表改读此数据源）
 * 2. 取分数最低的低分页，DeepSeek 生成补强补丁（定义句 + 数字事实点）
 *    → KV SEO_DATA `geo:patches`（status: pending，Admin 审核后经 GitHub PR 应用）
 *
 * 也可通过 POST /api/trigger/geo-audit 手动触发。
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
  const resp = await env.ASSETS.fetch(`https://www.kestrelmetal.com${assetPath}`);
  if (resp.ok) {
    const html = await resp.text();
    if (html) return html;
  }
  const slug = path.replace(/^\//, '').replace(/\.html$/, '');
  if (slug && !slug.includes('/') && !slug.includes('.')) {
    const published = (await env.CONTENT_QUEUE.get(`published:${slug}`, 'json')) as { html?: string } | null;
    if (published?.html) return published.html;
  }
  return null;
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

export default async function geoAudit(env: Env): Promise<string> {
  console.log('[geo-audit] Starting full-site GEO audit...');
  const urls = await collectUrls(env);
  console.log(`[geo-audit] Scoring ${urls.length} pages`);

  const rows = await scoreAllPages(env, urls);
  if (rows.length === 0) {
    return 'No pages scored (sitemap empty or fetch failures)';
  }
  await setJSON(env.SEO_DATA, 'geo:scores', rows);

  const avg = Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length);
  console.log(`[geo-audit] Scored ${rows.length}/${urls.length} pages, average ${avg}`);

  // 2. 低分页补丁（跳过已发布动态文章 —— 那些已在生成侧做过 GEO）
  const { getJSON: gkv } = await import('../lib/kv');
  const dynamicSlugs = new Set(
    ((await gkv<Array<{ slug: string }>>(env.CONTENT_QUEUE, 'published:all')) ?? []).map((p) => p.slug),
  );
  const lowest = rows
    .filter((r) => {
      const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '');
      return !dynamicSlugs.has(slug) && slug !== '';
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, PATCH_TARGET_COUNT);

  const existing = (await getJSON<GeoPatch[]>(env.SEO_DATA, 'geo:patches')) ?? [];
  const dismissedOrApplied = new Set(
    existing.filter((p) => p.status === 'applied' || p.status === 'dismissed').map((p) => p.slug),
  );
  const pendingTargets = lowest.filter((r) => {
    const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, '').replace(/\.html$/, '');
    return !dismissedOrApplied.has(slug);
  });

  if (!env.DEEPSEEK_API_KEY || pendingTargets.length === 0) {
    console.log('[geo-audit] Patch generation skipped');
    return `Scored ${rows.length} pages, average ${avg}; no patches generated`;
  }

  // 保留仍待审的旧补丁，新一轮结果按 slug 覆盖
  const keptPending = existing.filter((p) => p.status === 'approved');
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

  await setJSON(env.SEO_DATA, 'geo:patches', [...keptPending, ...fresh]);
  console.log(`[geo-audit] ${fresh.length} patches pending review`);
  return `Scored ${rows.length} pages (avg ${avg}); ${fresh.length} new patches pending review`;
}
