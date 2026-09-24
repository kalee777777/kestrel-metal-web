/**
 * FAQ 服务端存储（GEO 单一数据源）
 *
 * KV SEO_DATA `geo:faqs` 存全量 FAQ（Admin 手工录入 + geo-faq cron 自动生成，
 * 字段与 admin localStorage faqs 集合一致，可无缝迁移）：
 *   { id, question, answer, category, language, sort_order, is_active, source, created_at }
 *
 * 消费方：
 * 1. Admin「FAQ 管理 / GEO 问答」—— /api/faq/* 路由
 * 2. faq.html 运行时注入 —— injectFaqIntoHtml（seo-inject 调用）
 * 3. geo-faq cron —— 未覆盖选题判定
 */

import type { Env } from '../index';
import { getJSON, setJSON } from './kv';

export interface FaqItem {
  id: number | string;
  question: string;
  answer: string;
  category?: string;
  language?: string;
  sort_order?: number;
  is_active?: boolean;
  /** admin = 手工录入; auto = cron 生成（默认待审核 is_active=false） */
  source?: 'admin' | 'auto';
  created_at?: string;
}

const KV_KEY = 'geo:faqs';

export async function listFaqs(env: Env): Promise<FaqItem[]> {
  const items = (await getJSON<FaqItem[]>(env.SEO_DATA, KV_KEY)) ?? [];
  return items.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

export async function saveFaqs(env: Env, items: FaqItem[]): Promise<void> {
  await setJSON(env.SEO_DATA, KV_KEY, items);
}

export async function getFaq(env: Env, id: string): Promise<FaqItem | undefined> {
  const items = await listFaqs(env);
  return items.find((f) => String(f.id) === id);
}

function nextId(items: FaqItem[]): number {
  return items.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;
}

export async function createFaq(env: Env, data: Partial<FaqItem>): Promise<FaqItem> {
  if (!data.question || !data.answer) throw new Error('question and answer are required');
  const items = await listFaqs(env);
  const item: FaqItem = {
    id: nextId(items),
    question: String(data.question),
    answer: String(data.answer),
    category: data.category || 'General',
    language: data.language || 'en',
    sort_order: data.sort_order ?? nextId(items),
    is_active: data.is_active ?? true,
    source: data.source || 'admin',
    created_at: new Date().toISOString(),
  };
  items.push(item);
  await saveFaqs(env, items);
  return item;
}

export async function updateFaq(env: Env, id: string, data: Partial<FaqItem>): Promise<FaqItem | undefined> {
  const items = await listFaqs(env);
  const idx = items.findIndex((f) => String(f.id) === id);
  if (idx < 0) return undefined;
  const { id: _ignored, ...rest } = data;
  items[idx] = { ...items[idx], ...rest };
  await saveFaqs(env, items);
  return items[idx];
}

export async function deleteFaq(env: Env, id: string): Promise<boolean> {
  const items = await listFaqs(env);
  const next = items.filter((f) => String(f.id) !== id);
  if (next.length === items.length) return false;
  await saveFaqs(env, next);
  return true;
}

/** Admin 本地 localStorage 集合一次性迁移：按 question 去重 upsert */
export async function importFaqs(env: Env, incoming: Partial<FaqItem>[]): Promise<{ imported: number; skipped: number }> {
  const items = await listFaqs(env);
  let imported = 0;
  let skipped = 0;
  for (const row of incoming) {
    if (!row?.question || !row?.answer) {
      skipped++;
      continue;
    }
    if (items.some((f) => f.question === row.question)) {
      skipped++;
      continue;
    }
    items.push({
      id: nextId(items),
      question: String(row.question),
      answer: String(row.answer),
      category: row.category || 'General',
      language: row.language || 'en',
      sort_order: row.sort_order ?? nextId(items),
      is_active: row.is_active ?? true,
      source: row.source || 'admin',
      created_at: row.created_at || new Date().toISOString(),
    });
    imported++;
  }
  await saveFaqs(env, items);
  return { imported, skipped };
}

/** 站点渲染用：active 且英文（站点单语） */
export function activeEnglishFaqs(items: FaqItem[]): FaqItem[] {
  return items.filter((f) => f.is_active !== false && (f.language ?? 'en') === 'en');
}

/** 是否已存在同义问题（geo-faq cron 判重用，忽略大小写与句尾标点） */
export function hasSimilarQuestion(items: FaqItem[], question: string): boolean {
  const norm = (q: string) => q.trim().toLowerCase().replace(/[?.!]+$/, '');
  const target = norm(question);
  return items.some((f) => norm(f.question) === target);
}

// ─── faq.html 运行时注入（GEO：KV FAQ 即时上线，无需 git 部署） ───

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/[?.!]+$/, '').replace(/\s+/g, ' ');
}

const FAQ_ITEM_TMPL = (question: string, answer: string) => `
            <div class="faq-item">
              <div class="faq-question">
                <span class="faq-question-text">${escapeHtml(question)}</span>
                <span class="faq-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </div>
              <div class="faq-answer-wrapper">
                <div class="faq-answer">${escapeHtml(answer)}</div>
              </div>
            </div>`;

/**
 * 把 KV 中 active 英文 FAQ 注入 faq.html：
 * 1. 与静态 .faq-item 按问题文本去重后，追加一个「Buying & Technical FAQ」分组
 * 2. 合并进现有 FAQPage JSON-LD 的 mainEntity（无则注入独立块），保持 "text" 字段约定
 * 由 index.ts 在 ASSETS 返回 /faq.html 时调用。
 */
export async function injectFaqIntoHtml(html: string, env: Env): Promise<string> {
  const faqs = activeEnglishFaqs(await listFaqs(env));
  if (faqs.length === 0) return html;

  const existingQuestions = new Set(
    [...html.matchAll(/<span class="faq-question-text">\s*([\s\S]*?)\s*<\/span>/gi)].map((m) =>
      normQuestion(m[1].replace(/<[^>]+>/g, '')),
    ),
  );
  const fresh = faqs.filter((f) => !existingQuestions.has(normQuestion(f.question)));
  if (fresh.length === 0) return html;

  const itemsHtml = fresh.map((f) => FAQ_ITEM_TMPL(f.question, f.answer)).join('\n');
  const groupHtml = `
          <!-- KV geo:faqs runtime-injected -->
          <div class="faq-group" data-group="general" data-reveal>
            <div class="faq-group-header">
              <span class="faq-group-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Buying &amp; Technical FAQ
              </span>
              <div class="faq-group-line"></div>
            </div>
${itemsHtml}
          </div>
`;

  const containerOpen = '<div id="faqContainer">';
  const idx = html.indexOf(containerOpen);
  if (idx < 0) return html;
  let out = html.slice(0, idx + containerOpen.length) + groupHtml + html.slice(idx + containerOpen.length);

  const schemaEntries = fresh.map((f) => ({
    '@type': 'Question',
    text: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  }));

  // 已有 FAQPage → 追加进 mainEntity（与静态生成器 "text" 约定一致）
  const faqPageRe =
    /(<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?"mainEntity"\s*:\s*\[)([\s\S]*?)(\][\s\S]*?<\/script>)/;
  if (faqPageRe.test(out)) {
    out = out.replace(faqPageRe, (match, pre, entityBody, post) => {
      try {
        const arr = JSON.parse(`[${entityBody.trim().replace(/,$/, '')}]`) as Array<Record<string, unknown>>;
        for (const entry of schemaEntries) {
          const already = arr.some(
            (q) => q && normQuestion(String(q.text ?? q.name ?? '')) === normQuestion(entry.text),
          );
          if (!already) arr.push(entry);
        }
        return `${pre}\n    ${arr.map((q) => JSON.stringify(q)).join(',\n    ')}\n  ${post}`;
      } catch {
        return match;
      }
    });
  } else if (/<\/head>/i.test(out)) {
    // 没有 FAQPage 块则注入独立块
    const block = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "FAQPage",\n    "mainEntity": ${JSON.stringify(schemaEntries, null, 2).replace(/</g, '\\u003c')}\n  }\n  </script>\n`;
    out = out.replace(/<\/head>/i, `${block}</head>`);
  }

  console.log(`[faq] Injected ${fresh.length} KV FAQs into faq.html`);
  return out;
}
