Router.register('/analytics', async function (container) {
  let settings = {};
  try {
    const raw = localStorage.getItem('km_admin_site_settings');
    if (raw) settings = JSON.parse(raw);
  } catch (_) {}

  const umamiWebsiteId = settings.umami_website_id || '';
  const umamiDomain = (settings.umami_domain || '').replace(/\/+$/, '');

  if (umamiWebsiteId) {
    const shareUrl = umamiDomain
      ? umamiDomain + '/share/' + umamiWebsiteId
      : 'https://cloud.umami.is/share/' + umamiWebsiteId;
    const dashboardUrl = umamiDomain
      ? umamiDomain + '/dashboard'
      : 'https://cloud.umami.is/dashboard';

    container.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center">
        <h1>访客分析 <span style="display:inline-block;font-size:0.6875rem;font-weight:500;background:var(--primary);color:#fff;padding:0.15rem 0.5rem;border-radius:4px;margin-left:0.5rem;vertical-align:middle">Umami 驱动</span></h1>
        <div style="display:flex;gap:0.5rem">
          <a href="${shareUrl}" target="_blank" rel="noopener" class="btn" style="text-decoration:none;font-size:0.875rem">
            📊 打开实时仪表板
          </a>
          <a href="${dashboardUrl}" target="_blank" rel="noopener" class="btn" style="text-decoration:none;font-size:0.875rem">
            ⚙️ Umami 后台管理
          </a>
        </div>
      </div>
      <div class="card" style="margin-top:1rem">
        <div class="card-body" style="padding:2rem">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;text-align:center">
            <div style="padding:1.5rem;background:var(--gray-50);border-radius:8px">
              <div style="font-size:2rem;margin-bottom:0.5rem">🗺️</div>
              <div style="font-weight:600;color:var(--gray-800);margin-bottom:0.25rem">世界地图</div>
              <div style="font-size:0.8125rem;color:var(--gray-500)">实时显示全球访客位置</div>
            </div>
            <div style="padding:1.5rem;background:var(--gray-50);border-radius:8px">
              <div style="font-size:2rem;margin-bottom:0.5rem">📈</div>
              <div style="font-weight:600;color:var(--gray-800);margin-bottom:0.25rem">实时监控</div>
              <div style="font-size:0.8125rem;color:var(--gray-500)">当前在线访客 & 页面浏览</div>
            </div>
            <div style="padding:1.5rem;background:var(--gray-50);border-radius:8px">
              <div style="font-size:2rem;margin-bottom:0.5rem">📱</div>
              <div style="font-weight:600;color:var(--gray-800);margin-bottom:0.25rem">设备分析</div>
              <div style="font-size:0.8125rem;color:var(--gray-500)">浏览器/系统/设备分布</div>
            </div>
          </div>
          <div style="margin-top:1.5rem;text-align:center">
            <p style="font-size:0.875rem;color:var(--gray-600);margin-bottom:1rem">
              点击上方按钮打开 Umami 完整分析面板，查看实时访客地图、来源分析、热门页面等数据。
            </p>
            <p style="font-size:0.8125rem;color:var(--gray-400)">
              Website ID: <code style="background:var(--gray-100);padding:0.15rem 0.4rem;border-radius:4px">${umamiWebsiteId}</code>
            </p>
          </div>
        </div>
      </div>
      <p style="margin-top:0.75rem;font-size:0.8125rem;color:var(--gray-500)">数据由 Umami 提供，包含实时访客、地理位置地图、设备信息、热门页面、来源分析等</p>
    `;
  } else {
    container.innerHTML = `
      <div class="page-header">
        <h1>访客分析</h1>
      </div>
      <div class="card" style="max-width:600px">
        <div class="card-body" style="padding:2rem">
          <h2 style="font-size:1.125rem;font-weight:600;margin-bottom:1.5rem;color:var(--gray-800)">配置 Umami 数据分析</h2>
          <p style="font-size:0.875rem;color:var(--gray-600);margin-bottom:1.5rem;line-height:1.6">
            Kestrel Metal 使用 <strong>Umami</strong> 进行网站访客分析，包括世界地图、实时访客、设备信息等。
          </p>
          <ol style="padding-left:1.25rem;margin:0 0 1.5rem;line-height:2;color:var(--gray-700);font-size:0.875rem">
            <li>访问 <a href="https://umami.is" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none">https://umami.is</a> 注册 Umami Cloud 账号（免费）</li>
            <li>在 Umami 后台添加网站 <code style="background:var(--gray-100);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.8125rem">www.kestrelmetal.com</code></li>
            <li>复制 Website ID</li>
            <li>前往 <a href="#/settings" style="color:var(--primary);text-decoration:none">系统设置 → 数据埋点</a> → 粘贴 Website ID</li>
          </ol>
          <a href="#/settings" class="btn" style="display:inline-block;text-decoration:none">前往系统设置 →</a>
        </div>
      </div>
    `;
  }
});
