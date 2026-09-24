Router.register('/geo', async function (container) {
  let questions = [];
  let templates = [];
  let scores = [];
  let patches = [];
  let patchesLoaded = false;

  async function loadPatches() {
    try {
      patches = await API.get('/api/geo/patches');
      patchesLoaded = true;
      renderPatches();
    } catch (err) {
      // 服务端未部署该路由时静默(表格保持空态提示),不弹错误
      patchesLoaded = true;
      renderPatches();
    }
  }

  function renderPatches() {
    const tbody = document.getElementById('patchTable');
    if (!tbody) return;
    const esc = API.escapeHtml;
    if (!patches.length) {
      tbody.innerHTML = emptyRow(6, '暂无补丁。每月 1 号 geo-audit cron 自动生成低分页补丁,或点上方按钮手动触发');
      return;
    }
    const statusBadge = (p) => {
      if (p.status === 'applied') return `<span class="badge badge-success">已应用</span>${p.pr_url ? `<div style="font-size:0.75rem;margin-top:0.2rem"><a href="${esc(p.pr_url)}" target="_blank" rel="noopener">PR ↗</a></div>` : ''}`;
      if (p.status === 'approved') return '<span class="badge badge-info">已批准</span>';
      if (p.status === 'dismissed') return '<span class="badge badge-gray">已忽略</span>';
      return '<span class="badge badge-warning">待审核</span>';
    };
    tbody.innerHTML = patches.map((p, idx) => `
      <tr>
        <td>
          <strong>${esc(p.title || p.slug)}</strong>
          <div style="font-size:0.75rem;color:var(--text-secondary)"><a href="${esc(p.page_url)}" target="_blank" rel="noopener">${esc(p.slug)}.html ↗</a></div>
        </td>
        <td><span class="badge ${p.current_score >= 60 ? 'badge-warning' : 'badge-danger'}">${p.current_score}</span></td>
        <td style="max-width:320px">${esc((p.definition_sentence || '').slice(0, 120))}${(p.definition_sentence || '').length > 120 ? '...' : ''}</td>
        <td>${(p.fact_points || []).length}</td>
        <td>${statusBadge(p)}</td>
        <td>
          <div class="btn-group">
            ${p.status === 'pending' ? `<button class="btn btn-sm btn-success" onclick="approvePatch(${idx})">✓ 批准</button>` : ''}
            ${p.status === 'pending' ? `<button class="btn btn-sm" onclick="dismissPatch(${idx})">忽略</button>` : ''}
            <button class="btn btn-sm" onclick="editPatch(${idx})">编辑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function loadQuestions() {
    try {
      // GEO 问答与「FAQ 管理」共享 faqs 集合(单一数据源),站点 faq.html 经 cms-sync.js 渲染
      questions = await API.get('/api/faq/all');
      questions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      renderQuestions();
    } catch (err) {
      API.toast('加载 GEO 问答失败: ' + err.message, 'error');
    }
  }

  async function loadTemplates() {
    try {
      templates = await API.get('/api/geo/schema-templates');
      renderTemplates();
    } catch (err) {
      API.toast('加载 Schema 模板失败: ' + err.message, 'error');
    }
  }

  async function loadScores() {
    try {
      scores = await API.get('/api/geo/scores');
      scores.sort((a, b) => (a.score || 0) - (b.score || 0)); // 低分置顶,优先改进
      renderScores();
    } catch (err) {
      API.toast('加载 GEO 评分失败: ' + err.message, 'error');
    }
  }

  function emptyRow(cols, text) {
    return `<tr><td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--text-secondary)">${text}</td></tr>`;
  }

  function renderQuestions() {
    const tbody = document.getElementById('geoQuestionTable');
    if (!questions.length) {
      tbody.innerHTML = emptyRow(7, '暂无 GEO 问答,点击「+ 新增 GEO 问答」录入,或到「FAQ 管理」查看同一数据源');
      return;
    }
    const esc = API.escapeHtml;
    tbody.innerHTML = questions.map((q, idx) => `
      <tr>
        <td>${q.id}</td>
        <td>${esc(q.category || '-')}</td>
        <td>${esc(q.language || '-')}</td>
        <td>${esc((q.question || '').slice(0, 50))}${(q.question || '').length > 50 ? '...' : ''}</td>
        <td>${q.sort_order || 0}</td>
        <td><span class="badge ${q.is_active ? 'badge-success' : 'badge-danger'}">${q.is_active ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editGeoQuestion(${idx})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteGeoQuestion(${idx})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderTemplates() {
    const tbody = document.getElementById('templateTable');
    if (!templates.length) {
      tbody.innerHTML = emptyRow(6, '暂无 Schema 模板,点击「+ 新增 Schema 模板」录入(保存时自动校验 JSON)');
      return;
    }
    const esc = API.escapeHtml;
    tbody.innerHTML = templates.map((t, idx) => `
      <tr>
        <td>${t.id}</td>
        <td>${esc(t.type || '-')}</td>
        <td>${esc(t.name || '-')}</td>
        <td>${t.jsonld_template ? esc(t.jsonld_template.slice(0, 50)) + '...' : '-'}</td>
        <td><span class="badge ${t.is_active ? 'badge-success' : 'badge-danger'}">${t.is_active ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editTemplate(${idx})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${idx})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderScores() {
    const tbody = document.getElementById('scoreTable');
    if (!scores.length) {
      tbody.innerHTML = emptyRow(6, '暂无评分数据,点击「从 sitemap 拉取并全站评分」基于页面真实内容计算');
      return;
    }
    const esc = API.escapeHtml;
    tbody.innerHTML = scores.map((s, idx) => {
      const href = API.safeUrl(s.page_url);
      const link = href
        ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(s.page_url)}</a>`
        : esc(s.page_url);
      return `
      <tr>
        <td>${s.title ? `<strong>${esc(s.title)}</strong><div style="font-size:0.75rem;color:var(--text-secondary)">` : ''}${link}${s.title ? '</div>' : ''}<div style="font-size:0.75rem;color:var(--text-secondary)">评分于 ${s.scored_at ? esc(new Date(s.scored_at).toLocaleString('zh-CN')) : '历史数据'}</div></td>
        <td><span class="badge ${s.score >= 80 ? 'badge-success' : s.score >= 60 ? 'badge-warning' : 'badge-danger'}">${s.score}</span></td>
        <td>${s.schema_completeness}%</td>
        <td>${s.citation_friendliness}%</td>
        <td>${s.fact_density}%</td>
        <td><button class="btn btn-sm" onclick="generateScore(${idx})">重新评分</button></td>
      </tr>`;
    }).join('');
  }

  window.editGeoQuestion = async (idx) => {
    const q = questions[idx];
    if (!q) return;
    document.getElementById('geoQuestionForm').reset();
    document.getElementById('geoQuestionForm').id.value = q.id;
    document.getElementById('geoQuestionForm').question.value = q.question;
    document.getElementById('geoQuestionForm').answer.value = q.answer;
    document.getElementById('geoQuestionForm').category.value = q.category || '';
    document.getElementById('geoQuestionForm').language.value = q.language;
    document.getElementById('geoQuestionForm').sort_order.value = q.sort_order || 0;
    document.getElementById('geoQuestionForm').is_active.checked = q.is_active;
    document.getElementById('geoModalTitle').textContent = '编辑 GEO 问题';
    document.getElementById('geoModal').classList.add('show');
  };

  window.deleteGeoQuestion = async (idx) => {
    const q = questions[idx];
    if (!q) return;
    if (!confirm('确定要删除这条问答吗?删除后 FAQ 管理与站点 FAQ 页同步移除。')) return;
    try {
      await API.delete(`/api/faq/${q.id}`);
      API.toast('删除成功', 'success');
      await loadQuestions();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.editTemplate = async (idx) => {
    const t = templates[idx];
    if (!t) return;
    const form = document.getElementById('templateForm');
    form.reset();
    form.id.value = t.id;
    form.type.value = t.type || '';
    form.name.value = t.name || '';
    form.jsonld_template.value = t.jsonld_template || '';
    form.is_active.checked = t.is_active !== false;
    document.getElementById('templateModalTitle').textContent = '编辑 Schema 模板';
    document.getElementById('templateModal').classList.add('show');
  };

  window.deleteTemplate = async (idx) => {
    const t = templates[idx];
    if (!t) return;
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await API.delete(`/api/geo/schema-templates/${t.id}`);
      API.toast('模板删除成功', 'success');
      await loadTemplates();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddGeoQuestion = () => {
    document.getElementById('geoQuestionForm').reset();
    document.getElementById('geoQuestionForm').id.value = '';
    document.getElementById('geoModalTitle').textContent = '新增 GEO 问题';
    document.getElementById('geoModal').classList.add('show');
  };

  window.openAddTemplate = () => {
    const form = document.getElementById('templateForm');
    form.reset();
    form.id.value = '';
    form.is_active.checked = true;
    document.getElementById('templateModalTitle').textContent = '新增 Schema 模板';
    document.getElementById('templateModal').classList.add('show');
  };

  window.closeGeoModal = () => {
    document.getElementById('geoModal').classList.remove('show');
  };

  window.closeTemplateModal = () => {
    document.getElementById('templateModal').classList.remove('show');
  };

  // ==================== GEO 真实评分 ====================
  // 评分模型:JSON-LD 类型覆盖 40% + 可引用结构 30% + 事实密度 30%,全部基于页面真实 HTML
  const SCORE_BATCH = 8;

  async function fetchSitemapUrls() {
    const resp = await fetch('/sitemap.xml');
    if (!resp.ok) throw new Error('无法读取 sitemap.xml (HTTP ' + resp.status + ')');
    const text = await resp.text();
    const locs = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
    // sitemap 的 <loc> 是生产域名,统一取 pathname 后在本域抓取评分
    const paths = [...new Set(locs.map(l => { try { return new URL(l, location.origin).pathname; } catch { return null; } }).filter(Boolean))];
    return paths.filter(p => p === '/' || /\.html?$/i.test(p));
  }

  function computeScore(html) {
    const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
    const text = noScript.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');

    // 1) Schema 完整性:JSON-LD 块解析 + 相关类型覆盖
    const blocks = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    const types = new Set();
    let parseFail = 0;
    blocks.forEach(src => {
      try {
        const data = JSON.parse(src);
        (Array.isArray(data) ? data : [data]).forEach(d => { if (d && d['@type']) types.add(String(d['@type'])); });
      } catch { parseFail++; }
    });
    const RELEVANT = ['Organization', 'WebSite', 'Product', 'Article', 'TechArticle', 'FAQPage', 'BreadcrumbList', 'Service', 'LocalBusiness'];
    const relevant = RELEVANT.filter(t => types.has(t)).length;
    let schema = blocks.length ? Math.min(100, 40 + relevant * 15) : 0;
    if (parseFail) schema = Math.min(schema, 60);

    // 2) 引用友好度:AI 可直接引用的页面结构
    let citation = 0;
    if (/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)) citation += 15;
    if (/\b(?:is|are)\s+(?:a|an|the)\s+[a-z]/i.test(text)) citation += 30; // 自闭环定义句
    if ((html.match(/<h[23][\s>]/gi) || []).length >= 2) citation += 20;   // 清晰的小标题结构
    if (/class=["'][^"']*faq/i.test(html) || /<details[\s>]/i.test(html)) citation += 15;
    if (/<link[^>]+rel=["']canonical["']/i.test(html)) citation += 10;
    if (/<(?:ul|ol)[\s>]/i.test(html)) citation += 10;                      // 列表化信息

    // 3) 事实密度:带单位的数字 / 每千字符(规格、参数、数据点)
    const factRe = /\d+(?:\.\d+)?\s?(?:%|mm|cm|km|kg|mpa|psi|mesh|gauge|awg|µm|micron|kw|mw|kn|g\/m²?|m[23²]|inch(?:es)?|ft|years?)\b/gi;
    const facts = (text.match(factRe) || []).length;
    const kb = Math.max(1, text.length / 1024);
    const density = Math.min(100, Math.round((facts / kb) * 25));

    const score = Math.round(schema * 0.4 + citation * 0.3 + density * 0.3);
    return { score, schema_completeness: Math.round(schema), citation_friendliness: Math.round(citation), fact_density: density };
  }

  async function scorePage(pageUrl) {
    const resp = await fetch(pageUrl, { credentials: 'omit' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const html = await resp.text();
    const result = computeScore(html);
    return API.post('/api/geo/scores', { page_url: pageUrl, ...result });
  }

  window.generateScore = async (idx) => {
    const s = scores[idx];
    if (!s) return;
    try {
      await scorePage(s.page_url);
      API.toast('已重新评分: ' + s.page_url, 'success');
      await loadScores();
    } catch (err) {
      API.toast('评分失败: ' + err.message, 'error');
    }
  };

  window.scoreAllPages = async () => {
    const btn = document.getElementById('scoreAllBtn');
    if (btn && btn.disabled) return;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 评分中...'; }
    try {
      const urls = await fetchSitemapUrls();
      if (!urls.length) { API.toast('sitemap 中未解析到页面 URL', 'error'); return; }
      let failed = 0, firstErr = null;
      for (let i = 0; i < urls.length; i += SCORE_BATCH) {
        const batch = urls.slice(i, i + SCORE_BATCH);
        await Promise.all(batch.map(async u => {
          try { await scorePage(u); } catch (e) { failed++; if (!firstErr) firstErr = e.message; }
        }));
        if (btn) btn.textContent = `⏳ 评分中 ${Math.min(i + SCORE_BATCH, urls.length)}/${urls.length}...`;
      }
      API.toast(`全站评分完成: ${urls.length - failed} 成功${failed ? ',' + failed + ' 失败' + (firstErr ? '(如: ' + firstErr + ')' : '') : ''}`, failed ? 'warning' : 'success');
      await loadScores();
    } catch (err) {
      API.toast('全站评分失败: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🔍 从 sitemap 拉取并全站评分'; }
    }
  };

  // 独立的 GEO 本地存储工具
  function geoStorage(key, value) {
    const fullKey = 'km_geo_' + key;
    if (arguments.length === 1) {
      try {
        const raw = localStorage.getItem(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    }
    if (value === null || value === undefined) {
      localStorage.removeItem(fullKey);
    } else {
      try { localStorage.setItem(fullKey, JSON.stringify(value)); } catch {}
    }
  }

  // robots.txt 按规范解析:连续 user-agent 行合并为同组;bot 未显式列出时回落到 * 组判定
  function checkRobotsBots(robotsText, bots) {
    const groups = [];
    let current = null, lastWasUA = false;
    robotsText.split(/\r?\n/).forEach(raw => {
      const line = raw.split('#')[0].trim();
      if (!line) return;
      const m = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
      if (!m) return;
      const key = m[1].toLowerCase(), val = m[2].trim();
      if (key === 'user-agent') {
        const ua = val.toLowerCase();
        if (lastWasUA && current) current.uas.push(ua);
        else { current = { uas: [ua], allow: [], disallow: [] }; groups.push(current); }
        lastWasUA = true;
      } else {
        if (current) (key === 'allow' ? current.allow : current.disallow).push(val);
        lastWasUA = false;
      }
    });
    const findGroup = (name) => groups.find(g => g.uas.includes(name.toLowerCase()));
    return bots.map(bot => {
      const explicit = findGroup(bot);
      const group = explicit || findGroup('*');
      if (!group) return { bot, allowed: true, source: '无匹配组,默认允许' };
      const blanketBlock = group.disallow.some(d => d === '/' || d === '/*');
      return { bot, allowed: !blanketBlock, source: explicit ? '显式组' : '* 组回落' };
    });
  }

  function renderAuditHistory() {
    const el = document.getElementById('auditHistory');
    if (!el) return;
    const baseline = geoStorage('visibility_baseline');
    const runs = (baseline && baseline.results) || [];
    if (!runs.length) {
      el.innerHTML = '<p style="font-size:0.85rem;color:var(--text-secondary)">暂无历史基线,运行一次诊断后自动记录(本地保留最近 12 次)</p>';
      return;
    }
    el.innerHTML = `
      <h4 style="margin:0 0 0.5rem">📈 诊断历史 · 最近 ${runs.length} 次</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>时间</th><th>通过</th><th>警告</th><th>失败</th><th>需关注项</th></tr></thead>
        <tbody>
        ${runs.slice().reverse().map(r => {
          const counts = r.checks.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
          const bad = r.checks.filter(c => c.status !== 'pass').map(c => c.name);
          return `<tr><td>${API.escapeHtml(new Date(r.date).toLocaleString('zh-CN'))}</td><td>${counts.pass || 0}</td><td>${counts.warn || 0}</td><td>${(counts.fail || 0) + (counts.error || 0)}</td><td>${bad.length ? API.escapeHtml(bad.join(', ')) : '-'}</td></tr>`;
        }).join('')}
        </tbody>
      </table></div>`;
  }

  // ==================== 基线验证(Prompt 管理 + 引用记录)====================
  const PROMPTS_KEY = 'km_geo_prompts';
  const CITATIONS_KEY = 'km_geo_citations';
  const DEFAULT_PROMPTS = [
    'Recommend a China wire mesh fence manufacturer with NATO-22 razor wire and 500MW solar farm project experience',
    '3D wire panel fence vs chain link for Australian solar perimeter, who supplies both?',
    'Galvanized vs PVC coated chain link fence in saltwater, which China factory has comparison data?'
  ];
  function getPrompts() {
    try {
      const v = JSON.parse(localStorage.getItem(PROMPTS_KEY) || 'null');
      if (Array.isArray(v)) return v;
    } catch {}
    return DEFAULT_PROMPTS.slice();
  }
  const setPrompts = (list) => localStorage.setItem(PROMPTS_KEY, JSON.stringify(list));
  function getCitations() {
    try {
      const v = JSON.parse(localStorage.getItem(CITATIONS_KEY) || 'null');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  }
  const setCitations = (list) => localStorage.setItem(CITATIONS_KEY, JSON.stringify(list));

  function renderBaseline() {
    const esc = API.escapeHtml;
    const prompts = getPrompts();
    const promptBody = document.getElementById('promptTable');
    if (promptBody) {
      promptBody.innerHTML = prompts.length ? prompts.map((p, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td style="max-width:520px">${esc(p)}</td>
          <td><div class="btn-group">
            <button class="btn btn-sm" onclick="openRecordCitation(${idx})">记录结果</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBaselinePrompt(${idx})">删除</button>
          </div></td>
        </tr>`).join('') : emptyRow(3, '暂无基线 Prompt,在上方输入框添加');
    }

    const cites = getCitations().slice().reverse(); // 最新在前
    const byEngine = {};
    cites.forEach(c => {
      byEngine[c.engine] = byEngine[c.engine] || { yes: 0, total: 0 };
      byEngine[c.engine].total++;
      if (c.cited === 'yes') byEngine[c.engine].yes++;
    });
    const summary = document.getElementById('citationSummary');
    if (summary) summary.textContent = cites.length
      ? `共 ${cites.length} 次测试 — ` + Object.entries(byEngine).map(([e, s]) => `${e}: ${s.yes}/${s.total} 引用`).join(' / ')
      : '暂无测试记录';
    const citeBody = document.getElementById('citationTable');
    if (citeBody) {
      citeBody.innerHTML = cites.length ? cites.map((c, i) => `
        <tr>
          <td>${esc(c.date || '-')}</td>
          <td style="max-width:300px">${esc((getPrompts()[c.prompt_idx] || c.prompt_text || '').slice(0, 60))}</td>
          <td>${esc(c.engine || '-')}</td>
          <td><span class="badge ${c.cited === 'yes' ? 'badge-success' : 'badge-danger'}">${c.cited === 'yes' ? '已引用' : '未引用'}</span></td>
          <td>${c.rank ? '#' + esc(c.rank) : '-'}</td>
          <td>${esc(c.note || '-')}</td>
          <td><button class="btn btn-sm btn-danger" onclick="deleteCitation(${i})">删除</button></td>
        </tr>`).join('') : emptyRow(7, '暂无记录,点击 Prompt 行「记录结果」开始测试');
    }
  }

  window.addBaselinePrompt = () => {
    const input = document.getElementById('newPromptInput');
    const text = (input.value || '').trim();
    if (!text) { API.toast('请输入 Prompt 内容', 'error'); return; }
    const prompts = getPrompts();
    if (prompts.includes(text)) { API.toast('该 Prompt 已存在', 'error'); return; }
    prompts.push(text);
    setPrompts(prompts);
    input.value = '';
    renderBaseline();
    API.toast('Prompt 已添加', 'success');
  };

  window.deleteBaselinePrompt = (idx) => {
    if (!confirm('删除这条 Prompt?(已有引用记录保留)')) return;
    const prompts = getPrompts();
    prompts.splice(idx, 1);
    setPrompts(prompts);
    renderBaseline();
  };

  window.openRecordCitation = (idx) => {
    const form = document.getElementById('citationForm');
    form.reset();
    form.prompt_idx.value = idx;
    form.prompt_text.value = getPrompts()[idx] || '';
    form.date.value = new Date().toISOString().slice(0, 10);
    document.getElementById('citationModal').classList.add('show');
  };

  window.closeCitationModal = () => document.getElementById('citationModal').classList.remove('show');

  window.deleteCitation = (i) => {
    if (!confirm('删除这条记录?')) return;
    const cites = getCitations().slice().reverse();
    cites.splice(i, 1);
    setCitations(cites.reverse());
    renderBaseline();
  };

  // ==================== 全站 JSON-LD 校验 / llms.txt / sitemap 查看器 ====================
  window.validateJsonLd = async () => {
    const btn = document.getElementById('jsonldBtn');
    const panel = document.getElementById('jsonldResult');
    if (btn && btn.disabled) return;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 校验中...'; }
    panel.innerHTML = '<div class="audit-loading">正在抓取页面并解析 JSON-LD...</div>';
    try {
      const urls = await fetchSitemapUrls();
      const stats = { total: urls.length, noSchema: [], parseErrors: [], typeCounts: {} };
      for (let i = 0; i < urls.length; i += SCORE_BATCH) {
        const batch = urls.slice(i, i + SCORE_BATCH);
        await Promise.all(batch.map(async u => {
          try {
            const resp = await fetch(u, { credentials: 'omit' });
            if (!resp.ok) return;
            const html = await resp.text();
            const blocks = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
            if (!blocks.length) { stats.noSchema.push(u); return; }
            blocks.forEach(m => {
              try {
                const d = JSON.parse(m[1]);
                (Array.isArray(d) ? d : [d]).forEach(x => { if (x && x['@type']) stats.typeCounts[x['@type']] = (stats.typeCounts[x['@type']] || 0) + 1; });
              } catch { stats.parseErrors.push(u); }
            });
          } catch {}
        }));
        if (btn) btn.textContent = `⏳ 校验中 ${Math.min(i + SCORE_BATCH, urls.length)}/${urls.length}...`;
      }
      const esc = API.escapeHtml;
      const types = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1]);
      panel.innerHTML = `
        <div class="audit-header"><strong>全站 JSON-LD 校验 · ${new Date().toLocaleString('zh-CN')}</strong><span class="audit-date">${stats.total} 页</span></div>
        <div class="audit-checks">
          <div class="audit-check audit-${stats.noSchema.length ? 'warn' : 'pass'}"><span class="audit-icon">${stats.noSchema.length ? '⚠️' : '✅'}</span><div class="audit-info"><span class="audit-name">无 Schema 页面(${stats.noSchema.length})</span><span class="audit-detail">${stats.noSchema.length ? esc(stats.noSchema.slice(0, 8).join(', ')) + (stats.noSchema.length > 8 ? ` 等 ${stats.noSchema.length} 页` : '') : '全部页面均有 JSON-LD'}</span></div></div>
          <div class="audit-check audit-${stats.parseErrors.length ? 'fail' : 'pass'}"><span class="audit-icon">${stats.parseErrors.length ? '❌' : '✅'}</span><div class="audit-info"><span class="audit-name">JSON 解析失败(${stats.parseErrors.length})</span><span class="audit-detail">${stats.parseErrors.length ? esc(stats.parseErrors.slice(0, 8).join(', ')) + (stats.parseErrors.length > 8 ? ` 等 ${stats.parseErrors.length} 页` : '') : '全部 JSON-LD 块解析通过'}</span></div></div>
          <div class="audit-check audit-pass"><span class="audit-icon">📊</span><div class="audit-info"><span class="audit-name">类型分布</span><span class="audit-detail">${esc(types.map(([t, n]) => `${t}×${n}`).join(', ') || '无')}</span></div></div>
        </div>`;
    } catch (err) {
      panel.innerHTML = `<div class="audit-loading">校验失败: ${API.escapeHtml(err.message)}</div>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🧩 全站 JSON-LD 校验'; }
    }
  };

  window.viewLlmsTxt = async () => {
    try {
      const resp = await fetch('/llms.txt');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      document.getElementById('llmsEditor').value = text;
      document.getElementById('llmsStats').textContent = `${text.split('\n').length} 行 / ${(text.match(/^##\s+/gm) || []).length} 个章节 / ${(text.match(/^Q:\s/gm) || []).length} 条 FAQ — 可直接编辑,改完点「下载」替换站点根目录 llms.txt`;
      document.getElementById('llmsModal').classList.add('show');
    } catch (err) {
      API.toast('读取 llms.txt 失败: ' + err.message, 'error');
    }
  };

  window.closeLlmsModal = () => document.getElementById('llmsModal').classList.remove('show');

  window.downloadLlmsTxt = () => {
    const text = document.getElementById('llmsEditor').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llms.txt';
    a.click();
    URL.revokeObjectURL(url);
    API.toast('llms.txt 已下载,替换 kestrel-site/llms.txt 后重新部署', 'success');
  };

  window.viewSitemap = async () => {
    try {
      const urls = await fetchSitemapUrls();
      const esc = API.escapeHtml;
      document.getElementById('sitemapBody').innerHTML = urls.map(u => `<tr><td><a href="${esc(API.safeUrl(u) || u)}" target="_blank" rel="noopener">${esc(u)}</a></td></tr>`).join('');
      document.getElementById('sitemapCount').textContent = `共 ${urls.length} 个 URL`;
      document.getElementById('sitemapSearch').value = '';
      document.getElementById('sitemapModal').classList.add('show');
    } catch (err) {
      API.toast('读取 sitemap.xml 失败: ' + err.message, 'error');
    }
  };

  window.filterSitemap = () => {
    const q = document.getElementById('sitemapSearch').value.trim().toLowerCase();
    [...document.querySelectorAll('#sitemapBody tr')].forEach(tr => {
      tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.closeSitemapModal = () => document.getElementById('sitemapModal').classList.remove('show');

  window.runGeoAudit = async () => {
    const resultEl = document.getElementById('auditResult');
    resultEl.innerHTML = '<div class="audit-loading">正在检查 GEO 配置...</div>';

    const checks = [];

    try {
      const robotsResp = await fetch('/robots.txt');
      const robotsText = await robotsResp.text();
      const aiBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot', 'Google-Extended', 'Bingbot'];
      const verdicts = checkRobotsBots(robotsText, aiBots);
      const aiBotsAllowed = verdicts.filter(v => v.allowed);
      const hasContentSignal = robotsText.includes('ai-input=yes');
      const hasAiTrainNo = robotsText.includes('ai-train=no');

      checks.push({
        name: 'AI 爬虫放行',
        status: aiBotsAllowed.length >= 4 ? 'pass' : 'warn',
        detail: `已放行 ${aiBotsAllowed.length}/${verdicts.length} 个 AI 爬虫 — ` + verdicts.map(v => `${v.bot}: ${v.allowed ? '允许' : '禁止'}(${v.source})`).join('; ')
      });
      checks.push({
        name: 'Content-Signal',
        status: hasContentSignal ? 'pass' : 'warn',
        detail: hasContentSignal ? '已设置 ai-input=yes，允许 AI 实时引用(RAG)' : '未检测到 ai-input=yes，AI 引用权限不明'
      });
      checks.push({
        name: 'ai-train 合规',
        status: hasAiTrainNo ? 'pass' : 'warn',
        detail: hasAiTrainNo ? '已设置 ai-train=no，版权合规(禁止训练但可引用)' : '未设置 ai-train=no'
      });
    } catch (err) {
      checks.push({ name: 'robots.txt', status: 'error', detail: '无法读取: ' + err.message });
    }

    try {
      const llmsResp = await fetch('/llms.txt');
      const exists = llmsResp.ok;
      let llmsDetail = 'llms.txt 已部署，AI 可读取公司事实';
      if (exists) {
        try {
          const text = await llmsResp.text();
          const sections = (text.match(/^##\s+/gm) || []).length;
          const faqs = (text.match(/^Q:\s/gm) || []).length;
          llmsDetail = `llms.txt 已部署，含 ${sections} 个章节、${faqs} 条 FAQ，AI 可直接引用`;
        } catch {}
      }
      checks.push({
        name: 'llms.txt',
        status: exists ? 'pass' : 'fail',
        detail: exists ? llmsDetail : 'llms.txt 不存在，AI 无法快速了解公司信息'
      });
    } catch {
      checks.push({ name: 'llms.txt', status: 'fail', detail: 'llms.txt 不存在' });
    }

    try {
      const sitemapResp = await fetch('/sitemap.xml');
      checks.push({
        name: 'sitemap.xml',
        status: sitemapResp.ok ? 'pass' : 'warn',
        detail: sitemapResp.ok ? '站点地图已就绪' : '未找到 sitemap.xml'
      });
    } catch {
      checks.push({ name: 'sitemap.xml', status: 'warn', detail: '未检测到 sitemap.xml' });
    }

    // 保存历史基线
    try {
      const baseline = geoStorage('visibility_baseline') || { results: [] };
      baseline.results.push({ date: new Date().toISOString(), checks: JSON.parse(JSON.stringify(checks)) });
      if (baseline.results.length > 12) baseline.results = baseline.results.slice(-12);
      baseline.lastCheck = baseline.results[baseline.results.length - 1].date;
      geoStorage('visibility_baseline', baseline);
    } catch {}
    renderAuditHistory();

    const icons = { pass: '✅', warn: '⚠️', fail: '❌', error: '🚫' };
    resultEl.innerHTML = `
      <style>
        .audit-loading { padding:2rem; text-align:center; color:var(--text-secondary); }
        .audit-header { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.2rem; background:var(--surface-alt); border-radius:8px 8px 0 0; border-bottom:1px solid var(--border); font-size:1rem; }
        .audit-date { font-size:0.8rem; color:var(--text-secondary); }
        .audit-checks { display:grid; gap:0; }
        .audit-check { display:flex; gap:0.8rem; padding:0.9rem 1.2rem; align-items:flex-start; border-bottom:1px solid var(--border); }
        .audit-check:last-child { border-bottom:none; }
        .audit-icon { font-size:1.1rem; flex-shrink:0; margin-top:2px; }
        .audit-info { flex:1; display:flex; flex-direction:column; gap:0.2rem; }
        .audit-name { font-weight:600; font-size:0.9rem; }
        .audit-detail { font-size:0.82rem; color:var(--text-secondary); }
        .audit-pass { background:rgba(34,197,94,0.04); }
        .audit-warn { background:rgba(234,179,8,0.05); }
        .audit-fail { background:rgba(239,68,68,0.05); }
        .audit-error { background:rgba(239,68,68,0.08); }
        .audit-checks { background:#fff; border-radius:8px; border:1px solid var(--border); overflow:hidden; }
      </style>
      <div class="audit-header">
        <strong>GEO 诊断结果 · GEO Diagnostic Report</strong>
        <span class="audit-date">${new Date().toLocaleString('zh-CN')}</span>
      </div>
      <div class="audit-checks">
        ${checks.map(c => `
          <div class="audit-check audit-${c.status}">
            <span class="audit-icon">${icons[c.status]}</span>
            <div class="audit-info">
              <span class="audit-name">${c.name}</span>
              <span class="audit-detail">${c.detail}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="audit-actions" style="margin-top:1rem;padding:1rem 1.2rem;background:var(--surface-alt);border-radius:8px;border:1px solid var(--border)">
        <h4 style="margin-bottom:0.5rem">📋 基线测试 · Baseline Prompts(共 ${getPrompts().length} 条)</h4>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem">在 Perplexity 和 ChatGPT(Search Enabled) 中测试以下采购问题,然后到「基线验证」标签记录答案是否引用 kestrelmetal.com:</p>
        <ol style="font-size:0.85rem;color:var(--text-secondary);padding-left:1.5rem;line-height:1.6">
          ${getPrompts().map(p => `<li style="margin-bottom:0.2rem">"${API.escapeHtml(p)}"</li>`).join('')}
        </ol>
        <button class="btn btn-sm" onclick="showGeoTab('baseline')">前往基线验证 →</button>
      </div>
    `;
  };

  window.exportGeoData = () => {
    const data = {
      questions: questions,
      templates: templates,
      scores: scores,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kestral-metal-geo-data-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    API.toast('GEO 数据已导出', 'success');
  };

  // 提取 JSON-LD 模板中的 {placeholder} 占位符
  function extractPlaceholders(str) {
    return [...new Set((str.match(/\{([a-zA-Z0-9_]+)\}/g) || []).map(s => s.slice(1, -1)))];
  }

  // 导出 Schema 模板,供 perf-scripts/static-jsonld.js 等生成器作为类型扩展输入
  window.exportGeoTemplates = () => {
    const out = templates.map(t => {
      let jsonld = null, parse_error = null;
      try { jsonld = JSON.parse(t.jsonld_template); } catch (e) { parse_error = e.message; }
      const item = {
        type: t.type,
        name: t.name,
        is_active: t.is_active,
        placeholders: extractPlaceholders(t.jsonld_template || ''),
        jsonld: jsonld
      };
      if (parse_error) { item.parse_error = parse_error; item.jsonld_template_raw = t.jsonld_template; }
      return item;
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geo-schema-templates-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    const invalid = out.filter(i => i.parse_error).length;
    API.toast(invalid ? `已导出 ${out.length} 条模板,其中 ${invalid} 条 JSON 非法(已标记 parse_error)` : `已导出 ${out.length} 条模板`, invalid ? 'error' : 'success');
  };

  window.loadPatchesBtn = async () => {
    patchesLoaded = false;
    await loadPatches();
    API.toast('补丁列表已刷新', 'success');
  };

  window.approvePatch = async (idx) => {
    const p = patches[idx];
    if (!p) return;
    try {
      await API.put(`/api/geo/patches/${encodeURIComponent(p.slug)}`, { status: 'approved' });
      API.toast('已批准,可点「合并已批准补丁并开 PR」', 'success');
      await loadPatches();
    } catch (err) {
      API.toast('批准失败: ' + err.message, 'error');
    }
  };

  window.dismissPatch = async (idx) => {
    const p = patches[idx];
    if (!p || !confirm('忽略这个页面的补丁?(下轮审计可能重新生成)')) return;
    try {
      await API.put(`/api/geo/patches/${encodeURIComponent(p.slug)}`, { status: 'dismissed' });
      await loadPatches();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  };

  window.editPatch = (idx) => {
    const p = patches[idx];
    if (!p) return;
    const form = document.getElementById('patchForm');
    form.slug.value = p.slug;
    form.definition_sentence.value = p.definition_sentence || '';
    form.fact_points.value = JSON.stringify(p.fact_points || [], null, 2);
    form.dataset.idx = idx;
    document.getElementById('patchModal').classList.add('show');
  };

  window.closePatchModal = () => document.getElementById('patchModal').classList.remove('show');

  window.openPatchPr = async () => {
    const approved = patches.filter(p => p.status === 'approved');
    if (!approved.length) {
      API.toast('没有已批准的补丁——先在列表里点「✓ 批准」', 'error');
      return;
    }
    if (!confirm(`将为 ${approved.length} 个页面开 PR(合并后自动部署)。继续?`)) return;
    try {
      const result = await API.post('/api/geo/patches/pr');
      API.toast(`PR 已创建,去 GitHub 合并即可部署`, 'success');
      if (result.prUrl) window.open(result.prUrl, '_blank');
      await loadPatches();
    } catch (err) {
      API.toast('开 PR 失败: ' + err.message, 'error');
    }
  };

  window.runGeoAuditCron = async () => {
    if (!confirm('立即全站审计(评分 + 生成低分页补丁)。服务端按分片执行,这里会自动连续跑完所有分片(约 1-3 分钟)。继续?')) return;
    let adminToken = localStorage.getItem('km_admin_token');
    let round = 0;
    try {
      let result = null;
      // 服务端每次调用只处理一个分片(Workers 子请求上限),客户端循环跑到完成
      while (round < 25) {
        round++;
        const resp = await fetch('/api/trigger/geo-audit', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data.error || ('HTTP ' + resp.status));
        result = data;
        if (data.done) break;
        await new Promise(r => setTimeout(r, 1500));
      }
      API.toast('审计完成: ' + (result ? (result.summary || '') : ''), 'success');
      await loadPatches();
      await loadScores();
    } catch (err) {
      API.toast('审计中断(已完成分片保留,可重试续跑): ' + err.message, 'error');
    }
  };

  let activeTab = 'questions';
  window.showGeoTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.geo-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.geo-tab-content').forEach(c => c.classList.toggle('hidden', c.id !== tab + 'Tab'));
    if (tab === 'patches' && !patchesLoaded) loadPatches();
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>GEO 优化</h1>
    </div>
    <div class="tabs">
      <button class="geo-tab-btn active" data-tab="questions" onclick="showGeoTab('questions')">GEO 问答</button>
      <button class="geo-tab-btn" data-tab="templates" onclick="showGeoTab('templates')">Schema 模板</button>
      <button class="geo-tab-btn" data-tab="scores" onclick="showGeoTab('scores')">GEO 评分</button>
      <button class="geo-tab-btn" data-tab="patches" onclick="showGeoTab('patches')">GEO 补强</button>
      <button class="geo-tab-btn" data-tab="monitor" onclick="showGeoTab('monitor')">GEO 诊断</button>
      <button class="geo-tab-btn" data-tab="baseline" onclick="showGeoTab('baseline')">基线验证</button>
    </div>

    <div id="questionsTab" class="geo-tab-content">
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
        ℹ️ 本列表与「FAQ 管理」共享同一数据源(faqs 集合),两边编辑实时同步;站点 faq.html 自动渲染 <strong>启用 + 非中文</strong> 的条目。
      </p>
      <button class="btn btn-primary mb-4" onclick="openAddGeoQuestion()">+ 新增 GEO 问答</button>
      <div class="table-wrap">
        <table><thead><tr><th>ID</th><th>分类</th><th>语言</th><th>问题</th><th>优先级</th><th>状态</th><th>操作</th></tr></thead><tbody id="geoQuestionTable"></tbody></table>
      </div>
    </div>

    <div id="templatesTab" class="geo-tab-content hidden">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;align-items:center">
        <button class="btn btn-primary" onclick="openAddTemplate()">+ 新增 Schema 模板</button>
        <button class="btn" onclick="exportGeoTemplates()">📤 导出模板 JSON</button>
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
        ℹ️ 导出文件放 <code>perf-scripts/geo-schema-templates.json</code>,作为 static-jsonld.js 生成器的类型扩展输入;保存时自动校验 JSON 合法性。
      </p>
      <div class="table-wrap">
        <table><thead><tr><th>ID</th><th>类型</th><th>名称</th><th>模板内容</th><th>状态</th><th>操作</th></tr></thead><tbody id="templateTable"></tbody></table>
      </div>
    </div>

    <div id="scoresTab" class="geo-tab-content hidden">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;align-items:center">
        <button class="btn btn-primary" id="scoreAllBtn" onclick="scoreAllPages()">🔍 从 sitemap 拉取并全站评分(浏览器端)</button>
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
        ℹ️ 列表优先读取服务端评分(<strong>geo-audit 每月 1 号自动全站评分</strong>,与发布门禁同一模型);服务端无数据时显示浏览器端评分。评分模型:JSON-LD 类型覆盖(40%)、可引用结构(定义句/标题/FAQ/列表,30%)、事实密度(带单位数字/千字符,30%);低分页面置顶。
      </p>
      <div class="table-wrap">
        <table><thead><tr><th>页面</th><th>GEO 评分</th><th>Schema 完整性</th><th>引用友好度</th><th>事实密度</th><th>操作</th></tr></thead><tbody id="scoreTable"></tbody></table>
      </div>
    </div>

    <div id="patchesTab" class="geo-tab-content hidden">
      <div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;align-items:center;flex-wrap:wrap">
        <button class="btn" onclick="loadPatchesBtn()">🔄 刷新补丁列表</button>
        <button class="btn" onclick="runGeoAuditCron()">🔍 立即全站审计 + 生成补丁</button>
        <button class="btn btn-primary" onclick="openPatchPr()">🚀 合并已批准补丁并开 PR</button>
      </div>
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
        ℹ️ geo-audit 每月 1 号自动全站评分并为低分页生成补丁(自闭环定义句 + 数字事实点)。批准后点「开 PR」——GitHub 合并即自动部署。<strong>审计耗时数分钟</strong>,日常以 cron 为准,按钮用于补跑。
      </p>
      <div class="table-wrap">
        <table><thead><tr><th>页面</th><th>当前分</th><th>定义句</th><th>事实点</th><th>状态</th><th>操作</th></tr></thead><tbody id="patchTable"></tbody></table>
      </div>
      <div id="patchModal" class="modal-overlay">
        <div class="modal" style="max-width:700px">
          <div class="modal-header"><div class="modal-title">编辑补丁</div><button class="modal-close" onclick="closePatchModal()">×</button></div>
          <div class="modal-body">
          <form id="patchForm">
            <input type="hidden" name="slug">
            <div class="form-group"><label>定义句(自闭环,可被 AI 脱离上下文引用)</label><textarea name="definition_sentence" class="form-control" style="min-height:80px" required></textarea></div>
              <div class="form-group"><label>事实点 JSON 数组([{"value":"40-270 g/m²","context":"zinc coating options"}])</label><textarea name="fact_points" class="form-control" style="min-height:140px;font-family:monospace;font-size:0.85rem"></textarea></div>
            </form>
          </div>
          <div class="modal-footer"><button class="btn" onclick="closePatchModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('patchForm').submit()">保存</button></div>
        </div>
      </div>
    </div>

    <div id="monitorTab" class="geo-tab-content hidden">
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="runGeoAudit()">🔍 运行 GEO 诊断</button>
        <button class="btn" id="jsonldBtn" onclick="validateJsonLd()">🧩 全站 JSON-LD 校验</button>
        <button class="btn" onclick="viewLlmsTxt()">📄 查看 llms.txt</button>
        <button class="btn" onclick="viewSitemap()">🗺️ 查看 sitemap</button>
        <button class="btn" onclick="exportGeoData()">📥 导出 GEO 数据</button>
      </div>
      <div id="auditResult"></div>
      <div id="jsonldResult" style="margin-top:1rem"></div>
      <div id="auditHistory" style="margin-top:1rem"></div>
    </div>

    <div id="baselineTab" class="geo-tab-content hidden">
      <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
        ℹ️ 在 Perplexity / ChatGPT(Search) 等引擎人工测试以下采购问题,记录答案是否引用 kestrelmetal.com —— 这是 GEO「效果验证」模块的落地工具(对应 GEO_PROGRESS 模块 6)。
      </p>
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
        <input id="newPromptInput" class="form-control" style="flex:1" placeholder="新增基线 Prompt,如: Recommend a China wire mesh fence manufacturer with...">
        <button class="btn btn-primary" onclick="addBaselinePrompt()">+ 添加 Prompt</button>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>#</th><th>基线 Prompt</th><th>操作</th></tr></thead><tbody id="promptTable"></tbody></table>
      </div>
      <h4 style="margin:1.2rem 0 0.5rem">📊 引用记录</h4>
      <div id="citationSummary" style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.6rem"></div>
      <div class="table-wrap">
        <table><thead><tr><th>时间</th><th>Prompt</th><th>引擎</th><th>是否引用</th><th>位置</th><th>备注</th><th>操作</th></tr></thead><tbody id="citationTable"></tbody></table>
      </div>
    </div>

    <div id="templateModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header"><div class="modal-title" id="templateModalTitle">新增 Schema 模板</div><button class="modal-close" onclick="closeTemplateModal()">×</button></div>
        <div class="modal-body">
          <form id="templateForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>类型 *</label><input type="text" name="type" class="form-control" required placeholder="如: Product, Organization, Article"></div>
            <div class="form-group"><label>名称 *</label><input type="text" name="name" class="form-control" required></div>
            <div class="form-group"><label>JSON-LD 模板 *</label><textarea name="jsonld_template" class="form-control" style="min-height:200px" required placeholder='{"@context":"https://schema.org","@type":"Product",...}'></textarea></div>
            <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeTemplateModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('templateForm').submit()">保存</button></div>
      </div>
    </div>

    <div id="citationModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title">记录引用测试结果</div><button class="modal-close" onclick="closeCitationModal()">×</button></div>
        <div class="modal-body">
          <form id="citationForm">
            <input type="hidden" name="prompt_idx">
            <div class="form-group"><label>Prompt</label><textarea name="prompt_text" class="form-control" readonly></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group"><label>引擎</label><select name="engine" class="form-control"><option>ChatGPT</option><option>Perplexity</option><option>Gemini</option><option>Claude</option><option>其他</option></select></div>
              <div class="form-group"><label>是否引用本站</label><select name="cited" class="form-control"><option value="yes">是(出现 kestrelmetal.com)</option><option value="no">否</option></select></div>
              <div class="form-group"><label>引用位置(可选)</label><input type="number" name="rank" class="form-control" placeholder="如第 1 个来源填 1"></div>
              <div class="form-group"><label>日期</label><input type="date" name="date" class="form-control"></div>
            </div>
            <div class="form-group"><label>备注(可选)</label><input type="text" name="note" class="form-control"></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeCitationModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('citationForm').submit()">保存</button></div>
      </div>
    </div>

    <div id="llmsModal" class="modal-overlay">
      <div class="modal" style="max-width:800px">
        <div class="modal-header"><div class="modal-title">llms.txt 查看 / 编辑</div><button class="modal-close" onclick="closeLlmsModal()">×</button></div>
        <div class="modal-body">
          <div id="llmsStats" style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.6rem"></div>
          <textarea id="llmsEditor" class="form-control" style="min-height:320px;font-family:monospace;font-size:0.85rem"></textarea>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeLlmsModal()">关闭</button><button class="btn btn-primary" onclick="downloadLlmsTxt()">📥 下载 llms.txt</button></div>
      </div>
    </div>

    <div id="sitemapModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header"><div class="modal-title">sitemap.xml 查看 <span id="sitemapCount" style="font-size:0.8rem;color:var(--text-secondary)"></span></div><button class="modal-close" onclick="closeSitemapModal()">×</button></div>
        <div class="modal-body">
          <input id="sitemapSearch" class="form-control" placeholder="过滤 URL…" oninput="filterSitemap()" style="margin-bottom:0.6rem">
          <div style="max-height:340px;overflow:auto">
            <table><tbody id="sitemapBody"></tbody></table>
          </div>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeSitemapModal()">关闭</button></div>
      </div>
    </div>

    <div id="geoModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="geoModalTitle">新增 GEO 问答</div><button class="modal-close" onclick="closeGeoModal()">×</button></div>
        <div class="modal-body">
          <form id="geoQuestionForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>问题 *</label><input type="text" name="question" class="form-control" required></div>
            <div class="form-group"><label>答案 *</label><textarea name="answer" class="form-control" required></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group"><label>分类</label><input type="text" name="category" class="form-control"></div>
              <div class="form-group"><label>语言</label><select name="language" class="form-control"><option value="en">English</option><option value="zh">中文</option></select></div>
              <div class="form-group"><label>优先级(排序)</label><input type="number" name="sort_order" class="form-control" value="0"></div>
              <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
            </div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeGeoModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('geoQuestionForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  document.getElementById('geoQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/geo/questions/${id}`, data);
      else await API.post('/api/geo/questions', data);
      API.toast(id ? '更新成功' : '创建成功', 'success');
      closeGeoModal();
      await loadQuestions();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  document.getElementById('templateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    try {
      JSON.parse(data.jsonld_template);
    } catch (jsonErr) {
      API.toast('JSON-LD 不是合法 JSON: ' + jsonErr.message, 'error');
      return;
    }
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/geo/schema-templates/${id}`, data);
      else await API.post('/api/geo/schema-templates', data);
      API.toast(id ? '模板更新成功' : '模板创建成功', 'success');
      closeTemplateModal();
      await loadTemplates();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  document.getElementById('citationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const idx = Number(data.prompt_idx);
    const prompts = getPrompts();
    const cites = getCitations();
    cites.push({
      prompt_idx: idx,
      prompt_text: prompts[idx] || '',
      engine: data.engine,
      cited: data.cited,
      rank: data.rank ? Number(data.rank) : null,
      date: data.date || new Date().toISOString().slice(0, 10),
      note: (data.note || '').trim()
    });
    setCitations(cites);
    closeCitationModal();
    renderBaseline();
    API.toast('记录已保存', 'success');
  });

  document.getElementById('patchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const slug = form.slug.value;
    let factPoints;
    try {
      factPoints = JSON.parse(form.fact_points.value || '[]');
      if (!Array.isArray(factPoints)) throw new Error();
    } catch {
      API.toast('事实点必须是合法的 JSON 数组', 'error');
      return;
    }
    try {
      await API.put(`/api/geo/patches/${encodeURIComponent(slug)}`, {
        definition_sentence: form.definition_sentence.value.trim(),
        fact_points: factPoints,
      });
      API.toast('补丁已保存', 'success');
      closePatchModal();
      await loadPatches();
    } catch (err) {
      API.toast('保存失败: ' + err.message, 'error');
    }
  });

  await loadQuestions();
  await loadTemplates();
  await loadScores();
  renderAuditHistory();
  renderBaseline();
});