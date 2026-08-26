const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '..');

const apiFile = fs.readFileSync(path.join(SITE_DIR, 'admin', 'js', 'api.js'), 'utf-8');

// 真实文件列表（相对于 SITE_DIR）
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

// 提取所有 cover_image 值
const re = /cover_image:\s*['"`]([^'"`]+)['"`]/g;
let m;
const items = [];
while ((m = re.exec(apiFile)) !== null) {
  const raw = m[1];
  let normalized = raw.startsWith('/') ? raw.slice(1) : raw;
  // 常见错误：原种子里有类似 /images/blog-xxx 这种没有 blog/ 子目录的
  const exists = allFiles.has(normalized);
  let suggested = null;
  if (!exists) {
    const base = path.basename(normalized);
    // 尝试在 images/blog/ 下找同名
    const inBlog = 'images/blog/' + base;
    if (allFiles.has(inBlog)) suggested = inBlog;
    else {
      // 模糊匹配 basename（去扩展名）
      const nameNoExt = base.replace(/\.[^.]+$/, '').toLowerCase();
      for (const f of allFiles) {
        const fn = path.basename(f).replace(/\.[^.]+$/, '').toLowerCase();
        if (fn === nameNoExt) { suggested = f; break; }
      }
    }
  }
  items.push({ raw, normalized, exists, suggested });
}

console.log('Total cover_images:', items.length);
console.log('Existing:', items.filter(i => i.exists).length);
console.log('Missing:', items.filter(i => !i.exists).length);
console.log('');
items.filter(i => !i.exists).forEach(i => {
  console.log('MISSING: ' + i.raw);
  console.log('         normalized: ' + i.normalized);
  if (i.suggested) console.log('  -> SUGGEST: ' + i.suggested);
  else console.log('  -> NO MATCH');
  console.log('');
});
