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

  const wordCount = htmlContent.split(/\s+/).length;
  const slug = slugify(outline.title);
  const today = new Date().toISOString().split('T')[0];
  const aiHeroImage = `images/blog/${slug}-hero.webp`;

  // Fallback hero images from existing static assets (used when AI generation fails)
  const keywordToHero: Record<string, string> = {
    'gabion': 'images/blog/blog-gabion-market-hero.webp',
    'chain-link': 'images/blog/blog-chain-link-yard-hero.webp',
    'razor-wire': 'images/blog/blog-razor-coils-hero.avif',
    'barbed-wire': 'images/blog/blog-barbed-cost-hero.webp',
    'welded-wire': 'images/blog/welded-mesh-711.webp',
    'hexagonal': 'images/blog/blog-hex-mesh-hero.webp',
    'security-fence': 'images/blog/dual-fence-hero.webp',
    'fence': 'images/blog/blog-gabion-market-hero.webp',
    'wire-mesh': 'images/blog/epoxy-coated-wire-mesh.webp',
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
              ${htmlContent}
            </article>
            <section class="article-faq">
              <h2>Frequently Asked Questions</h2>
              ${faqHtml}
            </section>
            <div class="article-inquiry-cta">
              <p>Looking for reliable ${keyword} solutions? At Kestrel Metal, we manufacture premium metal products with worldwide shipping and 24-hour quote response. <a class="inquiry-cta-link" href="contact.html">Request a Quote</a> today for customized specifications and competitive pricing.</p>
            </div>
          </div>
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
