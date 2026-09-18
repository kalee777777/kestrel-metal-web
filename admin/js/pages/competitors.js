Router.register('/competitors', async function (container) {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0));
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function getToken() {
    let token = sessionStorage.getItem('km_worker_token') || '';
    if (!token) {
      token = prompt('请输入 Worker 管理令牌（ADMIN_TOKEN）：') || '';
      if (token) sessionStorage.setItem('km_worker_token', token);
    }
    return token;
  }

  // ─── 竞品管理 ───

  async function loadCompetitors() {
    const resp = await fetch('/api/competitors');
    if (!resp.ok) throw new Error('竞品列表加载失败');
    const data = await resp.json();
    return data.competitors || [];
  }

  async function addCompetitor() {
    const domain = document.getElementById('compDomain').value.trim();
    const name = document.getElementById('compName').value.trim();
    if (!domain) { API.toast('请输入竞品域名', 'error'); return; }

    const token = getToken();
    if (!token) { API.toast('需要管理令牌', 'error'); return; }

    const resp = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ domain, name: name || domain }),
    });

    if (resp.status === 401) { sessionStorage.removeItem('km_worker_token'); API.toast('管理令牌无效', 'error'); return; }
    if (resp.status === 409) { API.toast('该竞品已存在', 'error'); return; }
    if (!resp.ok) { API.toast('添加失败', 'error'); return; }

    API.toast('竞品已添加', 'success');
    render();
  }

  async function analyzeCompetitor(domain) {
    const token = getToken();
    if (!token) { API.toast('需要管理令牌', 'error'); return; }

    const btn = document.querySelector(`[data-analyze="${domain}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '分析中...'; }

    try {
      const resp = await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ domain }),
      });
      if (resp.status === 401) { sessionStorage.removeItem('km_worker_token'); API.toast('管理令牌无效', 'error'); return; }
      const data = await resp.json();
      if (data.error) { API.toast(data.error, 'error'); }
      else { API.toast(`分析完成，提取 ${data.keywordCount} 个关键词`, 'success'); }
    } catch (err) {
      API.toast('分析请求失败: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '分析'; }
    }
    render();
  }

  async function deleteCompetitor(domain) {
    if (!confirm(`确定删除竞品 ${domain}？`)) return;
    const token = getToken();
    if (!token) { API.toast('需要管理令牌', 'error'); return; }

    const resp = await fetch(`/api/competitors/${encodeURIComponent(domain)}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (resp.status === 401) { sessionStorage.removeItem('km_worker_token'); API.toast('管理令牌无效', 'error'); return; }
    if (!resp.ok) { API.toast('删除失败', 'error'); return; }
    API.toast('竞品已删除', 'success');
    render();
  }

  // ─── 缺口分析 ───

  let gapData = [];

  async function loadGapData() {
    try {
      const resp = await fetch('/api/competitors/gap');
      console.log('[competitors] gap API response:', resp.status);
      if (resp.ok) {
        const data = await resp.json();
        gapData = data.gaps || [];
        console.log('[competitors] loaded gaps:', gapData.length);
      }
    } catch (err) {
      console.error('[competitors] loadGapData error:', err);
    }
  }

  async function runGapAnalysis() {
    const btn = document.getElementById('runGapBtn');
    if (btn) { btn.disabled = true; btn.textContent = '分析中...'; }

    try {
      const resp = await fetch('/api/competitors/gap');
      if (!resp.ok) throw new Error('缺口分析失败');
      const data = await resp.json();
      gapData = data.gaps || [];
      renderGapTable();
      API.toast(`缺口分析完成，发现 ${gapData.length} 个未覆盖关键词`, 'success');
    } catch (err) {
      API.toast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '运行缺口分析'; }
    }
  }

  function renderGapTable(filter = '') {
    const container = document.getElementById('gapTableBody');
    console.log('[competitors] renderGapTable called, gapData:', gapData.length, 'container:', !!container);
    if (!container) return;

    const filtered = filter
      ? gapData.filter(g => g.keyword.toLowerCase().includes(filter.toLowerCase()))
      : gapData;

    if (filtered.length === 0) {
      container.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:24px">暂无缺口数据，请先添加竞品并执行分析</td></tr>';
      return;
    }

    container.innerHTML = filtered.map(g => `
      <tr>
        <td><strong>${escapeHtml(g.keyword)}</strong></td>
        <td style="text-align:center"><span class="badge badge-warning">${g.competitorCount}</span></td>
        <td>${g.competitors.map(c => `<a href="https://${c.domain}" target="_blank" style="color:#3b82f6;text-decoration:none">${escapeHtml(c.domain)}</a>`).join(', ')}</td>
        <td><span class="badge" style="background:#fef2f2;color:#b91c1c">未覆盖</span></td>
      </tr>
    `).join('');
  }

  // ─── 渲染 ───

  async function render() {
    const competitors = await loadCompetitors();

    container.innerHTML = `
      <div class="page-header">
        <div><h1>竞品关键词</h1><p class="text-muted">竞品关键词缺口分析 · 发现未覆盖的关键词机会</p></div>
      </div>

      <!-- Section A: 竞品管理 -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h2>竞品管理</h2></div>
        <div class="card-body">
          <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
            <input id="compDomain" type="text" placeholder="竞品域名（如 example.com）" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #ddd;border-radius:6px">
            <input id="compName" type="text" placeholder="名称（可选）" style="width:160px;padding:8px 12px;border:1px solid #ddd;border-radius:6px">
            <button class="btn btn-primary" onclick="window.addCompetitor()">添加竞品</button>
          </div>

          ${competitors.length > 0 ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>域名</th><th>名称</th><th>添加时间</th><th>最后分析</th><th>操作</th></tr></thead>
              <tbody>
                ${competitors.map(c => `
                  <tr>
                    <td><a href="https://${c.domain}" target="_blank" style="color:#3b82f6">${escapeHtml(c.domain)}</a></td>
                    <td>${escapeHtml(c.name)}</td>
                    <td>${formatDate(c.addedAt)}</td>
                    <td>${formatDate(c.lastAnalyzed)}</td>
                    <td>
                      <button class="btn btn-primary" style="padding:4px 10px;font-size:12px" data-analyze="${c.domain}" onclick="window.analyzeCompetitor('${c.domain}')">分析</button>
                      <button class="btn" style="padding:4px 10px;font-size:12px;color:#ef4444;border-color:#ef4444" onclick="window.deleteCompetitor('${c.domain}')">删除</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>` : '<p style="color:#999;text-align:center;padding:16px">暂无竞品，请添加竞品域名开始分析</p>'}
        </div>
      </div>

      <!-- Section B: 缺口分析 -->
      <div class="card">
        <div class="card-header">
          <h2>关键词缺口</h2>
          <button class="btn btn-primary" id="runGapBtn" onclick="window.runGapAnalysis()">运行缺口分析</button>
        </div>
        <div class="card-body">
          <div id="gapStats" style="margin-bottom:16px"></div>
          <div style="margin-bottom:12px">
            <input id="gapFilter" type="text" placeholder="搜索关键词..." style="width:100%;max-width:300px;padding:8px 12px;border:1px solid #ddd;border-radius:6px">
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>关键词</th><th style="text-align:center">覆盖竞品数</th><th>竞品来源</th><th>状态</th></tr></thead>
              <tbody id="gapTableBody">
                <tr><td colspan="4" style="text-align:center;color:#999;padding:24px">点击「运行缺口分析」查看结果</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // 绑定搜索过滤
    const filterInput = document.getElementById('gapFilter');
    if (filterInput) {
      filterInput.addEventListener('input', e => renderGapTable(e.target.value));
    }

    // 自动加载缺口数据
    console.log('[competitors] render() starting auto-load');
    await loadGapData();
    console.log('[competitors] after loadGapData, gapData:', gapData.length);
    renderGapTable();
    console.log('[competitors] after renderGapTable');
  }

  // 暴露全局函数
  window.addCompetitor = addCompetitor;
  window.analyzeCompetitor = analyzeCompetitor;
  window.deleteCompetitor = deleteCompetitor;
  window.runGapAnalysis = runGapAnalysis;

  await render();
});
