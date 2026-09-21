/**
 * 动态 Sitemap 构建器
 *
 * 静态 sitemap.xml（ASSETS）+ KV 中自动发布的文章（published:all）实时合并，
 * 确保自动化流程发布的新内容能立即被搜索引擎通过 sitemap 发现。
 */

import type { Env } from '../index';
import { getJSON } from './kv';

const DOMAIN = 'https://www.kestrelmetal.com';

interface PublishedEntry {
  slug: string;
  title?: string;
  publishedAt?: string;
}

export interface SitemapResult {
  xml: string;
  urlCount: number;
  dynamicCount: number;
}

function normalizePath(loc: string): string {
  return loc
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/\.html$/, '');
}

export async function buildSitemap(env: Env): Promise<SitemapResult> {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';

  const staticResp = await env.ASSETS.fetch('https://www.kestrelmetal.com/sitemap.xml');
  if (staticResp.ok) {
    xml = await staticResp.text();
  }

  const staticLocs = new Set(
    Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => normalizePath(m[1].trim())),
  );

  const published = (await getJSON<PublishedEntry[]>(env.CONTENT_QUEUE, 'published:all')) ?? [];

  const additions: string[] = [];
  for (const entry of published) {
    if (!entry.slug) continue;
    const path = `/${entry.slug}`;
    if (staticLocs.has(path)) continue;
    const lastmod = (entry.publishedAt ?? new Date().toISOString()).split('T')[0];
    additions.push(
      [
        '  <url>',
        `    <loc>${DOMAIN}/${entry.slug}.html</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.7</priority>',
        '  </url>',
      ].join('\n'),
    );
  }

  if (additions.length === 0) {
    return { xml, urlCount: staticLocs.size, dynamicCount: 0 };
  }

  const merged = xml.replace('</urlset>', `${additions.join('\n')}\n</urlset>`);
  const urlCount = Array.from(merged.matchAll(/<loc>/g)).length;
  return { xml: merged, urlCount, dynamicCount: additions.length };
}
