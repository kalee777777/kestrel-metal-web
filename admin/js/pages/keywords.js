Router.register('/keywords', async function (container) {
  let date = new Date().toISOString().split('T')[0];

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

  async function load() {
    const [rankingResponse, statusResponse] = await Promise.all([
      fetch(`/api/keywords/rankings?date=${encodeURIComponent(date)}`),
      fetch('/api/gsc/status')
    ]);
    if (!rankingResponse.ok) throw new Error('关键词数据加载失败');
    const rankingData = await rankingResponse.json();
    const statusData = statusResponse.ok ? await statusResponse.json() : {};
    const rows = rankingData.rankings || [];
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
      <div class="card">
        <div class="card-header"><h2>同步状态</h2><span class="badge ${statusData.ok ? 'badge-success' : 'badge-warning'}">${statusData.ok ? 'Connected' : 'Not verified'}</span></div>
        <div class="card-body"><p>网站资源：${escapeHtml(statusData.siteUrl || '未配置')}</p><p>最近同步：${escapeHtml(statusData.lastSync || '尚未同步')}</p><p>${escapeHtml(statusData.error || (statusData.rowCount !== undefined ? `连接测试返回 ${statusData.rowCount} 条记录` : ''))}</p></div>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>关键词</th><th>点击</th><th>展示</th><th>CTR</th><th>平均排名</th><th>日期</th></tr></thead><tbody>
          ${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.keyword)}</strong></td><td>${formatNumber(row.clicks)}</td><td>${formatNumber(row.impressions)}</td><td>${(Number(row.ctr || 0) * 100).toFixed(2)}%</td><td>${Number(row.position || 0).toFixed(1)}</td><td>${escapeHtml(row.date)}</td></tr>`).join('') : '<tr><td colspan="6"><div class="empty-state"><p>当前日期没有关键词数据</p></div></td></tr>'}
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
