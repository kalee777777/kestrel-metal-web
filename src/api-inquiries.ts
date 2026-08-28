/**
 * 询盘 API 接口 — 对外提供的询盘数据访问接口
 *
 * 端点：
 *   GET  /api/external/inquiries          → 获取询盘列表（分页）
 *   GET  /api/external/inquiries/stats     → 获取询盘统计信息
 *   GET  /api/external/inquiries/:id       → 获取单条询盘详情
 *   POST /api/inquiries                    → 创建新询盘（前台提交）
 */

import { route, jsonResponse, type RouteContext } from './router';
import {
  getInquiries,
  getInquiryById,
  getInquiryStats,
  createInquiry
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