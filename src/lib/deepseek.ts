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
  wordCount: number;
  schema: object;
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

  const userPrompt = `Create a detailed SEO blog article outline for the target keyword: "${request.keyword}"

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

Requirements:
1. Write in professional B2B English
2. Include the target keyword naturally 8-12 times
3. Use semantic variations of the keyword
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

  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${outline.title} | Kestrel Metal</title>
  <meta name="description" content="${outline.metaDescription}">
  <meta name="keywords" content="${keyword}, kestrel metal, metal fencing, industrial security">
  <link rel="canonical" href="https://kestrelmetal.com/blog/${slug}.html">
  <style>
    :root { --primary: #ff6b35; --bg: #0a0a0a; --text: #333; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: var(--text); line-height: 1.8; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: clamp(28px, 4vw, 40px); margin-bottom: 20px; color: var(--bg); }
    h2 { font-size: clamp(22px, 3vw, 28px); margin: 40px 0 16px; color: var(--bg); }
    h3 { font-size: clamp(18px, 2.5vw, 22px); margin: 24px 0 12px; color: #444; }
    p { margin-bottom: 16px; }
    ul, ol { margin: 16px 0 16px 24px; }
    li { margin-bottom: 8px; }
    strong { color: var(--bg); }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
    th { background: #f5f5f5; }
    .cta { background: var(--bg); color: white; padding: 24px; border-radius: 8px; margin-top: 40px; text-align: center; }
    .cta a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .faq { margin-top: 40px; }
    .faq-item { margin-bottom: 20px; }
    .faq-item h3 { color: var(--primary); }
  </style>
</head>
<body>
  <article class="container">
    <h1>${outline.h1}</h1>
    
    ${htmlContent}
    
    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      ${outline.faq.map(f => `
      <div class="faq-item">
        <h3>${f.question}</h3>
        <p>${f.answer}</p>
      </div>`).join('\n')}
    </section>
    
    <div class="cta">
      <h2>Ready to Discuss Your Project?</h2>
      <p>Contact Kestrel Metal for customized solutions and competitive pricing.</p>
      <a href="/contact.html">Get a Free Quote →</a>
    </div>
  </article>
</body>
</html>`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: outline.title,
    description: outline.metaDescription,
    author: {
      '@type': 'Organization',
      name: 'Kestrel Metal',
      url: 'https://kestrelmetal.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kestrel Metal',
      url: 'https://kestrelmetal.com',
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kestrelmetal.com/blog/${slug}.html`,
    },
    keywords: keyword,
    wordCount,
  };

  return {
    slug,
    title: outline.title,
    metaDescription: outline.metaDescription,
    html: articleHtml,
    keyword,
    wordCount,
    schema,
  };
}

export async function generateFullArticle(
  env: DeepSeekEnv,
  request: ArticleRequest,
): Promise<GeneratedArticle> {
  console.log(`[deepseek] Generating outline for keyword: ${request.keyword}`);
  const outline = await generateOutline(env, request);

  console.log(`[deepseek] Generating article: ${outline.title}`);
  const article = await generateArticle(env, outline, request.keyword);

  console.log(`[deepseek] Article generated: ${article.wordCount} words`);
  return article;
}
