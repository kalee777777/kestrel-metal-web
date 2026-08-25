/**
 * Phase 05: AI 内容生成 Cron 任务
 *
 * 每周一 04:00 UTC+8 自动执行：
 * 1. 从机会列表中选择本周选题
 * 2. 使用 DeepSeek V4 Pro 生成大纲
 * 3. 生成完整文章（2000-3000 字）
 * 4. 保存到 KV 草稿存储
 */

import type { Env } from '../index';
import { generateFullArticle } from '../lib/deepseek';
import { saveDraft, getRankings } from '../lib/kv';

const MAX_ARTICLES_PER_WEEK = 2;

export default async function generate(env: Env): Promise<void> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  console.log('[generate] Starting weekly content generation...');

  const today = new Date().toISOString().split('T')[0];
  const rankings = await getRankings(env.SEO_DATA, today);

  if (!rankings || rankings.length === 0) {
    console.log('[generate] No ranking data available, skipping generation');
    return;
  }

  const opportunities = await env.SEO_DATA.get('opportunities:weekly');
  let items: Array<{ keyword: string; type: string; suggestedAction: string }> = [];

  if (opportunities) {
    try {
      items = JSON.parse(opportunities);
    } catch {
      console.log('[generate] Failed to parse opportunities, using rankings directly');
    }
  }

  if (items.length === 0) {
    const topKeywords = rankings
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, MAX_ARTICLES_PER_WEEK * 2)
      .map((r) => ({
        keyword: r.keyword,
        type: 'auto',
        suggestedAction: 'Create comprehensive blog article',
      }));
    items = topKeywords;
  }

  const selectedKeywords = items.slice(0, MAX_ARTICLES_PER_WEEK);

  console.log(`[generate] Selected ${selectedKeywords.length} keywords for generation`);

  let generated = 0;

  for (const item of selectedKeywords) {
    try {
      console.log(`[generate] Processing keyword: ${item.keyword}`);

      const article = await generateFullArticle(
        {
          DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
          DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat',
        },
        {
          keyword: item.keyword,
          productLine: 'metal-fencing',
          targetAudience: 'B2B buyers, contractors, security professionals',
        },
      );

      await saveDraft(env.CONTENT_QUEUE, {
        slug: article.slug,
        title: article.title,
        metaDescription: article.metaDescription,
        html: article.html,
        keyword: article.keyword,
        status: 'queued',
        createdAt: new Date().toISOString(),
        score: undefined,
        scoreRound: undefined,
        images: [],
      });

      generated++;
      console.log(`[generate] Article saved: ${article.slug} (${article.wordCount} words)`);

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`[generate] Failed to generate article for "${item.keyword}":`, err);
    }
  }

  console.log(`[generate] Completed. Generated ${generated} articles.`);
}
