/**
 * IndexNow 自动提交
 *
 * 发布新内容后主动通知支持 IndexNow 协议的搜索引擎（Bing / Yandex / Naver / Seznam）。
 * 协议要求：key 需通过 https://{host}/{key}.txt 可访问，内容为 key 本身。
 * key 优先取 env.INDEXNOW_KEY（wrangler secret），否则自动生成一次并持久化到 KV。
 */

import type { Env } from '../index';
import { setJSON, now } from './kv';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export interface IndexNowResult {
  ok: boolean;
  submitted: number;
  status: number | null;
  error?: string;
}

export async function getIndexNowKey(env: Env): Promise<string> {
  if (env.INDEXNOW_KEY) return env.INDEXNOW_KEY;
  const stored = await env.SEO_DATA.get('indexnow:key');
  if (stored) return stored;
  const key = crypto.randomUUID().replace(/-/g, '');
  await env.SEO_DATA.put('indexnow:key', key);
  return key;
}

export function resolveHost(env: Env): string {
  const raw = env.SITE_URL || 'https://www.kestrelmetal.com';
  try {
    return new URL(raw).host;
  } catch {
    return 'www.kestrelmetal.com';
  }
}

function toAbsoluteUrl(env: Env, path: string): string {
  const host = resolveHost(env);
  if (path.startsWith('http')) return path;
  return `https://${host}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function submitToIndexNow(env: Env, paths: string[]): Promise<IndexNowResult> {
  if (paths.length === 0) {
    return { ok: true, submitted: 0, status: null };
  }

  const key = await getIndexNowKey(env);
  const host = resolveHost(env);
  const keyLocation = `https://${host}/${key}.txt`;
  const urlList = paths.map((p) => toAbsoluteUrl(env, p));

  let result: IndexNowResult;
  try {
    const resp = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList }),
    });
    result = {
      ok: (resp.status >= 200 && resp.status < 300) || resp.status === 202,
      submitted: urlList.length,
      status: resp.status,
    };
  } catch (err) {
    result = {
      ok: false,
      submitted: 0,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  await setJSON(env.SEO_DATA, 'indexnow:last_submit', {
    ...result,
    timestamp: now(),
    urls: urlList,
  });

  return result;
}
