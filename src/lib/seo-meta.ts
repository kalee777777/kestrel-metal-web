/**
 * SEO 元数据管理（Admin 可配置的页面级 override）
 *
 * 存储：SEO_DATA KV，键 seo:metas（数组）
 * 生效：lib/seo-inject.ts 在渲染 HTML 时读取并覆盖对应页面的
 *       title / description / keywords / canonical / og:image / robots
 */

import type { Env } from '../index';
import { getJSON, setJSON, now } from './kv';

export interface SeoMetaRecord {
  id: number;
  page_url: string;
  title?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
  updated_at?: string;
}

const STORAGE_KEY = 'seo:metas';

/** 规范化 page_url：去掉域名前缀、保证以 / 开头 */
export function normalizePageUrl(url: string): string {
  if (!url) return '';
  let u = url.trim();
  u = u.replace(/^https?:\/\/[^/]+/i, '');
  if (u && !u.startsWith('/')) u = `/${u}`;
  return u;
}

/** 匹配页面：page_url 与 pathname 均去掉 .html 后缀比对 */
export function findSeoMeta(
  metas: SeoMetaRecord[],
  pathname: string,
): SeoMetaRecord | null {
  const target = normalizePageUrl(pathname).replace(/\.html$/, '');
  if (!target) return null;
  for (const m of metas) {
    const p = normalizePageUrl(m.page_url).replace(/\.html$/, '');
    if (p === target) return m;
  }
  return null;
}

export async function listSeoMetas(env: Env): Promise<SeoMetaRecord[]> {
  return (await getJSON<SeoMetaRecord[]>(env.SEO_DATA, STORAGE_KEY)) ?? [];
}

export async function saveSeoMetas(env: Env, metas: SeoMetaRecord[]): Promise<void> {
  await setJSON(env.SEO_DATA, STORAGE_KEY, metas);
}

export function nextSeoMetaId(metas: SeoMetaRecord[]): number {
  return metas.reduce((max, m) => Math.max(max, m.id ?? 0), 0) + 1;
}

export async function createSeoMeta(
  env: Env,
  data: Partial<SeoMetaRecord>,
): Promise<SeoMetaRecord | null> {
  if (!data.page_url) return null;
  const metas = await listSeoMetas(env);
  if (findSeoMeta(metas, data.page_url)) return null;
  const record: SeoMetaRecord = {
    ...data,
    id: nextSeoMetaId(metas),
    page_url: normalizePageUrl(data.page_url),
    noindex: !!data.noindex,
    updated_at: now(),
  };
  metas.push(record);
  await saveSeoMetas(env, metas);
  return record;
}

export async function updateSeoMeta(
  env: Env,
  id: number,
  data: Partial<SeoMetaRecord>,
): Promise<SeoMetaRecord | null> {
  const metas = await listSeoMetas(env);
  const index = metas.findIndex((m) => m.id === id);
  if (index === -1) return null;
  metas[index] = {
    ...metas[index],
    ...data,
    id: metas[index].id,
    page_url: normalizePageUrl(data.page_url ?? metas[index].page_url),
    noindex: data.noindex ?? metas[index].noindex,
    updated_at: now(),
  };
  await saveSeoMetas(env, metas);
  return metas[index];
}

export async function deleteSeoMeta(env: Env, id: number): Promise<boolean> {
  const metas = await listSeoMetas(env);
  const filtered = metas.filter((m) => m.id !== id);
  if (filtered.length === metas.length) return false;
  await saveSeoMetas(env, filtered);
  return true;
}
