/**
 * Phase 09: 效果追踪 Cron 任务
 *
 * 每周日 06:00 UTC+8 执行：
 * - 跟踪已发布文章的排名变化
 * - 监控 AI Referral 流量
 */

import type { Env } from '../index';
import { trackArticlePerformance } from '../lib/tracking';

export default async function track(env: Env): Promise<void> {
  console.log('[track] Starting weekly performance tracking...');

  try {
    await trackArticlePerformance(env);
    console.log('[track] Completed successfully.');
  } catch (err) {
    console.error('[track] Failed:', err);
  }
}
