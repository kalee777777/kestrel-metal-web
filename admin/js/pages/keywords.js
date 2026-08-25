Router.register('/keywords', async function (container) {
  let date = new Date().toISOString().split('T')[0];
  let analysisData = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('en-US').format(Number(value || 0));
  }

  function getTrendIcon(trend) {
    if (trend === 'up') return '<span style="color:#10b981">▲</span>';
    if (trend === 'down') return '<span style="color:#ef4444">▼</span>';
    if (trend === 'new') return '<span style="color:#3b82f6">★</span>';
    return '<span style="color:#6b7280">—</span>';
  }

  function getTrendClass(trend) {
    if (trend === 'up') return 'color:#10b981';
    if (trend === 'down') return 'color:#ef4444';
    if (trend === 'new') return 'color:#3b82f6';
    return 'color:#6b7280';
  }

  async function load() {
    const [rankingResponse, analysisResponse, statusResponse] = await Promise.all([
      fetch(`/api/keywords/rankings?date=${encodeURIComponent(date)}`),
      fetch('/api/keywords/analysis'),
      fetch('/api/gsc/status')
    ]);
    
    if (!rankingResponse.ok) throw new Error('关键词数据加载失败');
    const rankingData = await rankingResponse.json();
    const analysisJson = analysisResponse.ok ? await analysisResponse.json() : null;
    const statusData = statusResponse.ok ? await statusResponse.json() : {};
    
    analysisData = analysisJson;
    const rows = rankingData.rankings || [];
    const stats = analysisJson?.stats || { total: 0, top10: 0, top20: 0, rising: 0, falling: 0 };
    
    const totalClicks = rows.reduce((sum, row) => sum + Number(row.clicks || 0), 0);
    const totalImpressions = rows.reduce((sum, row) => sum + Number(row.impressions || 0), 0);
    const averagePosition = rows.length ? rows.reduce((sum, row) => sum + Number(row.position || 0), 0) / rows.length : 0;

    container.innerHTML = `
      <div class="page-header">
        <div><h1>关键词监控</h1><p class="text-muted">Google Search Console · ${escapeHtml(date)}</p></div>
        <div class="btn-group"><input id="keywordDate" type="date" value="${escapeHtml(date)}"><button class="btn btn-primary" id="refreshKeywords">刷新数据</button></div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">关键词数量</div><div class="stat-value">${formatNumber(rows.length)}</div></div>
        <div class="stat-card"><div class="stat-label">展示次数</div><div class="stat-value">${formatNumber(totalImpressions)}</div></div>
        <div class="stat-card"><div class="stat-label">点击次数</div><div class="stat-value">${formatNumber(totalClicks)}</div></div>
        <div class="stat-card"><div class="stat-label">平均排名</div><div class="stat-value">${averagePosition ? averagePosition.toFixed(1) : '-'}</div></div>
      </div>
      
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card" style="border-left:3px solid #10b981"><div class="stat-label">Top 10 关键词</div><div class="stat-value" style="color:#10b981">${stats.top10}</div></div>
        <div class="stat-card" style="border-left:3px solid #3b82f6"><div class="stat-label">Top 20 关键词</div><div class="stat-value" style="color:#3b82f6">${stats.top20}</div></div>
        <div class="stat-card" style="border-left:3px solid #10b981"><div class="stat-label">排名上升</div><div class="stat-value" style="color:#10b981">${stats.rising}</div></div>
        <div class="stat-card" style="border-left:3px solid #ef4444"><div class="stat-label">排名下降</div><div class="stat-value" style="color:#ef4444">${stats.falling}</div></div>
      </div>

      <div class="card">
        <div class="card-header"><h2>同步状态</h2><span class="badge ${statusData.ok ? 'badge-success' : 'badge-warning'}">${statusData.ok ? 'Connected' : 'Not verified'}</span></div>
        <div class="card-body"><p>网站资源：${escapeHtml(statusData.siteUrl || '未配置')}</p><p>最近同步：${escapeHtml(statusData.lastSync || '尚未同步')}</p></div>
      </div>

      <div class="card">
        <div class="card-header"><h2>排名趋势</h2></div>
        <div class="card-body">
          ${rows.length > 0 ? `
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:16px">
              <div style="flex:1;min-width:200px">
                <h4 style="margin-bottom:8px;color:#666;font-size:13px">Top 10 关键词</h4>
                ${rows.filter(r => Number(r.position) <= 10).slice(0, 5).map(r => `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
                    <span>${escapeHtml(r.keyword)}</span>
                    <span style="font-weight:600;color:#10b981">#${Number(r.position).toFixed(0)}</span>
                  </div>
                `).join('')}
              </div>
              <div style="flex:1;min-width:200px">
                <h4 style="margin-bottom:8px;color:#666;font-size:13px">排名变化最大的关键词</h4>
                ${(analysisJson?.keywords || []).filter(k => Math.abs(k.change) > 0).slice(0, 5).map(k => `
                  <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px">
                    <span>${escapeHtml(k.keyword)}</span>
                    <span style="${getTrendClass(k.trend)}">${getTrendIcon(k.trend)} ${k.change > 0 ? '+' : ''}${k.change}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p style="color:#999;text-align:center">暂无数据</p>'}
        </div>
      </div>
      
      <div class="table-wrap">
        <table><thead><tr><th>关键词</th><th>点击</th><th>展示</th><th>CTR</th><th>平均排名</th><th>趋势</th><th>日期</th></tr></thead><tbody>
          ${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.keyword)}</strong></td><td>${formatNumber(row.clicks)}</td><td>${formatNumber(row.impressions)}</td><td>${(Number(row.ctr || 0) * 100).toFixed(2)}%</td><td>${Number(row.position || 0).toFixed(1)}</td><td>${getTrendIcon(analysisJson?.keywords?.find(k => k.keyword === row.keyword)?.trend || 'stable')}</td><td>${escapeHtml(row.date)}</td></tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><p>当前日期没有关键词数据</p><p style="color:#999;font-size:13px">数据通常在 Google 收录网站后 2-3 天开始出现</p></div></td></tr>'}
        </tbody></table>
      </div>`;

    document.getElementById('keywordDate').addEventListener('change', event => {
      date = event.target.value;
      load().catch(error => API.toast(error.message, 'error'));
    });
    document.getElementById('refreshKeywords').addEventListener('click', () => {
      load().catch(error => API.toast(error.message, 'error'));
    });
  }

  await load();
});
