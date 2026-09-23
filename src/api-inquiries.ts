/**
 * 询盘 API 接口 — 对外提供的询盘数据访问接口
 *
 * 端点：
 *   POST /api/inquiries                    → 创建新询盘（前台提交）
 *   GET  /api/inquiries                    → Admin 获取询盘列表（分页）
 *   GET  /api/inquiries/stats/count        → Admin 获取询盘统计
 *   GET  /api/inquiries/export/csv         → Admin 导出 CSV
 *   GET  /api/inquiries/:id                → Admin 获取单条询盘详情
 *   DELETE /api/inquiries/:id              → Admin 删除询盘
 *   POST /api/inquiries/:id/replies        → Admin 回复询盘
 *   GET  /api/external/inquiries           → 外部获取询盘列表（分页）
 *   GET  /api/external/inquiries/stats     → 外部获取询盘统计信息
 *   GET  /api/external/inquiries/:id       → 外部获取单条询盘详情
 */

import { route, jsonResponse, type RouteContext } from './router';
import {
  getInquiries,
  getInquiryById,
  getInquiryStats,
  createInquiry,
  updateInquiry,
  deleteInquiry,
  addReply
} from './lib/inquiries';

interface InquiryRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  product_name?: string;
  quantity?: string;
  message?: string;
  source_page?: string;
}

/** 验证 API 密钥 */
function verifyApiKey(ctx: RouteContext, env: { INQUIRY_API_KEY: string }): boolean {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader) return false;

  // 支持 Bearer token 格式
  const token = authHeader.replace('Bearer ', '');
  return token === env.INQUIRY_API_KEY;
}

/** 创建新询盘（前台提交） */
route('POST', '/api/inquiries', async (ctx: RouteContext) => {
  const { env, request } = ctx;
  // 验证 API 密钥
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid API key' }, 401);
  }

  try {
    const body = await request.json() as InquiryRequest;
    const { name, email, phone, company, country, product_name, quantity, message, source_page } = body;

    // 验证必填字段
    if (!name || !email || !message) {
      return jsonResponse({ error: 'Bad request', message: 'Missing required fields: name, email, message' }, 400);
    }

    const inquiry = await createInquiry(env.INQUIRIES, {
      name,
      email,
      phone: phone || '',
      company: company || '',
      country: country || '',
      product_name: product_name || '',
      quantity: quantity || '',
      message,
      source_page: source_page || ''
    });

    return jsonResponse(inquiry, 201);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** 获取询盘列表 */
route('GET', '/api/external/inquiries', async (ctx: RouteContext) => {
  const { env, url } = ctx;
  // 验证 API 密钥
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid API key' }, 401);
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';

  try {
    const result = await getInquiries(env.INQUIRIES, page, pageSize, search, status);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** 获取询盘统计信息 */
route('GET', '/api/external/inquiries/stats', async (ctx: RouteContext) => {
  const { env } = ctx;
  // 验证 API 密钥
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid API key' }, 401);
  }

  try {
    const stats = await getInquiryStats(env.INQUIRIES);
    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** 获取单条询盘详情 */
route('GET', '/api/external/inquiries/:id', async (ctx: RouteContext) => {
  const { env, params } = ctx;
  // 验证 API 密钥
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized', message: 'Invalid API key' }, 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Bad request', message: 'Invalid inquiry ID' }, 400);
  }

  try {
    const inquiry = await getInquiryById(env.INQUIRIES, id);
    if (!inquiry) {
      return jsonResponse({ error: 'Not found', message: 'Inquiry not found' }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

// ─── Admin 后台路由（使用 ADMIN_TOKEN 认证） ───

/** 验证 Admin Token */
function verifyAdminToken(ctx: RouteContext, env: { ADMIN_TOKEN: string }): boolean {
  const authHeader = ctx.request.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === env.ADMIN_TOKEN;
}

/** Admin 获取询盘列表（分页） */
route('GET', '/api/inquiries', async (ctx: RouteContext) => {
  const { env, url } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';

  try {
    const result = await getInquiries(env.INQUIRIES, page, pageSize, search, status);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** Admin 获取询盘统计 */
route('GET', '/api/inquiries/stats/count', async (ctx: RouteContext) => {
  const { env } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const stats = await getInquiryStats(env.INQUIRIES);
    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** Admin 导出 CSV */
route('GET', '/api/inquiries/export/csv', async (ctx: RouteContext) => {
  const { env } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await getInquiries(env.INQUIRIES, 1, 10000, '', '');
    let csv = 'ID,Name,Email,Company,Country,Product,Quantity,Status,Created At\n';
    result.data.forEach(i => {
      csv += `${i.id},"${i.name}","${i.email}","${i.company || ''}","${i.country || ''}","${i.product_name || ''}","${i.quantity || ''}",${i.status},${i.created_at}\n`;
    });
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="inquiries.csv"',
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** Admin 获取单条询盘详情 */
route('GET', '/api/inquiries/:id', async (ctx: RouteContext) => {
  const { env, params } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Bad request', message: 'Invalid inquiry ID' }, 400);
  }

  try {
    const inquiry = await getInquiryById(env.INQUIRIES, id);
    if (!inquiry) {
      return jsonResponse({ error: 'Not found', message: 'Inquiry not found' }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** Admin 更新询盘状态（支持 PUT / PATCH） */
const updateInquiryStatusHandler = async (ctx: RouteContext) => {
  const { env, params, request } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Bad request', message: 'Invalid inquiry ID' }, 400);
  }

  try {
    const body = await request.json() as { status?: string };
    const allowed = ['pending', 'replied', 'closed'];
    if (!body?.status || !allowed.includes(body.status)) {
      return jsonResponse({ error: 'Bad request', message: 'status must be one of: pending, replied, closed' }, 400);
    }

    const updates: { status: 'pending' | 'replied' | 'closed'; replied_at?: string } = {
      status: body.status as 'pending' | 'replied' | 'closed'
    };
    if (body.status === 'replied') {
      updates.replied_at = new Date().toISOString();
    }

    const inquiry = await updateInquiry(env.INQUIRIES, id, updates);
    if (!inquiry) {
      return jsonResponse({ error: 'Not found', message: 'Inquiry not found' }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
};
route('PUT', '/api/inquiries/:id', updateInquiryStatusHandler);
route('PATCH', '/api/inquiries/:id', updateInquiryStatusHandler);

/** Admin 删除询盘 */
route('DELETE', '/api/inquiries/:id', async (ctx: RouteContext) => {
  const { env, params } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Bad request', message: 'Invalid inquiry ID' }, 400);
  }

  try {
    const ok = await deleteInquiry(env.INQUIRIES, id);
    if (!ok) {
      return jsonResponse({ error: 'Not found', message: 'Inquiry not found' }, 404);
    }
    return jsonResponse({ message: 'Deleted' });
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});

/** Admin 回复询盘 */
route('POST', '/api/inquiries/:id/replies', async (ctx: RouteContext) => {
  const { env, params, request } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: 'Bad request', message: 'Invalid inquiry ID' }, 400);
  }

  try {
    const body = await request.json() as { content?: string };
    if (!body?.content) {
      return jsonResponse({ error: 'Bad request', message: 'Reply content is required' }, 400);
    }

    const inquiry = await addReply(env.INQUIRIES, id, { content: body.content });
    if (!inquiry) {
      return jsonResponse({ error: 'Not found', message: 'Inquiry not found' }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', message: String(error) }, 500);
  }
});