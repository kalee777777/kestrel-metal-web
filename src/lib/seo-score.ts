/**
 * Phase 07: SEO 评分器
 *
 * 检查文章的 SEO 质量，返回 0-100 分
 * 低于 80 分的自动修复循环（最多 3 轮）
 */

export interface SEOCheckResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
}

export interface SEOScoreResult {
  totalScore: number;
  passed: boolean;
  checks: SEOCheckResult[];
  suggestions: string[];
}

const MINIMUM_SCORE = 80;

export function scoreSEO(html: string, keyword: string): SEOScoreResult {
  const checks: SEOCheckResult[] = [];
  const suggestions: string[] = [];

  checks.push(checkTitle(html, keyword, suggestions));
  checks.push(checkMetaDescription(html, keyword, suggestions));
  checks.push(checkH1(html, keyword, suggestions));
  checks.push(checkH2Structure(html, suggestions));
  checks.push(checkKeywordDensity(html, keyword, suggestions));
  checks.push(checkInternalLinks(html, suggestions));
  checks.push(checkImageAltText(html, keyword, suggestions));
  checks.push(checkWordCount(html, suggestions));
  checks.push(checkParagraphLength(html, suggestions));
  checks.push(checkFAQ(html, suggestions));
  checks.push(checkSchema(html, suggestions));
  checks.push(checkCanonicalUrl(html, suggestions));
  checks.push(checkOpenGraph(html, suggestions));

  const totalScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.reduce((sum, c) => sum + c.maxScore, 0) * 100,
  );

  return {
    totalScore,
    passed: totalScore >= MINIMUM_SCORE,
    checks,
    suggestions,
  };
}

function checkTitle(html: string, keyword: string, suggestions: string[]): SEOCheckResult {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1] ?? '';
  const hasKeyword = title.toLowerCase().includes(keyword.toLowerCase());
  const length = title.length;

  let score = 0;
  let message = '';

  if (title && hasKeyword && length >= 30 && length <= 60) {
    score = 10;
    message = 'Title is optimal';
  } else if (title && hasKeyword) {
    score = 7;
    message = `Title length (${length} chars) should be 30-60`;
    suggestions.push('Optimize title length to 30-60 characters');
  } else if (title) {
    score = 4;
    message = 'Title missing target keyword';
    suggestions.push('Include target keyword in title');
  } else {
    message = 'Title tag not found';
    suggestions.push('Add a title tag with target keyword');
  }

  return { name: 'Title Tag', passed: score >= 7, score, maxScore: 10, message };
}

function checkMetaDescription(html: string, keyword: string, suggestions: string[]): SEOCheckResult {
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const desc = metaMatch?.[1] ?? '';
  const hasKeyword = desc.toLowerCase().includes(keyword.toLowerCase());
  const length = desc.length;

  let score = 0;
  let message = '';

  if (desc && hasKeyword && length >= 120 && length <= 160) {
    score = 10;
    message = 'Meta description is optimal';
  } else if (desc && hasKeyword) {
    score = 7;
    message = `Description length (${length}) should be 120-160`;
    suggestions.push('Optimize meta description length');
  } else if (desc) {
    score = 4;
    message = 'Meta description missing keyword';
    suggestions.push('Include keyword in meta description');
  } else {
    message = 'Meta description not found';
    suggestions.push('Add meta description with target keyword');
  }

  return { name: 'Meta Description', passed: score >= 7, score, maxScore: 10, message };
}

function checkH1(html: string, keyword: string, suggestions: string[]): SEOCheckResult {
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) ?? [];
  const hasKeyword = h1Matches.some((h) => h.toLowerCase().includes(keyword.toLowerCase()));

  let score = 0;
  let message = '';

  if (h1Matches.length === 1 && hasKeyword) {
    score = 10;
    message = 'H1 is optimal (single tag with keyword)';
  } else if (h1Matches.length === 1) {
    score = 6;
    message = 'H1 exists but missing keyword';
    suggestions.push('Include keyword in H1 tag');
  } else if (h1Matches.length > 1) {
    score = 3;
    message = `Multiple H1 tags found (${h1Matches.length})`;
    suggestions.push('Use only one H1 tag per page');
  } else {
    message = 'No H1 tag found';
    suggestions.push('Add an H1 tag with target keyword');
  }

  return { name: 'H1 Tag', passed: score >= 6, score, maxScore: 10, message };
}

function checkH2Structure(html: string, suggestions: string[]): SEOCheckResult {
  const h2Matches = html.match(/<h2[^>]*>/gi) ?? [];
  const h3Matches = html.match(/<h3[^>]*>/gi) ?? [];

  let score = 0;
  let message = '';

  if (h2Matches.length >= 3 && h3Matches.length >= 2) {
    score = 10;
    message = `Good structure: ${h2Matches.length} H2s, ${h3Matches.length} H3s`;
  } else if (h2Matches.length >= 2) {
    score = 7;
    message = `Decent structure: ${h2Matches.length} H2s, ${h3Matches.length} H3s`;
    suggestions.push('Add more H2/H3 subheadings for better structure');
  } else if (h2Matches.length >= 1) {
    score = 4;
    message = 'Needs more subheadings';
    suggestions.push('Add at least 3 H2 sections');
  } else {
    message = 'No H2 tags found';
    suggestions.push('Structure content with H2 and H3 tags');
  }

  return { name: 'Heading Structure', passed: score >= 7, score, maxScore: 10, message };
}

function checkKeywordDensity(html: string, keyword: string, suggestions: string[]): SEOCheckResult {
  const text = html.replace(/<[^>]+>/g, ' ').toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(/\s+/);

  let count = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const slice = words.slice(i, i + keywordWords.length).join(' ');
    if (slice === keywordLower) count++;
  }

  const density = words.length > 0 ? (count / words.length) * 100 : 0;

  let score = 0;
  let message = '';

  if (density >= 1 && density <= 2.5) {
    score = 10;
    message = `Keyword density optimal: ${density.toFixed(2)}% (${count} times)`;
  } else if (density >= 0.5 && density < 1) {
    score = 7;
    message = `Keyword density low: ${density.toFixed(2)}%`;
    suggestions.push('Increase keyword usage slightly');
  } else if (density > 2.5 && density <= 4) {
    score = 6;
    message = `Keyword density high: ${density.toFixed(2)}%`;
    suggestions.push('Reduce keyword stuffing');
  } else if (density > 4) {
    score = 3;
    message = `Keyword stuffing detected: ${density.toFixed(2)}%`;
    suggestions.push('Reduce keyword density to 1-2.5%');
  } else {
    score = 2;
    message = `Keyword not found in content`;
    suggestions.push('Include target keyword naturally in content');
  }

  return { name: 'Keyword Density', passed: score >= 7, score, maxScore: 10, message };
}

function checkInternalLinks(html: string, suggestions: string[]): SEOCheckResult {
  const linkMatches = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) ?? [];
  const internalLinks = linkMatches.filter((l) => !l.includes('http'));

  let score = 0;
  let message = '';

  if (internalLinks.length >= 3) {
    score = 10;
    message = `Good: ${internalLinks.length} internal links`;
  } else if (internalLinks.length >= 1) {
    score = 6;
    message = `Only ${internalLinks.length} internal links`;
    suggestions.push('Add more internal links to related products');
  } else {
    score = 2;
    message = 'No internal links found';
    suggestions.push('Add internal links to related product pages');
  }

  return { name: 'Internal Links', passed: score >= 6, score, maxScore: 10, message };
}

function checkImageAltText(html: string, keyword: string, suggestions: string[]): SEOCheckResult {
  const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
  const withAlt = imgMatches.filter((i) => /alt=["'][^"']+["']/i.test(i));
  const withKeyword = withAlt.filter((i) => i.toLowerCase().includes(keyword.toLowerCase()));

  let score = 0;
  let message = '';

  if (imgMatches.length === 0) {
    score = 5;
    message = 'No images found (add images with alt text)';
    suggestions.push('Add images with descriptive alt text');
  } else if (withAlt.length === imgMatches.length && withKeyword.length > 0) {
    score = 10;
    message = `All ${imgMatches.length} images have alt text (${withKeyword.length} with keyword)`;
  } else if (withAlt.length === imgMatches.length) {
    score = 7;
    message = `All images have alt text (none contain keyword)`;
    suggestions.push('Add keyword to some image alt texts');
  } else {
    score = 4;
    message = `${withAlt.length}/${imgMatches.length} images have alt text`;
    suggestions.push('Add alt text to all images');
  }

  return { name: 'Image Alt Text', passed: score >= 6, score, maxScore: 10, message };
}

function checkWordCount(html: string, suggestions: string[]): SEOCheckResult {
  const text = html.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;

  let score = 0;
  let message = '';

  if (words >= 2000) {
    score = 10;
    message = `Excellent: ${words} words`;
  } else if (words >= 1500) {
    score = 8;
    message = `Good: ${words} words (target 2000+)`;
    suggestions.push('Consider adding more content');
  } else if (words >= 1000) {
    score = 5;
    message = `Fair: ${words} words (target 2000+)`;
    suggestions.push('Add more depth to reach 2000+ words');
  } else {
    score = 2;
    message = `Too short: ${words} words`;
    suggestions.push('Content needs to be at least 1500 words');
  }

  return { name: 'Word Count', passed: score >= 8, score, maxScore: 10, message };
}

function checkParagraphLength(html: string, suggestions: string[]): SEOCheckResult {
  const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi) ?? [];
  const longParagraphs = pMatches.filter((p) => {
    const text = p.replace(/<[^>]+>/g, '');
    return text.split(/\s+/).length > 100;
  });

  let score = 10;
  let message = `All paragraphs are concise`;

  if (longParagraphs.length > 0) {
    score = 6;
    message = `${longParagraphs.length} paragraphs exceed 100 words`;
    suggestions.push('Break long paragraphs into shorter ones');
  }

  return { name: 'Paragraph Length', passed: score >= 6, score, maxScore: 10, message };
}

function checkFAQ(html: string, suggestions: string[]): SEOCheckResult {
  const hasFAQ = /FAQ|Frequently Asked Questions/i.test(html);
  const hasSchema = /FAQPage/i.test(html);

  let score = 0;
  let message = '';

  if (hasFAQ && hasSchema) {
    score = 10;
    message = 'FAQ section with FAQPage schema found';
  } else if (hasFAQ) {
    score = 6;
    message = 'FAQ section found (missing FAQPage schema)';
    suggestions.push('Add FAQPage schema markup');
  } else {
    score = 2;
    message = 'No FAQ section found';
    suggestions.push('Add FAQ section with 3-5 questions');
  }

  return { name: 'FAQ Section', passed: score >= 6, score, maxScore: 10, message };
}

function checkSchema(html: string, suggestions: string[]): SEOCheckResult {
  const hasArticleSchema = /"@type"\s*:\s*"Article"/i.test(html);
  const hasOrgSchema = /"@type"\s*:\s*"Organization"/i.test(html);

  let score = 0;
  let message = '';

  if (hasArticleSchema && hasOrgSchema) {
    score = 10;
    message = 'Article + Organization schemas found';
  } else if (hasArticleSchema) {
    score = 6;
    message = 'Article schema found (add Organization)';
    suggestions.push('Add Organization schema');
  } else {
    score = 2;
    message = 'No structured data found';
    suggestions.push('Add Article and Organization schemas');
  }

  return { name: 'Schema Markup', passed: score >= 6, score, maxScore: 10, message };
}

function checkCanonicalUrl(html: string, suggestions: string[]): SEOCheckResult {
  const hasCanonical = /rel=["']canonical["']/i.test(html);

  let score = 0;
  let message = '';

  if (hasCanonical) {
    score = 10;
    message = 'Canonical URL found';
  } else {
    score = 3;
    message = 'No canonical URL';
    suggestions.push('Add canonical URL');
  }

  return { name: 'Canonical URL', passed: score >= 6, score, maxScore: 10, message };
}

function checkOpenGraph(html: string, suggestions: string[]): SEOCheckResult {
  const hasOG = /og:title/i.test(html);
  const hasOGDesc = /og:description/i.test(html);
  const hasOGImage = /og:image/i.test(html);

  let score = 0;
  let message = '';

  if (hasOG && hasOGDesc && hasOGImage) {
    score = 10;
    message = 'Full Open Graph tags found';
  } else if (hasOG || hasOGDesc) {
    score = 5;
    message = 'Partial Open Graph tags';
    suggestions.push('Add complete Open Graph tags');
  } else {
    score = 1;
    message = 'No Open Graph tags';
    suggestions.push('Add og:title, og:description, og:image');
  }

  return { name: 'Open Graph', passed: score >= 5, score, maxScore: 10, message };
}
