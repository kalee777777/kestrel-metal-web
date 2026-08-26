Router.register('/opportunities', async function (container) {
  let data = null;

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

  function getTypeBadge(type) {
    const badges = {
      low_ctr: '<span class="badge badge-warning">低点击率</span>',
      page_two: '<span class="badge badge-info">第二页</span>',
      new_opportunity: '<span class="badge badge-success">新机会</span>',
      competitor_gap: '<span class="badge badge-danger">竞争缺口</span>',
    };
    return badges[type] || type;
  }

  function getDifficultyBadge(difficulty) {
    const badges = {
      easy: '<span class="badge badge-success">容易</span>',
      medium: '<span class="badge badge-warning">中等</span>',
      hard: '<span class="badge badge-danger">困难</span>',
    };
    return badges[difficulty] || difficulty;
  }

  async function load() {
    const [opportunitiesResponse, statsResponse] = await Promise.all([
      fetch('/api/opportunities'),
      fetch('/api/opportunities/stats')
    ]);

    if (!opportunitiesResponse.ok) throw new Error('机会数据加载失败');
    const opportunitiesData = await opportunitiesResponse.json();
    const statsData = statsResponse.ok ? await statsResponse.json() : null;

    data = {
      opportunities: opportunitiesData.opportunities || [],
      stats: statsData?.stats || null,
      count: opportunitiesData.count || 0,
      message: opportunitiesData.message || '',
    };

    container.innerHTML = `
      <div class="page-header">
        <div><h1>内容机会分析</h1><p class="text-muted">基于 GSC 数据自动识别的内容机会</p></div>
        <div class="btn-group"><button class="btn btn-primary" id="refreshOpportunities">刷新分析</button></div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">总机会数</div><div class="stat-value">${data.count}</div></div>
        <div class="stat-card"><div class="stat-label">低点击率</div><div class="stat-value" style="color:#f59e0b">${data.stats?.byType?.low_ctr || 0}</div></div>
        <div class="stat-card"><div class="stat-label">第二页关键词</div><div class="stat-value" style="color:#3b82f6">${data.stats?.byType?.page_two || 0}</div></div>
        <div class="stat-card"><div class="stat-label">新机会</div><div class="stat-value" style="color:#10b981">${data.stats?.byType?.new_opportunity || 0}</div></div>
      </div>

      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-label">容易实施</div><div class="stat-value" style="color:#10b981">${data.stats?.byDifficulty?.easy || 0}</div></div>
        <div class="stat-card"><div class="stat-label">中等难度</div><div class="stat-value" style="color:#f59e0b">${data.stats?.byDifficulty?.medium || 0}</div></div>
        <div class="stat-card"><div class="stat-label">困难</div><div class="stat-value" style="color:#ef4444">${data.stats?.byDifficulty?.hard || 0}</div></div>
      </div>

      <div class="card">
        <div class="card-header"><h2>优先行动</h2></div>
        <div class="card-body">
          ${data.stats?.topKeywords?.length > 0 ? `
            <div style="display:grid;gap:12px">
              ${data.stats.topKeywords.map((item, index) => `
                <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f8f9fa;border-radius:8px;border-left:3px solid ${index < 3 ? '#ff6b35' : '#e5e7eb'}">
                  <span style="font-weight:600;color:#666;min-width:24px">${index + 1}</span>
                  <div style="flex:1">
                    <div style="font-weight:600;margin-bottom:4px">${escapeHtml(item.keyword)}</div>
                    <div style="font-size:13px;color:#666">${escapeHtml(item.action)}</div>
                  </div>
                  ${getTypeBadge(item.type)}
                </div>
              `).join('')}
            </div>
          ` : '<p style="color:#999;text-align:center">暂无数据</p>'}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h2>所有机会</h2></div>
        <div class="card-body">
          ${data.opportunities.length > 0 ? `
            <div class="table-wrap">
              <table>
                <thead><tr><th>关键词</th><th>类型</th><th>展示</th><th>点击</th><th>排名</th><th>难度</th><th>建议操作</th></tr></thead>
                <tbody>
                  ${data.opportunities.map(item => `
                    <tr>
                      <td><strong>${escapeHtml(item.keyword)}</strong></td>
                      <td>${getTypeBadge(item.type)}</td>
                      <td>${formatNumber(item.impressions)}</td>
                      <td>${formatNumber(item.clicks)}</td>
                      <td>${Number(item.position).toFixed(1)}</td>
                      <td>${getDifficultyBadge(item.estimatedDifficulty)}</td>
                      <td style="max-width:300px;font-size:13px">${escapeHtml(item.suggestedAction)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<div class="empty-state"><p>暂无内容机会数据</p><p style="color:#999;font-size:13px">' + (data.message || '需要积累更多 GSC 数据才能生成机会建议') + '</p></div>'}
        </div>
      </div>`;

    document.getElementById('refreshOpportunities').addEventListener('click', () => {
      load().catch(error => API.toast(error.message, 'error'));
    });
  }

  await load();
});
