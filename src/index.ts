/**
 * Kestrel Metal — Cloudflare Worker 入口
 *
 * 职责：
 * 1. fetch() — 处理 HTTP 请求：/api/* 路由由 Worker 处理，其余交给静态资源
 * 2. scheduled() — 处理 Cron Triggers，按时间触发 SEO 自动化工作流
 *
 * Cron 时间表（Cloudflare Cron 用 UTC，下表已换算为北京时间 UTC+8）：
 *   03:00 daily  — GSC 数据同步          (0 19 * * *)
 *   04:00 daily  — AI 内容生成（每天 1 组） (0 20 * * *)
 *   05:00 daily  — SEO 评分 + 自动部署    (0 21 * * *)
 *   06:00 daily  — 效果追踪（仅周日执行）   (0 22 * * *)
 *   08:00 daily  — 月度报告（仅每月 1 号）  (0 0 * * *)
 *
 * 重要：所有 trigger 都是「每日」，星期/日期判断放在代码里做。
 * 实测带星期字段的 trigger（0 20 * * 0 等）在这套 Git 集成部署下不可靠 ——
 * 周级任务曾连续 7 天未被唤起，而每日 trigger 一直正常。
 * 改成每日触发后，每次调度都会写入 cron:last_run，既能确认调度活着，
 * 也能通过 skipped 标记区分「唤起了但今天不该跑」。
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

// ─── 规范形态跳转 ───
// 全站规范形态是 .html，无扩展名请求统一 301 过去，保证同一页面只有一个可索引入口
function redirectToCanonical(url: URL): Response {
  const target = new URL(`${url.pathname}.html`, url.origin);
  target.search = url.search;
  return Response.redirect(target.toString(), 301);
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

    // 动态 llms.txt：静态基底 + KV 自动发布条目合并（GEO 闭环，免 git 部署）
    if (url.pathname === '/llms.txt') {
      const { renderLlmsTxt } = await import('./lib/llms');
      const text = await renderLlmsTxt(env);
      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
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

    const response = await env.ASSETS.fetch(assetRequest);

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
      const slug = url.pathname.replace(/^\//, '').replace(/\.html$/, '');
      // 全站规范形态是 .html，无扩展名请求一律 301 过去，
      // 否则同一篇文章会同时存在 /slug 和 /slug.html 两个返回 200 的入口（重复内容）
      const needsCanonical = !url.pathname.endsWith('.html');
      if (slug && !slug.includes('/') && !slug.includes('.')) {
        const published = await env.CONTENT_QUEUE.get(`published:${slug}`, 'json') as { html?: string } | null;
        if (published && published.html) {
          if (needsCanonical) return redirectToCanonical(url);
          return new Response(published.html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, must-revalidate',
            },
            status: 200,
          });
        }
      }

      // 无扩展名请求命中静态 .html 文件时（如新增页面未登记进 _redirects），同样 301 到规范形态
      if (needsCanonical && !url.pathname.includes('.')) {
        const htmlUrl = new URL(request.url);
        htmlUrl.pathname = url.pathname + '.html';
        const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
        if (htmlResponse.status !== 404) {
          return redirectToCanonical(url);
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
    let enhanced = await injectSeoTags(html, url.pathname, env);
    // faq.html：KV FAQ 运行时注入（GEO 闭环，Admin 启用即上线）
    if (url.pathname === '/faq.html' || url.pathname === '/faq') {
      try {
        const { injectFaqIntoHtml } = await import('./lib/faq');
        enhanced = await injectFaqIntoHtml(enhanced, env);
      } catch (err) {
        console.error('[faq] Runtime injection failed:', err);
      }
    }
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
        // 每日 03:00 UTC+8 — GSC 数据同步
        case '0 19 * * *':
          await runCronTask('gsc-sync', env, async () => {
            const { default: gscSync } = await import('./cron/gsc-sync');
            await gscSync(env);
          });
          break;

        // 每日 04:00 UTC+8 — AI 内容生成（每天 1 个产品组 = 1 篇文章）
        case '0 20 * * *':
          await runCronTask('generate', env, async () => {
            const { default: generate } = await import('./cron/generate');
            await generate(env);
          });
          break;

        // 每日 05:00 UTC+8 — SEO 评分 + 发布（有草稿才处理，空转开销极低）
        case '0 21 * * *':
          await runCronTask('score', env, async () => {
            const { default: score } = await import('./cron/score');
            await score(env);
          });
          break;

        // 每日 08:00 UTC+8，仅每月 1 号真正执行 — 月度报告
        case '0 0 * * *':
          await runCronTask('monthly-report', env, async () => {
            if (beijingDate() !== 1) return `跳过：今天不是 1 号（北京日期 ${beijingDate()}）`;
            const { default: monthlyReport } = await import('./cron/monthly-report');
            await monthlyReport(env);
          });
          // GEO 全站审计分片(自门控:1 号开周期,其余日子续跑至完成)。
          // 挂在本 slot 而非独立 cron:新增 trigger 表达式在 Git 集成部署下
          // 实测不被调度(2026-09-25 验证),老 slot 每日必触发。
          await runCronTask('geo-audit', env, async () => {
            const { default: geoAudit } = await import('./cron/geo-audit');
            return (await geoAudit(env)).summary;
          });
          break;

        // 每日 06:00 UTC+8，仅周日真正执行 — 效果追踪
        case '0 22 * * *':
          await runCronTask('track', env, async () => {
            if (!isBeijingWeekday(0)) return `跳过：今天不是周日（北京周 ${beijingDay()}）`;
            const { default: track } = await import('./cron/track');
            await track(env);
          });
          // GEO FAQ 自动扩容(仅周日;带 20h 新鲜度去重,防多 slot 重复生成)
          await runCronTask('geo-faq', env, async () => {
            if (!isBeijingWeekday(0)) return `跳过：今天不是周日（北京周 ${beijingDay()}）`;
            const { getJSON } = await import('./lib/kv');
            const last = await getJSON<{ timestamp: string }>(env.SEO_DATA, 'cron:last_run:geo-faq');
            if (last && Date.now() - new Date(last.timestamp).getTime() < 20 * 3600_000) {
              return `跳过：20 小时内已生成过(上次 ${last.timestamp})`;
            }
            const { default: geoFaq } = await import('./cron/geo-faq');
            await geoFaq(env);
          });
          break;

        // 备用直达 slot(若未来 trigger 被正确调度则由此触发;当前 Git 集成部署不调度新表达式)
        case '0 23 * * *':
          await runCronTask('geo-faq', env, async () => {
            if (!isBeijingWeekday(0)) return `跳过：今天不是周日（北京周 ${beijingDay()}）`;
            const { default: geoFaq } = await import('./cron/geo-faq');
            await geoFaq(env);
          });
          break;

        case '0 1 * * *':
          await runCronTask('geo-audit', env, async () => {
            const { default: geoAudit } = await import('./cron/geo-audit');
            return (await geoAudit(env)).summary;
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

// ─── 北京时间（UTC+8）工具 ───
//
// 星期/日期判断放在代码里而不是 cron 表达式里：实测带星期字段的 trigger
// 在这套 Git 集成部署下不可靠（周级任务曾连续 7 天未被唤起），
// 而每日 trigger 一直正常。改为每日触发 + 代码判断后，既可靠又可留痕。
function beijingNow(): Date {
  return new Date(Date.now() + 8 * 3600_000);
}

/** 北京时间星期几：0 = 周日 … 6 = 周六 */
function beijingDay(): number {
  return beijingNow().getUTCDay();
}

/** 北京时间日期（1-31） */
function beijingDate(): number {
  return beijingNow().getUTCDate();
}

function isBeijingWeekday(day: number): boolean {
  return beijingDay() === day;
}

/**
 * Cron 任务执行器 — 统一的错误处理和日志记录
 * 使用动态 import 确保尚未实现的模块不会阻塞构建
 *
 * fn 返回字符串表示「本次跳过」，仍会写入 last_run，便于区分
 * 「调度没唤起」和「唤起了但条件不满足」。
 */
async function runCronTask(
  name: string,
  env: Env,
  fn: () => Promise<string | void>,
): Promise<void> {
  const start = Date.now();
  console.log(`[Cron:${name}] Starting...`);

  try {
    const skipReason = await fn();
    const duration = Date.now() - start;

    if (skipReason) {
      console.log(`[Cron:${name}] ${skipReason}`);
      await env.SEO_DATA.put(
        `cron:last_run:${name}`,
        JSON.stringify({
          name,
          timestamp: new Date().toISOString(),
          duration,
          success: true,
          skipped: true,
          skipReason,
        }),
      );
      return;
    }

    console.log(`[Cron:${name}] Completed in ${duration}ms`);

    // 记录执行日志到 KV
    await env.SEO_DATA.put(
      `cron:last_run:${name}`,
      JSON.stringify({ name, timestamp: new Date().toISOString(), duration, success: true, skipped: false }),
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
