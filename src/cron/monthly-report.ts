/**
 * Phase 09: 月度报告 Cron 任务
 *
 * 每月 1 号 00:00 UTC+8 执行：
 * - 生成月度 SEO 报告
 */

import type { Env } from '../index';
import { generateMonthlyReport } from '../lib/tracking';

export default async function monthlyReport(env: Env): Promise<void> {
  console.log('[monthly-report] Generating monthly report...');

  try {
    const report = await generateMonthlyReport(env);
    console.log(`[monthly-report] Completed: ${report.totalArticles} articles, ${report.totalImpressions} impressions`);
  } catch (err) {
    console.error('[monthly-report] Failed:', err);
  }
}
