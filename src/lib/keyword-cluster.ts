/**
 * 关键词聚类 — 把扁平关键词池按产品线归组，实现「一组 = 一篇文章」
 *
 * 背景：原先 generate.ts 是「1 关键词 → 1 篇文章」，同产品的近义词
 * （如 gabion box supplier / gabion basket manufacturer）会被拆成多篇，
 * 互相抢排名。本模块在选题前插入一层聚类，让同产品词合并进一篇支柱文章。
 *
 * 聚类策略：基于产品种子词词典的确定性匹配（不调用 AI，零成本、可预测）。
 * 组定义按「具体 → 通用」排序，命中即归组，保证 razor wire 不会被误分到 wire products。
 */

import type { Env } from '../index';
import { getJSON, setJSON, getRankings } from './kv';
import { isEnglishKeyword } from './lang-filter';

// ─── 类型定义 ───

export type KeywordSource = 'competitor_gap' | 'gsc_opportunity' | 'gsc_ranking';

export interface KeywordItem {
  keyword: string;
  source: KeywordSource;
  impressions: number;
  clicks: number;
  position: number;
  competitorCount: number;
  weight: number;
}

export interface KeywordGroup {
  id: string;
  name: string;
  productLine: string;
  primaryKeyword: string;
  keywords: KeywordItem[];
  totalWeight: number;
  totalImpressions: number;
  gapCount: number;
  opportunityCount: number;
  covered: boolean;
  coveredBy: string | null;
  coveredKeywords: string[];
}

export interface GroupOverrides {
  /** 强制指定：关键词 → 组 ID */
  assign: Record<string, string>;
  /** 排除：不参与选题的关键词 */
  exclude: string[];
}

export interface ClusterResult {
  groups: KeywordGroup[];
  ungrouped: KeywordItem[];
  totalKeywords: number;
  coveredGroupCount: number;
  /** 被语言过滤剔除非英文关键词数量（诊断用） */
  filteredNonEnglish?: number;
  /** 被噪音过滤剔除的非产品页关键词数量（诊断用） */
  filteredNoise?: number;
  generatedAt: string;
}

// ─── 产品组定义（顺序 = 匹配优先级，具体在前，通用在后）───

interface ProductGroupDef {
  id: string;
  name: string;
  productLine: string;
  patterns: string[];
}

const PRODUCT_GROUPS: ProductGroupDef[] = [
  {
    id: 'gabion',
    name: 'Gabion / 石笼网',
    productLine: 'gabion',
    patterns: ['gabion', 'galfan', 'rock cage', 'rockfall', 'retaining wall basket', 'mattress'],
  },
  {
    id: 'razor-wire',
    name: 'Razor Wire / 刀片刺绳',
    productLine: 'razor-wire',
    patterns: ['razor wire', 'razor tape', 'concertina', 'barbed tape'],
  },
  {
    id: 'barbed-wire',
    name: 'Barbed Wire / 刺铁丝',
    productLine: 'barbed-wire',
    patterns: ['barbed wire', 'barb wire', 'barbed'],
  },
  {
    id: 'chain-link',
    name: 'Chain Link Fence / 勾花网',
    productLine: 'chain-link',
    patterns: ['chain link', 'chain-link', 'cyclone fence', 'cyclone wire', 'diamond mesh fence'],
  },
  {
    id: 'welded-mesh',
    name: 'Welded Wire Mesh / 焊接网',
    productLine: 'welded-mesh',
    patterns: [
      'welded wire mesh', 'welded mesh', 'weldmesh', 'welded panel', 'welded fence',
      'welded wire', 'masonry',
    ],
  },
  {
    id: 'hexagonal-mesh',
    name: 'Hexagonal Wire Mesh / 六角网',
    productLine: 'hexagonal-mesh',
    patterns: ['hexagonal', 'hex mesh', 'chicken wire', 'poultry netting', 'hex netting'],
  },
  {
    id: 'woven-mesh',
    name: 'Woven Wire Mesh / 编织网',
    productLine: 'woven-mesh',
    patterns: ['woven wire', 'woven mesh', 'crimped mesh', 'dutch weave', 'square mesh'],
  },
  {
    id: 'security-fence',
    name: 'Security Fence / 安全防护围栏',
    productLine: 'security-fence',
    patterns: [
      'security fence', 'perimeter fence', 'perimeter fencing', 'prison fence', 'anti climb', 'anti-climb',
      'crowd control', 'temporary fence', '358 fence', '358 mesh', 'palisade', 'high security',
      'airport fence', 'airport perimeter', 'military', 'warehouse fencing', 'warehouse fence',
    ],
  },
  {
    id: 'fence-panel',
    name: 'Fence Panels / 围栏网片（3D / BRC / 双丝）',
    productLine: 'fence-panel',
    patterns: [
      '3d fence', '3d panel', 'panel fence', 'fence panel', 'brc fence', 'brc roll',
      'brc wire', 'double wire', 'clear view', 'wire partition', 'partition panel',
      'curved fence', 'v mesh',
    ],
  },
  {
    id: 'farm-fence',
    name: 'Farm & Field Fence / 农牧围栏',
    productLine: 'farm-fence',
    patterns: ['farm fence', 'field fence', 'cattle', 'livestock', 'horse fence', 'deer fence', 'agricultural'],
  },
  {
    id: 'fence-accessories',
    name: 'Posts & Accessories / 围栏配件',
    productLine: 'fence-accessories',
    patterns: ['fence post', 't post', 'y post', 'gate', 'tension wire', 'fence clamp', 'tie wire'],
  },
  // 丝材先判：避免 "stainless steel wire"（丝）被不锈钢网组抢走
  {
    id: 'wire-products',
    name: 'Wire Products / 丝材',
    productLine: 'wire',
    patterns: [
      'wire rod', 'steel wire', 'galvanized wire', 'binding wire', 'annealed wire',
      'stainless wire', 'stainless steel wire', 'oval wire', 'flat wire',
    ],
  },
  // ── 工业过滤网 / 特种合金网系列 ──
  // 必须排在通用 wire-mesh 之前：
  // "stainless steel mesh" 同时命中 "steel mesh"，顺序反了会被通用组吞掉。
  {
    id: 'stainless-mesh',
    name: 'Stainless Steel Mesh / 不锈钢网',
    productLine: 'stainless-mesh',
    patterns: ['stainless steel', 'stainless', 'steel screen'],
  },
  {
    id: 'nickel-mesh',
    name: 'Nickel Mesh / 镍网',
    productLine: 'nickel-mesh',
    patterns: ['nickel'],
  },
  {
    id: 'copper-brass-mesh',
    name: 'Copper & Brass Mesh / 铜网黄铜网',
    productLine: 'copper-brass-mesh',
    patterns: ['copper', 'brass', 'bronze'],
  },
  {
    id: 'filter-mesh',
    name: 'Filter & Screen Mesh / 过滤网筛网',
    productLine: 'filter-mesh',
    patterns: [
      'filter mesh', 'filter screen', 'filtration', 'filter disc', 'filter',
      'sieve', 'screening', 'screen mesh', 'epoxy coated', 'epoxy',
      'fine mesh', 'dutch twill',
    ],
  },
  {
    id: 'wire-mesh',
    name: 'Wire Mesh / 金属网（通用）',
    productLine: 'wire-mesh',
    patterns: [
      'wire mesh', 'steel mesh', 'metal mesh', 'mesh sheet', 'mesh roll', 'expanded metal',
      'mesh fence', 'wire fence', 'steel fence', 'mesh fencing',
    ],
  },
];

const UNGROUPED_ID = 'ungrouped';

/**
 * 非产品页噪音：竞品 sitemap 里的品牌宣传、展会、视频、政策页。
 * 这些词即使语言正确、也含产品词根，也不应进入选题池。
 */
const NOISE_PATTERNS = [
  'privacy policy', 'terms of service', 'terms and conditions', 'cookie policy',
  'about us', 'contact us', 'factory tour', 'company profile', 'our history',
  'introduction video', 'product video', 'wholesale introduction',
  'canton fair', 'trade show', 'exhibition', 'shengsen', 'new opportunities',
  'weed mat', 'careers', 'job vacancy', 'download catalog',
  // 竞品站内页：质量巡检、深加工介绍等，不是可选题的产品词
  'quality inspection', 'further processing', 'yingkaimo',
];

/** 整体即噪音的单词（"products" 单独出现是栏目页，但 "wire mesh products" 是有效词） */
const NOISE_EXACT = new Set([
  'products', 'product', 'home', 'about', 'contact', 'service', 'services',
  'news', 'blog', 'faq', 'gallery', 'video', 'download', 'index',
]);

/** 判断是否为可选题的产品关键词（排除品牌/展会/政策/栏目类噪音页） */
export function isProductKeyword(keyword: string): boolean {
  const kw = normalizeKeyword(keyword);
  if (!kw) return false;
  if (NOISE_EXACT.has(kw)) return false;
  return !NOISE_PATTERNS.some((p) => kw.includes(p));
}

/** 每篇文章最多携带的变体词数量（主词 + N 个变体） */
export const MAX_VARIANTS_PER_ARTICLE = 8;

// ─── 聚类核心（纯函数，便于测试）───

/** 规范化关键词：小写、压缩空白 */
export function normalizeKeyword(keyword: string): string {
  return String(keyword ?? '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/** 判断关键词命中哪个产品组，返回组 ID；未命中返回 null */
export function matchGroupId(keyword: string): string | null {
  const kw = normalizeKeyword(keyword);
  if (!kw) return null;
  for (const group of PRODUCT_GROUPS) {
    if (group.patterns.some((p) => kw.includes(p))) {
      return group.id;
    }
  }
  return null;
}

/**
 * 计算单个关键词的选题权重
 * 竞品覆盖数权重最高（说明是行业公认必争词），其次是展示量与机会分，
 * 排名越靠前越紧急（100 - position 的差值越大）。
 */
export function keywordWeight(item: {
  impressions?: number;
  competitorCount?: number;
  position?: number;
  source?: KeywordSource;
}): number {
  const impressions = Number(item.impressions ?? 0);
  const competitorCount = Number(item.competitorCount ?? 0);
  const position = Number(item.position ?? 100);
  const opportunityBonus = item.source === 'gsc_opportunity' ? 60 : 0;
  const gapBonus = item.source === 'competitor_gap' ? 40 : 0;
  const rankUrgency = Math.max(0, 100 - Math.min(position, 100)) * 1.5;
  return impressions * 0.3 + competitorCount * 80 + opportunityBonus + gapBonus + rankUrgency;
}

/**
 * 把扁平关键词列表聚类为产品组
 * @param items 关键词候选（来源：竞品缺口 / GSC 机会 / GSC 排名）
 * @param overrides 人工调整（强制归组、排除）
 * @param publishedKeywords 已发布文章覆盖的关键词（用于标记 covered）
 */
export function buildKeywordGroups(
  items: KeywordItem[],
  overrides: GroupOverrides = { assign: {}, exclude: [] },
  publishedKeywords: Array<{ keyword: string; slug: string }> = [],
): ClusterResult {
  const excluded = new Set(overrides.exclude.map(normalizeKeyword));
  const buckets = new Map<string, KeywordItem[]>();
  const ungrouped: KeywordItem[] = [];

  for (const raw of items) {
    const keyword = normalizeKeyword(raw.keyword);
    if (!keyword || excluded.has(keyword)) continue;

    const item: KeywordItem = { ...raw, keyword };

    // 人工强制归组优先级最高
    const forced = overrides.assign[keyword];
    const groupId = forced && isValidGroupId(forced) ? forced : (matchGroupId(keyword) ?? UNGROUPED_ID);

    if (groupId === UNGROUPED_ID) {
      ungrouped.push(item);
      continue;
    }
    if (!buckets.has(groupId)) buckets.set(groupId, []);
    buckets.get(groupId)!.push(item);
  }

  // 已发布关键词 → 组，用于标记覆盖状态
  const publishedByGroup = new Map<string, Array<{ keyword: string; slug: string }>>();
  for (const entry of publishedKeywords) {
    const keyword = normalizeKeyword(entry.keyword);
    if (!keyword) continue;
    const groupId = matchGroupId(keyword) ?? UNGROUPED_ID;
    if (!publishedByGroup.has(groupId)) publishedByGroup.set(groupId, []);
    publishedByGroup.get(groupId)!.push({ keyword, slug: entry.slug });
  }

  const groups: KeywordGroup[] = [];
  for (const def of PRODUCT_GROUPS) {
    const keywords = buckets.get(def.id) ?? [];
    if (keywords.length === 0) continue;

    keywords.sort((a, b) => b.weight - a.weight);

    const coveredList = publishedByGroup.get(def.id) ?? [];
    const coveredKeywords = coveredList.map((c) => c.keyword);

    groups.push({
      id: def.id,
      name: def.name,
      productLine: def.productLine,
      primaryKeyword: keywords[0].keyword,
      keywords,
      totalWeight: Math.round(keywords.reduce((sum, k) => sum + k.weight, 0)),
      totalImpressions: keywords.reduce((sum, k) => sum + k.impressions, 0),
      gapCount: keywords.filter((k) => k.source === 'competitor_gap').length,
      opportunityCount: keywords.filter((k) => k.source === 'gsc_opportunity').length,
      covered: coveredList.length > 0,
      coveredBy: coveredList.length > 0 ? coveredList[0].slug : null,
      coveredKeywords,
    });
  }

  // 组间排序：总权重降序
  groups.sort((a, b) => b.totalWeight - a.totalWeight);

  return {
    groups,
    ungrouped,
    totalKeywords: items.length,
    coveredGroupCount: groups.filter((g) => g.covered).length,
    generatedAt: new Date().toISOString(),
  };
}

export function isValidGroupId(id: string): boolean {
  return id === UNGROUPED_ID || PRODUCT_GROUPS.some((g) => g.id === id);
}

export function listGroupDefs(): Array<{ id: string; name: string; productLine: string }> {
  return PRODUCT_GROUPS.map(({ id, name, productLine }) => ({ id, name, productLine }));
}

// ─── KV 读写 ───

const OVERRIDES_KEY = 'keyword-groups:overrides';
const CLUSTER_CACHE_KEY = 'keyword-groups:latest';

export async function loadOverrides(env: Env): Promise<GroupOverrides> {
  return (await getJSON<GroupOverrides>(env.SEO_DATA, OVERRIDES_KEY)) ?? { assign: {}, exclude: [] };
}

export async function saveOverrides(env: Env, overrides: GroupOverrides): Promise<void> {
  await setJSON(env.SEO_DATA, OVERRIDES_KEY, overrides);
}

export async function loadCachedCluster(env: Env): Promise<ClusterResult | null> {
  return getJSON<ClusterResult>(env.SEO_DATA, CLUSTER_CACHE_KEY);
}

export async function cacheCluster(env: Env, result: ClusterResult): Promise<void> {
  await setJSON(env.SEO_DATA, CLUSTER_CACHE_KEY, result);
}

/** 读取已发布文章的关键词（用于去重与覆盖标记） */
export async function getPublishedKeywords(env: Env): Promise<Array<{ keyword: string; slug: string }>> {
  const all = await getJSON<Array<{ keyword?: string; slug?: string; variants?: string[] }>>(
    env.CONTENT_QUEUE,
    'published:all',
  );
  if (!Array.isArray(all)) return [];

  // 主词与变体词都算「已覆盖」，否则同一组的变体词下周会被重复选题
  const covered: Array<{ keyword: string; slug: string }> = [];
  for (const p of all) {
    if (!p || !p.slug) continue;
    const pool = [p.keyword ?? '', ...(p.variants ?? [])];
    for (const raw of pool) {
      const keyword = normalizeKeyword(raw);
      if (keyword) covered.push({ keyword, slug: p.slug });
    }
  }
  return covered;
}

/**
 * 汇总全部候选关键词：竞品缺口 + GSC 机会 + GSC 排名
 */
export async function collectCandidates(env: Env): Promise<{ items: KeywordItem[]; gapCount: number; opportunityCount: number; filteredNonEnglish: number; filteredNoise: number }> {
  const items: KeywordItem[] = [];
  const seen = new Set<string>();
  let filteredNonEnglish = 0;
  let filteredNoise = 0;

  /** 语言 + 噪音两道过滤，返回 true 表示可用 */
  const usable = (keyword: string): boolean => {
    if (!isEnglishKeyword(keyword)) { filteredNonEnglish++; return false; }
    if (!isProductKeyword(keyword)) { filteredNoise++; return false; }
    return true;
  };

  // 来源 1：竞品缺口
  const gapData = await env.SEO_DATA.get('competitors:gap');
  let gapCount = 0;
  if (gapData) {
    try {
      const parsed = JSON.parse(gapData) as { gaps?: Array<{ keyword: string; competitorCount: number }> };
      for (const gap of parsed.gaps ?? []) {
        const keyword = normalizeKeyword(gap.keyword);
        if (!keyword) continue;
        // 竞品多语言 sitemap 会带进大量非英文 slug，先过滤再进入选题池
        if (!usable(keyword)) continue;
        if (seen.has(keyword)) continue;
        seen.add(keyword);
        const competitorCount = Number(gap.competitorCount ?? 0);
        items.push({
          keyword,
          source: 'competitor_gap',
          impressions: 0,
          clicks: 0,
          position: 100,
          competitorCount,
          weight: keywordWeight({ competitorCount, source: 'competitor_gap' }),
        });
        gapCount++;
      }
    } catch {
      // 缺口数据损坏则跳过
    }
  }

  // 来源 2：GSC 机会分析
  const opportunities = await getJSON<Array<{ keyword: string; impressions: number; clicks: number; position: number }>>(
    env.SEO_DATA,
    'opportunities:weekly',
  );
  let opportunityCount = 0;
  for (const op of opportunities ?? []) {
    const keyword = normalizeKeyword(op.keyword);
    if (!keyword) continue;
    if (!usable(keyword)) continue;
    if (seen.has(keyword)) continue;
    seen.add(keyword);
    const impressions = Number(op.impressions ?? 0);
    items.push({
      keyword,
      source: 'gsc_opportunity',
      impressions,
      clicks: Number(op.clicks ?? 0),
      position: Number(op.position ?? 100),
      competitorCount: 0,
      weight: keywordWeight({ impressions, position: op.position, source: 'gsc_opportunity' }),
    });
    opportunityCount++;
  }

  // 来源 3：GSC 排名（兜底，展示量高的词）
  const today = new Date().toISOString().split('T')[0];
  const rankings = (await getRankings(env.SEO_DATA, today)) ?? [];
  for (const row of rankings) {
    const keyword = normalizeKeyword(row.keyword);
    if (!keyword) continue;
    if (!usable(keyword)) continue;
    if (seen.has(keyword)) continue;
    seen.add(keyword);
    items.push({
      keyword,
      source: 'gsc_ranking',
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      position: Number(row.position ?? 100),
      competitorCount: 0,
      weight: keywordWeight({ impressions: row.impressions, position: row.position, source: 'gsc_ranking' }),
    });
  }

  if (filteredNonEnglish > 0) {
    console.log(`[cluster] Filtered out ${filteredNonEnglish} non-English keywords`);
  }
  if (filteredNoise > 0) {
    console.log(`[cluster] Filtered out ${filteredNoise} non-product noise keywords`);
  }
  return { items, gapCount, opportunityCount, filteredNonEnglish, filteredNoise };
}

/**
 * 完整聚类流程：采集 → 过滤非英文 → 归组 → 标记覆盖
 */
export async function runClustering(env: Env): Promise<ClusterResult> {
  const { items, filteredNonEnglish, filteredNoise } = await collectCandidates(env);
  const overrides = await loadOverrides(env);
  const publishedKeywords = await getPublishedKeywords(env);
  const result = buildKeywordGroups(items, overrides, publishedKeywords);
  result.filteredNonEnglish = filteredNonEnglish;
  result.filteredNoise = filteredNoise;
  await cacheCluster(env, result);
  return result;
}

/**
 * 选出本周要写的组：
 * 1. 排除已覆盖的组（去重）
 * 2. 按权重降序取前 N 个
 * 3. 若全部已覆盖，则放宽限制，取未完全覆盖的组（新增变体词仍有价值）
 */
export function selectGroups(
  result: ClusterResult,
  maxGroups: number,
): KeywordGroup[] {
  const pending = result.groups.filter((g) => !g.covered);
  if (pending.length >= maxGroups) {
    return pending.slice(0, maxGroups);
  }
  // 不足时，把已覆盖但仍有未写词的组补上
  const partiallyCovered = result.groups
    .filter((g) => g.covered)
    .map((g) => {
      const coveredSet = new Set(g.coveredKeywords);
      const fresh = g.keywords.filter((k) => !coveredSet.has(k.keyword));
      return { group: g, freshCount: fresh.length, freshWeight: fresh.reduce((s, k) => s + k.weight, 0) };
    })
    .filter((x) => x.freshCount > 0)
    .sort((a, b) => b.freshWeight - a.freshWeight);

  return [
    ...pending,
    ...partiallyCovered.slice(0, maxGroups - pending.length).map((x) => x.group),
  ];
}

/** 取一篇文章要覆盖的词：主词 + 权重最高的若干变体（排除已写过的） */
export function pickArticleKeywords(group: KeywordGroup): { primary: string; variants: string[] } {
  const coveredSet = new Set(group.coveredKeywords);
  const fresh = group.keywords.filter((k) => !coveredSet.has(k.keyword));
  const pool = fresh.length > 0 ? fresh : group.keywords;
  const primary = pool[0]?.keyword ?? group.primaryKeyword;
  const variants = pool
    .slice(1, MAX_VARIANTS_PER_ARTICLE)
    .map((k) => k.keyword);
  return { primary, variants };
}
