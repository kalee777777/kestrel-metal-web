/**
 * 询盘数据管理模块 — Cloudflare KV 存储操作
 *
 * 数据结构（v2，2026-10-07 起消除索引读改写竞态）：
 *   inquiries:item:{id}  — 单条询盘详情 (JSON object)
 *                          put 时附带 KV metadata（列表/统计/导出所需的索引字段）
 *
 * 列表、统计、CSV 导出一律通过 kv.list({ prefix: 'inquiries:item:' }) 枚举 +
 * key metadata 生成，不再维护集中式 inquiries:list 索引键：
 *   - 并发创建各自写独立 item 键，互不覆盖，不存在丢索引的竞态窗口
 *   - 删除即删键，天然幂等，不会残留幻影条目
 *   - 旧版本的 inquiries:list / inquiries:stats 键已停止读写，残留无害
 *
 * 子请求预算：Worker 单次调用上限 50（见 docs/GEO_PROGRESS.md）。
 * list 枚举每页 1000 key 计 1 次；详情补全（搜索/列表页切片/旧数据迁移）
 * 一律受 DETAIL_FETCH_BUDGET 约束，超限降级为仅元数据字段。
 */

export interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  product_name?: string;
  quantity?: string;
  status: 'pending' | 'replied' | 'closed';
  message: string;
  source_page?: string;
  created_at: string;
  replied_at?: string;
  replies?: Array<{
    admin: { username: string };
    content: string;
    created_at: string;
  }>;
}

export interface InquiryListResponse {
  data: Inquiry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** item 键上携带的 KV metadata（上限 1KB，超长字段截断，全文以 item 详情为准） */
interface InquiryIndexMeta {
  id: number;
  status: Inquiry['status'];
  created_at: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  product_name: string;
  quantity: string;
  source_page: string;
}

const ITEM_PREFIX = 'inquiries:item:';
/** 详情读取预算：留余量给 list 枚举等必要子请求，确保单次调用总数不超 50 */
const DETAIL_FETCH_BUDGET = 40;
/** metadata 单字段截断长度，11 个字段合计远小于 1KB 上限 */
const META_FIELD_MAX = 120;

function itemKey(id: number): string {
  return `${ITEM_PREFIX}${id}`;
}

function metaField(value: string | undefined | null): string {
  const s = (value ?? '').toString();
  return s.length > META_FIELD_MAX ? s.slice(0, META_FIELD_MAX) : s;
}

function buildIndexMeta(inq: Inquiry): InquiryIndexMeta {
  return {
    id: inq.id,
    status: inq.status,
    created_at: inq.created_at,
    name: metaField(inq.name),
    email: metaField(inq.email),
    phone: metaField(inq.phone),
    company: metaField(inq.company),
    country: metaField(inq.country),
    product_name: metaField(inq.product_name),
    quantity: metaField(inq.quantity),
    source_page: metaField(inq.source_page)
  };
}

function rowFromMeta(meta: InquiryIndexMeta): Inquiry {
  return { ...meta, message: '', replies: [] };
}

/** 枚举全部询盘键的 metadata 索引（每 1000 键 1 次子请求） */
async function listIndexKeys(
  kv: KVNamespace
): Promise<Array<{ id: number; meta: InquiryIndexMeta | null }>> {
  const out: Array<{ id: number; meta: InquiryIndexMeta | null }> = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list<InquiryIndexMeta>({ prefix: ITEM_PREFIX, cursor });
    for (const k of page.keys) {
      const id = parseInt(k.name.slice(ITEM_PREFIX.length), 10);
      if (!isNaN(id)) out.push({ id, meta: k.metadata ?? null });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor !== undefined);
  return out;
}

/** 批量拉取详情补全行（message / replies），失败或已删键回落到元数据行 */
async function hydrateRows(kv: KVNamespace, rows: Inquiry[]): Promise<Inquiry[]> {
  if (!rows.length) return rows;
  const details = await Promise.all(rows.map(r => kv.get(itemKey(r.id), 'json')));
  return rows.map((r, i) => (details[i] as Inquiry | null) ?? r);
}

/**
 * 构建全量索引行：
 *   - 有 metadata 的键直接生成行（0 次详情读取）
 *   - 无 metadata 的旧数据（v1 写入）拉详情重建，并回写 metadata 完成永久迁移
 */
async function buildIndex(kv: KVNamespace): Promise<Inquiry[]> {
  const keys = await listIndexKeys(kv);
  const legacy = keys.filter(k => k.meta === null);
  const healed = new Map<number, Inquiry>();

  if (legacy.length > 0) {
    // 预算内全部迁移；超出预算的旧键以极简行展示（仅 id），下次调用继续迁移
    const toHeal = legacy.slice(0, DETAIL_FETCH_BUDGET);
    const details = await Promise.all(toHeal.map(k => kv.get(itemKey(k.id), 'json')));
    await Promise.all(toHeal.map((k, i) => {
      const d = details[i] as Inquiry | null;
      if (!d) return null;
      healed.set(k.id, d);
      return kv.put(itemKey(k.id), JSON.stringify(d), { metadata: buildIndexMeta(d) });
    }));
  }

  return keys.map(k => {
    if (k.meta) return rowFromMeta(k.meta);
    if (healed.has(k.id)) return healed.get(k.id)!;
    return { id: k.id, status: 'pending', created_at: '', name: '', email: '', message: '', replies: [] } as Inquiry;
  });
}

/** 获取询盘列表（分页） */
export async function getInquiries(
  kv: KVNamespace,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: string
): Promise<InquiryListResponse> {
  let rows = await buildIndex(kv);
  let rowsHydrated = false;

  // 关键词搜索契约（docs/inquiry-api-guide.md）：name / email / company / product_name / message。
  // message 不在 metadata 里，规模在预算内时全量拉详情保证全文搜索；超预算降级为元数据字段。
  if (search) {
    if (rows.length <= DETAIL_FETCH_BUDGET) {
      rows = await hydrateRows(kv, rows);
      rowsHydrated = true;
    } else {
      console.warn(`[inquiries] ${rows.length} rows exceed detail budget ${DETAIL_FETCH_BUDGET}, search degrades to metadata fields`);
    }
    const q = search.toLowerCase();
    rows = rows.filter(inq =>
      inq.name?.toLowerCase().includes(q) ||
      inq.email?.toLowerCase().includes(q) ||
      inq.company?.toLowerCase().includes(q) ||
      inq.product_name?.toLowerCase().includes(q) ||
      inq.message?.toLowerCase().includes(q)
    );
  }

  // 状态过滤
  if (status) {
    rows = rows.filter(inq => inq.status === status);
  }

  // 按创建时间倒序排列；同毫秒创建的以 id（时间戳+随机数）决胜，保证顺序确定
  rows.sort((a, b) =>
    (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || (b.id - a.id)
  );

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginated = rows.slice(startIndex, startIndex + pageSize);

  // 列表页切片补全详情（message / replies），保证与 v1 响应字段完全一致；
  // 大 pageSize 场景（CSV 导出 10000）只导出 metadata 字段，不补全
  const data = (rowsHydrated || pageSize > DETAIL_FETCH_BUDGET)
    ? paginated
    : await hydrateRows(kv, paginated);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages
  };
}

/** 获取单条询盘详情 */
export async function getInquiryById(
  kv: KVNamespace,
  id: number
): Promise<Inquiry | null> {
  const data = await kv.get(itemKey(id), 'json');
  return data ? (data as Inquiry) : null;
}

/** 创建新询盘：只写独立 item 键（详情 + metadata 索引），无共享索引键，并发安全 */
export async function createInquiry(
  kv: KVNamespace,
  inquiryData: Omit<Inquiry, 'id' | 'created_at' | 'status' | 'replies'>
): Promise<Inquiry> {
  // id = 毫秒时间戳 + 百万随机空间：同毫秒并发提交时撞 id 概率约 1e-6，
  // 相比 v1 的 1/1000 随机空间（同毫秒碰撞即互相覆盖丢单）降低三个数量级
  const id = Date.now() + Math.floor(Math.random() * 1_000_000);
  const inquiry: Inquiry = {
    ...inquiryData,
    id,
    status: 'pending',
    created_at: new Date().toISOString(),
    replies: []
  };

  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });

  return inquiry;
}

/** 更新询盘状态（详情与 metadata 同步重写） */
export async function updateInquiry(
  kv: KVNamespace,
  id: number,
  updates: Partial<Pick<Inquiry, 'status' | 'replied_at'>>
): Promise<Inquiry | null> {
  const data = await kv.get(itemKey(id), 'json');
  if (!data) return null;

  const inquiry = { ...(data as Inquiry), ...updates };
  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });

  return inquiry;
}

/** 删除询盘：删键即从枚举中消失，天然幂等 */
export async function deleteInquiry(
  kv: KVNamespace,
  id: number
): Promise<boolean> {
  await kv.delete(itemKey(id));
  return true;
}

/** 添加回复（详情与 metadata 同步重写） */
export async function addReply(
  kv: KVNamespace,
  id: number,
  reply: { content: string; admin?: { username: string } }
): Promise<Inquiry | null> {
  const data = await kv.get(itemKey(id), 'json');
  if (!data) return null;

  const inquiry = data as Inquiry;
  if (!inquiry.replies) inquiry.replies = [];

  inquiry.replies.push({
    admin: reply.admin || { username: 'admin' },
    content: reply.content,
    created_at: new Date().toISOString()
  });

  inquiry.status = 'replied';
  inquiry.replied_at = new Date().toISOString();

  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });

  return inquiry;
}

/** 获取询盘统计信息（从索引实时计算，不再缓存到 inquiries:stats） */
export async function getInquiryStats(
  kv: KVNamespace
): Promise<{ total: number; pending: number; replied: number; closed: number; today: number }> {
  const rows = await buildIndex(kv);

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    total: rows.length,
    pending: rows.filter(i => i.status === 'pending').length,
    replied: rows.filter(i => i.status === 'replied').length,
    closed: rows.filter(i => i.status === 'closed').length,
    today: rows.filter(i => i.created_at?.split('T')[0] === todayStr).length
  };
}
