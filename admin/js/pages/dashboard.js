Router.register('/dashboard', async function (container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>数据概览</h1>
      <span class="badge badge-gray">实时数据</span>
    </div>
    <div id="statGrid" class="stat-grid">
      <div class="loading">加载中...</div>
    </div>
    <div id="topPagesSection" style="margin-top:1.5rem"></div>
    <div id="trendSection" style="margin-top:1.5rem"></div>
    <div id="quickActions" style="margin-top:1.5rem">
      <div class="card">
        <div class="card-header">
          <div class="card-title">快捷操作</div>
        </div>
        <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem">
          <a href="#/products" class="btn">📦 新增产品</a>
          <a href="#/blog" class="btn">📝 写博客</a>
          <a href="#/inquiries" class="btn">💬 查看询盘</a>
          <a href="#/media" class="btn">🖼️ 上传图片</a>
          <a href="#/seo" class="btn">🔍 SEO 设置</a>
          <a href="#/geo" class="btn">🤖 GEO 优化</a>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await API.get('/api/dashboard/summary');
    const fmt = (n) => n.toLocaleString('en-US');
    const fmtDuration = (sec) => {
      const m = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return m + ':' + String(s).padStart(2, '0');
    };

    document.getElementById('statGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">今日页面浏览</div>
        <div class="stat-card-value">${fmt(data.today.pageviews)}</div>
        <div class="stat-card-delta">总计 ${fmt(data.total.pageviews)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">今日访客数</div>
        <div class="stat-card-value">${fmt(data.today.visitors)}</div>
        <div class="stat-card-delta">总计 ${fmt(data.total.visitors)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">今日询盘</div>
        <div class="stat-card-value">${fmt(data.today.inquiries)}</div>
        <div class="stat-card-delta">总计 ${fmt(data.total.inquiries)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">本周平均停留</div>
        <div class="stat-card-value">${fmtDuration(data.weekly.avgDuration)}</div>
        <div class="stat-card-delta">跳出率 ${data.weekly.bounceRate}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">已发布产品</div>
        <div class="stat-card-value">${fmt(data.total.products)}</div>
        <div class="stat-card-delta">可在产品管理维护</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">已发布博客</div>
        <div class="stat-card-value">${fmt(data.total.blogPosts)}</div>
        <div class="stat-card-delta">可在博客管理维护</div>
      </div>
    `;

    var topPages = data.topPages || {};
    var topEntries = Object.keys(topPages).map(function (k) {
      return { path: k, count: topPages[k] };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 10);

    if (topEntries.length > 0) {
      var maxCount = topEntries[0].count || 1;
      var rows = topEntries.map(function (entry) {
        var pct = Math.round((entry.count / maxCount) * 100);
        return '<tr><td style="padding:6px 8px;font-family:monospace;font-size:13px;color:#333">' + entry.path + '</td>' +
          '<td style="padding:6px 8px;text-align:right;font-weight:600;width:80px">' + fmt(entry.count) + '</td>' +
          '<td style="padding:6px 8px;width:40%"><div style="background:#f0f0f0;border-radius:4px;height:8px"><div style="background:#e74c3c;height:8px;border-radius:4px;width:' + pct + '%"></div></div></td></tr>';
      }).join('');
      document.getElementById('topPagesSection').innerHTML = '<div class="card"><div class="card-header"><div class="card-title">热门页面 Top 10</div></div>' +
        '<div class="card-body" style="padding:0"><table style="width:100%;border-collapse:collapse">' + rows + '</table></div></div>';
    }

    var dailyHistory = data.dailyHistory || {};
    var days = Object.keys(dailyHistory).sort().slice(-7);
    if (days.length > 1) {
      var maxPv = 1;
      days.forEach(function (d) {
        if (dailyHistory[d].pageviews > maxPv) maxPv = dailyHistory[d].pageviews;
      });
      var barWidth = Math.floor(100 / days.length);
      var bars = days.map(function (d) {
        var pv = dailyHistory[d].pageviews || 0;
        var height = Math.max(4, Math.round((pv / maxPv) * 120));
        var label = d.substring(5);
        return '<div style="display:flex;flex-direction:column;align-items:center;flex:1">' +
          '<div style="font-size:11px;color:#666;margin-bottom:4px">' + pv + '</div>' +
          '<div style="width:100%;max-width:48px;background:#f0f0f0;border-radius:4px;height:120px;display:flex;align-items:flex-end;justify-content:center">' +
          '<div style="width:100%;background:linear-gradient(to top,#e74c3c,#c0392b);border-radius:4px;height:' + height + 'px;transition:height .3s"></div>' +
          '</div>' +
          '<div style="font-size:11px;color:#999;margin-top:4px">' + label + '</div></div>';
      }).join('');
      document.getElementById('trendSection').innerHTML = '<div class="card"><div class="card-header"><div class="card-title">近 7 日浏览趋势</div></div>' +
        '<div class="card-body"><div style="display:flex;gap:8px;align-items:flex-end;height:160px;padding:0 8px">' + bars + '</div></div></div>';
    }

  } catch (err) {
    document.getElementById('statGrid').innerHTML = '<div class="empty-state"><p>数据加载失败: ' + err.message + '</p></div>';
  }
});
