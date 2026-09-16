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

  let rows = await queryAllKeywords(
    env,
    getDateDaysAgo(3),
    getDateDaysAgo(2),
  );

  if (rows.length === 0) {
    console.log('[gsc-sync] No data for 3-2 days ago, trying wider range...');
    rows = await queryAllKeywords(
      env,
      getDateDaysAgo(28),
      getDateDaysAgo(1),
    );
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
