#!/usr/bin/env node
/**
 * GEO 补丁应用脚本(GitHub Actions 运行;也可本地手动执行)
 *
 * 输入:patches JSON 文件路径(geo-audit 产出、Admin 已批准的补丁数组)
 * 输出:把「Key Facts」块(定义句 + 数字事实点)插入对应 {slug}.html 的 </main> 前
 *      (无 main 则 </body> 前),与 Worker 端 lib/github.ts 的 patchToHtml 逻辑一致;
 *      已含 GEO reinforcement 标记或文件不存在的补丁自动跳过。
 *
 * 用法:node scripts/apply-geo-patches.mjs <patches.json>
 * 成功后向 stdout 输出 JSON:{ applied: [{slug,title,definition_sentence}], skipped: [...] }
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function patchToHtml(patch) {
  const facts = patch.fact_points
    .map((f) => `        <li><strong>${escapeHtml(f.value)}</strong> — ${escapeHtml(f.context)}</li>`)
    .join('\n');
  return `
  <!-- GEO reinforcement patch (auto-generated, reviewed in admin) -->
  <section class="geo-facts" style="max-width:1200px;margin:2rem auto;padding:1.5rem;border:1px solid #e5e7eb;border-radius:12px;">
    <h2 style="margin:0 0 0.75rem;font-size:1.25rem;">Key Facts</h2>
    <p style="margin:0 0 0.75rem;">${escapeHtml(patch.definition_sentence)}</p>
    <ul style="margin:0;padding-left:1.25rem;display:grid;gap:0.4rem;">
${facts}
    </ul>
  </section>
`;
}

function applyPatchToHtml(html, patch) {
  const block = patchToHtml(patch);
  if (html.includes('GEO reinforcement patch')) return html; // 幂等
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${block}  </main>`);
  return html.replace(/<\/body>/i, `${block}</body>`);
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('用法: node scripts/apply-geo-patches.mjs <patches.json>');
  process.exit(1);
}
const patches = JSON.parse(readFileSync(inputPath, 'utf8'));
if (!Array.isArray(patches)) {
  console.error('patches.json 必须是数组');
  process.exit(1);
}

const applied = [];
const skipped = [];
for (const patch of patches) {
  if (!patch?.slug || !patch.definition_sentence) {
    skipped.push({ slug: patch?.slug ?? '(invalid)', reason: 'missing fields' });
    continue;
  }
  const file = join(repoRoot, `${patch.slug}.html`);
  if (!existsSync(file)) {
    skipped.push({ slug: patch.slug, reason: 'file not found in repo' });
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const next = applyPatchToHtml(html, patch);
  if (next === html) {
    skipped.push({ slug: patch.slug, reason: 'already patched or no insertion point' });
    continue;
  }
  writeFileSync(file, next);
  applied.push({ slug: patch.slug, title: patch.title ?? patch.slug, definition_sentence: patch.definition_sentence });
}

console.log(JSON.stringify({ applied, skipped }, null, 2));
