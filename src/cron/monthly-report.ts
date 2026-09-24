/**
 * Phase 09: 月度报告 Cron 任务
 *
 * 每月 1 号 08:00 UTC+8 执行：
 * - 生成月度 SEO 报告
 * - 附 GEO 段：全站平均分 / 高中低分布 / 本月 llms.txt 新增 / FAQ 与补丁待审数
 */

import type { Env } from '../index';
import { generateMonthlyReport } from '../lib/tracking';
import { getJSON, setJSON } from '../lib/kv';

interface GeoReportSection {
  average_score: number | null;
  scored_pages: number;
  distribution: { high: number; mid: number; low: number };
  bottom_pages: Array<{ page: string; score: number }>;
  llms_entries_total: number;
  llms_entries_added_this_month: number;
  faq_total: number;
  faq_auto_total: number;
  faq_pending_review: number;
  patches_pending: number;
  patches_applied: number;
}

async function buildGeoSection(env: Env, monthPrefix: string): Promise<GeoReportSection> {
  interface ScoreRow { page_url: string; score: number; scored_at: string }
  interface LlmsEntry { addedAt: string }
  interface FaqItem { is_active?: boolean; source?: string; language?: string }
  interface Patch { status: string }

  const scores = (await getJSON<ScoreRow[]>(env.SEO_DATA, 'geo:scores')) ?? [];
  const llms = (await getJSON<LlmsEntry[]>(env.SEO_DATA, 'geo:llms:entries')) ?? [];
  const faqs = (await getJSON<FaqItem[]>(env.SEO_DATA, 'geo:faqs')) ?? [];
  const patches = (await getJSON<Patch[]>(env.SEO_DATA, 'geo:patches')) ?? [];

  const average = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : null;
  return {
    average_score: average,
    scored_pages: scores.length,
    distribution: {
      high: scores.filter((r) => r.score >= 80).length,
      mid: scores.filter((r) => r.score >= 60 && r.score < 80).length,
      low: scores.filter((r) => r.score < 60).length,
    },
    bottom_pages: scores
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => ({ page: r.page_url.replace(/^https?:\/\/[^/]+\//, '/'), score: r.score })),
    llms_entries_total: llms.length,
    llms_entries_added_this_month: llms.filter((e) => e.addedAt?.startsWith(monthPrefix)).length,
    faq_total: faqs.filter((f) => f.is_active !== false && (f.language ?? 'en') === 'en').length,
    faq_auto_total: faqs.filter((f) => f.source === 'auto').length,
    faq_pending_review: faqs.filter((f) => f.source === 'auto' && f.is_active === false).length,
    patches_pending: patches.filter((p) => p.status === 'pending' || p.status === 'approved').length,
    patches_applied: patches.filter((p) => p.status === 'applied').length,
  };
}

export default async function monthlyReport(env: Env): Promise<void> {
  console.log('[monthly-report] Generating monthly report...');

  try {
    const report = await generateMonthlyReport(env);
    console.log(`[monthly-report] Completed: ${report.totalArticles} articles, ${report.totalImpressions} impressions`);

    // GEO 段并入当月报告
    try {
      const month = report.month; // YYYY-MM
      const stored = await getJSON<Record<string, unknown>>(env.SEO_DATA, `report:${month}`);
      if (stored) {
        const geo = await buildGeoSection(env, month);
        stored.geo = geo;
        await setJSON(env.SEO_DATA, `report:${month}`, stored);
        console.log(`[monthly-report] GEO section attached (avg ${geo.average_score}, ${geo.scored_pages} pages)`);
      }
    } catch (err) {
      console.error('[monthly-report] GEO section failed:', err);
    }
  } catch (err) {
    console.error('[monthly-report] Failed:', err);
  }
}
