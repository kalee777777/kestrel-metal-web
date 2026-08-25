/**
 * Phase 06: 图片生成 Cron 任务
 *
 * 为草稿中的文章生成配图
 */

import type { Env } from '../index';
import { generateArticleImages } from '../lib/image-gen';
import { listKeys, getJSON, setJSON } from '../lib/kv';

export default async function imageGen(env: Env): Promise<void> {
  console.log('[image-gen] Starting image generation for drafts...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'draft:');

  if (keys.length === 0) {
    console.log('[image-gen] No drafts found');
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
      console.log(`[image-gen] Generating images for: ${draft.slug}`);

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
      console.log(`[image-gen] Generated ${images.length} images for ${draft.slug}`);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[image-gen] Failed for ${draft.slug}:`, err);
    }
  }

  console.log(`[image-gen] Completed. Processed ${processed} drafts.`);
}
