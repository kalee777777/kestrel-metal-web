/**
 * llms.txt 动态化
 *
 * 静态基底文件（仓库 llms.txt，公司身份/产品线/Proof Points/FAQ）不动；
 * KV `geo:llms:entries` 存放流水线自动发布文章的追加条目，
 * GET /llms.txt 时合并输出「Latest Guides」段 —— 新文章发布即进 llms.txt，
 * 无需 git 部署（与动态 sitemap 同一模式）。
 *
 * 回退：清空 KV 条目即恢复纯静态文件。
 */

import type { Env } from '../index';
import { getJSON, setJSON } from './kv';

export interface LlmsEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  keyword: string;
  addedAt: string;
}

const KV_KEY = 'geo:llms:entries';
const MAX_ENTRIES = 50;

export async function listLlmsEntries(env: Env): Promise<LlmsEntry[]> {
  return (await getJSON<LlmsEntry[]>(env.SEO_DATA, KV_KEY)) ?? [];
}

/** 发布文章后调用：按 slug 去重 upsert，新条目排最前，总量截断 */
export async function appendLlmsEntry(env: Env, entry: Omit<LlmsEntry, 'addedAt'>): Promise<void> {
  const entries = await listLlmsEntries(env);
  const next: LlmsEntry[] = [
    { ...entry, addedAt: new Date().toISOString() },
    ...entries.filter((e) => e.slug !== entry.slug),
  ].slice(0, MAX_ENTRIES);
  await setJSON(env.SEO_DATA, KV_KEY, next);
  console.log(`[llms] Entry upserted: ${entry.slug} (${next.length} total)`);
}

export async function removeLlmsEntry(env: Env, slug: string): Promise<void> {
  const entries = (await listLlmsEntries(env)).filter((e) => e.slug !== slug);
  await setJSON(env.SEO_DATA, KV_KEY, entries);
}

function escapeLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * 合并静态基底 + KV 条目。
 * 「Latest Guides」插在 `## FAQ` 段之前（FAQ 收尾是既定结构），
 * 无 FAQ 段则追加到末尾。KV 为空时原样返回基底。
 */
export function mergeLlmsTxt(baseText: string, entries: LlmsEntry[]): string {
  if (entries.length === 0) return baseText;

  const lines = entries.map((e) => {
    const summary = escapeLine(e.summary);
    return `- [${escapeLine(e.title)}](${e.url})${summary ? ` — ${summary}` : ''}`;
  });
  const section = `## Latest Guides (Auto-Updated)\n\n${lines.join('\n')}`;

  const trimmed = baseText.replace(/\s+$/, '');
  const faqIndex = trimmed.indexOf('\n## FAQ');
  if (faqIndex >= 0) {
    return `${trimmed.slice(0, faqIndex).replace(/\s+$/, '')}\n\n${section}\n${trimmed.slice(faqIndex)}\n`;
  }
  return `${trimmed}\n\n${section}\n`;
}

/** GET /llms.txt 处理器：读静态基底 + 合并 KV 条目 */
export async function renderLlmsTxt(env: Env): Promise<string> {
  const assetResp = await env.ASSETS.fetch('https://www.kestrelmetal.com/llms.txt');
  const base = assetResp.ok ? await assetResp.text() : '';
  if (!base) {
    console.error('[llms] Static base llms.txt missing from ASSETS');
    return '# KESTREL METAL\n';
  }
  const entries = await listLlmsEntries(env);
  return mergeLlmsTxt(base, entries);
}
