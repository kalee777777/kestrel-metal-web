/**
 * GitHub PR 自动应用 GEO 补丁（C3）
 *
 * Admin 批准补丁后：新分支提交改动 → 开 PR 到 main → 人工在 GitHub 合并
 * → Cloudflare git 集成自动部署（README 1.3 既有链路）。
 *
 * 前置：wrangler secret put GH_TOKEN（fine-grained，仅 kalee777777/kestrel-metal-web
 * 仓库 Contents 读写 + Pull requests 读写）。
 */

import type { Env } from '../index';
import type { GeoPatch } from '../cron/geo-audit';

const REPO = 'kalee777777/kestrel-metal-web';
const API = 'https://api.github.com';

function authHeaders(env: Env): Record<string, string> {
  return {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function gh<T>(env: Env, path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...authHeaders(env), ...(init?.headers as Record<string, string> | undefined) },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return (await resp.json()) as T;
}

interface ContentsResponse {
  sha: string;
  content: string;
}

async function getFile(env: Env, path: string, ref: string): Promise<{ sha: string; text: string }> {
  const data = await gh<ContentsResponse>(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`);
  // GitHub 返回带换行的 base64；Worker 环境无 Node Buffer，用 atob 手动拼接
  const b64 = data.content.replace(/\n/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { sha: data.sha, text: new TextDecoder().decode(bytes) };
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 把单个补丁转成可插入页面的「Key Facts」HTML 块 */
export function patchToHtml(patch: GeoPatch): string {
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

function applyPatchToHtml(html: string, patch: GeoPatch): string {
  const block = patchToHtml(patch);
  if (html.includes('GEO reinforcement patch')) return html; // 幂等：已有补丁块不重复插
  // 主内容收尾处插入；无 main 则兜底 body 收尾
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${block}  </main>`);
  return html.replace(/<\/body>/i, `${block}</body>`);
}

export interface PrResult {
  prUrl: string;
  branch: string;
  appliedSlugs: string[];
}

/**
 * 把一批已批准补丁应用到仓库静态页，开一个 PR。
 * 每个 slug 对应仓库根下 `{slug}.html`。
 */
export async function openPatchPullRequest(env: Env, patches: GeoPatch[]): Promise<PrResult> {
  if (!env.GH_TOKEN) throw new Error('GH_TOKEN not configured (wrangler secret put GH_TOKEN)');
  if (patches.length === 0) throw new Error('No approved patches to apply');

  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const branch = `geo/patches-${dateTag}`;

  // 1. 基于 main 最新 commit 建分支（已存在则复用）
  const mainRef = await gh<{ object: { sha: string } }>(env, `/repos/${REPO}/git/ref/heads%2Fmain`);
  const baseSha = mainRef.object.sha;
  try {
    await gh(env, `/repos/${REPO}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });
  } catch (err) {
    if (!String(err).includes('422')) throw err; // 422 = ref already exists，复用
  }

  // 2. 逐页改文件提交
  const applied: string[] = [];
  for (const patch of patches) {
    const path = `${patch.slug}.html`;
    let file: { sha: string; text: string };
    try {
      file = await getFile(env, path, branch);
    } catch {
      console.warn(`[github] ${path} not found in repo, skipping`);
      continue;
    }
    const next = applyPatchToHtml(file.text, patch);
    if (next === file.text) {
      console.warn(`[github] ${path} already patched or no insertion point, skipping`);
      continue;
    }
    await gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `geo: reinforce ${path} (definition + key facts)`,
        content: toBase64(next),
        sha: file.sha,
        branch,
      }),
    });
    applied.push(patch.slug);
  }

  if (applied.length === 0) throw new Error('No files were modified (missing or already patched)');

  // 3. 开 PR
  const bodyLines = patches
    .filter((p) => applied.includes(p.slug))
    .map((p) => `- **${p.title}** (\`${p.slug}.html\`, GEO ${p.current_score}/100)\n  - ${p.definition_sentence}`);
  const pr = await gh<{ html_url: string }>(env, `/repos/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `geo: reinforce ${applied.length} low-scoring pages (${dateTag})`,
      head: branch,
      base: 'main',
      body: [
        'Automated GEO reinforcement patch (generated by geo-audit cron, approved in admin).',
        '',
        ...bodyLines,
        '',
        'Each page gets a "Key Facts" block (self-contained definition + numeric facts) inserted before `</main>`.',
        'Merge to deploy via Cloudflare git integration.',
      ].join('\n'),
    }),
  });

  console.log(`[github] PR opened: ${pr.html_url} (${applied.length} files)`);
  return { prUrl: pr.html_url, branch, appliedSlugs: applied };
}
