/**
 * API 路由注册表 — 集中管理所有 API 端点
 *
 * 路由模式：
 *   GET  /api/health              → 健康检查
 *   GET  /api/keywords/rankings   → 获取最新关键词排名
 *   GET  /api/keywords/trend      → 获取关键词趋势 (?keyword=xxx)
 *   GET  /api/keywords/summary    → 按产品线分组概览
 *   GET  /api/opportunities       → 获取本周选题建议
 *   GET  /api/performance/report  → 获取效果报告
 *   GET  /api/images/:key         → 获取 R2 存储的图片
 *   POST /api/trigger/:cron       → 手动触发 Cron 任务 (需认证)
 *   GET  /api/content/drafts      → 获取草稿列表
 *   GET  /api/content/published   → 获取已发布列表
 */

import type { Env } from './index';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  url: URL;
}

type RouteHandler = (ctx: RouteContext) => Promise<Response>;

interface RouteEntry {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: RouteEntry[] = [];

/** 注册路由 */
export function route(
  method: HttpMethod,
  path: string,
  handler: RouteHandler,
): void {
  // 将路径参数 :param 转为正则捕获组
  const paramNames: string[] = [];
  const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${regexPath}$`);
  routes.push({ method, pattern, paramNames, handler });
}

/** 匹配并执行路由 */
export async function handleRoute(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method as HttpMethod;

  for (const entry of routes) {
    if (entry.method !== method) continue;
    const match = entry.pattern.exec(pathname);
    if (!match) continue;

    const params: Record<string, string> = {};
    entry.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    return entry.handler({ request, env, params, url });
  }

  return null; // 无匹配路由
}

// ─── 注册路由 ───

// 健康检查
route('GET', '/api/health', async ({ env }) => {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    kv_bound: !!env.SEO_DATA,
    r2_bound: !!env.IMAGES,
    last_gsc_sync: await env.SEO_DATA.get('gsc:last_sync'),
  });
});

// 关键词排名（最新）
route('GET', '/api/keywords/rankings', async ({ env, url }) => {
  const date = url.searchParams.get('date');
  const todayStr = date ?? new Date().toISOString().split('T')[0];
  const { getRankings } = await import('./lib/kv');
  const rankings = await getRankings(env.SEO_DATA, todayStr);
  return jsonResponse({ date: todayStr, rankings: rankings ?? [] });
});

// 关键词趋势
route('GET', '/api/keywords/trend', async ({ env, url }) => {
  const keyword = url.searchParams.get('keyword');
  if (!keyword) {
    return jsonResponse({ error: 'Missing keyword parameter' }, 400);
  }
  const days = parseInt(url.searchParams.get('days') ?? '30', 10);
  const { getKeywordTrend } = await import('./lib/kv');
  const trend = await getKeywordTrend(env.SEO_DATA, keyword, days);
  return jsonResponse({ keyword, trend });
});

// 选题建议
route('GET', '/api/opportunities', async ({ env }) => {
  const { getRankings } = await import('./lib/kv');
  const today = new Date().toISOString().split('T')[0];
  const rankings = await getRankings(env.SEO_DATA, today);

  if (!rankings || rankings.length === 0) {
    return jsonResponse({ opportunities: [], message: 'No ranking data available yet' });
  }

  const { opportunities } = await import('./cron/opportunity');
  const items = await opportunities(rankings);

  return jsonResponse({ date: today, count: items.length, opportunities: items });
});

// 选题统计（Phase 04）
route('GET', '/api/opportunities/stats', async ({ env }) => {
  const { getRankings } = await import('./lib/kv');
  const today = new Date().toISOString().split('T')[0];
  const rankings = await getRankings(env.SEO_DATA, today);

  if (!rankings || rankings.length === 0) {
    return jsonResponse({ stats: null, message: 'No ranking data available yet' });
  }

  const { opportunities } = await import('./cron/opportunity');
  const items = await opportunities(rankings);

  const stats = {
    total: items.length,
    byType: {
      low_ctr: items.filter((i) => i.type === 'low_ctr').length,
      page_two: items.filter((i) => i.type === 'page_two').length,
      new_opportunity: items.filter((i) => i.type === 'new_opportunity').length,
      competitor_gap: items.filter((i) => i.type === 'competitor_gap').length,
    },
    byDifficulty: {
      easy: items.filter((i) => i.estimatedDifficulty === 'easy').length,
      medium: items.filter((i) => i.estimatedDifficulty === 'medium').length,
      hard: items.filter((i) => i.estimatedDifficulty === 'hard').length,
    },
    topKeywords: items.slice(0, 10).map((i) => ({
      keyword: i.keyword,
      type: i.type,
      action: i.suggestedAction,
    })),
  };

  return jsonResponse({ date: today, stats });
});

// 草稿列表
route('GET', '/api/content/drafts', async ({ env }) => {
  const { listKeys, getJSON } = await import('./lib/kv');
  const keys = await listKeys(env.CONTENT_QUEUE, 'draft:');
  const drafts = await Promise.all(
    keys.map((k) => getJSON(env.CONTENT_QUEUE, k.name)),
  );
  return jsonResponse({ drafts: drafts.filter(Boolean) });
});

// 已发布列表
route('GET', '/api/content/published', async ({ env }) => {
  const { getJSON } = await import('./lib/kv');
  const published = await getJSON(env.CONTENT_QUEUE, 'published:all');
  return jsonResponse({ published: published ?? [] });
});

// 关键词排名（最新）
route('GET', '/api/keywords/rankings', async ({ env, url }) => {
  const date = url.searchParams.get('date');
  const todayStr = date ?? new Date().toISOString().split('T')[0];
  const { getRankings } = await import('./lib/kv');
  const rankings = await getRankings(env.SEO_DATA, todayStr);
  return jsonResponse({ date: todayStr, rankings: rankings ?? [] });
});

// 关键词趋势（多日）
route('GET', '/api/keywords/trend', async ({ env, url }) => {
  const keyword = url.searchParams.get('keyword');
  if (!keyword) {
    return jsonResponse({ error: 'Missing keyword parameter' }, 400);
  }
  const days = parseInt(url.searchParams.get('days') ?? '30', 10);
  const { getKeywordTrend } = await import('./lib/kv');
  const trend = await getKeywordTrend(env.SEO_DATA, keyword, days);
  return jsonResponse({ keyword, days, trend });
});

// 关键词排名（按日期范围查询，支持多日数据对比）
route('GET', '/api/keywords/rankings/range', async ({ env, url }) => {
  const startDate = url.searchParams.get('start');
  const endDate = url.searchParams.get('end');

  const end = endDate ?? new Date().toISOString().split('T')[0];
  const start = startDate ?? new Date(Date.now() - 6 * 86400_000).toISOString().split('T')[0];

  const { getRankings } = await import('./lib/kv');
  const allRankings: Array<{ date: string; rankings: unknown[] }> = [];

  const current = new Date(start);
  const endDt = new Date(end);

  while (current <= endDt) {
    const dateStr = current.toISOString().split('T')[0];
    const rankings = await getRankings(env.SEO_DATA, dateStr);
    if (rankings && rankings.length > 0) {
      allRankings.push({ date: dateStr, rankings });
    }
    current.setDate(current.getDate() + 1);
  }

  return jsonResponse({ start, end, data: allRankings });
});

// 关键词分析（按产品线分组 + 趋势）
route('GET', '/api/keywords/analysis', async ({ env }) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0];
  const { getRankings } = await import('./lib/kv');

  const todayRankings = await getRankings(env.SEO_DATA, today);
  const yesterdayRankings = await getRankings(env.SEO_DATA, yesterday);

  const todayMap = new Map((todayRankings ?? []).map((r) => [r.keyword, r]));
  const yesterdayMap = new Map((yesterdayRankings ?? []).map((r) => [r.keyword, r]));

  const allKeywords = new Set([...todayMap.keys(), ...yesterdayMap.keys()]);

  const keywords = Array.from(allKeywords).map((keyword) => {
    const todayData = todayMap.get(keyword);
    const yesterdayData = yesterdayMap.get(keyword);
    return {
      keyword,
      today: todayData ?? null,
      yesterday: yesterdayData ?? null,
      trend: todayData && yesterdayData 
        ? (todayData.position < yesterdayData.position ? 'up' : todayData.position > yesterdayData.position ? 'down' : 'stable')
        : 'new',
      change: todayData && yesterdayData ? yesterdayData.position - todayData.position : 0,
    };
  });

  keywords.sort((a, b) => {
    const aPos = a.today?.position ?? 999;
    const bPos = b.today?.position ?? 999;
    return aPos - bPos;
  });

  const stats = {
    total: keywords.length,
    top10: keywords.filter((k) => (k.today?.position ?? 999) <= 10).length,
    top20: keywords.filter((k) => (k.today?.position ?? 999) <= 20).length,
    rising: keywords.filter((k) => k.trend === 'up').length,
    falling: keywords.filter((k) => k.trend === 'down').length,
  };

  return jsonResponse({ today, yesterday, stats, keywords });
});

// R2 图片代理
route('GET', '/api/images/:key', async ({ env, params }) => {
  const { serveImage } = await import('./lib/r2');
  return serveImage(env.IMAGES, params.key);
});

// GSC 连接状态
route('GET', '/api/gsc/status', async ({ env }) => {
  const { getJSON } = await import('./lib/kv');
  const details = await getJSON<{ timestamp: string; date: string; siteUrl: string; rows: number }>(env.SEO_DATA, 'gsc:last_sync:details');
  const lastSync = await env.SEO_DATA.get('gsc:last_sync');

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GSC_REFRESH_TOKEN || !env.GSC_SITE_URL) {
    return jsonResponse({ ok: false, siteUrl: env.GSC_SITE_URL ?? '', error: 'GSC OAuth secrets not configured', lastSync: lastSync ?? null });
  }

  try {
    const { verifyConnection } = await import('./lib/gsc');
    const result = await verifyConnection(env);
    return jsonResponse({
      ok: result.ok,
      siteUrl: result.siteUrl,
      rowCount: result.rowCount,
      error: result.error,
      lastSync: lastSync ?? null,
      details,
    });
  } catch (err) {
    return jsonResponse({ ok: false, siteUrl: env.GSC_SITE_URL, error: err instanceof Error ? err.message : String(err), lastSync: lastSync ?? null });
  }
});

// 手动触发 Cron 任务（需简单认证）
route('POST', '/api/trigger/:cron', async ({ env, params, request }) => {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const cronName = params.cron;

  if (cronName === 'gsc-sync') {
    const { default: gscSync } = await import('./cron/gsc-sync');
    await gscSync(env);
    return jsonResponse({ message: 'GSC sync completed', siteUrl: env.GSC_SITE_URL });
  }

  if (cronName === 'generate') {
    const { default: generate } = await import('./cron/generate');
    await generate(env);
    return jsonResponse({ message: 'Content generation completed' });
  }

  if (cronName === 'image-gen') {
    const { default: imageGen } = await import('./cron/image-gen');
    await imageGen(env);
    return jsonResponse({ message: 'Image generation completed' });
  }

  if (cronName === 'score') {
    const { default: score } = await import('./cron/score');
    await score(env);
    return jsonResponse({ message: 'Score and deploy completed' });
  }

  return jsonResponse({
    message: `Cron ${cronName} triggered`,
    note: 'This cron handler is not yet implemented',
  });
});

// ─── 工具函数 ───

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
