/**
 * Cron: AI 内容生成 — 每周一 04:00 UTC+8
 *
 * 将在 Phase 05 实现：
 * - 从选题队列选择 1-2 个
 * - 调用 DeepSeek V4 Pro 生成大纲 + 正文
 * - HTML 装配 + 内链插入
 */

import type { Env } from '../index';

export default async function generate(env: Env): Promise<void> {
  console.log('[generate] TODO: Phase 05 — AI content generation');

  if (!env.DEEPSEEK_API_KEY) {
    console.log('[generate] DEEPSEEK_API_KEY not configured, skipping');
    return;
  }

  // Phase 05 将实现
}
