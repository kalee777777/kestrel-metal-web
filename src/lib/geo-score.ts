/**
 * 服务端 GEO 评分器
 *
 * 模型与 Admin 端 computeScore（admin/js/pages/geo.js）完全一致，供两处使用：
 * 1. src/cron/score.ts —— 新文章发布门禁（GEO_MINIMUM_SCORE）
 * 2. src/cron/geo-audit.ts —— 全站逐页评分
 *
 * 评分 = JSON-LD 类型覆盖 40% + 可引用结构 30% + 事实密度 30%
 * 两端模型必须保持同步：改这里时同步改 admin/js/pages/geo.js 的 computeScore。
 */

export interface GeoScoreResult {
  score: number;
  schema_completeness: number;
  citation_friendliness: number;
  fact_density: number;
}

const RELEVANT_SCHEMA_TYPES = [
  'Organization',
  'WebSite',
  'Product',
  'Article',
  'TechArticle',
  'FAQPage',
  'BreadcrumbList',
  'Service',
  'LocalBusiness',
];

const FACT_WITH_UNIT_RE =
  /\d+(?:\.\d+)?\s?(?:%|mm|cm|km|kg|mpa|psi|mesh|gauge|awg|µm|micron|kw|mw|kn|g\/m²?|m[23²]|inch(?:es)?|ft|years?)\b/gi;

export function computeGeoScore(html: string): GeoScoreResult {
  const noScript = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const text = noScript.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');

  // 1) Schema 完整性：JSON-LD 块解析 + 相关类型覆盖
  const blocks = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  );
  const types = new Set<string>();
  let parseFail = 0;
  for (const src of blocks) {
    try {
      const data = JSON.parse(src);
      for (const d of Array.isArray(data) ? data : [data]) {
        if (d && d['@type']) types.add(String(d['@type']));
      }
    } catch {
      parseFail++;
    }
  }
  const relevant = RELEVANT_SCHEMA_TYPES.filter((t) => types.has(t)).length;
  let schema = blocks.length > 0 ? Math.min(100, 40 + relevant * 15) : 0;
  if (parseFail > 0) schema = Math.min(schema, 60);

  // 2) 引用友好度：AI 可直接引用的页面结构
  let citation = 0;
  if (/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)) citation += 15;
  if (/\b(?:is|are)\s+(?:a|an|the)\s+[a-z]/i.test(text)) citation += 30; // 自闭环定义句
  if ((html.match(/<h[23][\s>]/gi) || []).length >= 2) citation += 20; // 清晰的小标题结构
  if (/class=["'][^"']*faq/i.test(html) || /<details[\s>]/i.test(html)) citation += 15;
  if (/<link[^>]+rel=["']canonical["']/i.test(html)) citation += 10;
  if (/<(?:ul|ol)[\s>]/i.test(html)) citation += 10; // 列表化信息

  // 3) 事实密度：带单位的数字 / 每千字符（规格、参数、数据点）
  const facts = (text.match(FACT_WITH_UNIT_RE) || []).length;
  const kb = Math.max(1, text.length / 1024);
  const density = Math.min(100, Math.round((facts / kb) * 25));

  const score = Math.round(schema * 0.4 + citation * 0.3 + density * 0.3);
  return {
    score,
    schema_completeness: Math.round(schema),
    citation_friendliness: Math.round(citation),
    fact_density: density,
  };
}

/**
 * 把 GEO 失分维度翻译成 DeepSeek 重新生成时的具体修复指令。
 * score.ts 的自动修复循环调用；每条指令对应一个评分维度的缺口。
 */
export function geoRepairHints(result: GeoScoreResult, html: string): string[] {
  const hints: string[] = [];

  if (result.citation_friendliness < 70) {
    if (!/\b(?:is|are)\s+(?:a|an|the)\s+[a-z]/i.test(html.replace(/<[^>]+>/g, ' '))) {
      hints.push(
        'The article body lacks a self-contained definition sentence: the very first sentence must read "<keyword> is a <category> used for <primary use case>" so AI engines can quote it out of context',
      );
    }
    if ((html.match(/<h[23][\s>]/gi) || []).length < 2) {
      hints.push('Add at least 2 H2/H3 headings to structure the content for scannability');
    }
    if (!/<(?:ul|ol)[\s>]/i.test(html)) {
      hints.push('Convert at least one prose block into a <ul> or <ol> list (specifications, steps, or criteria)');
    }
  }

  if (result.fact_density < 40) {
    hints.push(
      'Fact density is too low: add concrete numbers with units in every major section (dimensions in mm/m, coating in g/m², capacity in tons/month, lead time in days, percentages)',
    );
  }

  if (result.schema_completeness < 70) {
    if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
      hints.push('The FAQ section is missing or empty: include 3-5 FAQ entries with numeric answers');
    }
  }

  return hints;
}
