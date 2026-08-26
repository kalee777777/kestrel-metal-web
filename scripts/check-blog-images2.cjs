const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '..');

const apiFile = fs.readFileSync(path.join(SITE_DIR, 'admin', 'js', 'api.js'), 'utf-8');

const allFiles = new Set();
function walk(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, base + e.name + '/'); }
    else { allFiles.add(base + e.name); }
  });
}
walk(path.join(SITE_DIR, 'images'), 'images/');

// 按行扫描，找到 cover_image 不存在的，并打印上下文（title 行）
const lines = apiFile.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/cover_image:\s*['"`]([^'"`]+)['"`]/);
  if (!m) continue;
  const raw = m[1];
  const normalized = raw.startsWith('/') ? raw.slice(1) : raw;
  if (allFiles.has(normalized)) continue;
  // 向上找 title 行
  let title = '';
  for (let j = i - 1; j >= 0 && j >= i - 6; j--) {
    const t = lines[j].match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (t) { title = t[1]; break; }
  }
  // 建议路径
  const base = path.basename(normalized);
  let suggested = null;
  const inBlog = 'images/blog/' + base;
  if (allFiles.has(inBlog)) suggested = inBlog;
  else {
    const nameNoExt = base.replace(/\.[^.]+$/, '').toLowerCase();
    for (const f of allFiles) {
      const fn = path.basename(f).replace(/\.[^.]+$/, '').toLowerCase();
      if (fn === nameNoExt) { suggested = f; break; }
    }
    if (!suggested) {
      // 去掉前缀 blog- 再试
      const withoutPrefix = nameNoExt.replace(/^blog-/, '');
      for (const f of allFiles) {
        const fn = path.basename(f).replace(/\.[^.]+$/, '').toLowerCase();
        if (fn === withoutPrefix) { suggested = f; break; }
      }
    }
  }
  console.log(`Line ${i+1} | cover_image: ${raw}`);
  console.log(`  title: ${title}`);
  console.log(`  suggest: ${suggested || 'NO MATCH'}`);
  console.log('');
}
