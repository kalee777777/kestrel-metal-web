/**
 * 询盘数据管理模块 — Cloudflare KV 存储操作
 *
 * 数据结构：
 *   inquiries:list          — 询盘索引列表 (JSON array)
 *   inquiries:item:{id}     — 单条询盘详情 (JSON object)
 *   inquiries:stats         — 询盘统计信息
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

/** 获取询盘列表（分页） */
export async function getInquiries(
  kv: KVNamespace,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  status?: string
): Promise<InquiryListResponse> {
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  let inquiries: Inquiry[] = listData ? (listData as Inquiry[]) : [];

  // 搜索过滤
  if (search) {
    const searchLower = search.toLowerCase();
    inquiries = inquiries.filter(inq =>
      inq.name?.toLowerCase().includes(searchLower) ||
      inq.email?.toLowerCase().includes(searchLower) ||
      inq.company?.toLowerCase().includes(searchLower) ||
      inq.product_name?.toLowerCase().includes(searchLower) ||
      inq.message?.toLowerCase().includes(searchLower)
    );
  }

  // 状态过滤
  if (status) {
    inquiries = inquiries.filter(inq => inq.status === status);
  }

  // 按创建时间倒序排列
  inquiries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = inquiries.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedInquiries = inquiries.slice(startIndex, startIndex + pageSize);

  return {
    data: paginatedInquiries,
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
  const itemKey = `inquiries:item:${id}`;
  const data = await kv.get(itemKey, 'json');
  return data ? (data as Inquiry) : null;
}

/** 创建新询盘 */
export async function createInquiry(
  kv: KVNamespace,
  inquiryData: Omit<Inquiry, 'id' | 'created_at' | 'status' | 'replies'>
): Promise<Inquiry> {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const inquiry: Inquiry = {
    ...inquiryData,
    id,
    status: 'pending',
    created_at: new Date().toISOString(),
    replies: []
  };

  // 保存询盘详情
  const itemKey = `inquiries:item:${id}`;
  await kv.put(itemKey, JSON.stringify(inquiry));

  // 更新索引列表
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  const inquiries: Inquiry[] = listData ? (listData as Inquiry[]) : [];
  inquiries.push(inquiry);
  await kv.put(listKey, JSON.stringify(inquiries));

  // 更新统计
  await updateInquiryStats(kv);

  return inquiry;
}

/** 更新询盘状态 */
export async function updateInquiry(
  kv: KVNamespace,
  id: number,
  updates: Partial<Pick<Inquiry, 'status' | 'replied_at'>>
): Promise<Inquiry | null> {
  const itemKey = `inquiries:item:${id}`;
  const data = await kv.get(itemKey, 'json');
  if (!data) return null;

  const inquiry = { ...(data as Inquiry), ...updates };
  await kv.put(itemKey, JSON.stringify(inquiry));

  // 更新索引列表
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  if (listData) {
    const inquiries = (listData as Inquiry[]).map(inq =>
      inq.id === id ? inquiry : inq
    );
    await kv.put(listKey, JSON.stringify(inquiries));
  }

  // 更新统计
  await updateInquiryStats(kv);

  return inquiry;
}

/** 删除询盘 */
export async function deleteInquiry(
  kv: KVNamespace,
  id: number
): Promise<boolean> {
  const itemKey = `inquiries:item:${id}`;
  const data = await kv.get(itemKey, 'json');
  if (!data) return false;

  // 删除询盘详情
  await kv.delete(itemKey);

  // 更新索引列表
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  if (listData) {
    const inquiries = (listData as Inquiry[]).filter(inq => inq.id !== id);
    await kv.put(listKey, JSON.stringify(inquiries));
  }

  // 更新统计
  await updateInquiryStats(kv);

  return true;
}

/** 添加回复 */
export async function addReply(
  kv: KVNamespace,
  id: number,
  reply: { content: string; admin?: { username: string } }
): Promise<Inquiry | null> {
  const itemKey = `inquiries:item:${id}`;
  const data = await kv.get(itemKey, 'json');
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

  await kv.put(itemKey, JSON.stringify(inquiry));

  // 更新索引列表
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  if (listData) {
    const inquiries = (listData as Inquiry[]).map(inq =>
      inq.id === id ? inquiry : inq
    );
    await kv.put(listKey, JSON.stringify(inquiries));
  }

  // 更新统计
  await updateInquiryStats(kv);

  return inquiry;
}

/** 获取询盘统计信息 */
export async function getInquiryStats(
  kv: KVNamespace
): Promise<{ total: number; pending: number; replied: number; closed: number }> {
  const statsKey = 'inquiries:stats';
  const data = await kv.get(statsKey, 'json');
  if (data) return data as { total: number; pending: number; replied: number; closed: number };

  // 如果没有缓存，计算统计
  return await updateInquiryStats(kv);
}

/** 更新询盘统计 */
async function updateInquiryStats(
  kv: KVNamespace
): Promise<{ total: number; pending: number; replied: number; closed: number }> {
  const listKey = 'inquiries:list';
  const listData = await kv.get(listKey, 'json');
  const inquiries: Inquiry[] = listData ? (listData as Inquiry[]) : [];

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    replied: inquiries.filter(i => i.status === 'replied').length,
    closed: inquiries.filter(i => i.status === 'closed').length
  };

  const statsKey = 'inquiries:stats';
  await kv.put(statsKey, JSON.stringify(stats));

  return stats;
}