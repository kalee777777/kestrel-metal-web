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

  for (const key of keys) {
    const draft = await getJSON<DraftData>(env.CONTENT_QUEUE, key.name);

    if (!draft || (draft.status !== 'queued' && draft.status !== 'image_gen')) {
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

        console.log(`[score] Score below 80, attempting fix round ${round}...`);

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

      if (currentScore >= 80) {
        await setJSON(env.CONTENT_QUEUE, `published:${draft.slug}`, {
          slug: draft.slug,
          title: draft.title,
          metaDescription: draft.metaDescription,
          keyword: draft.keyword,
          score: currentScore,
          publishedAt: new Date().toISOString(),
        });

        console.log(`[score] Published: ${draft.slug} (Score: ${currentScore})`);
        deployed++;
      } else {
        console.log(`[score] Skipped: ${draft.slug} (Score: ${currentScore} < 80)`);
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
}
