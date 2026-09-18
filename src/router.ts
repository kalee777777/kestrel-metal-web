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

// ─── SEO 元数据管理（Admin 后台） ───

function isAdminAuthorized(request: Request, env: Env): boolean {
  return request.headers.get('Authorization') === `Bearer ${env.ADMIN_TOKEN}`;
}

// 列表（meta 数据为公开页面信息，允许匿名读取）
route('GET', '/api/seo', async ({ env }) => {
  const { listSeoMetas } = await import('./lib/seo-meta');
  const metas = await listSeoMetas(env);
  return jsonResponse(metas);
});

// 新增
route('POST', '/api/seo', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<Partial<import('./lib/seo-meta').SeoMetaRecord>>().catch(() => null);
  if (!body || !body.page_url) {
    return jsonResponse({ error: 'page_url is required' }, 400);
  }
  const { createSeoMeta } = await import('./lib/seo-meta');
  const record = await createSeoMeta(env, body);
  if (!record) {
    return jsonResponse({ error: 'Record already exists for this page' }, 409);
  }
  return jsonResponse(record, 201);
});

// 更新
route('PUT', '/api/seo/:id', async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<Partial<import('./lib/seo-meta').SeoMetaRecord>>().catch(() => null);
  if (!body) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  const { updateSeoMeta } = await import('./lib/seo-meta');
  const record = await updateSeoMeta(env, Number(params.id), body);
  if (!record) {
    return jsonResponse({ error: 'Not found' }, 404);
  }
  return jsonResponse(record);
});

// 删除
route('DELETE', '/api/seo/:id', async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { deleteSeoMeta } = await import('./lib/seo-meta');
  const ok = await deleteSeoMeta(env, Number(params.id));
  if (!ok) {
    return jsonResponse({ error: 'Not found' }, 404);
  }
  return jsonResponse({ message: 'Deleted' });
});

// Sitemap 生成（动态合并：静态 URL + KV 自动发布文章）
route('GET', '/api/seo/generate/sitemap', async ({ env }) => {
  const { buildSitemap } = await import('./lib/sitemap');
  const sitemap = await buildSitemap(env);
  return jsonResponse({
    file_count: sitemap.urlCount,
    static_count: sitemap.urlCount - sitemap.dynamicCount,
    dynamic_count: sitemap.dynamicCount,
    note: 'sitemap.xml is served dynamically, always up to date',
  });
});

// IndexNow 状态查询
route('GET', '/api/seo/indexnow', async ({ env }) => {
  const { getJSON } = await import('./lib/kv');
  const lastSubmit = await getJSON(env.SEO_DATA, 'indexnow:last_submit');
  return jsonResponse({ last_submit: lastSubmit ?? null });
});

// GSC 重新授权：生成 Google 授权链接（需 ADMIN_TOKEN）
route('GET', '/api/gsc/auth', async ({ env, request, url }) => {
  if (request.headers.get('Authorization') !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  if (!env.GOOGLE_CLIENT_ID) {
    return jsonResponse({ error: 'GOOGLE_CLIENT_ID not configured' }, 500);
  }
  const redirectUri = `${url.origin}/api/gsc/callback`;
  const { buildGscAuthUrl } = await import('./lib/gsc');
  return jsonResponse({
    authorization_url: buildGscAuthUrl(env.GOOGLE_CLIENT_ID, redirectUri),
    redirect_uri: redirectUri,
    note: 'Add redirect_uri to Google Cloud Console → Credentials → Authorized redirect URIs if not yet registered',
  });
});

// GSC OAuth 回调：code 换 refresh_token 并写入 KV（Google 浏览器跳转，无法带认证头）
route('GET', '/api/gsc/callback', async ({ env, url }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const redirectUri = `${url.origin}/api/gsc/callback`;

  const render = (ok: boolean, message: string) => new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GSC Authorization</title></head>` +
    `<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#f0f0f0">` +
    `<div style="text-align:center;max-width:520px;padding:32px"><h2 style="color:${ok ? '#4ade80' : '#f87171'}">${ok ? '✅ 授权成功' : '❌ 授权失败'}</h2>` +
    `<p style="color:#999;line-height:1.6">${message}</p>` +
    `<p style="color:#666;font-size:13px">可关闭此页面，回到 Admin 后台点击「刷新数据」。</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );

  if (error) {
    return render(false, `Google 返回错误：${error}`);
  }
  if (!code) {
    return render(false, '缺少授权码参数（code）');
  }

  const { exchangeGscCode } = await import('./lib/gsc');
  const result = await exchangeGscCode(env, code, redirectUri);
  if (!result.ok) {
    return render(false, result.error ?? 'Unknown error');
  }
  return render(true, 'refresh_token 已保存，GSC 数据同步已恢复。每日 03:00 将自动同步关键词数据。');
});

// ─── 竞品关键词缺口分析 ───

// 竞品列表
route('GET', '/api/competitors', async ({ env }) => {
  const { getCompetitors } = await import('./lib/competitor');
  const competitors = await getCompetitors(env);
  return jsonResponse({ competitors });
});

// 添加竞品（需 ADMIN_TOKEN）
route('POST', '/api/competitors', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<{ domain?: string; name?: string }>().catch(() => null);
  if (!body || !body.domain) {
    return jsonResponse({ error: 'domain is required' }, 400);
  }
  const { addCompetitor } = await import('./lib/competitor');
  const entry = await addCompetitor(env, body.domain, body.name);
  if (!entry) {
    return jsonResponse({ error: 'Competitor already exists' }, 409);
  }
  return jsonResponse(entry, 201);
});

// 删除竞品（需 ADMIN_TOKEN）
route('DELETE', '/api/competitors/:domain', async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { deleteCompetitor } = await import('./lib/competitor');
  const ok = await deleteCompetitor(env, params.domain);
  if (!ok) {
    return jsonResponse({ error: 'Not found' }, 404);
  }
  return jsonResponse({ message: 'Deleted' });
});

// 触发竞品分析（需 ADMIN_TOKEN）
route('POST', '/api/competitors/analyze', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<{ domain?: string }>().catch(() => null);
  if (!body || !body.domain) {
    return jsonResponse({ error: 'domain is required' }, 400);
  }
  const { analyzeCompetitor } = await import('./lib/competitor');
  const result = await analyzeCompetitor(env, body.domain);
  if (result.error) {
    return jsonResponse({ domain: body.domain, keywordCount: result.keywordCount, error: result.error });
  }
  return jsonResponse({ domain: body.domain, keywordCount: result.keywordCount });
});

// 缺口分析结果
route('GET', '/api/competitors/gap', async ({ env }) => {
  const { computeGap } = await import('./lib/competitor');
  const gaps = await computeGap(env);
  return jsonResponse({ gaps, generatedAt: new Date().toISOString() });
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
    return jsonResponse({ message: 'GSC sync completed (opportunity analysis included)', siteUrl: env.GSC_SITE_URL });
  }

  if (cronName === 'opportunity') {
    const { default: opportunityCron } = await import('./cron/opportunity');
    await opportunityCron(env);
    return jsonResponse({ message: 'Opportunity analysis completed' });
  }

  if (cronName === 'generate') {
    const { default: generate } = await import('./cron/generate');
    await generate(env);
    return jsonResponse({ message: 'Content generation completed' });
  }

  if (cronName === 'score') {
    const { default: score } = await import('./cron/score');
    await score(env);
    return jsonResponse({ message: 'Score and deploy completed' });
  }

  if (cronName === 'track') {
    const { default: track } = await import('./cron/track');
    await track(env);
    return jsonResponse({ message: 'Performance tracking completed' });
  }

  if (cronName === 'monthly-report') {
    const { default: monthlyReport } = await import('./cron/monthly-report');
    await monthlyReport(env);
    return jsonResponse({ message: 'Monthly report generated' });
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
