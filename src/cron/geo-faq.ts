/**
 * GEO FAQ 自动扩容 Cron（GEO-07）
 *
 * 每周日 07:00（北京）执行：从竞品缺口 + GSC 机会关键词中挑 3 个
 * 尚无 FAQ 覆盖的采购主题，DeepSeek 生成含数字事实的 Q/A，
 * 以 source='auto' + is_active=false 存入 KV geo:faqs 待人工审核。
 *
 * 审核入口：Admin「FAQ 管理」——「待审核」徽章行点「✓ 启用」即上线 faq.html。
 */

import type { Env } from '../index';
import { callDeepSeek } from '../lib/deepseek';
import { listFaqs, createFaq, hasSimilarQuestion } from '../lib/faq';
import type { FaqItem } from '../lib/faq';
import { getJSON } from '../lib/kv';

const FAQS_PER_RUN = 3;

interface GapData {
  gaps?: Array<{ keyword: string }>;
}

interface OpportunityData {
  opportunities?: Array<{ keyword?: string }>;
}

/** 合并两个关键词源（竞品缺口优先），去重保序 */
async function collectTopicKeywords(env: Env): Promise<string[]> {
  const gap = (await getJSON<GapData>(env.SEO_DATA, 'competitors:gap'))?.gaps ?? [];
  const opp = (await getJSON<OpportunityData>(env.SEO_DATA, 'opportunities:weekly'))?.opportunities ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of [...gap, ...opp]) {
    const kw = String(row.keyword ?? '').trim().toLowerCase();
    if (!kw || seen.has(kw)) continue;
    // FAQ 面向采购问题，过滤纯导航/品牌词
    if (/(^|\s)(best|top|cheapest)\b/i.test(kw) && kw.length < 12) continue;
    seen.add(kw);
    out.push(kw);
  }
  return out;
}

interface GeneratedFaq {
  question: string;
  answer: string;
  category?: string;
}

async function generateFaq(env: Env, keyword: string): Promise<GeneratedFaq> {
  const systemPrompt =
    'You are a B2B export sales engineer at Kestrel Metal (kestrelmetal.com), a wire mesh fence manufacturer in Anping, China (ISO 9001, 12+ years, 3000+ tons/month capacity, FOB Tianjin/Shanghai, lead time 15-25 days). Respond ONLY with valid JSON.';
  const userPrompt = `A procurement buyer would ask an AI search engine: "${keyword}"

Write ONE FAQ entry answering this as Kestrel Metal would. Requirements:
- question: natural buyer phrasing (may differ slightly from the keyword)
- answer: 2-3 sentences, self-contained and quotable by AI engines, MUST include at least one concrete number with a unit drawn from real B2B facts (dimensions mm/m, coating g/m², capacity tons/month, lead time days, MOQ, standards ASTM/EN/ISO)
- category: one of Orders, Products, Quality, Compliance, Shipping, Product Knowledge, Installation Guide
- Do not invent certifications the company does not hold (we hold ISO 9001:2015, CE, UKCA, REACH)

JSON format: {"question": "...", "answer": "...", "category": "..."}`;

  const resp = await callDeepSeek(
    { DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY, DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || 'deepseek-chat' },
    systemPrompt,
    userPrompt,
  );
  const match = resp.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in DeepSeek response');
  const parsed = JSON.parse(match[0]) as GeneratedFaq;
  if (!parsed.question || !parsed.answer) throw new Error('Incomplete FAQ JSON');
  return parsed;
}

export default async function geoFaq(env: Env): Promise<void> {
  if (!env.DEEPSEEK_API_KEY) {
    console.log('[geo-faq] DEEPSEEK_API_KEY not set, skipping');
    return;
  }

  const existing = await listFaqs(env);
  const keywords = await collectTopicKeywords(env);

  // 尚未被 FAQ 覆盖的主题（关键词出现在已有问题文本里即算覆盖）
  const unanswered = keywords.filter((kw) => {
    const kwWords = kw.split(/\s+/).filter((w) => w.length > 3);
    if (kwWords.length === 0) return false;
    return !existing.some((f) => {
      const q = f.question.toLowerCase();
      return kwWords.every((w) => q.includes(w));
    });
  });

  console.log(`[geo-faq] ${keywords.length} topics, ${unanswered.length} uncovered, generating ${FAQS_PER_RUN}`);

  let created = 0;
  for (const keyword of unanswered.slice(0, FAQS_PER_RUN)) {
    try {
      const faq = await generateFaq(env, keyword);
      if (hasSimilarQuestion(existing, faq.question)) {
        console.log(`[geo-faq] Similar question exists, skipped: ${faq.question}`);
        continue;
      }
      await createFaq(env, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'Product Knowledge',
        language: 'en',
        sort_order: 100,
        is_active: false, // 待审核，Admin 启用后才进 faq.html
        source: 'auto',
      });
      existing.push({ question: faq.question } as FaqItem);
      created++;
      console.log(`[geo-faq] Created pending FAQ: ${faq.question}`);
    } catch (err) {
      console.error(`[geo-faq] Failed for "${keyword}":`, err);
    }
  }

  console.log(`[geo-faq] Done. ${created} pending FAQs awaiting review.`);
}
