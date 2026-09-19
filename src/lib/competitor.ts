/**
 * 竞品关键词缺口分析 — Sitemap 抓取 + 关键词提取 + 缺口计算
 *
 * 零成本方案：抓取竞品公开 sitemap，从 URL 提取关键词，
 * 与自身 GSC 数据交叉对比，找出内容缺口。
 */

import type { Env } from '../index';
import { getJSON, setJSON, getRankings } from './kv';
import { isEnglishKeyword } from './lang-filter';

// ─── 类型定义 ───

export interface CompetitorEntry {
  domain: string;
  name: string;
  addedAt: string;
  lastAnalyzed: string | null;
}

export interface CompetitorKeyword {
  keyword: string;
  url: string;
  source: 'sitemap' | 'title';
}

export interface GapResult {
  keyword: string;
  competitorCount: number;
  competitors: { domain: string; url: string }[];
  ourStatus: 'missing';
}

// ─── 常量 ───

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'for', 'of', 'to', 'in', 'and', 'with', 'or',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'at', 'by', 'from', 'on', 'over', 'under', 'between', 'through',
  'during', 'before', 'after', 'above', 'below', 'into', 'out',
  'about', 'against', 'within', 'without', 'along', 'across',
  'behind', 'beyond', 'plus', 'except', 'but', 'up', 'down',
  'off', 'than', 'then', 'that', 'this', 'these', 'those',
  'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'me',
  'him', 'her', 'them', 'us', 'my', 'your', 'his', 'our', 'their',
  'what', 'which', 'who', 'whom', 'where', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'too', 'very', 'just', 'because', 'as', 'until', 'while',
  'page', 'html', 'htm', 'php', 'asp', 'aspx', 'jsp',
]);

const INDUSTRY_SEEDS = [
  'gabion', 'mesh', 'wire', 'fence', 'fencing', 'metal', 'steel',
  'barbed', 'razor', 'chain link', 'welded', 'screen', 'netting',
  'post', 'panel', 'barrier', 'security', 'iron', 'aluminum',
  'galvanized', 'pvc', 'coated', 'stainless', 'carbon',
  'hexagonal', 'square', 'rectangular', 'diamond',
  'cattle', 'horse', 'farm', 'agricultural', 'industrial',
  'construction', 'building', 'garden', 'decorative',
  'reinforcement', 'concrete', 'plastering', 'stucco',
  'rockfall', 'slope', 'erosion', 'retaining',
  'hedge', 'privacy', 'temporary', 'portable', 'mobile',
  'crowd', 'control', 'traffic', 'road', 'highway',
  'airport', 'military', 'prison', 'perimeter',
  'basket', 'box', 'mattress', 'sack', 'bag',
  'roll', 'sheet', 'coil', 'strip', 'rod', 'cable',
  'nail', 'staple', 'tie', 'clip', 'clamp', 'connector',
  'supplier', 'manufacturer', 'factory', 'wholesale', 'export',
  'price', 'cost', 'buy', 'custom', 'specification', 'standard',
  'size', 'gauge', 'diameter', 'width', 'height', 'length',
  'weight', 'strength', 'durability', 'corrosion', 'rust',
];

// ─── Sitemap 抓取 ───

async function fetchWithTimeout(url: string, _timeoutMs = 10000): Promise<string | null> {
  try {
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      console.log(`[competitor] Fetch failed for ${url}: HTTP ${resp.status}`);
      return null;
    }
    const text = await resp.text();
    if (!text || text.trim().length === 0) {
      console.log(`[competitor] Empty response for ${url}`);
      return null;
    }
    return text;
  } catch (err) {
    console.log(`[competitor] Fetch error for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/**
 * 抓取竞品 sitemap，返回所有页面 URL
 */
export async function fetchCompetitorSitemap(domain: string): Promise<string[]> {
  const candidates = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap.xml`,
    `https://${domain}/sitemap.xml.gz`,
  ];

  let xml: string | null = null;
  for (const url of candidates) {
    xml = await fetchWithTimeout(url);
    if (xml && xml.trim().length > 0 && xml.includes('<')) {
      console.log(`[competitor] Sitemap found at ${url}, length: ${xml.length}`);
      break;
    }
  }

  if (!xml) {
    console.log(`[competitor] No sitemap found for ${domain}`);
    return [];
  }

  // 检查是否是 sitemap index
  if (xml.includes('<sitemapindex')) {
    console.log(`[competitor] Detected sitemap index for ${domain}`);
    const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    const childUrls = locs.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(u => u.startsWith('http'));
    console.log(`[competitor] Found ${childUrls.length} child sitemaps`);
    // 最多取 3 个子 sitemap
    const allUrls: string[] = [];
    for (const childUrl of childUrls.slice(0, 3)) {
      const childXml = await fetchWithTimeout(childUrl);
      if (childXml) {
        const childLocs = childXml.match(/<loc>([^<]+)<\/loc>/g) || [];
        const childPageUrls = childLocs.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(u => u.startsWith('http'));
        console.log(`[competitor] Child sitemap ${childUrl}: ${childPageUrls.length} URLs`);
        allUrls.push(...childPageUrls);
      }
    }
    console.log(`[competitor] Total URLs from sitemap index: ${allUrls.length}`);
    return allUrls;
  }

  // 普通 sitemap
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = locs.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(u => u.startsWith('http'));
  console.log(`[competitor] Total URLs from sitemap: ${urls.length}`);
  return urls;
}

// ─── 关键词提取 ───

/**
 * 从 URL 路径提取关键词
 */
function extractKeywordFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    const path = url.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\.html?$/i, '');
    if (!path) return null;

    const slug = path.split('/').pop() || '';
    if (!slug || slug.length < 3) return null;

    // 连字符/下划线转空格，去停用词
    const words = slug
      .replace(/[-_]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));

    if (words.length === 0) return null;
    const keyword = words.join(' ').toLowerCase();
    return keyword;
  } catch {
    return null;
  }
}

/**
 * 从页面 HTML 提取 title 中的关键词
 */
function extractKeywordFromTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) return null;

  const title = titleMatch[1]
    .replace(/\s*\|.*$/, '')  // 去掉 " | Site Name"
    .replace(/\s*-.*$/, '')   // 去掉 " - Site Name"
    .trim();

  if (title.length < 5 || title.length > 100) return null;

  const words = title
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  if (words.length < 2) return null;
  return words.join(' ');
}

/**
 * 检查关键词是否包含行业相关种子词
 */
function isIndustryRelevant(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return INDUSTRY_SEEDS.some(seed => lower.includes(seed));
}

/**
 * 从 URL 列表提取关键词
 */
export async function extractKeywordsFromUrls(
  urls: string[],
): Promise<{ keywords: CompetitorKeyword[]; extractedCount: number; filteredCount: number; sampleKeywords: string[] }> {
  const keywords: CompetitorKeyword[] = [];
  const seen = new Set<string>();
  let extractedCount = 0;
  let filteredCount = 0;
  let sampleKeywords: string[] = [];

  // 从 URL slug 提取（竞品多语言 sitemap 会混入西语/意语/印尼语等版本，
  // 这里直接丢弃非英文词，避免污染缺口池）
  for (const url of urls) {
    const kw = extractKeywordFromUrl(url);
    if (kw) {
      extractedCount++;
      if (sampleKeywords.length < 5) sampleKeywords.push(kw);
      if (!seen.has(kw) && isEnglishKeyword(kw) && isIndustryRelevant(kw)) {
        seen.add(kw);
        keywords.push({ keyword: kw, url, source: 'sitemap' });
      } else {
        filteredCount++;
      }
    }
  }

  console.log(`[competitor] URL extraction: ${extractedCount} raw keywords, ${filteredCount} filtered, ${keywords.length} kept`);
  console.log(`[competitor] Sample keywords: ${sampleKeywords.join(', ')}`);

  // 从页面 title 提取（最多 10 个页面，并发 5）
  const titleUrls = urls.filter(u => {
    const path = new URL(u).pathname;
    return path.includes('/product') || path.includes('/category') || path.includes('/blog');
  }).slice(0, 10);

  const batchSize = 5;
  for (let i = 0; i < titleUrls.length; i += batchSize) {
    const batch = titleUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (url) => {
        const html = await fetchWithTimeout(url, 8000);
        if (!html) return null;
        const kw = extractKeywordFromTitle(html);
        if (kw && !seen.has(kw) && isEnglishKeyword(kw) && isIndustryRelevant(kw)) {
          seen.add(kw);
          return { keyword: kw, url, source: 'title' as const };
        }
        return null;
      }),
    );
    keywords.push(...results.filter(Boolean) as CompetitorKeyword[]);
  }

  return { keywords, extractedCount, filteredCount, sampleKeywords };
}

// ─── 竞品管理 ───

/**
 * 获取竞品列表
 */
export async function getCompetitors(env: Env): Promise<CompetitorEntry[]> {
  return (await getJSON<CompetitorEntry[]>(env.SEO_DATA, 'competitors:list')) ?? [];
}

/**
 * 添加竞品
 */
export async function addCompetitor(
  env: Env,
  domain: string,
  name?: string,
): Promise<CompetitorEntry | null> {
  const list = await getCompetitors(env);
  if (list.some(c => c.domain === domain)) return null;

  const entry: CompetitorEntry = {
    domain,
    name: name || domain,
    addedAt: new Date().toISOString(),
    lastAnalyzed: null,
  };
  list.push(entry);
  await setJSON(env.SEO_DATA, 'competitors:list', list);
  return entry;
}

/**
 * 删除竞品
 */
export async function deleteCompetitor(
  env: Env,
  domain: string,
): Promise<boolean> {
  const list = await getCompetitors(env);
  const filtered = list.filter(c => c.domain !== domain);
  if (filtered.length === list.length) return false;

  await setJSON(env.SEO_DATA, 'competitors:list', filtered);
  await env.SEO_DATA.delete(`competitor:${domain}:keywords`);
  return true;
}

/**
 * 分析竞品：抓取 sitemap → 提取关键词 → 存入 KV
 */
export async function analyzeCompetitor(
  env: Env,
  domain: string,
): Promise<{ keywordCount: number; error?: string; debug?: { urlCount: number; extracted: number; filtered: number; samples: string[] } }> {
  const urls = await fetchCompetitorSitemap(domain);
  console.log(`[competitor] Sitemap fetch for ${domain}: ${urls.length} URLs`);
  if (urls.length === 0) {
    return { keywordCount: 0, error: '无法获取 sitemap，请确认域名正确且 sitemap 公开可访问' };
  }

  const { keywords, extractedCount, filteredCount, sampleKeywords } = await extractKeywordsFromUrls(urls);
  console.log(`[competitor] Keyword extraction for ${domain}: ${keywords.length} keywords (${extractedCount} raw, ${filteredCount} filtered)`);

  await setJSON(env.SEO_DATA, `competitor:${domain}:keywords`, keywords);

  // 更新 lastAnalyzed
  const list = await getCompetitors(env);
  const entry = list.find(c => c.domain === domain);
  if (entry) {
    entry.lastAnalyzed = new Date().toISOString();
    await setJSON(env.SEO_DATA, 'competitors:list', list);
  }

  return { 
    keywordCount: keywords.length, 
    debug: { urlCount: urls.length, extracted: extractedCount, filtered: filteredCount, samples: sampleKeywords } 
  };
}

// ─── 缺口计算 ───

/**
 * 获取我方最新关键词集合
 */
async function getOurKeywords(env: Env): Promise<Set<string>> {
  const ourSet = new Set<string>();

  // 回溯 7 天找最近有数据的日期
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rankings = await getRankings(env.SEO_DATA, dateStr);
    if (rankings && rankings.length > 0) {
      for (const r of rankings) {
        ourSet.add(r.keyword.toLowerCase().trim());
      }
      break;
    }
  }

  return ourSet;
}

/**
 * 计算竞品关键词缺口
 */
export async function computeGap(env: Env): Promise<GapResult[]> {
  const ourKeywords = await getOurKeywords(env);
  const competitors = await getCompetitors(env);

  // 收集所有竞品关键词，记录每个词被哪些竞品覆盖
  const keywordMap = new Map<string, { domain: string; url: string }[]>();

  for (const comp of competitors) {
    const keywords = await getJSON<CompetitorKeyword[]>(
      env.SEO_DATA,
      `competitor:${comp.domain}:keywords`,
    );
    if (!keywords) continue;

    for (const kw of keywords) {
      const normalized = kw.keyword.toLowerCase().trim();
      // 存量 KV 里可能还留着早期未过滤的多语言词，这里再兜一层
      if (!normalized || !isEnglishKeyword(normalized)) continue;
      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, []);
      }
      keywordMap.get(normalized)!.push({ domain: comp.domain, url: kw.url });
    }
  }

  // 找出我方未覆盖的关键词
  const gaps: GapResult[] = [];
  for (const [keyword, competitors] of keywordMap) {
    if (!ourKeywords.has(keyword)) {
      gaps.push({
        keyword,
        competitorCount: competitors.length,
        competitors,
        ourStatus: 'missing',
      });
    }
  }

  // 按竞品覆盖数降序排列
  gaps.sort((a, b) => b.competitorCount - a.competitorCount);

  return gaps;
}
