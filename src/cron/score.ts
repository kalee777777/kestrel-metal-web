/**
 * Phase 07: SEO/GEO 评分 + 自动发布 Cron 任务
 *
 * 每日 05:00 UTC+8 自动执行：
 * 1. 从草稿队列中获取待评分文章
 * 2. SEO 评分（13 项检查）+ GEO 评分（schema/可引用性/事实密度）
 * 3. 不达标自动修复（最多 3 轮，失分维度作为反馈传给重新生成）
 * 4. 达标（SEO ≥60 且 GEO ≥70）写入 KV published，Worker 动态渲染
 * 5. IndexNow 推送 + llms.txt 自动追加条目（GEO 闭环）
 */

import type { Env } from '../index';
import { scoreSEO } from '../lib/seo-score';
import { computeGeoScore, geoRepairHints } from '../lib/geo-score';
import type { GeoScoreResult } from '../lib/geo-score';
import { generateFullArticle } from '../lib/deepseek';
import { listKeys, getJSON, setJSON } from '../lib/kv';

/** GEO 发布门禁：低于此分不发布（模型见 lib/geo-score.ts） */
const GEO_MINIMUM_SCORE = 70;

interface DraftData {
  slug: string;
  title: string;
  metaDescription: string;
  html: string;
  keyword: string;
  groupId?: string;
  variants?: string[];
  status: string;
  score?: number;
  geoScore?: number;
  scoreRound?: number;
  images?: string[];
}

export default async function score(env: Env): Promise<void> {
  console.log('[score] Starting SEO scoring and deployment...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'draft:');

  if (keys.length === 0) {
    console.log('[score] No drafts found');
    return;
  }

  let deployed = 0;
  const publishedPaths: string[] = [];
  const publishedSlugs: string[] = [];

  for (const key of keys) {
    const draft = await getJSON<DraftData>(env.CONTENT_QUEUE, key.name);

    if (!draft || (draft.status !== 'queued' && draft.status !== 'image_gen' && draft.status !== 'skipped')) {
      continue;
    }

    try {
      console.log(`[score] Scoring: ${draft.slug}`);

      let currentHtml = draft.html;
      let currentScore = 0;
      let currentGeo: GeoScoreResult = { score: 0, schema_completeness: 0, citation_friendliness: 0, fact_density: 0 };
      let round = 0;

      while (round < 3) {
        round++;
        const result = scoreSEO(currentHtml, draft.keyword);
        currentGeo = computeGeoScore(currentHtml);
        currentScore = result.totalScore;

        console.log(
          `[score] Round ${round}: SEO ${currentScore}/100, GEO ${currentGeo.score}/100 ` +
            `(schema ${currentGeo.schema_completeness} / citation ${currentGeo.citation_friendliness} / facts ${currentGeo.fact_density})`,
        );

        if (result.passed && currentGeo.score >= GEO_MINIMUM_SCORE) {
          break;
        }

        console.log(`[score] Below threshold (SEO 60 / GEO ${GEO_MINIMUM_SCORE}), attempting fix round ${round}...`);

        if (env.DEEPSEEK_API_KEY) {
          try {
            // 失分维度 → 具体修复指令，让重新生成有的放矢而不是盲抽
            const hints = geoRepairHints(currentGeo, currentHtml);
            if (!result.passed) {
              hints.unshift(`Previous draft failed SEO checks (score ${currentScore}/100); tighten title/meta/keyword density/word count (2000+)`);
            }
            const fixedArticle = await generateFullArticle(
              {
                DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
                DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat',
              },
              {
                keyword: draft.keyword,
                title: draft.title,
                variants: draft.variants ?? [],
                repairHints: hints,
              },
            );
            currentHtml = fixedArticle.html;
            console.log(`[score] Regenerated article for round ${round} (${hints.length} repair hints)`);
          } catch (err) {
            console.error(`[score] Regeneration failed:`, err);
            break;
          }
        } else {
          break;
        }
      }

      await setJSON(env.CONTENT_QUEUE, key.name, {
        ...draft,
        html: currentHtml,
        score: currentScore,
        geoScore: currentGeo.score,
        scoreRound: round,
        status: 'scoring',
      });

      if (currentScore >= 60 && currentGeo.score >= GEO_MINIMUM_SCORE) {
        // 为新增动态页面生成 Banner 图片（不影响已有静态页面）
        let finalHtml = currentHtml;
        try {
          const { generateBannerImage, applyBannerToHtml } = await import('../lib/banner-gen');
          const bannerUrl = await generateBannerImage(
            { QWEN_API_KEY: env.QWEN_API_KEY, QWEN_MODEL: env.QWEN_MODEL, IMAGES: env.IMAGES },
            draft.keyword,
            draft.slug,
          );
          if (bannerUrl) {
            finalHtml = applyBannerToHtml(finalHtml, bannerUrl);
            console.log(`[score] Banner generated for ${draft.slug}: ${bannerUrl}`);
          }
        } catch (err) {
          console.error(`[score] Banner generation failed for ${draft.slug}:`, err);
        }

        const publishedEntry = {
          slug: draft.slug,
          title: draft.title,
          metaDescription: draft.metaDescription,
          keyword: draft.keyword,
          groupId: draft.groupId ?? null,
          variants: draft.variants ?? [],
          score: currentScore,
          geoScore: currentGeo.score,
          status: 'published',
          publishedAt: new Date().toISOString(),
          detail_url: `https://www.kestrelmetal.com/${draft.slug}.html`,
          html: finalHtml,
        };

        // 写入单个 published 键（包含完整 HTML，供 Worker 动态渲染）
        await setJSON(env.CONTENT_QUEUE, `published:${draft.slug}`, publishedEntry);

        // 更新 published:all 数组（供 /api/blog 读取，不含 html 以减小体积）
        interface PublishedSummary {
          slug: string;
          title: string;
          metaDescription: string;
          keyword: string;
          groupId?: string | null;
          variants?: string[];
          score: number;
          status: string;
          publishedAt: string;
          detail_url: string;
          html?: string;
        }
        const allPublished = await getJSON<PublishedSummary[]>(env.CONTENT_QUEUE, 'published:all') || [];
        const { html: _html, ...entryWithoutHtml } = publishedEntry;
        const existingIndex = allPublished.findIndex((p) => p.slug === draft.slug);
        if (existingIndex >= 0) {
          allPublished[existingIndex] = entryWithoutHtml;
        } else {
          allPublished.push(entryWithoutHtml);
        }
        await setJSON(env.CONTENT_QUEUE, 'published:all', allPublished);

        console.log(`[score] Published: ${draft.slug} (SEO: ${currentScore}, GEO: ${currentGeo.score})`);
        deployed++;
        publishedPaths.push(`/${draft.slug}.html`);
        publishedSlugs.push(draft.slug);

        // GEO 闭环：发布后把文章追加进动态 llms.txt（失败不影响发布）
        try {
          const { appendLlmsEntry } = await import('../lib/llms');
          await appendLlmsEntry(env, {
            slug: draft.slug,
            title: draft.title,
            url: `https://www.kestrelmetal.com/${draft.slug}.html`,
            summary: draft.metaDescription,
            keyword: draft.keyword,
          });
        } catch (err) {
          console.error(`[score] llms.txt append failed for ${draft.slug}:`, err);
        }
      } else {
        console.log(`[score] Skipped: ${draft.slug} (SEO: ${currentScore}/60, GEO: ${currentGeo.score}/${GEO_MINIMUM_SCORE})`);
        await setJSON(env.CONTENT_QUEUE, key.name, {
          ...draft,
          html: currentHtml,
          score: currentScore,
          scoreRound: round,
          status: 'skipped',
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[score] Failed for ${draft.slug}:`, err);
    }
  }

  console.log(`[score] Completed. Deployed ${deployed} articles.`);

  // 发布后通过 IndexNow 主动推送新 URL，加速搜索引擎发现
  if (publishedPaths.length > 0) {
    try {
      const { submitToIndexNow } = await import('../lib/indexnow');
      const result = await submitToIndexNow(env, publishedPaths);
      if (result.ok) {
        console.log(`[score] IndexNow submitted ${result.submitted} URLs (status ${result.status})`);
      } else {
        console.error(`[score] IndexNow submission failed: ${result.error ?? `status ${result.status}`}`);
      }
    } catch (err) {
      console.error('[score] IndexNow submission failed:', err);
    }

    // IndexNow 只覆盖 Bing / Yandex 等，Google 不参与该协议，
    // 也没有面向普通文章的 Indexing API。所以额外维护一份清单，
    // 供人工在 Search Console 里批量请求编入索引。
    try {
      await recordPendingGscUrls(env, publishedPaths, publishedSlugs);
    } catch (err) {
      console.error('[score] Failed to record pending GSC urls:', err);
    }
  }
}

/** 把刚发布的文章记入「待提交 Google」清单（按 slug 去重，保留最新的 200 条） */
async function recordPendingGscUrls(env: Env, paths: string[], slugs: string[]): Promise<void> {
  const { getJSON, setJSON } = await import('../lib/kv');

  interface PendingRow { url: string; slug: string; publishedAt: string }
  const existing = (await getJSON<{ urls: PendingRow[] }>(env.SEO_DATA, 'gsc:pending')) ?? { urls: [] };
  const bySlug = new Map(existing.urls.map((row) => [row.slug, row]));
  const now = new Date().toISOString();

  paths.forEach((path, index) => {
    const slug = slugs[index] ?? path.replace(/^\//, '').replace(/\.html$/, '');
    if (!slug) return;
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { url: `https://www.kestrelmetal.com${path.startsWith('/') ? '' : '/'}${path}`, slug, publishedAt: now });
    }
  });

  const urls = Array.from(bySlug.values()).slice(-200);
  await setJSON(env.SEO_DATA, 'gsc:pending', { urls, updatedAt: now });
  console.log(`[score] GSC pending list now holds ${urls.length} URLs`);
}
