Router.register('/analytics', async function (container) {
  let settings = {};
  try {
    const raw = localStorage.getItem('km_admin_site_settings');
    if (raw) settings = JSON.parse(raw);
  } catch (_) {}

  const ga4Id = settings.ga4_measurement_id || '';
  const umamiWebsiteId = settings.umami_website_id || '';
  const umamiDomain = (settings.umami_domain || '').replace(/\/+$/, '');

  const hasGA4 = !!ga4Id;
  const hasUmami = !!umamiWebsiteId;

  let html = `
    <div class="page-header">
      <h1>访客分析</h1>
      <div style="display:flex;gap:0.5rem">
        ${hasUmami ? `<a href="${umamiDomain || 'https://cloud.umami.is'}/share/${umamiWebsiteId}" target="_blank" rel="noopener" class="btn" style="text-decoration:none;font-size:0.875rem">📊 Umami 实时仪表板</a>` : ''}
        ${hasGA4 ? `<a href="https://analytics.google.com/analytics/web/#/p${ga4Id.replace('G-', '')}/realtime" target="_blank" rel="noopener" class="btn" style="text-decoration:none;font-size:0.875rem">📈 GA4 实时报告</a>` : ''}
        ${hasGA4 ? `<a href="https://analytics.google.com/analytics/web/#/p${ga4Id.replace('G-', '')}/reports" target="_blank" rel="noopener" class="btn" style="text-decoration:none;font-size:0.875rem">🔍 GA4 完整报告</a>` : ''}
      </div>
    </div>
  `;

  // Status Cards
  html += `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
      <div class="card" style="border-left:4px solid #10b981">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
            <div style="font-size:2rem">🌍</div>
            <div>
              <div style="font-weight:600;color:var(--gray-800)">Umami</div>
              <div style="font-size:0.8125rem;color:var(--gray-500)">开源网站分析</div>
            </div>
            <div style="margin-left:auto;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.75rem;font-weight:500;background:${hasUmami ? '#d1fae5;color:#065f46' : '#fee2e2;color:#991b1b'}">
              ${hasUmami ? '✅ 已配置' : '❌ 未配置'}
            </div>
          </div>
          <ul style="font-size:0.875rem;color:var(--gray-600);line-height:1.8;padding-left:1.25rem;margin:0">
            <li>🗺️ 世界地图 - 实时访客位置</li>
            <li>📈 实时监控 - 当前在线访客</li>
            <li>📱 设备分析 - 浏览器/系统/设备</li>
            <li>🔗 来源分析 - 流量渠道追踪</li>
            <li>📄 热门页面 - 访问量排行</li>
          </ul>
          ${hasUmami ? `<div style="margin-top:1rem;font-size:0.8125rem;color:var(--gray-400)">Website ID: <code style="background:var(--gray-100);padding:0.15rem 0.4rem;border-radius:4px">${umamiWebsiteId}</code></div>` : ''}
        </div>
      </div>
      
      <div class="card" style="border-left:4px solid #3b82f6">
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem">
            <div style="font-size:2rem">📊</div>
            <div>
              <div style="font-weight:600;color:var(--gray-800)">Google Analytics (GA4)</div>
              <div style="font-size:0.8125rem;color:var(--gray-500)">Google 官方分析</div>
            </div>
            <div style="margin-left:auto;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.75rem;font-weight:500;background:${hasGA4 ? '#dbeafe;color:#1e40af' : '#fee2e2;color:#991b1b'}">
              ${hasGA4 ? '✅ 已配置' : '❌ 未配置'}
            </div>
          </div>
          <ul style="font-size:0.875rem;color:var(--gray-600);line-height:1.8;padding-left:1.25rem;margin:0">
            <li>🔎 搜索分析 - Google 搜索排名</li>
            <li>🎯 转化追踪 - 用户行为分析</li>
            <li>👥 受众洞察 - 用户画像/兴趣</li>
            <li>📱 跨设备分析 - 多设备用户旅程</li>
            <li>💰 广告效果 - Google Ads 联动</li>
          </ul>
          ${hasGA4 ? `<div style="margin-top:1rem;font-size:0.8125rem;color:var(--gray-400)">Measurement ID: <code style="background:var(--gray-100);padding:0.15rem 0.4rem;border-radius:4px">${ga4Id}</code></div>` : ''}
        </div>
      </div>
    </div>
  `;

  // Quick Actions
  html += `
    <div class="card" style="margin-top:1.5rem">
      <div class="card-header">
        <div class="card-title">快速操作</div>
      </div>
      <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
        ${hasUmami ? `<a href="${umamiDomain || 'https://cloud.umami.is'}/share/${umamiWebsiteId}" target="_blank" rel="noopener" class="btn" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none">🌍 打开 Umami 仪表板</a>` : `<a href="#/settings" class="btn" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none;background:var(--gray-100)">🌍 配置 Umami 分析</a>`}
        ${hasGA4 ? `<a href="https://analytics.google.com/analytics/web/#/p${ga4Id.replace('G-', '')}/reports" target="_blank" rel="noopener" class="btn" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none">📊 打开 GA4 报告</a>` : `<a href="#/settings" class="btn" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none;background:var(--gray-100)">📊 配置 GA4 分析</a>`}
      </div>
    </div>
  `;

  // Feature Comparison
  html += `
    <div class="card" style="margin-top:1.5rem">
      <div class="card-header">
        <div class="card-title">功能对比 - 为什么要两个？</div>
      </div>
      <div class="card-body" style="padding:0">
        <table style="width:100%;border-collapse:collapse;font-size:0.875rem">
          <thead>
            <tr style="background:var(--gray-50);border-bottom:1px solid var(--gray-200)">
              <th style="padding:1rem;text-align:left;font-weight:600">功能</th>
              <th style="padding:1rem;text-align:center;font-weight:600">Umami</th>
              <th style="padding:1rem;text-align:center;font-weight:600">GA4</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">🗺️ 世界地图实时展示</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ 内置</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#6b7280">需自建报表</td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">🔎 Google 搜索关键词</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#6b7280">无</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ Search Console 联动</td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">👥 用户画像/兴趣分析</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#6b7280">基础</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ 完整用户画像</td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">🎯 转化漏斗分析</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#6b7280">基础</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ 高级漏斗</td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">💰 广告效果追踪</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#6b7280">无</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ Google Ads 联动</td>
            </tr>
            <tr style="border-bottom:1px solid var(--gray-100)">
              <td style="padding:0.75rem 1rem">🔒 隐私合规 (GDPR)</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#10b981">✅ 无需 Cookie</td>
              <td style="padding:0.75rem 1rem;text-align:center;color:#f59e0b">⚠️ 需 Cookie 同意</td>
            </tr>
            <tr>
              <td style="padding:0.75rem 1rem">💵 免费额度</td>
              <td style="padding:0.75rem 1rem;text-align:center">月 10,000 PV</td>
              <td style="padding:0.75rem 1rem;text-align:center">无限</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Setup Instructions (if not configured)
  if (!hasGA4 || !hasUmami) {
    html += `
      <div class="card" style="margin-top:1.5rem;border-left:4px solid #f59e0b">
        <div class="card-body" style="padding:1.5rem">
          <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--gray-800)">⚠️ 部分分析工具未配置</h3>
          <div style="font-size:0.875rem;color:var(--gray-600);line-height:1.8">
            ${!hasGA4 ? `<p><strong>Google Analytics (GA4):</strong> 访问 <a href="https://analytics.google.com" target="_blank" rel="noopener" style="color:var(--primary)">analytics.google.com</a> → 管理 → 数据流 → 获取 Measurement ID</p>` : ''}
            ${!hasUmami ? `<p><strong>Umami:</strong> 访问 <a href="https://umami.is" target="_blank" rel="noopener" style="color:var(--primary)">umami.is</a> 注册账号 → 添加网站 → 获取 Website ID</p>` : ''}
            <p style="margin-top:1rem">
              <a href="#/settings" class="btn" style="text-decoration:none">前往系统设置 → 数据埋点</a>
            </p>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
});
