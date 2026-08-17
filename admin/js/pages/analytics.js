Router.register('/analytics', async function (container) {
  let settings = {};
  try {
    const raw = localStorage.getItem('km_admin_site_settings');
    if (raw) settings = JSON.parse(raw);
  } catch (_) {}

  const umamiWebsiteId = settings.umami_website_id || '';
  const umamiDomain = (settings.umami_domain || '').replace(/\/+$/, '');

  if (umamiWebsiteId) {
    const shareBase = umamiDomain
      ? umamiDomain + '/share/' + umamiWebsiteId
      : 'https://cloud.umami.is/share/' + umamiWebsiteId;

    container.innerHTML = `
      <div class="page-header">
        <h1>访客分析 <span style="display:inline-block;font-size:0.6875rem;font-weight:500;background:var(--primary);color:#fff;padding:0.15rem 0.5rem;border-radius:4px;margin-left:0.5rem;vertical-align:middle">Umami 驱动</span></h1>
      </div>
      <div style="border-radius:8px;overflow:hidden;background:#fff">
        <iframe src="${shareBase}" style="width:100%;height:calc(100vh - 200px);border:none;border-radius:8px"></iframe>
      </div>
      <p style="margin-top:0.75rem;font-size:0.8125rem;color:var(--gray-500)">数据由 Umami 提供，包含实时访客、地理位置地图、设备信息、热门页面等</p>
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
            Kestrel 使用 <strong>Umami</strong> 进行网站访客分析。Umami 是一款开源、注重隐私的网站分析工具，可替代 Google Analytics。
          </p>
          <ol style="padding-left:1.25rem;margin:0 0 1.5rem;line-height:2;color:var(--gray-700);font-size:0.875rem">
            <li>访问 <a href="https://umami.is" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none">https://umami.is</a> 注册 Umami Cloud 账号（免费）</li>
            <li>在 Umami 后台添加你的网站 <code style="background:var(--gray-100);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.8125rem">https://www.kestrelmetal.com</code></li>
            <li>复制 Website ID</li>
            <li>前往 <a href="#/settings" style="color:var(--primary);text-decoration:none">系统设置 → 数据埋点</a> → 粘贴 Website ID</li>
          </ol>
          <a href="#/settings" class="btn" style="display:inline-block;text-decoration:none">前往系统设置 →</a>
        </div>
      </div>
    `;
  }
});
