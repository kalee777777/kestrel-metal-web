/**
 * Google Search Console API 集成 — OAuth2 认证 + 关键词排名查询
 *
 * 使用 OAuth2 refresh_token 自动获取 access_token
 * 调用 searchAnalytics.query 获取关键词的展示、点击、排名数据
 */

export interface GscTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface GscQueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryResponse {
  rows: GscQueryRow[];
  responseAggregationType: string;
}

export interface GscEnv {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GSC_REFRESH_TOKEN: string;
  GSC_SITE_URL: string;
  SEO_DATA: KVNamespace;
}

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TOKEN_CACHE_KEY = 'gsc:access_token';

/**
 * 获取有效的 access_token
 * 优先从 KV 缓存读取，过期则刷新
 */
async function getAccessToken(env: GscEnv): Promise<string> {
  const cached = await env.SEO_DATA.get(TOKEN_CACHE_KEY);
  if (cached) {
    try {
      const token = JSON.parse(cached) as { access_token: string; expires_at: number };
      if (Date.now() < token.expires_at - 60_000) {
        return token.access_token;
      }
    } catch {
      // cache corrupted, refresh
    }
  }

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GSC_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GSC token refresh failed (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as GscTokenResponse;

  // 缓存到 KV，提前 5 分钟过期
  const expiresAt = Date.now() + data.expires_in * 1000;
  await env.SEO_DATA.put(
    TOKEN_CACHE_KEY,
    JSON.stringify({ access_token: data.access_token, expires_at: expiresAt }),
    { expirationTtl: Math.floor(data.expires_in / 2) },
  );

  return data.access_token;
}

/**
 * 调用 GSC searchAnalytics.query
 * 拉取指定日期范围的关键词数据
 */
export async function querySearchAnalytics(
  env: GscEnv,
  startDate: string,
  endDate: string,
  dimensions: string[] = ['query'],
  rowLimit = 1000,
): Promise<GscQueryRow[]> {
  const accessToken = await getAccessToken(env);
  const siteUrl = encodeURIComponent(env.GSC_SITE_URL);

  const url = `${GSC_API_BASE}/sites/${siteUrl}/searchAnalytics/query`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
      startRow: 0,
      dimensionFilterGroups: [],
      searchType: 'web',
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GSC query failed (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as GscQueryResponse;
  return data.rows ?? [];
}

/**
 * 分页拉取全部关键词数据
 * GSC 单次最多返回 25000 行，超过需要分页
 */
export async function queryAllKeywords(
  env: GscEnv,
  startDate: string,
  endDate: string,
): Promise<GscQueryRow[]> {
  const allRows: GscQueryRow[] = [];
  let startRow = 0;
  const pageSize = 25000;

  while (true) {
    const accessToken = await getAccessToken(env);
    const siteUrl = encodeURIComponent(env.GSC_SITE_URL);

    const resp = await fetch(
      `${GSC_API_BASE}/sites/${siteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: pageSize,
          startRow,
          searchType: 'web',
        }),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`GSC paginated query failed at row ${startRow}: ${errText}`);
    }

    const data = (await resp.json()) as GscQueryResponse;
    const rows = data.rows ?? [];
    allRows.push(...rows);

    if (rows.length < pageSize) break;
    startRow += pageSize;
  }

  return allRows;
}

/**
 * 验证 GSC 连接是否正常
 * 用极小的查询测试认证和权限
 */
export async function verifyConnection(env: GscEnv): Promise<{
  ok: boolean;
  siteUrl: string;
  rowCount?: number;
  error?: string;
}> {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 3 * 86400_000).toISOString().split('T')[0];
    const rows = await querySearchAnalytics(env, startDate, endDate, ['query'], 5);
    return { ok: true, siteUrl: env.GSC_SITE_URL, rowCount: rows.length };
  } catch (err) {
    return {
      ok: false,
      siteUrl: env.GSC_SITE_URL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
