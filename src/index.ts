/**
 * Kestrel Metal — Cloudflare Worker 入口
 *
 * 职责：
 * 1. fetch() — 处理 HTTP 请求：/api/* 路由由 Worker 处理，其余交给静态资源
 * 2. scheduled() — 处理 Cron Triggers，按时间触发 SEO 自动化工作流
 *
 * Cron 时间表（Cloudflare Cron 用 UTC，下表已换算为北京时间 UTC+8）：
 *   03:00 daily  — GSC 数据同步          (0 19 * * *)
 *   04:00 Monday — AI 内容 + 图片生成      (0 20 * * 0)
 *   05:00 Monday — SEO 评分 + 自动部署     (0 21 * * 0)
 *   06:00 Sunday — 效果追踪               (0 22 * * 6)
 *   08:00 1st    — 月度报告               (0 0 1 * *)
 *
 * 注意：UTC 比北京时间晚 8 小时，周一 04:00 (UTC+8) 对应 UTC 周日 20:00，
 * 因此周一任务的 cron 星期位必须写 0（周日），写成 1 会整体延后一天。
 */

import { handleRoute, jsonResponse } from './router';
import { injectSeoTags } from './lib/seo-inject';
import './api-blog';
import './api-inquiries';

// ─── 环境变量类型定义 ───
export interface Env {
  // KV namespaces
  SEO_DATA: KVNamespace;
  CONTENT_QUEUE: KVNamespace;
  SCORE_LOG: KVNamespace;
  INQUIRIES: KVNamespace;

  // R2 bucket
  IMAGES: R2Bucket;

  // Static assets
  ASSETS: Fetcher;

  // Environment variables
  SITE_URL: string;
  DEEPSEEK_MODEL: string;
  QWEN_MODEL: string;
  ADMIN_TOKEN: string;
  INQUIRY_API_KEY: string;

  // Secrets (configured via wrangler secret put)
  DEEPSEEK_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GSC_REFRESH_TOKEN: string;
  GSC_SITE_URL: string;
  GH_TOKEN: string;
  IMG_API_KEY: string;
  QWEN_API_KEY: string;
  INDEXNOW_KEY?: string;
}

// ─── fetch() — HTTP 请求处理 ───
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // workers.dev 调试域名统一 301 到正式域名（保留 /api/ 调试通道），
    // 消除第三重复内容源，避免被搜索引擎当作备用页面抓取
    if (url.hostname.endsWith('.workers.dev') && !url.pathname.startsWith('/api/')) {
      const redirectUrl = new URL(request.url);
      redirectUrl.hostname = 'www.kestrelmetal.com';
      redirectUrl.protocol = 'https:';
      return Response.redirect(redirectUrl.toString(), 301);
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      const adminUrl = new URL(request.url);
      adminUrl.pathname = '/admin/index.html';
      const response = await env.ASSETS.fetch(new Request(adminUrl, request));
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }

    if (url.pathname === '/components/navbar' || url.pathname === '/components/footer') {
      const componentUrl = new URL(request.url);
      componentUrl.pathname += '.html';
      const response = await env.ASSETS.fetch(new Request(componentUrl, request));
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }

    if (url.pathname.startsWith('/api/')) {
      const response = await handleRoute(request, env);
      if (response) {
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
      }
      return jsonResponse({ error: 'Not found' }, 404);
    }

    // 动态 sitemap：静态 198 条 + KV 自动发布文章实时合并
    if (url.pathname === '/sitemap.xml') {
      const { buildSitemap } = await import('./lib/sitemap');
      const sitemap = await buildSitemap(env);
      return new Response(sitemap.xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
        status: 200,
      });
    }

    // IndexNow key 验证文件：/{key}.txt 返回 key 本身
    if (url.pathname.endsWith('.txt')) {
      const { getIndexNowKey } = await import('./lib/indexnow');
      const key = await getIndexNowKey(env);
      if (url.pathname === `/${key}.txt`) {
        return new Response(key, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=86400',
          },
          status: 200,
        });
      }
    }

    let assetRequest = request;
    if (url.pathname === '/') {
      const rootUrl = new URL(request.url);
      rootUrl.pathname = '/index.html';
      assetRequest = new Request(rootUrl, request);
    }

    let response = await env.ASSETS.fetch(assetRequest);

    // /images/ 路由：从 R2 读取 AI 生成的图片
    if (response.status === 404 && url.pathname.startsWith('/images/')) {
      const r2Key = url.pathname.replace('/images/', '');
      const object = await env.IMAGES.get(r2Key);
      if (object) {
        const respHeaders = new Headers({
          'Content-Type': object.httpMetadata?.contentType || 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        });
        return new Response(object.body, { headers: respHeaders, status: 200 });
      }
    }

    // 静态资源 404 时，尝试从 KV 读取动态发布的文章
    if (response.status === 404) {
      // 提取 slug（去掉开头的 / 和 .html 后缀）
      let slug = url.pathname.replace(/^\//, '').replace(/\.html$/, '');
      if (slug && !slug.includes('/') && !slug.includes('.')) {
        const published = await env.CONTENT_QUEUE.get(`published:${slug}`, 'json') as { html?: string } | null;
        if (published && published.html) {
          return new Response(published.html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, must-revalidate',
            },
            status: 200,
          });
        }
      }

      // 尝试加 .html 后缀
      if (!url.pathname.includes('.')) {
        const htmlUrl = new URL(request.url);
        htmlUrl.pathname = url.pathname + '.html';
        const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
        if (htmlResponse.status !== 404) {
          response = htmlResponse;
        }
      }
    }
    const contentType = response.headers.get('content-type') || '';
    const headers = new Headers(response.headers);
    if (url.pathname.startsWith('/api/')) {
      headers.set('Cache-Control', 'no-store');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (response.ok && /\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|glb|gltf)$/.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (/\.(?:js|css)$/.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=604800, must-revalidate');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (!contentType.includes('text/html')) return response;
    if (url.pathname.startsWith('/admin/') || url.pathname.startsWith('/components/')) {
      headers.set('Cache-Control', 'no-cache');
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }

    const html = await response.text();
    const enhanced = await injectSeoTags(html, url.pathname, env);
    headers.set('Cache-Control', 'public, max-age=300, must-revalidate');
    return new Response(enhanced, {
      headers,
      status: response.status,
      statusText: response.statusText,
    });
  },

  // ─── scheduled() — Cron Triggers 处理 ───
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const cron = event.cron;
    console.log(`[Cron] Triggered: ${cron} at ${new Date().toISOString()}`);

    try {
      // 根据 cron 表达式分发到对应的处理函数
      // 各 cron handler 将在后续 Phase 中实现
      switch (cron) {
        // 每日 03:00 UTC+8 (19:00 UTC 前一天) — GSC 数据同步
        case '0 19 * * *':
          await runCronTask('gsc-sync', env, async () => {
            const { default: gscSync } = await import('./cron/gsc-sync');
            await gscSync(env);
          });
          break;

        // 每周一 04:00 UTC+8 = UTC 周日 20:00 — AI 内容生成
        case '0 20 * * 0':
          await runCronTask('generate', env, async () => {
            const { default: generate } = await import('./cron/generate');
            await generate(env);
          });
          break;

        // 每周一 05:00 UTC+8 = UTC 周日 21:00 — SEO 评分 + 自动部署
        case '0 21 * * 0':
          await runCronTask('score', env, async () => {
            const { default: score } = await import('./cron/score');
            await score(env);
          });
          break;

        // 每月 1 号 08:00 UTC+8 = UTC 1 号 00:00 — 月度报告
        case '0 0 1 * *':
          await runCronTask('monthly-report', env, async () => {
            const { default: monthlyReport } = await import('./cron/monthly-report');
            await monthlyReport(env);
          });
          break;

        // 每周日 06:00 UTC+8 = UTC 周六 22:00 — 效果追踪
        case '0 22 * * 6':
          await runCronTask('track', env, async () => {
            const { default: track } = await import('./cron/track');
            await track(env);
          });
          break;

        default:
          console.warn(`[Cron] Unknown cron expression: ${cron}`);
      }
    } catch (err) {
      console.error(`[Cron] Error in ${cron}:`, err);
    }
  },
};

/**
 * Cron 任务执行器 — 统一的错误处理和日志记录
 * 使用动态 import 确保尚未实现的模块不会阻塞构建
 */
async function runCronTask(
  name: string,
  env: Env,
  fn: () => Promise<void>,
): Promise<void> {
  const start = Date.now();
  console.log(`[Cron:${name}] Starting...`);

  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`[Cron:${name}] Completed in ${duration}ms`);

    // 记录执行日志到 KV
    await env.SEO_DATA.put(
      `cron:last_run:${name}`,
      JSON.stringify({ name, timestamp: new Date().toISOString(), duration, success: true }),
    );
  } catch (err) {
    const duration = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cron:${name}] Failed after ${duration}ms:`, errMsg);

    await env.SEO_DATA.put(
      `cron:last_run:${name}`,
      JSON.stringify({ name, timestamp: new Date().toISOString(), duration, success: false, error: errMsg }),
    );
  }
}
