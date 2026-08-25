/**
 * Phase 09: 效果追踪 + 数据回流闭环
 *
 * 功能：
 * - 跟踪已发布文章的排名变化
 * - 监控 AI Referral 流量
 * - 数据回流到 GSC 分析
 * - 月度报告生成
 */

import type { Env } from '../index';
import { listKeys, getJSON, setJSON } from '../lib/kv';
import { querySearchAnalytics } from '../lib/gsc';

interface PublishedArticle {
  slug: string;
  title: string;
  keyword: string;
  publishedAt: string;
  score: number;
  url: string;
}

interface TrackingData {
  slug: string;
  keyword: string;
  url: string;
  impressions: number;
  clicks: number;
  avgPosition: number;
  trackedAt: string;
}

interface MonthlyReport {
  month: string;
  totalArticles: number;
  totalImpressions: number;
  totalClicks: number;
  avgPosition: number;
  topKeywords: Array<{ keyword: string; clicks: number; position: number }>;
  generatedAt: string;
}

export async function trackArticlePerformance(env: Env): Promise<void> {
  console.log('[tracking] Starting article performance tracking...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'published:');

  if (keys.length === 0) {
    console.log('[tracking] No published articles found');
    return;
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  for (const key of keys) {
    const article = await getJSON<PublishedArticle>(env.CONTENT_QUEUE, key.name);

    if (!article) continue;

    try {
      console.log(`[tracking] Tracking: ${article.slug}`);

      const gscData = await querySearchAnalytics(
        {
          GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
          GSC_REFRESH_TOKEN: env.GSC_REFRESH_TOKEN,
          GSC_SITE_URL: env.GSC_SITE_URL,
          SEO_DATA: env.SEO_DATA,
        },
        start,
        end,
        ['query', 'page'],
      );

      const pageData = gscData.filter(
        (row: { keys: string[] }) => row.keys[1]?.includes(article.slug),
      );

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalPosition = 0;
      let positionCount = 0;

      for (const row of pageData) {
        totalImpressions += row.impressions;
        totalClicks += row.clicks;
        totalPosition += row.position;
        positionCount++;
      }

      const trackingData: TrackingData = {
        slug: article.slug,
        keyword: article.keyword,
        url: `https://kestrelmetal.com/blog/${article.slug}.html`,
        impressions: totalImpressions,
        clicks: totalClicks,
        avgPosition: positionCount > 0 ? totalPosition / positionCount : 0,
        trackedAt: new Date().toISOString(),
      };

      await setJSON(env.CONTENT_QUEUE, `tracking:${article.slug}`, trackingData);

      console.log(`[tracking] ${article.slug}: ${totalImpressions} impressions, ${totalClicks} clicks`);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`[tracking] Failed for ${article.slug}:`, err);
    }
  }

  console.log('[tracking] Completed.');
}

export async function generateMonthlyReport(env: Env): Promise<MonthlyReport> {
  console.log('[report] Generating monthly report...');

  const keys = await listKeys(env.CONTENT_QUEUE, 'published:');
  const trackingKeys = await listKeys(env.CONTENT_QUEUE, 'tracking:');

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalPosition = 0;
  let positionCount = 0;
  const keywordStats: Record<string, { clicks: number; position: number }> = {};

  for (const key of trackingKeys) {
    const tracking = await getJSON<TrackingData>(env.CONTENT_QUEUE, key.name);

    if (!tracking) continue;

    totalImpressions += tracking.impressions;
    totalClicks += tracking.clicks;

    if (tracking.avgPosition > 0) {
      totalPosition += tracking.avgPosition;
      positionCount++;
    }

    if (!keywordStats[tracking.keyword]) {
      keywordStats[tracking.keyword] = { clicks: 0, position: 0 };
    }
    keywordStats[tracking.keyword].clicks += tracking.clicks;
    keywordStats[tracking.keyword].position = tracking.avgPosition;
  }

  const topKeywords = Object.entries(keywordStats)
    .map(([keyword, stats]) => ({
      keyword,
      clicks: stats.clicks,
      position: stats.position,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const report: MonthlyReport = {
    month,
    totalArticles: keys.length,
    totalImpressions,
    totalClicks,
    avgPosition: positionCount > 0 ? totalPosition / positionCount : 0,
    topKeywords,
    generatedAt: new Date().toISOString(),
  };

  await setJSON(env.SEO_DATA, `report:${month}`, report);

  console.log(`[report] Monthly report generated: ${report.totalArticles} articles, ${totalImpressions} impressions`);

  return report;
}
