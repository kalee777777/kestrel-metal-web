/**
 * Cloudflare KV 封装 — 类型安全的读写操作
 * 用于存储关键词排名、选题队列、评分日志等 SEO 工作流数据
 */

export interface RankingRecord {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  date: string;
}

export interface TargetKeyword {
  keyword: string;
  productLine: string;
  priority: 'high' | 'medium' | 'low';
  currentRank?: number;
  previousRank?: number;
}

export interface OpportunityItem {
  keyword: string;
  type: 'low_ctr' | 'page_two' | 'new_opportunity' | 'competitor_gap';
  impressions: number;
  clicks: number;
  position: number;
  suggestedAction: string;
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
}

export interface ContentDraft {
  slug: string;
  title: string;
  metaDescription: string;
  html: string;
  keyword: string;
  status: 'queued' | 'generating' | 'image_gen' | 'scoring' | 'deploying' | 'published' | 'skipped';
  createdAt: string;
  publishedAt?: string;
  score?: number;
  scoreRound?: number;
  images?: string[];
}

export interface ScoreRecord {
  slug: string;
  round: number;
  score: number;
  checks: CheckResult[];
  fixedIssues?: string[];
  timestamp: string;
}

export interface CheckResult {
  name: string;
  passed: boolean;
  points: number;
  message: string;
}

/** 读取 JSON 数据并解析为指定类型 */
export async function getJSON<T>(
  ns: KVNamespace,
  key: string,
): Promise<T | null> {
  const raw = await ns.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 写入 JSON 数据 */
export async function setJSON<T>(
  ns: KVNamespace,
  key: string,
  value: T,
  ttl?: number,
): Promise<void> {
  const text = JSON.stringify(value);
  if (ttl) {
    await ns.put(key, text, { expirationTtl: ttl });
  } else {
    await ns.put(key, text);
  }
}

/** 追加数据到列表 */
export async function appendToList<T>(
  ns: KVNamespace,
  key: string,
  item: T,
  maxItems = 100,
): Promise<T[]> {
  const list = (await getJSON<T[]>(ns, key)) ?? [];
  list.unshift(item);
  if (list.length > maxItems) list.length = maxItems;
  await setJSON(ns, key, list);
  return list;
}

/** 按前缀列出所有键 */
export async function listKeys(
  ns: KVNamespace,
  prefix: string,
  limit = 100,
): Promise<{ name: string; metadata?: unknown }[]> {
  const result = await ns.list({ prefix, limit });
  return result.keys;
}

/** 获取今天日期字符串 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/** 获取当前时间戳 */
export function now(): string {
  return new Date().toISOString();
}

// ─── SEO_DATA namespace helpers ───

/** 存储当日排名快照 */
export async function saveRankings(
  ns: KVNamespace,
  date: string,
  rankings: RankingRecord[],
): Promise<void> {
  await setJSON(ns, `rankings:${date}`, rankings);
  await ns.put('gsc:last_sync', new Date().toISOString());
}

/** 获取指定日期排名 */
export async function getRankings(
  ns: KVNamespace,
  date: string,
): Promise<RankingRecord[] | null> {
  return getJSON<RankingRecord[]>(ns, `rankings:${date}`);
}

/** 获取关键词历史趋势 */
export async function getKeywordTrend(
  ns: KVNamespace,
  keyword: string,
  days = 30,
): Promise<RankingRecord[]> {
  const trend: RankingRecord[] = [];
  const todayDate = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rankings = await getRankings(ns, dateStr);
    if (rankings) {
      const found = rankings.find((r) => r.keyword === keyword);
      if (found) trend.unshift(found);
    }
  }
  return trend;
}

// ─── CONTENT_QUEUE namespace helpers ───

/** 获取待处理选题队列 */
export async function getContentQueue(
  ns: KVNamespace,
): Promise<ContentDraft[]> {
  return (await getJSON<ContentDraft[]>(ns, 'queue:pending')) ?? [];
}

/** 更新选题队列 */
export async function setContentQueue(
  ns: KVNamespace,
  queue: ContentDraft[],
): Promise<void> {
  await setJSON(ns, 'queue:pending', queue);
}

/** 保存草稿 */
export async function saveDraft(
  ns: KVNamespace,
  draft: ContentDraft,
): Promise<void> {
  await setJSON(ns, `draft:${draft.slug}`, draft);
}

/** 获取草稿 */
export async function getDraft(
  ns: KVNamespace,
  slug: string,
): Promise<ContentDraft | null> {
  return getJSON<ContentDraft>(ns, `draft:${slug}`);
}

/** 标记文章已发布 */
export async function markPublished(
  ns: KVNamespace,
  draft: ContentDraft,
): Promise<void> {
  draft.status = 'published';
  draft.publishedAt = now();
  await setJSON(ns, `published:${draft.slug}`, {
    slug: draft.slug,
    title: draft.title,
    keyword: draft.keyword,
    publishedAt: draft.publishedAt,
    score: draft.score,
  });
  // 追加到已发布列表
  await appendToList(ns, 'published:all', {
    slug: draft.slug,
    title: draft.title,
    publishedAt: draft.publishedAt,
  }, 500);
}

// ─── SCORE_LOG namespace helpers ───

/** 保存评分记录 */
export async function saveScore(
  ns: KVNamespace,
  record: ScoreRecord,
): Promise<void> {
  await setJSON(ns, `score:${record.slug}:round_${record.round}`, record);
  await appendToList(ns, `fix_log:${record.slug}`, record, 10);
}

/** 获取评分历史 */
export async function getScoreHistory(
  ns: KVNamespace,
  slug: string,
): Promise<ScoreRecord[]> {
  return (await getJSON<ScoreRecord[]>(ns, `fix_log:${slug}`)) ?? [];
}
