/**
 * Phase 04: 内容机会引擎
 *
 * 分析 GSC 关键词数据，识别内容机会：
 * - 高展示低点击 → 优化 title/meta description
 * - 排名 11-20 → 写新博客助推到 Top 10
 * - 有展示无排名 → 创建新页面/博客
 */

import type { Env } from '../index';
import type { RankingRecord, OpportunityItem } from '../lib/kv';

export async function opportunities(rankings: RankingRecord[]): Promise<OpportunityItem[]> {
  const items: OpportunityItem[] = [];

  for (const row of rankings) {
    const { keyword, impressions, clicks, ctr, position } = row;

    if (impressions < 100) continue;

    // 高展示低点击 → 优化 title/meta
    if (position <= 10 && ctr < 0.02 && impressions > 500) {
      items.push({
        keyword,
        type: 'low_ctr',
        impressions,
        clicks,
        position,
        suggestedAction: `优化 title 和 meta description，当前 CTR ${(ctr * 100).toFixed(1)}% 低于行业平均`,
        estimatedDifficulty: 'easy',
      });
    }

    // 排名 11-20 → 写新博客助推
    if (position >= 11 && position <= 20) {
      items.push({
        keyword,
        type: 'page_two',
        impressions,
        clicks,
        position,
        suggestedAction: `创建针对 "${keyword}" 的深度博客文章（2000+ 字），助推到首页`,
        estimatedDifficulty: 'medium',
      });
    }

    // 有展示无排名 → 创建新页面
    if (position > 20 && impressions > 200) {
      items.push({
        keyword,
        type: 'new_opportunity',
        impressions,
        clicks,
        position,
        suggestedAction: `创建专门的产品页面或博客文章，目标关键词 "${keyword}"`,
        estimatedDifficulty: 'hard',
      });
    }
  }

  items.sort((a, b) => {
    const scoreA = a.impressions * (1 / Math.max(a.position, 1));
    const scoreB = b.impressions * (1 / Math.max(b.position, 1));
    return scoreB - scoreA;
  });

  return items.slice(0, 50);
}

export default async function opportunityCron(env: Env): Promise<void> {
  console.log('[opportunity] Running opportunity analysis...');

  const today = new Date().toISOString().split('T')[0];
  const { getRankings } = await import('../lib/kv');
  const rankings = await getRankings(env.SEO_DATA, today);

  if (!rankings || rankings.length === 0) {
    console.log('[opportunity] No ranking data available');
    return;
  }

  const items = await opportunities(rankings);

  await env.SEO_DATA.put('opportunities:weekly', JSON.stringify(items));

  console.log(`[opportunity] Identified ${items.length} content opportunities`);
}
