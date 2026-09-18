/**
 * Phase 07: SEO 评分 + 自动部署 Cron 任务
 *
 * 每周一 05:00 UTC+8 自动执行：
 * 1. 从草稿队列中获取待评分文章
 * 2. SEO 评分（30+ 项检查）
 * 3. 低于 80 分自动修复（最多 3 轮）
 * 4. 评分达标后提交到 GitHub
 * 5. Cloudflare Pages 自动部署
 */

import type { Env } from '../index';
import { scoreSEO } from '../lib/seo-score';
import { generateFullArticle } from '../lib/deepseek';
import { listKeys, getJSON, setJSON } from '../lib/kv';

interface DraftData {
  slug: string;
  title: string;
  metaDescription: string;
  html: string;
  keyword: string;
  status: string;
  score?: number;
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

  for (const key of keys) {
    const draft = await getJSON<DraftData>(env.CONTENT_QUEUE, key.name);

    if (!draft || (draft.status !== 'queued' && draft.status !== 'image_gen' && draft.status !== 'skipped')) {
      continue;
    }

    try {
      console.log(`[score] Scoring: ${draft.slug}`);

      let currentHtml = draft.html;
      let currentScore = 0;
      let round = 0;

      while (round < 3) {
        round++;
        const result = scoreSEO(currentHtml, draft.keyword);
        currentScore = result.totalScore;

        console.log(`[score] Round ${round}: Score ${currentScore}/100`);

        if (result.passed) {
          break;
        }

        console.log(`[score] Score below 60, attempting fix round ${round}...`);

        if (env.DEEPSEEK_API_KEY) {
          try {
            const fixedArticle = await generateFullArticle(
              {
                DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
                DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat',
              },
              {
                keyword: draft.keyword,
                title: draft.title,
              },
            );
            currentHtml = fixedArticle.html;
            console.log(`[score] Regenerated article for round ${round}`);
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
        scoreRound: round,
        status: 'scoring',
      });

      if (currentScore >= 60) {
        // 为新增动态页面生成 Banner 图片（不影响已有静态页面）
        let finalHtml = currentHtml;
        try {
          const { generateBannerImage } = await import('../lib/banner-gen');
          const bannerUrl = await generateBannerImage(
            { QWEN_API_KEY: env.QWEN_API_KEY, QWEN_MODEL: env.QWEN_MODEL, IMAGES: env.IMAGES },
            draft.keyword,
            draft.slug,
          );
          if (bannerUrl) {
            finalHtml = finalHtml.replace(
              /background-image:url\('[^']*'\);/,
              `background-image:url('${bannerUrl}');`,
            );
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
          score: currentScore,
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

        console.log(`[score] Published: ${draft.slug} (Score: ${currentScore})`);
        deployed++;
        publishedPaths.push(`/${draft.slug}.html`);
      } else {
        console.log(`[score] Skipped: ${draft.slug} (Score: ${currentScore} < 60)`);
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
  }
}
