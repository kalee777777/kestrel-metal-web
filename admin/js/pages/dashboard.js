/**
 * Dashboard 页面 - 数据看板
 */
Router.register('/dashboard', async function (container) {
  container.innerHTML = `
    <div class="page-header">
      <h1>数据概览</h1>
      <span class="badge badge-gray">实时数据</span>
    </div>
    <div id="statGrid" class="stat-grid">
      <div class="loading">加载中...</div>
    </div>
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
    const data = await API.getDashboardSummary();
    const fmt = (n) => n.toLocaleString('en-US');
    const fmtDuration = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
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
  } catch (err) {
    document.getElementById('statGrid').innerHTML = `<div class="empty-state"><p>数据加载失败: ${err.message}</p></div>`;
  }
});