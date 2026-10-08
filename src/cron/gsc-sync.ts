import type { Env } from '../index';
import { queryAllKeywords } from '../lib/gsc';
import { saveRankings, today, now } from '../lib/kv';
import { opportunities } from './opportunity';

const DAY_MS = 86400_000;

function getDateDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().split('T')[0];
}

export default async function gscSync(env: Env): Promise<void> {
  const required = [
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GSC_REFRESH_TOKEN,
    env.GSC_SITE_URL,
  ];

  if (required.some((value) => !value)) {
    throw new Error('GSC OAuth secrets are not fully configured');
  }

  const date = today();

  // 只抓取单个已最终化的日期（GSC 约 2-3 天最终化）。
  // 之前若该窗口为空会回退到「近 28 天累计聚合」并写入单个日期键，
  // 导致 dashboard 把约 28 天的累计关键词/展示误标成当天（假回弹）。
  // 现在彻底移除累计回退，只保留单日且稍提前一个窗口兜底，保证取数口径真实。
  const dataDate = getDateDaysAgo(3);
  let rows = await queryAllKeywords(env, dataDate, dataDate);

  if (rows.length === 0) {
    const fallbackDate = getDateDaysAgo(4);
    console.log(`[gsc-sync] No data for finalized day ${dataDate}, trying ${fallbackDate}...`);
    rows = await queryAllKeywords(env, fallbackDate, fallbackDate);
  }

  if (rows.length === 0) {
    console.log('[gsc-sync] No data found in GSC. Website may need more time to be indexed.');
  }

  const rankings = rows.map((row) => ({
    keyword: row.keys[0] ?? '',
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr,
    position: row.position,
    date,
  })).filter((record) => record.keyword.length > 0);

  await saveRankings(env.SEO_DATA, date, rankings);
  await env.SEO_DATA.put('gsc:last_sync:details', JSON.stringify({
    timestamp: now(),
    date,
    siteUrl: env.GSC_SITE_URL,
    rows: rankings.length,
  }));

  console.log(`[gsc-sync] Saved ${rankings.length} keyword rows for ${date}`);

  // 同步完成后立即执行机会分析，供周一内容生成选题使用
  if (rankings.length > 0) {
    try {
      const items = await opportunities(rankings);
      await env.SEO_DATA.put('opportunities:weekly', JSON.stringify(items));
      console.log(`[gsc-sync] Identified ${items.length} content opportunities`);
    } catch (err) {
      console.error('[gsc-sync] Opportunity analysis failed:', err);
    }
  }
}
