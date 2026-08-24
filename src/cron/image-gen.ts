/**
 * Cron: AI 图片生成 — 每周一 04:30 UTC+8
 *
 * 将在 Phase 06 实现：
 * - 根据文章内容构建图片 Prompt
 * - 调用 AI 图片 API 生成 Hero + 配图
 * - 压缩为 WebP 存入 R2
 */

import type { Env } from '../index';

export default async function imageGen(env: Env): Promise<void> {
  console.log('[image-gen] TODO: Phase 06 — AI image generation');

  if (!env.IMG_API_KEY) {
    console.log('[image-gen] IMG_API_KEY not configured, skipping');
    return;
  }

  // Phase 06 将实现
}
