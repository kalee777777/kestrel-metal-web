/**
 * Phase 05 + 06: AI 内容 + 图片生成 Cron 任务
 *
 * 每周一 04:00 UTC+8 自动执行：
 * 1. 从机会列表中选择本周选题
 * 2. 使用 DeepSeek V4 Pro 生成大纲
 * 3. 生成完整文章（2000-3000 字）
 * 4. 保存到 KV 草稿存储
 * 5. 为草稿文章生成配图（Qwen3.8-max）
 */

import type { Env } from '../index';
import { generateFullArticle } from '../lib/deepseek';
import { generateArticleImages } from '../lib/image-gen';
import { saveDraft, getRankings, listKeys, getJSON, setJSON } from '../lib/kv';

const MAX_ARTICLES_PER_WEEK = 2;

export default async function generate(env: Env): Promise<void> {
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  console.log('[generate] Starting weekly content generation...');

  const today = new Date().toISOString().split('T')[0];
  const rankings = await getRankings(env.SEO_DATA, today);

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
    if (rankings && rankings.length > 0) {
      const topKeywords = rankings
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, MAX_ARTICLES_PER_WEEK * 2)
        .map((r) => ({
          keyword: r.keyword,
          type: 'auto',
          suggestedAction: 'Create comprehensive blog article',
        }));
      items = topKeywords;
    } else {
      const defaultKeywords = [
        { keyword: 'galvanized chain link fence', type: 'default', suggestedAction: 'Create comprehensive guide' },
        { keyword: 'gabion boxes supplier', type: 'default', suggestedAction: 'Product comparison article' },
      ];
      items = defaultKeywords;
    }
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

  await generateImagesForDrafts(env);
}

async function generateImagesForDrafts(env: Env): Promise<void> {
  console.log('[generate] Starting image generation for drafts...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'draft:');

  if (keys.length === 0) {
    console.log('[generate] No drafts found for image generation');
    return;
  }

  let processed = 0;

  for (const key of keys) {
    const draft = await getJSON<{
      slug: string;
      keyword: string;
      status: string;
      images?: string[];
    }>(env.CONTENT_QUEUE, key.name);

    if (!draft || draft.status !== 'queued' || (draft.images && draft.images.length > 0)) {
      continue;
    }

    try {
      console.log(`[generate] Generating images for: ${draft.slug}`);

      const images = await generateArticleImages(
        {
          QWEN_API_KEY: env.QWEN_API_KEY,
          QWEN_MODEL: env.QWEN_MODEL,
          IMAGES: env.IMAGES,
        },
        draft.keyword,
      );

      await setJSON(env.CONTENT_QUEUE, key.name, {
        ...draft,
        status: 'image_gen',
        images: images.map((img) => img.url),
        imageKeys: images.map((img) => img.key),
      });

      processed++;
      console.log(`[generate] Generated ${images.length} images for ${draft.slug}`);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[generate] Failed to generate images for ${draft.slug}:`, err);
    }
  }

  console.log(`[generate] Image generation completed. Processed ${processed} drafts.`);
}
