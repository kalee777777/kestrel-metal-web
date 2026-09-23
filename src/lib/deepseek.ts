/**
 * DeepSeek V4 Pro AI 内容生成核心
 *
 * 功能：
 * - 生成 SEO 优化的博客大纲
 * - 生成 2000-3000 字的深度文章
 * - 生成 HTML 模板 + JSON-LD Schema
 * - 生成 meta description 和 title
 */

export interface DeepSeekEnv {
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_MODEL: string;
}

export interface ArticleRequest {
  keyword: string;
  /** 同产品组的变体词，会与主词一起写进同一篇文章（关键词聚类用） */
  variants?: string[];
  title?: string;
  productLine?: string;
  targetAudience?: string;
}

export interface ArticleOutline {
  title: string;
  metaDescription: string;
  h1: string;
  sections: Array<{
    h2: string;
    h3s: string[];
    content: string;
  }>;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  internalLinks: string[];
  targetWordCount: number;
}

export interface GeneratedArticle {
  slug: string;
  title: string;
  metaDescription: string;
  html: string;
  keyword: string;
  /** 同组变体词，随主词一起被文章覆盖 */
  variants: string[];
  wordCount: number;
  heroImage: string;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

async function callDeepSeek(
  env: DeepSeekEnv,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const resp = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`DeepSeek API error (${resp.status}): ${errText}`);
  }

  const data = (await resp.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 清洗 AI 输出的文章 HTML。
 *
 * 历史事故（2026-09）：AI 输出直接嵌入模板发布，出现过未闭合 <p>、
 * 提前出现的 </article>、注入的隐藏外链，导致侧边栏渲染失效与安全风险。
 * 此函数在发布前统一兜底：
 * 1. 剥离 <script> 与隐藏元素（display:none / visibility:hidden 的标签）
 * 2. 剥离文档级标签（html/head/body/article 由模板提供，AI 不应输出）
 * 3. 补齐未闭合的常见容器标签（追加到末尾，浏览器容错多余闭合）
 */
export function sanitizeArticleHtml(html: string): string {
  let out = html;

  // 1. strip scripts (with or without closing tag)
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  out = out.replace(/<script\b[^>]*>/gi, '');

  // 2. strip hidden injected elements (e.g. Cloudflare-style hidden anchors)
  out = out.replace(/<a\b[^>]*(display\s*:\s*none|visibility\s*:\s*hidden)[^>]*>([\s\S]*?)<\/a>/gi, '');
  out = out.replace(/<a\b[^>]*(display\s*:\s*none|visibility\s*:\s*hidden)[^>]*\/?>/gi, '');

  // 3. strip document-level tags the template owns
  out = out.replace(/<\/?(?:html|head|body|article|main|aside)\b[^>]*>/gi, '');

  // 4. balance common container tags by appending missing closers
  const tags = ['details', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'div', 'p', 'blockquote', 'figure', 'strong', 'em', 'h2', 'h3', 'h4'];
  const warnings: string[] = [];
  for (const tag of tags) {
    const opens = (out.match(new RegExp(`<${tag}(?:\\s|>)`, 'gi')) || []).length;
    const closes = (out.match(new RegExp(`</${tag}\\s*>`, 'gi')) || []).length;
    if (opens > closes) {
      const missing = opens - closes;
      warnings.push(`<${tag}> x${missing} unclosed`);
      out += `</${tag}>`.repeat(missing);
    }
  }
  if (warnings.length > 0) {
    console.warn(`[deepseek] sanitize: auto-closed ${warnings.join(', ')}`);
  }
  return out.trim();
}

/** 转义属性值中的特殊字符，防止标题里的引号破坏属性 */
function escAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface SidebarProduct {
  href: string;
  img: string;
  name: string;
  desc: string;
}

interface SidebarData {
  categories: string[];
  posts: Array<{ href: string; title: string }>;
  products: SidebarProduct[];
}

/**
 * 关键词 → 侧边栏内容映射（Category / Related Posts / Related Products）。
 *
 * 历史事故（2026-09）：模板只生成 article-main 单列，新文章天生缺右侧栏，
 * 只能人工逐篇补齐。此映射让模板直接产出与标准 blog 文章页一致的
 * article-grid 两列结构。引用的产品页 / 图片 / 文章均为仓库静态资产。
 */
const KEYWORD_SIDEBARS: Array<{ match: string[]; data: SidebarData }> = [
  {
    match: ['razor'],
    data: {
      categories: ['Security', 'Razor Wire'],
      posts: [
        { href: 'blog-razor-coils-7-things.html', title: "7 Things You Probably Didn't Know About Razor Coils" },
        { href: 'blog-nato22-razor-wire.html', title: 'NATO-22 Certified Razor Wire: Meeting Global Military Security Standards' },
        { href: 'blog-border-razor-wire-deployment.html', title: 'Razor Wire Is Most Visible Result of $210M Troop Deployment to US-Mexico Border' },
      ],
      products: [
        { href: 'razor-wire-btc.html', img: 'images/blog/btc-razor-wire.webp', name: 'BTC Barbed Tape Concertina', desc: 'Military-grade NATO-22 standard' },
        { href: 'razor-wire-cross.html', img: 'images/wire-razor-hero.webp', name: 'Cross Concertina Razor Wire', desc: 'Interlocking crossed coils' },
        { href: 'razor-wire-welded-mesh.html', img: 'images/fence-security-hero.webp', name: 'Welded Razor Mesh', desc: 'Rigid mesh panels' },
      ],
    },
  },
  {
    match: ['gabion'],
    data: {
      categories: ['Gabion', 'Sourcing Guide'],
      posts: [
        { href: 'blog-gabion-box-selection-guide.html', title: 'How to Select the Right Gabion Box' },
        { href: 'blog-how-to-install-welded-gabion-boxes.html', title: 'How to Install Welded Gabion Boxes: A Complete Step-by-Step Guide' },
        { href: 'blog-welded-vs-twisted-gabion.html', title: 'Welded vs Twisted Gabion: Which to Choose' },
      ],
      products: [
        { href: 'gabion-boxes.html', img: 'images/gabion-box-1.webp', name: 'Gabion Boxes', desc: 'Welded mesh stone cages' },
        { href: 'gabion-mattresses.html', img: 'images/gabion-mattress.webp', name: 'Gabion Mattresses', desc: 'Erosion control revetments' },
        { href: 'double-twisted-gabion.html', img: 'images/gabion-landscaping.webp', name: 'Double Twisted Gabion', desc: 'Hexagonal woven baskets' },
      ],
    },
  },
  {
    match: ['chain link', 'chain-link'],
    data: {
      categories: ['Fencing', 'Chain Link'],
      posts: [
        { href: 'blog-chain-link-selection.html', title: 'How to Select the Right Chain Link Fence' },
        { href: 'blog-chain-link-evolution.html', title: 'The Evolution of Chain Link Fence: 2024 and Beyond' },
        { href: 'blog-galvanized-vs-pvc.html', title: 'Galvanized vs PVC Coated Chain Link' },
      ],
      products: [
        { href: 'galvanized-chain-link.html', img: 'images/chain-link-overview.webp', name: 'Galvanized Chain Link', desc: 'Hot-dip zinc coating' },
        { href: 'chain-link-security-fence.html', img: 'images/chain-link-pvc.webp', name: 'Chain Link Security Fence', desc: 'PVC coated options' },
        { href: 'chain-link.html', img: 'images/chain-link-privacy.webp', name: 'Chain Link Fencing', desc: 'All gauge options' },
      ],
    },
  },
  {
    match: ['barbed'],
    data: {
      categories: ['Fencing', 'Barbed Wire'],
      posts: [
        { href: 'blog-barb-wire-gates-tips.html', title: 'Tips for Opening and Closing Barb Wire Gates' },
        { href: 'blog-nato22-razor-wire.html', title: 'NATO-22 Certified Razor Wire' },
        { href: 'blog-border-razor-wire-deployment.html', title: 'Razor Wire at the US-Mexico Border' },
      ],
      products: [
        { href: 'barbed-wire-concertina.html', img: 'images/wire-barbed-hero.webp', name: 'Barbed Wire Concertina', desc: 'Coiled barrier wire' },
        { href: 'barbed-wire-galvanized.html', img: 'images/wire-razor-hero.webp', name: 'Galvanized Barbed Wire', desc: 'Standard IOWA type' },
        { href: 'hot-dip-galvanized.html', img: 'images/fence-security-hero.webp', name: 'Hot Dip Galvanized Wire', desc: 'Zinc coated fencing wire' },
      ],
    },
  },
  {
    match: ['cattle', 'livestock', 'farm', 'field fence', 'deer', 'horse'],
    data: {
      categories: ['Agriculture', 'Field Fence'],
      posts: [
        { href: 'blog-field-fence-installation.html', title: 'Field Fence Installation Guide' },
        { href: 'blog-fence-liability-escaped-animals.html', title: 'Fence Liability: Escaped Animals' },
        { href: 'blog-installation-mistakes.html', title: '10 Common Mistakes When Installing Wire Mesh Fencing' },
      ],
      products: [
        { href: 'fence-farm.html', img: 'images/app-horse-paddocks.webp', name: 'Farm Fence', desc: 'Livestock fencing rolls' },
        { href: 'hinge-joint-knot.html', img: 'images/app-garden-fence.webp', name: 'Hinge Joint Knot Fence', desc: 'Flexible livestock mesh' },
        { href: 'fixed-knot-fence.html', img: 'images/app-tree-guard.webp', name: 'Fixed Knot Fence', desc: 'High-tension game fence' },
      ],
    },
  },
  {
    match: ['3d panel', '3d-panel', '358', 'anti-climb', 'high security', 'security fence', 'prison'],
    data: {
      categories: ['Security', 'High Security Fence'],
      posts: [
        { href: 'blog-dual-fence-security.html', title: 'Dual Fence Security System: Why Two Perimeter Barriers Multiply Security' },
        { href: 'blog-razor-coils-7-things.html', title: "7 Things You Probably Didn't Know About Razor Coils" },
        { href: 'blog-installation-mistakes.html', title: '10 Common Mistakes When Installing Wire Mesh Fencing' },
      ],
      products: [
        { href: 'fence-3d.html', img: 'images/fence-security-hero.webp', name: '3D Panel Fence', desc: 'V-profile welded panels' },
        { href: '358-security-fence.html', img: 'images/blog/dual-fence-hero.webp', name: '358 Security Fence', desc: 'Anti-climb small mesh' },
        { href: 'fence-security.html', img: 'images/welded-mesh-711.webp', name: 'Security Fencing', desc: 'Perimeter solutions' },
      ],
    },
  },
  {
    match: ['hexagonal', 'chicken'],
    data: {
      categories: ['Agriculture', 'Hexagonal Mesh'],
      posts: [
        { href: 'blog-squirrel-proof-wire-mesh.html', title: 'Squirrel Proof Wire Mesh' },
        { href: 'blog-materials-welded-wire-mesh.html', title: 'Materials Used in Welded Wire Mesh' },
        { href: 'blog-specification-sheet.html', title: 'Wire Mesh Specification Sheet: How to Read Technical Data' },
      ],
      products: [
        { href: 'hexagonal-wire.html', img: 'images/hexagonal-wire.webp', name: 'Hexagonal Wire Mesh', desc: 'Chicken netting rolls' },
        { href: 'hexagonal-wire-galvanized.html', img: 'images/hexagonal-wire.webp', name: 'Galvanized Hexagonal Wire', desc: 'Zinc coated netting' },
        { href: 'hexagonal-wire-pvc.html', img: 'images/app-rabbit-cage.webp', name: 'PVC Coated Hexagonal', desc: 'Green coated mesh' },
      ],
    },
  },
];

const DEFAULT_SIDEBAR: SidebarData = {
  categories: ['Buying Guide', 'Wire Mesh'],
  posts: [
    { href: 'blog-specification-sheet.html', title: 'Wire Mesh Specification Sheet: How to Read and Interpret Technical Data' },
    { href: 'blog-materials-welded-wire-mesh.html', title: 'Materials Used in Welded Wire Mesh' },
    { href: 'blog-installation-mistakes.html', title: '10 Common Mistakes When Installing Wire Mesh Fencing' },
  ],
  products: [
    { href: 'fence-products.html', img: 'images/welded-mesh-711.webp', name: 'Welded Wire Mesh', desc: 'Panels and rolls' },
    { href: 'galvanized-chain-link.html', img: 'images/chain-link-overview.webp', name: 'Galvanized Chain Link', desc: 'Hot-dip zinc coating' },
    { href: 'gabion-boxes.html', img: 'images/gabion-box-1.webp', name: 'Gabion Boxes', desc: 'Welded mesh stone cages' },
  ],
};

function getSidebarData(keyword: string): SidebarData {
  const kw = keyword.toLowerCase();
  for (const entry of KEYWORD_SIDEBARS) {
    if (entry.match.some((m) => kw.includes(m))) return entry.data;
  }
  return DEFAULT_SIDEBAR;
}

function buildSidebarHtml(keyword: string): string {
  const data = getSidebarData(keyword);
  const tagHtml = data.categories
    .map((c) => `<a href="blog-news.html" class="blog-sidebar-tag">${c}</a>`)
    .join('\n                  ');
  const postHtml = data.posts
    .map((p) => `<li><a href="${p.href}">${p.title}</a></li>`)
    .join('\n                ');
  const productHtml = data.products
    .map(
      (p) => `<a href="${p.href}" class="blog-sidebar-product-card">
                  <div class="blog-sidebar-product-card-img">
                    <img src="${p.img}" alt="${escAttr(p.name)}" loading="lazy" decoding="async">
                  </div>
                  <div class="blog-sidebar-product-card-info">
                    <h4>${p.name}</h4>
                    <p>${p.desc}</p>
                  </div>
                </a>`,
    )
    .join('\n                ');

  return `<aside class="article-sidebar">
            <div class="article-sidebar-card">
              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Category</div>
                <div class="blog-sidebar-tags">
                  ${tagHtml}
                </div>
              </div>

              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Related Posts</div>
                <ul class="blog-sidebar-links">
                  ${postHtml}
                </ul>
              </div>

              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Related Products</div>
                <div class="blog-sidebar-products">
                  ${productHtml}
                </div>
              </div>
            </div>
          </aside>`;
}

export async function generateOutline(
  env: DeepSeekEnv,
  request: ArticleRequest,
): Promise<ArticleOutline> {
  const systemPrompt = `You are an expert B2B SEO content writer specializing in metal fencing, gabion boxes, razor wire, and industrial security products. You write for an international audience (English). Always respond in valid JSON format.`;

  const variantList = (request.variants ?? []).filter(Boolean);
  const variantBlock = variantList.length > 0
    ? `\nSecondary keywords (same product family, must be woven into this single article):\n${variantList.map((v) => `- ${v}`).join('\n')}\n\nWhen structuring sections, allocate at least one H2 or H3 to each secondary keyword so the article ranks for the whole keyword group instead of a single phrase.`
    : '';

  const userPrompt = `Create a detailed SEO blog article outline for the target keyword: "${request.keyword}"${variantBlock}

Requirements:
1. Title should be compelling, include the keyword, and be under 60 characters
2. Meta description should be 150-160 characters, include the keyword, and have a clear CTA
3. Structure should have 4-6 H2 sections, each with 2-3 H3 subsections
4. Include 3-5 FAQ questions with answers
5. Target word count: 2000-3000 words
6. Content should be professional, informative, and suitable for B2B buyers
7. Include practical tips, specifications, and industry insights
8. Write in English, professional tone

Respond in this exact JSON format:
{
  "title": "Article title with keyword",
  "metaDescription": "150-160 char meta description",
  "h1": "Main heading",
  "sections": [
    {
      "h2": "Section heading",
      "h3s": ["Subsection 1", "Subsection 2"],
      "content": "Brief content outline for this section"
    }
  ],
  "faq": [
    {
      "question": "FAQ question?",
      "answer": "Concise answer"
    }
  ],
  "internalLinks": ["suggested anchor text for internal links"],
  "targetWordCount": 2500
}`;

  const response = await callDeepSeek(env, systemPrompt, userPrompt);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]) as ArticleOutline;
  } catch {
    throw new Error('Failed to parse outline JSON from DeepSeek response');
  }
}

export async function generateArticle(
  env: DeepSeekEnv,
  outline: ArticleOutline,
  keyword: string,
  variants: string[] = [],
): Promise<GeneratedArticle> {
  const systemPrompt = `You are an expert B2B SEO content writer for Kestrel Metal (kestrelmetal.com), a leading manufacturer of metal fencing, gabion boxes, razor wire, and industrial security products. Write comprehensive, SEO-optimized content in English. Always respond with valid HTML content only (no markdown, no code blocks).`;

  const userPrompt = `Write a complete SEO-optimized blog article based on this outline:

Title: ${outline.title}
Target Keyword: ${keyword}
Target Word Count: ${outline.targetWordCount}

Sections:
${outline.sections.map((s, i) => `
## ${i + 1}. ${s.h2}
${s.h3s.map(h3 => `### ${h3}`).join('\n')}
${s.content}
`).join('\n')}

FAQ Section:
${outline.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}

${variants.length > 0 ? `\nSecondary keywords to cover in this same article (each at least 1-2 times, ideally as its own subsection heading):\n${variants.map((v) => `- ${v}`).join('\n')}\n` : ''}
Requirements:
1. Write in professional B2B English
2. Include the target keyword "${keyword}" naturally 8-12 times
3. Use semantic variations of the keyword${variants.length > 0 ? ' and cover every secondary keyword listed above' : ''}
4. Include specific product specifications where relevant
5. Add practical tips and industry insights
6. Each section should be 300-500 words
7. Use short paragraphs (2-3 sentences)
8. Include bullet points and numbered lists where appropriate
9. Reference Kestrel Metal products naturally
10. End with a compelling conclusion and CTA

Output ONLY the HTML content for the article body (no <html>, <head>, <body> tags). Use proper semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <tr>, <td>.`;

  const htmlContent = await callDeepSeek(env, systemPrompt, userPrompt);

  const sanitizedHtml = sanitizeArticleHtml(htmlContent);
  const wordCount = sanitizedHtml.split(/\s+/).length;
  const slug = slugify(outline.title);
  const today = new Date().toISOString().split('T')[0];
  const aiHeroImage = `images/blog/${slug}-hero.webp`;

  // 兜底配图：AI Banner 生成失败时使用（例如 DashScope 欠费或限流）。
  // 顺序即优先级，具体产品词必须排在通用词之前 ——
  // 曾出现 "filter epoxy coated mesh" 一路落到默认的 gabion 图，图文完全不符。
  const keywordToHero: Record<string, string> = {
    'epoxy': 'images/blog/epoxy-coated-wire-mesh.webp',
    'filter': 'images/blog/epoxy-coated-wire-mesh.webp',
    'stainless': 'images/blog/epoxy-coated-wire-mesh.webp',
    'nickel': 'images/blog/epoxy-coated-wire-mesh.webp',
    'copper': 'images/blog/epoxy-coated-wire-mesh.webp',
    'brass': 'images/blog/epoxy-coated-wire-mesh.webp',
    'gabion': 'images/blog/blog-gabion-market-hero.webp',
    'chain-link': 'images/blog/blog-chain-link-yard-hero.webp',
    'chain link': 'images/blog/blog-chain-link-yard-hero.webp',
    'razor-wire': 'images/blog/blog-razor-coils-hero.avif',
    'barbed-wire': 'images/blog/blog-barbed-cost-hero.webp',
    'welded-wire': 'images/blog/welded-mesh-711.webp',
    'welded mesh': 'images/blog/welded-mesh-711.webp',
    'hexagonal': 'images/blog/blog-hex-mesh-hero.webp',
    'security-fence': 'images/blog/dual-fence-hero.webp',
    'anti-climb': 'images/blog/dual-fence-hero.webp',
    '358': 'images/blog/dual-fence-hero.webp',
    'wire-mesh': 'images/blog/epoxy-coated-wire-mesh.webp',
    'wire mesh': 'images/blog/epoxy-coated-wire-mesh.webp',
    'fence': 'images/blog/blog-gabion-market-hero.webp',
  };

  let heroFallback = 'images/blog/blog-gabion-market-hero.webp';
  for (const [kw, img] of Object.entries(keywordToHero)) {
    if (keyword.toLowerCase().includes(kw)) {
      heroFallback = img;
      break;
    }
  }

  const heroImage = aiHeroImage;
  const heroImageFallback = heroFallback;
  const faqHtml = outline.faq.map(f => `
      <details class="faq-detail">
        <summary>${f.question}</summary>
        <p>${f.answer}</p>
      </details>`).join('\n');

  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${outline.title} | KESTREL METAL</title>
  <meta name="description" content="${outline.metaDescription}">
  <meta name="keywords" content="${[keyword, ...variants].join(', ')}, kestrel metal, metal fencing, industrial security">
  <link rel="canonical" href="https://www.kestrelmetal.com/${slug}.html">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/navbar.css">
  <link rel="stylesheet" href="css/article.css">
  <link rel="stylesheet" href="css/footer.css">
  <script src="js/analytics-loader.js" async></script>
  <script src="js/seo-enhance.js" async></script>
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="shortcut icon" href="favicon.ico">
  <meta name="msapplication-TileColor" content="#FF6B35">
  <meta name="theme-color" content="#FF6B35">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.kestrelmetal.com/"},
      {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://www.kestrelmetal.com/resources.html"},
      {"@type": "ListItem", "position": 3, "name": "Blog & News", "item": "https://www.kestrelmetal.com/blog-news.html"},
      {"@type": "ListItem", "position": 4, "name": "${outline.title}", "item": "https://www.kestrelmetal.com/${slug}.html"}
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${outline.title}",
    "description": "${outline.metaDescription}",
    "author": {"@type": "Organization", "name": "Kestrel Metal", "url": "https://www.kestrelmetal.com"},
    "publisher": {"@type": "Organization", "name": "Kestrel Metal", "url": "https://www.kestrelmetal.com"},
    "datePublished": "${today}",
    "dateModified": "${today}",
    "mainEntityOfPage": {"@type": "WebPage", "@id": "https://www.kestrelmetal.com/${slug}.html"},
    "keywords": "${[keyword, ...variants].join(', ')}",
    "wordCount": ${wordCount},
    "image": "https://www.kestrelmetal.com/${heroImageFallback}"
  }
  </script>
</head>
<body>
  <div id="navbar-placeholder"></div>
  <main>
    <section class="article-hero">
      <div class="article-hero-bg" style="background-image:url('${heroImageFallback}');"></div>
      <div class="article-hero-overlay"></div>
      <div class="article-hero-content" data-reveal>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="resources.html">Resources</a>
          <span class="breadcrumb-sep">/</span>
          <a href="blog-news.html">Blog &amp; News</a>
          <span class="breadcrumb-sep">/</span>
          <span class="current">${outline.h1}</span>
        </nav>
        <span class="article-hero-kicker">Industry Guide</span>
        <h1 class="article-hero-title">${outline.h1}</h1>
        <div class="article-hero-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${today}</span>
          <span class="article-hero-unread"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${Math.ceil(wordCount / 250)} min read</span>
        </div>
      </div>
    </section>
    <section class="article-body">
      <div class="article-container">
        <div class="article-grid">
          <div class="article-main">
            <a href="blog-news.html" class="article-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              Back to Blog &amp; News
            </a>
            <article class="article-content">
              ${sanitizedHtml}
            </article>
            <section class="article-faq">
              <h2>Frequently Asked Questions</h2>
              ${faqHtml}
            </section>
            <div class="article-inquiry-cta">
              <p>Looking for reliable ${keyword} solutions? At Kestrel Metal, we manufacture premium metal products with worldwide shipping and 24-hour quote response. <a class="inquiry-cta-link" href="contact.html">Request a Quote</a> today for customized specifications and competitive pricing.</p>
            </div>
            <div class="share-section" data-page-url="https://www.kestrelmetal.com/${slug}.html" data-page-title="${escAttr(outline.title)} | KESTREL METAL">
              <span class="share-label">Share</span>
              <a href="#" class="share-btn" data-share="linkedin" title="Share on LinkedIn" target="_blank" rel="noopener"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" class="share-btn" data-share="twitter" title="Share on Twitter" target="_blank" rel="noopener"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
              <a href="#" class="share-btn" data-share="email" title="Share via Email"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
            </div>
            <div class="article-post-nav">
              <a href="blog-news.html" class="prev">
                <div class="nav-label">&larr; Previous</div>
                <div class="nav-title">Back to Blog &amp; News</div>
              </a>
              <a href="blog-news.html" class="next">
                <div class="nav-label">Next &rarr;</div>
                <div class="nav-title">More Blog &amp; News</div>
              </a>
            </div>
          </div>

          ${buildSidebarHtml(keyword)}
        </div>
      </div>
    </section>
  </main>
  <div id="footer-placeholder"></div>
  <script src="js/includes.js"></script>
  <script src="js/blog-detail.js"></script>
</body>
</html>`;

  return {
    slug,
    title: outline.title,
    metaDescription: outline.metaDescription,
    html: articleHtml,
    keyword,
    variants,
    wordCount,
    heroImage,
  };
}

export async function generateFullArticle(
  env: DeepSeekEnv,
  request: ArticleRequest,
): Promise<GeneratedArticle> {
  console.log(`[deepseek] Generating outline for keyword: ${request.keyword}`);
  const outline = await generateOutline(env, request);

  console.log(`[deepseek] Generating article: ${outline.title}`);
  const article = await generateArticle(env, outline, request.keyword, request.variants ?? []);
  article.variants = request.variants ?? [];

  console.log(`[deepseek] Article generated: ${article.wordCount} words`);
  return article;
}
