/**
 * Kestrel Metal — Cloudflare Worker 入口
 *
 * 职责：
 * 1. fetch() — 处理 HTTP 请求：/api/* 路由由 Worker 处理，其余交给静态资源
 * 2. scheduled() — 处理 Cron Triggers，按时间触发 SEO 自动化工作流
 *
 * Cron 时间表 (UTC+8)：
 *   03:00 daily  — GSC 数据同步
 *   03:30 daily  — 机会分析 + 效果追踪
 *   04:00 Monday — AI 内容生成
 *   04:30 Monday — AI 图片生成
 *   05:00 Monday — SEO 评分 + 自动部署
 *   00:00 1st    — 月度报告
 */

import { handleRoute, jsonResponse } from './router';
import { injectSeoTags } from './lib/seo-inject';
import './api-blog';

// ─── 环境变量类型定义 ───
export interface Env {
  // KV namespaces
  SEO_DATA: KVNamespace;
  CONTENT_QUEUE: KVNamespace;
  SCORE_LOG: KVNamespace;

  // R2 bucket
  IMAGES: R2Bucket;

  // Static assets
  ASSETS: Fetcher;

  // Environment variables
  SITE_URL: string;
  DEEPSEEK_MODEL: string;
  QWEN_MODEL: string;
  ADMIN_TOKEN: string;

  // Secrets (configured via wrangler secret put)
  DEEPSEEK_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GSC_REFRESH_TOKEN: string;
  GSC_SITE_URL: string;
  GH_TOKEN: string;
  IMG_API_KEY: string;
  QWEN_API_KEY: string;
}

// ─── fetch() — HTTP 请求处理 ───
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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
      return env.ASSETS.fetch(new Request(adminUrl, request));
    }

    if (url.pathname === '/components/navbar' || url.pathname === '/components/footer') {
      const componentUrl = new URL(request.url);
      componentUrl.pathname += '.html';
      return env.ASSETS.fetch(new Request(componentUrl, request));
    }

    if (url.pathname.startsWith('/api/')) {
      const response = await handleRoute(request, env);
      if (response) return response;
      return jsonResponse({ error: 'Not found' }, 404);
    }

    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const html = await response.text();
    if (!url.pathname.startsWith('/admin/') && !url.pathname.startsWith('/components/')) {
      const enhanced = injectSeoTags(html, url.pathname);
      if (enhanced !== html) {
        return new Response(enhanced, {
          headers: response.headers,
          status: response.status,
        });
      }
    }
    return response;
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

        // 每周一 04:00 UTC+8 — AI 内容生成
        case '0 20 * * 1':
          await runCronTask('generate', env, async () => {
            const { default: generate } = await import('./cron/generate');
            await generate(env);
          });
          break;

        // 每周一 04:30 UTC+8 — AI 图片生成
        case '30 20 * * 1':
          await runCronTask('image-gen', env, async () => {
            const { default: imageGen } = await import('./cron/image-gen');
            await imageGen(env);
          });
          break;

        // 每周一 05:00 UTC+8 — SEO 评分 + 自动部署
        case '0 21 * * 1':
          await runCronTask('score', env, async () => {
            const { default: score } = await import('./cron/score');
            await score(env);
          });
          break;

        // 每月 1 号 00:00 UTC+8 — 月度报告
        case '0 16 1 * *':
          await runCronTask('monthly-report', env, async () => {
            const { default: monthlyReport } = await import('./cron/monthly-report');
            await monthlyReport(env);
          });
          break;

        // 每周日 06:00 UTC+8 — 效果追踪
        case '0 22 * * 0':
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
