Router.register('/keyword-groups', async function (container) {
  let cluster = null;
  let defs = [];
  let expanded = new Set();
  let filterMode = 'all'; // all | pending | covered
  let searchTerm = '';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0));
  }

  function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function getToken() {
    let token = sessionStorage.getItem('km_worker_token') || '';
    if (!token) {
      token = prompt('请输入 Worker 管理令牌（ADMIN_TOKEN）：') || '';
      if (token) sessionStorage.setItem('km_worker_token', token);
    }
    return token;
  }

  function sourceLabel(source) {
    if (source === 'competitor_gap') return '<span class="badge badge-warning">竞品缺口</span>';
    if (source === 'gsc_opportunity') return '<span class="badge badge-info">GSC 机会</span>';
    return '<span class="badge badge-gray">GSC 排名</span>';
  }

  async function loadData(force) {
    const [clusterResp, defsResp] = await Promise.all([
      fetch('/api/keyword-groups' + (force ? '?refresh=1' : '')),
      fetch('/api/keyword-groups/defs')
    ]);
    if (!clusterResp.ok) throw new Error('关键词分组数据加载失败');
    cluster = await clusterResp.json();
    defs = defsResp.ok ? ((await defsResp.json()).groups || []) : [];
  }

  async function writeAction(url, method, body) {
    const token = getToken();
    if (!token) return false;
    const resp = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: method === 'DELETE' ? undefined : JSON.stringify(body || {})
    });
    if (resp.status === 401) {
      sessionStorage.removeItem('km_worker_token');
      API.toast('管理令牌无效，请重试', 'error');
      return false;
    }
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      API.toast(err.error || '操作失败', 'error');
      return false;
    }
    return true;
  }

  window.kgReassign = async function (keyword) {
    const options = defs.map((d, i) => `${i + 1}. ${d.name} (${d.id})`).join('\n');
    const answer = prompt(`把「${keyword}」移到哪个产品组？\n\n${options}\n\n请输入组 ID（如 gabion）：`);
    if (!answer) return;
    const groupId = answer.trim();
    const ok = await writeAction('/api/keyword-groups/assign', 'POST', { keyword, groupId });
    if (!ok) return;
    API.toast('已调整分组', 'success');
    await render();
  };

  window.kgExclude = async function (keyword) {
    if (!confirm(`确认把「${keyword}」排除出选题池？`)) return;
    const ok = await writeAction('/api/keyword-groups/exclude', 'POST', { keyword });
    if (!ok) return;
    API.toast('已排除该关键词', 'success');
    await render();
  };

  window.kgReset = async function (keyword) {
    const ok = await writeAction('/api/keyword-groups/override?keyword=' + encodeURIComponent(keyword), 'DELETE');
    if (!ok) return;
    API.toast('已恢复自动分组', 'success');
    await render();
  };

  window.kgToggle = function (groupId) {
    if (expanded.has(groupId)) expanded.delete(groupId);
    else expanded.add(groupId);
    render();
  };

  window.kgRebuild = async function () {
    const ok = await writeAction('/api/keyword-groups/rebuild', 'POST', {});
    if (!ok) return;
    API.toast('已重新聚类', 'success');
    await render(true);
  };

  async function render(force) {
    await loadData(force);

    const groups = (cluster.groups || []).filter(g => {
      if (filterMode === 'pending') return !g.covered;
      if (filterMode === 'covered') return g.covered;
      return true;
    });

    const totalKeywords = cluster.totalKeywords || 0;
    const groupedCount = (cluster.groups || []).reduce((s, g) => s + g.keywords.length, 0);
    const pendingGroups = (cluster.groups || []).filter(g => !g.covered).length;
    const coveredGroups = cluster.coveredGroupCount || 0;
    const ungrouped = cluster.ungrouped || [];
    const upcoming = cluster.upcoming || [];

    const statsBar = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">产品组</div><div class="stat-value">${(cluster.groups || []).length}</div></div>
        <div class="stat-card" style="border-left:3px solid #f59e0b"><div class="stat-label">待写组（未覆盖）</div><div class="stat-value" style="color:#f59e0b">${pendingGroups}</div></div>
        <div class="stat-card" style="border-left:3px solid #10b981"><div class="stat-label">已覆盖组</div><div class="stat-value" style="color:#10b981">${coveredGroups}</div></div>
        <div class="stat-card"><div class="stat-label">关键词总数</div><div class="stat-value">${formatNumber(totalKeywords)}</div></div>
        <div class="stat-card"><div class="stat-label">已归组</div><div class="stat-value">${formatNumber(groupedCount)}</div></div>
        <div class="stat-card" style="border-left:3px solid #ef4444"><div class="stat-label">未归组</div><div class="stat-value" style="color:#ef4444">${ungrouped.length}</div></div>
        ${cluster.filteredNonEnglish ? `<div class="stat-card" style="border-left:3px solid #8b5cf6"><div class="stat-label">已过滤非英文</div><div class="stat-value" style="color:#8b5cf6">${cluster.filteredNonEnglish}</div></div>` : ''}
      </div>`;

    const upcomingCard = upcoming.length ? `
      <div class="card">
        <div class="card-header"><h2>下周选题预告</h2><span class="badge badge-info">每周 2 组</span></div>
        <div class="card-body">
          ${upcoming.map(g => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
              <span><strong>${escapeHtml(g.name)}</strong></span>
              <span style="color:#666">主词 ${escapeHtml(g.primaryKeyword)} · ${g.keywordCount} 个词</span>
            </div>`).join('')}
          <p style="color:#999;font-size:12px;margin:10px 0 0">每组生成一篇文章，主词 + 同组变体词合并覆盖，避免同产品页互相抢排名。</p>
        </div>
      </div>` : '';

    const filterBar = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="btn ${filterMode === 'all' ? 'btn-primary' : 'btn-secondary'}" data-filter="all">全部</button>
        <button class="btn ${filterMode === 'pending' ? 'btn-primary' : 'btn-secondary'}" data-filter="pending">待写</button>
        <button class="btn ${filterMode === 'covered' ? 'btn-primary' : 'btn-secondary'}" data-filter="covered">已覆盖</button>
        <input id="kgSearch" type="text" placeholder="搜索关键词…" value="${escapeHtml(searchTerm)}" style="margin-left:8px;padding:6px 10px;border:1px solid #ddd;border-radius:6px">
        <button class="btn btn-primary" id="kgRebuildBtn" style="margin-left:8px">重新聚类</button>
      </div>`;

    container.innerHTML = `
      <div class="page-header">
        <div><h1>关键词分组</h1><p class="text-muted">按产品线聚类 · 一组一篇文章 · 更新于 ${escapeHtml(formatTime(cluster.generatedAt))}</p></div>
        ${filterBar}
      </div>

      ${statsBar}
      ${upcomingCard}

      <div class="card">
        <div class="card-header"><h2>产品组明细</h2><span class="badge badge-gray">点击组名展开关键词</span></div>
        <div class="card-body">
          ${groups.length ? groups.map(group => {
            const isOpen = expanded.has(group.id);
            const coveredSet = new Set(group.coveredKeywords || []);
            const visibleKeywords = (group.keywords || []).filter(k =>
              !searchTerm || k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return `
              <div style="border:1px solid #eee;border-radius:8px;margin-bottom:10px;overflow:hidden">
                <div onclick="kgToggle('${escapeHtml(group.id)}')" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;background:${group.covered ? '#f0fdf4' : '#fff'}">
                  <div>
                    <strong>${escapeHtml(group.name)}</strong>
                    <span style="color:#888;font-size:12px;margin-left:8px">${escapeHtml(group.id)}</span>
                    ${group.covered ? `<span class="badge badge-success" style="margin-left:8px">已覆盖 · ${escapeHtml(group.coveredBy || '')}</span>` : '<span class="badge badge-warning" style="margin-left:8px">待写</span>'}
                  </div>
                  <div style="text-align:right;font-size:12px;color:#666">
                    <div>${group.keywords.length} 个词 · 权重 ${formatNumber(group.totalWeight)}</div>
                    <div>缺口 ${group.gapCount} · 机会 ${group.opportunityCount} · 展示 ${formatNumber(group.totalImpressions)}</div>
                  </div>
                </div>
                ${isOpen ? `
                  <div style="padding:4px 14px 12px">
                    <div style="font-size:12px;color:#666;padding:6px 0">
                      主词：<strong style="color:#333">${escapeHtml(group.primaryKeyword)}</strong>
                      ${group.coveredKeywords && group.coveredKeywords.length ? `· 已写：${escapeHtml((group.coveredKeywords || []).slice(0, 4).join(', '))}` : ''}
                    </div>
                    <div class="table-wrap">
                      <table><thead><tr><th>关键词</th><th>来源</th><th>展示</th><th>竞品数</th><th>排名</th><th>权重</th><th>操作</th></tr></thead><tbody>
                        ${visibleKeywords.length ? visibleKeywords.map(k => `
                          <tr>
                            <td><strong>${escapeHtml(k.keyword)}</strong>${coveredSet.has(k.keyword) ? ' <span class="badge badge-success">已写</span>' : ''}</td>
                            <td>${sourceLabel(k.source)}</td>
                            <td>${formatNumber(k.impressions)}</td>
                            <td>${k.competitorCount || '—'}</td>
                            <td>${Number(k.position || 0).toFixed(1)}</td>
                            <td>${formatNumber(k.weight)}</td>
                            <td style="white-space:nowrap">
                              <button class="btn btn-secondary" style="padding:3px 8px;font-size:12px" onclick="kgReassign('${escapeHtml(k.keyword)}')">改组</button>
                              <button class="btn btn-secondary" style="padding:3px 8px;font-size:12px" onclick="kgExclude('${escapeHtml(k.keyword)}')">排除</button>
                              <button class="btn btn-secondary" style="padding:3px 8px;font-size:12px" onclick="kgReset('${escapeHtml(k.keyword)}')">还原</button>
                            </td>
                          </tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><p>没有匹配的关键词</p></div></td></tr>'}
                      </tbody></table>
                    </div>
                  </div>` : ''}
              </div>`;
          }).join('') : '<div class="empty-state"><p>暂无分组数据</p><p style="color:#999;font-size:13px">先在「竞品关键词」跑一次缺口分析，或等待 GSC 数据同步</p></div>'}
        </div>
      </div>

      ${ungrouped.length ? `
      <div class="card">
        <div class="card-header"><h2>未归组关键词</h2><span class="badge badge-warning">${ungrouped.length}</span></div>
        <div class="card-body">
          <p style="color:#888;font-size:13px;margin-bottom:10px">这些词没命中任何产品词典，需人工指定分组后才会进入选题池。</p>
          <div class="table-wrap">
            <table><thead><tr><th>关键词</th><th>来源</th><th>展示</th><th>操作</th></tr></thead><tbody>
              ${ungrouped.slice(0, 50).map(k => `
                <tr>
                  <td><strong>${escapeHtml(k.keyword)}</strong></td>
                  <td>${sourceLabel(k.source)}</td>
                  <td>${formatNumber(k.impressions)}</td>
                  <td style="white-space:nowrap">
                    <button class="btn btn-secondary" style="padding:3px 8px;font-size:12px" onclick="kgReassign('${escapeHtml(k.keyword)}')">指定分组</button>
                    <button class="btn btn-secondary" style="padding:3px 8px;font-size:12px" onclick="kgExclude('${escapeHtml(k.keyword)}')">排除</button>
                  </td>
                </tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      </div>` : ''}`;

    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterMode = btn.dataset.filter;
        render().catch(e => API.toast(e.message, 'error'));
      });
    });

    const searchInput = document.getElementById('kgSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchTerm = e.target.value;
        // 搜索时自动展开全部组，避免结果被折叠隐藏
        (cluster.groups || []).forEach(g => expanded.add(g.id));
        const cursor = e.target.selectionStart;
        render().then(() => {
          const next = document.getElementById('kgSearch');
          if (next) { next.focus(); next.setSelectionRange(cursor, cursor); }
        }).catch(err => API.toast(err.message, 'error'));
      });
    }

    const rebuildBtn = document.getElementById('kgRebuildBtn');
    if (rebuildBtn) rebuildBtn.addEventListener('click', () => window.kgRebuild());
  }

  await render();
});
