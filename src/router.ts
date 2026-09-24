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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

// Cron 任务执行状态（self-check：判断定时调度到底有没有真的触发）
//
// 关键点：/api/trigger/:cron 手动触发走的是裸函数，不写 cron:last_run，
// 所以本端点出现记录 == 该任务确实被 Cloudflare 定时调度唤起过。
route('GET', '/api/cron/status', async ({ env }) => {
  const { listKeys, getJSON } = await import('./lib/kv');
  const keys = await listKeys(env.SEO_DATA, 'cron:last_run:');

  const tasks = await Promise.all(
    keys.map(async (k) => {
      const name = k.name.replace('cron:last_run:', '');
      const record = await getJSON<{
        timestamp: string;
        duration: number;
        success: boolean;
        skipped?: boolean;
        skipReason?: string;
        error?: string;
      }>(env.SEO_DATA, k.name);
      return {
        name,
        lastRun: record?.timestamp ?? null,
        ageHours: record?.timestamp
          ? Math.round(((Date.now() - new Date(record.timestamp).getTime()) / 3600_000) * 10) / 10
          : null,
        durationMs: record?.duration ?? null,
        success: record?.success ?? null,
        skipped: record?.skipped ?? false,
        skipReason: record?.skipReason ?? null,
        error: record?.error ?? null,
      };
    }),
  );

  tasks.sort((a, b) => (a.lastRun && b.lastRun ? (a.lastRun < b.lastRun ? 1 : -1) : 0));

  return jsonResponse({
    now: new Date().toISOString(),
    note: '出现记录即代表该任务被定时调度唤起过；手动 /api/trigger 不写此记录。',
    tasks,
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

// 调试：测试 sitemap 抓取
route('GET', '/api/competitors/debug', async ({ url }) => {
  const domain = url.searchParams.get('domain');
  if (!domain) return jsonResponse({ error: 'domain required' }, 400);
  const { fetchCompetitorSitemap } = await import('./lib/competitor');
  const urls = await fetchCompetitorSitemap(domain);
  return jsonResponse({ domain, urlCount: urls.length, sample: urls.slice(0, 5) });
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

// 为早期文章回填产品组归属（需 ADMIN_TOKEN）
//
// groupId 字段是关键词聚类改造时才引入的，之前发布的文章都没有。
// 去重本身不依赖它（覆盖检测走 keyword+variants 再匹配组），
// 但 Admin 分组视图会把这些文章显示成「未标记」，这里按关键词推回去。
route('POST', '/api/blog/backfill-groups', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { getJSON, setJSON } = await import('./lib/kv');
  const { matchGroupId } = await import('./lib/keyword-cluster');

  interface PublishedRow {
    slug: string;
    keyword?: string;
    groupId?: string | null;
    variants?: string[];
    [key: string]: unknown;
  }

  const all = (await getJSON<PublishedRow[]>(env.CONTENT_QUEUE, 'published:all')) ?? [];
  const result = {
    total: all.length,
    alreadyTagged: 0,
    updated: 0,
    unresolved: 0,
    details: [] as Array<{ slug: string; groupId: string | null }>,
  };

  for (const row of all) {
    if (row.groupId) {
      result.alreadyTagged++;
      continue;
    }

    const slug = String(row.slug ?? '');
    // 先用关键词判定，退化到把 slug 的连字符拆成词再试
    const groupId =
      matchGroupId(row.keyword ?? '') ||
      matchGroupId(slug) ||
      matchGroupId(slug.replace(/[-_]/g, ' '));

    if (!groupId) {
      result.unresolved++;
      result.details.push({ slug, groupId: null });
      continue;
    }

    row.groupId = groupId;

    const record = await getJSON<PublishedRow>(env.CONTENT_QUEUE, `published:${slug}`);
    if (record) {
      record.groupId = groupId;
      await setJSON(env.CONTENT_QUEUE, `published:${slug}`, record);
    }

    result.updated++;
    result.details.push({ slug, groupId });
  }

  await setJSON(env.CONTENT_QUEUE, 'published:all', all);
  return jsonResponse({ message: 'Backfill completed', ...result });
});

// Banner 生成连通性诊断（需 ADMIN_TOKEN）
//
// generateBannerImage 内部把异常 catch 掉只返回 null，调用方只看到
// "no URL"，无从判断是额度耗尽、模型下线、内容审核还是网络问题。
// 这里直接打一次 DashScope 提交接口，把原始状态码与响应体透出来。
route('GET', '/api/banner/diagnose', async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const apiKey = env.QWEN_API_KEY;
  if (!apiKey) {
    return jsonResponse({ ok: false, stage: 'config', error: 'QWEN_API_KEY 未配置' });
  }
  if (!env.IMAGES) {
    return jsonResponse({ ok: false, stage: 'config', error: 'IMAGES (R2) 未绑定' });
  }

  const started = Date.now();

  // 传入 ?keyword=xxx 时用与真实流程完全一致的 prompt 复现问题，
  // 否则用一个简单的测试 prompt 判断服务是否可用。
  const keyword = url.searchParams.get('keyword');
  let prompt = 'bright industrial steel wire mesh fence, natural daylight';
  if (keyword) {
    const { buildBannerPrompt } = await import('./lib/banner-gen');
    prompt = buildBannerPrompt(keyword);
  }

  try {
    const resp = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: { prompt },
          parameters: { style: '<photography>', size: '1280*720', n: 1 },
        }),
      },
    );

    const bodyText = await resp.text();

    // 提交成功并不代表能出图：真正的失败常发生在轮询阶段（任务被服务端判 FAILED）。
    // 所以这里把任务跑到底，连同最终 task_status 与 message 一起返回。
    let taskId: string | null = null;
    try {
      taskId = (JSON.parse(bodyText) as { output?: { task_id?: string } }).output?.task_id ?? null;
    } catch {
      // 非 JSON，忽略
    }

    const polls: Array<{ attempt: number; status: string; message?: string }> = [];
    let imageUrl: string | null = null;

    if (taskId && resp.ok) {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const pr = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const pj = (await pr.json()) as {
          output?: { task_status?: string; message?: string; results?: Array<{ url: string }> };
        };
        const status = pj.output?.task_status ?? 'UNKNOWN';
        polls.push({ attempt: i + 1, status, message: pj.output?.message });
        if (status === 'SUCCEEDED') {
          imageUrl = pj.output?.results?.[0]?.url ?? null;
          break;
        }
        if (status === 'FAILED') break;
      }
    }

    return jsonResponse({
      ok: resp.ok,
      stage: 'submit+poll',
      status: resp.status,
      elapsedMs: Date.now() - started,
      taskId,
      polls,
      finalStatus: polls.length ? polls[polls.length - 1].status : null,
      finalMessage: polls.length ? polls[polls.length - 1].message ?? null : null,
      imageUrl: imageUrl ? '(ok)' : null,
      qwenModelVar: env.QWEN_MODEL || null,
      promptUsed: prompt,
      body: bodyText.slice(0, 400),
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      stage: 'network',
      elapsedMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// 待提交 Google 的 URL 清单
//
// IndexNow 只覆盖 Bing / Yandex，Google 不参与该协议，也没有面向普通文章的
// Indexing API，所以每次发布后把新 URL 记进 gsc:pending，
// 供人工在 Search Console 里批量请求编入索引。
route('GET', '/api/gsc/pending', async ({ env }) => {
  const { getJSON } = await import('./lib/kv');
  const data = await getJSON<{ urls: Array<{ url: string; slug: string; publishedAt: string }>; updatedAt?: string }>(
    env.SEO_DATA,
    'gsc:pending',
  );
  const urls = data?.urls ?? [];
  return jsonResponse({
    count: urls.length,
    updatedAt: data?.updatedAt ?? null,
    urls,
    plain: urls.map((u) => u.url).join('\n'),
  });
});

// 把已发布文章补进清单（首次启用时用，需 ADMIN_TOKEN）
// ?days=N 只补最近 N 天发布的；不传则补齐全部
route('POST', '/api/gsc/pending/seed', async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { getJSON, setJSON } = await import('./lib/kv');

  interface PendingRow { url: string; slug: string; publishedAt: string }
  interface PublishedRow { slug: string; publishedAt?: string }

  const days = Number(url.searchParams.get('days') ?? 0);
  const cutoff = days > 0 ? Date.now() - days * 86400_000 : 0;

  const published = (await getJSON<PublishedRow[]>(env.CONTENT_QUEUE, 'published:all')) ?? [];
  const existing = (await getJSON<{ urls: PendingRow[] }>(env.SEO_DATA, 'gsc:pending')) ?? { urls: [] };
  const bySlug = new Map(existing.urls.map((row) => [row.slug, row]));
  let added = 0;

  for (const row of published) {
    if (!row.slug) continue;
    if (bySlug.has(row.slug)) continue;
    const publishedAt = row.publishedAt ?? new Date().toISOString();
    if (cutoff && new Date(publishedAt).getTime() < cutoff) continue;
    bySlug.set(row.slug, {
      url: `https://www.kestrelmetal.com/${row.slug}.html`,
      slug: row.slug,
      publishedAt,
    });
    added++;
  }

  const urls = Array.from(bySlug.values()).sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  await setJSON(env.SEO_DATA, 'gsc:pending', { urls, updatedAt: new Date().toISOString() });
  return jsonResponse({ message: 'Seeded', added, count: urls.length });
});

// 清空整份清单，或移除指定 slug（需 ADMIN_TOKEN）
route('DELETE', '/api/gsc/pending', async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { getJSON, setJSON } = await import('./lib/kv');
  const slug = url.searchParams.get('slug');

  if (!slug) {
    await setJSON(env.SEO_DATA, 'gsc:pending', { urls: [], updatedAt: new Date().toISOString() });
    return jsonResponse({ message: 'Cleared', count: 0 });
  }

  const data = await getJSON<{ urls: Array<{ url: string; slug: string; publishedAt: string }> }>(
    env.SEO_DATA,
    'gsc:pending',
  );
  const urls = (data?.urls ?? []).filter((row) => row.slug !== slug);
  await setJSON(env.SEO_DATA, 'gsc:pending', { urls, updatedAt: new Date().toISOString() });
  return jsonResponse({ message: 'Removed', slug, count: urls.length });
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

// 缺口分析结果（同时保存到 KV 供 Cron 任务读取）
route('GET', '/api/competitors/gap', async ({ env }) => {
  const { computeGap } = await import('./lib/competitor');
  const gaps = await computeGap(env);
  await env.SEO_DATA.put('competitors:gap', JSON.stringify({ gaps, generatedAt: new Date().toISOString() }));
  return jsonResponse({ gaps, generatedAt: new Date().toISOString() });
});

// ─── 关键词分组管理（聚类） ───

// 分组定义（供 Admin 下拉选择）
route('GET', '/api/keyword-groups/defs', async () => {
  const { listGroupDefs } = await import('./lib/keyword-cluster');
  return jsonResponse({ groups: listGroupDefs() });
});

// 聚类结果（?refresh=1 强制重算）
route('GET', '/api/keyword-groups', async ({ env, url }) => {
  const { runClustering, loadCachedCluster, selectGroups } = await import('./lib/keyword-cluster');
  const forceRefresh = url.searchParams.get('refresh') === '1';
  const result = forceRefresh ? await runClustering(env) : ((await loadCachedCluster(env)) ?? await runClustering(env));
  // 与 generate 的 MAX_GROUPS_PER_RUN 保持一致：当前每天 1 组
  const upcoming = selectGroups(result, 1).map((g) => ({
    id: g.id,
    name: g.name,
    primaryKeyword: g.primaryKeyword,
    keywordCount: g.keywords.length,
  }));
  return jsonResponse({ ...result, upcoming });
});

// 强制重新聚类（需 ADMIN_TOKEN）
route('POST', '/api/keyword-groups/rebuild', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const { runClustering } = await import('./lib/keyword-cluster');
  const result = await runClustering(env);
  return jsonResponse({ message: 'Clustering rebuilt', totalGroups: result.groups.length, ...result });
});

// 手动把某个关键词指定到某个组（需 ADMIN_TOKEN）
route('POST', '/api/keyword-groups/assign', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<{ keyword?: string; groupId?: string }>().catch(() => null);
  if (!body?.keyword || !body?.groupId) {
    return jsonResponse({ error: 'keyword and groupId are required' }, 400);
  }
  const { loadOverrides, saveOverrides, normalizeKeyword, isValidGroupId } = await import('./lib/keyword-cluster');
  if (!isValidGroupId(body.groupId)) {
    return jsonResponse({ error: `Unknown groupId: ${body.groupId}` }, 400);
  }
  const overrides = await loadOverrides(env);
  overrides.assign = overrides.assign ?? {};
  const keyword = normalizeKeyword(body.keyword);
  overrides.assign[keyword] = body.groupId;
  overrides.exclude = (overrides.exclude ?? []).filter((k) => normalizeKeyword(k) !== keyword);
  await saveOverrides(env, overrides);
  const { runClustering } = await import('./lib/keyword-cluster');
  await runClustering(env);
  return jsonResponse({ message: 'Assigned', keyword, groupId: body.groupId });
});

// 排除某个关键词，不参与选题（需 ADMIN_TOKEN）
route('POST', '/api/keyword-groups/exclude', async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const body = await request.json<{ keyword?: string }>().catch(() => null);
  if (!body?.keyword) {
    return jsonResponse({ error: 'keyword is required' }, 400);
  }
  const { loadOverrides, saveOverrides, normalizeKeyword } = await import('./lib/keyword-cluster');
  const overrides = await loadOverrides(env);
  const keyword = normalizeKeyword(body.keyword);
  overrides.exclude = Array.from(new Set([...(overrides.exclude ?? []), keyword]));
  if (overrides.assign) delete overrides.assign[keyword];
  await saveOverrides(env, overrides);
  const { runClustering } = await import('./lib/keyword-cluster');
  await runClustering(env);
  return jsonResponse({ message: 'Excluded', keyword });
});

// 清除某个关键词的人工调整（需 ADMIN_TOKEN）
route('DELETE', '/api/keyword-groups/override', async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const keyword = url.searchParams.get('keyword');
  if (!keyword) {
    return jsonResponse({ error: 'keyword is required' }, 400);
  }
  const { loadOverrides, saveOverrides, normalizeKeyword } = await import('./lib/keyword-cluster');
  const overrides = await loadOverrides(env);
  const normalized = normalizeKeyword(keyword);
  overrides.exclude = (overrides.exclude ?? []).filter((k) => normalizeKeyword(k) !== normalized);
  if (overrides.assign) delete overrides.assign[normalized];
  await saveOverrides(env, overrides);
  const { runClustering } = await import('./lib/keyword-cluster');
  await runClustering(env);
  return jsonResponse({ message: 'Override cleared', keyword: normalized });
});

// 为指定已发布文章重新生成 Banner（需 ADMIN_TOKEN）
route('POST', '/api/banner/regenerate', async ({ env, request }) => {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = (await request.json()) as { slug?: string };
  if (!body.slug) return jsonResponse({ error: 'slug is required' }, 400);

  const published = await env.CONTENT_QUEUE.get(`published:${body.slug}`, 'json') as { html?: string; title?: string; keyword?: string } | null;
  if (!published || !published.html) return jsonResponse({ error: 'Article not found' }, 404);

  try {
    const { generateBannerImage, applyBannerToHtml } = await import('./lib/banner-gen');
    const bannerUrl = await generateBannerImage(
      { QWEN_API_KEY: env.QWEN_API_KEY, QWEN_MODEL: env.QWEN_MODEL, IMAGES: env.IMAGES },
      published.keyword || '',
      body.slug,
    );
    if (bannerUrl) {
      const hasSlot = /background-image:url\('[^']*'\);/.test(published.html);
      if (hasSlot) {
        // 同时更新 hero 背景与 JSON-LD 的 Article.image
        const updatedHtml = applyBannerToHtml(published.html, bannerUrl);
        await env.CONTENT_QUEUE.put(`published:${body.slug}`, JSON.stringify({ ...published, html: updatedHtml }));
        return jsonResponse({ ok: true, slug: body.slug, bannerUrl, inserted: true });
      }

      // 文章没有 hero 结构时（早期模板产物）无法就地插入，仍然返回图片地址，
      // 由调用方自行补 HTML 结构。另外注意：凡同时存在静态 .html 的文章，
      // 页面由 ASSETS 直出，改 KV 不会生效，必须同步改静态文件。
      return jsonResponse({
        ok: true,
        slug: body.slug,
        bannerUrl,
        inserted: false,
        reason: 'no background-image slot in stored html; hero section missing',
      });
    }
    return jsonResponse({ ok: false, error: 'Banner generation returned no URL' });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
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
    return jsonResponse({ message: 'GSC sync completed (opportunity analysis included)', siteUrl: env.GSC_SITE_URL });
  }

  if (cronName === 'opportunity') {
    const { default: opportunityCron } = await import('./cron/opportunity');
    await opportunityCron(env);
    return jsonResponse({ message: 'Opportunity analysis completed' });
  }

  if (cronName === 'generate') {
    const { default: generate } = await import('./cron/generate');
    const result = await generate(env);
    return jsonResponse({ message: 'Content generation completed', ...result });
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
