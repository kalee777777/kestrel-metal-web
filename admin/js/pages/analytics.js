Router.register('/analytics', async function (container) {
  async function loadSummary() {
    try {
      const data = await API.get('/api/analytics/summary');
      renderSummary(data);
    } catch (err) {
      API.toast('加载数据失败: ' + err.message, 'error');
    }
  }

  function renderSummary(data) {
    const fmt = (n) => n.toLocaleString('en-US');
    const fmtDuration = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m + ':' + String(s).padStart(2, '0');
    };

    document.getElementById('statGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-label">总页面浏览</div>
        <div class="stat-card-value">${fmt(data.totals.pageviews)}</div>
        <div class="stat-card-delta">本周 ${fmt(data.weekly.pageviews)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">总访客数</div>
        <div class="stat-card-value">${fmt(data.totals.visitors)}</div>
        <div class="stat-card-delta">本周 ${fmt(data.weekly.visitors)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">今日访问</div>
        <div class="stat-card-value">${fmt(data.today.pageviews)}</div>
        <div class="stat-card-delta">访客 ${fmt(data.today.visitors)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">平均停留时长</div>
        <div class="stat-card-value">${fmtDuration(data.weekly.avgDuration)}</div>
        <div class="stat-card-delta">跳出率 ${data.weekly.bounceRate}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">本月访问</div>
        <div class="stat-card-value">${fmt(data.monthly.pageviews)}</div>
        <div class="stat-card-delta">访客 ${fmt(data.monthly.visitors)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">转化事件</div>
        <div class="stat-card-value">${fmt(data.totals.conversions)}</div>
        <div class="stat-card-delta">询盘、下载等</div>
      </div>
    `;

    renderTopPages(data.topPages);
    renderTopCountries(data.topCountries);
  }

  function renderTopPages(pages) {
    const container = document.getElementById('topPagesContainer');
    if (!pages || pages.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>排名</th>
              <th>页面 URL</th>
              <th>访问次数</th>
            </tr>
          </thead>
          <tbody>
            ${pages.slice(0, 10).map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.url}</td>
                <td>${p.count.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderTopCountries(countries) {
    const container = document.getElementById('topCountriesContainer');
    if (!countries || countries.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无数据</p></div>';
      return;
    }

    const total = countries.reduce((sum, c) => sum + c.count, 0);

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${countries.slice(0, 10).map(c => {
              const percent = total > 0 ? Math.round((c.count / total) * 100) : 0;
              return `
                <div style="display:flex;align-items:center;gap:0.75rem">
                  <div style="width:24px;text-align:center;font-size:0.875rem">${getFlag(c.country)}</div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem">
                      <span style="font-size:0.875rem">${c.country}</span>
                      <span style="font-size:0.8125rem;color:var(--gray-500)">${c.count.toLocaleString()} (${percent}%)</span>
                    </div>
                    <div style="height:4px;background:var(--gray-200);border-radius:2px;overflow:hidden">
                      <div style="height:100%;width:${percent}%;background:var(--primary);border-radius:2px"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function getFlag(country) {
    const flags = {
      'US': '🇺🇸', 'CN': '🇨🇳', 'GB': '🇬🇧', 'DE': '🇩🇪', 'AU': '🇦🇺',
      'CA': '🇨🇦', 'JP': '🇯🇵', 'KR': '🇰🇷', 'FR': '🇫🇷', 'IT': '🇮🇹',
      'ES': '🇪🇸', 'NL': '🇳🇱', 'BE': '🇧🇪', 'IE': '🇮🇪', 'SG': '🇸🇬',
      'MY': '🇲🇾', 'TH': '🇹🇭', 'VN': '🇻🇳', 'RU': '🇷🇺', 'UA': '🇺🇦',
      'Unknown': '🌍'
    };
    return flags[country] || '🌍';
  }

  async function loadTrendData() {
    try {
      const [pageviews, visitors] = await Promise.all([
        API.get('/api/analytics/pageviews?days=30'),
        API.get('/api/analytics/visitors?days=30')
      ]);
      renderTrendChart(pageviews, visitors);
    } catch (err) {
      console.error('Load trend data failed:', err);
    }
  }

  function renderTrendChart(pageviews, visitors) {
    const container = document.getElementById('trendChart');
    if (!pageviews || !visitors || pageviews.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无趋势数据</p></div>';
      return;
    }

    const dates = [...new Set([...pageviews.map(p => p.date), ...visitors.map(v => v.date)])].sort();

    const pvData = dates.map(d => {
      const p = pageviews.find(x => x.date === d);
      return p ? p.count : 0;
    });

    const vData = dates.map(d => {
      const v = visitors.find(x => x.date === d);
      return v ? v.count : 0;
    });

    const maxPV = Math.max(...pvData);
    const maxV = Math.max(...vData);

    const pvLines = pvData.map((v, i) => {
      const x = (i / (dates.length - 1)) * 100;
      const y = 100 - (v / maxPV) * 100;
      return `${x},${y}`;
    }).join(' ');

    const vLines = vData.map((v, i) => {
      const x = (i / (dates.length - 1)) * 100;
      const y = 100 - (v / maxV) * 100;
      return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div style="height:240px;position:relative">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pvGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:rgba(255,107,53,0.3)"/>
                  <stop offset="100%" style="stop-color:rgba(255,107,53,0)"/>
                </linearGradient>
                <linearGradient id="vGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:rgba(59,130,246,0.3)"/>
                  <stop offset="100%" style="stop-color:rgba(59,130,246,0)"/>
                </linearGradient>
              </defs>
              ${[0, 25, 50, 75, 100].map(y => `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="#e5e7eb" stroke-width="0.2"/>`).join('')}
              <polyline points="${pvLines}" fill="none" stroke="#ff6b35" stroke-width="0.5"/>
              <polyline points="${pvLines} 100,${pvLines.split(' ')[0].split(',')[1]} 100,${pvLines.split(' ').pop().split(',')[1]}" fill="url(#pvGradient)"/>
              <polyline points="${vLines}" fill="none" stroke="#3B82F6" stroke-width="0.5"/>
              <polyline points="${vLines} 100,${vLines.split(' ')[0].split(',')[1]} 100,${vLines.split(' ').pop().split(',')[1]}" fill="url(#vGradient)"/>
            </svg>
            <div style="display:flex;justify-content:center;gap:2rem;margin-top:0.5rem">
              <div style="display:flex;align-items:center;gap:0.5rem">
                <div style="width:12px;height:2px;background:#ff6b35"></div>
                <span style="font-size:0.75rem">页面浏览</span>
              </div>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <div style="width:12px;height:2px;background:#3B82F6"></div>
                <span style="font-size:0.75rem">访客数</span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:0.5rem;font-size:0.6875rem;color:var(--gray-500)">
              <span>${dates[0]}</span>
              <span>${dates[Math.floor(dates.length / 2)]}</span>
              <span>${dates[dates.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadEvents() {
    try {
      const events = await API.get('/api/analytics/events');
      renderEvents(events);
    } catch (err) {
      console.error('Load events failed:', err);
    }
  }

  function renderEvents(events) {
    const container = document.getElementById('eventsContainer');
    if (!events || events.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>暂无事件记录</p></div>';
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:0.5rem">
            ${events.slice(0, 20).map(e => {
              const time = new Date(e.created_at).toLocaleString();
              const typeColor = e.event_type === 'inquiry_submitted' ? 'var(--success)' :
                                e.event_type === 'download' ? 'var(--info)' :
                                e.event_type === 'click' ? 'var(--warning)' : 'var(--gray-500)';
              return `
                <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem;border-bottom:1px solid var(--gray-100)">
                  <div style="width:8px;height:8px;border-radius:50%;background:${typeColor}"></div>
                  <div style="flex:1">
                    <div style="display:flex;justify-content:space-between">
                      <span style="font-size:0.8125rem;font-weight:500">${e.event_type.replace('_', ' ')}</span>
                      <span style="font-size:0.75rem;color:var(--gray-500)">${time}</span>
                    </div>
                    <div style="font-size:0.75rem;color:var(--gray-600)">${e.page_url}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="page-header">
      <h1>访客分析</h1>
      <button class="btn" onclick="loadAnalytics()">🔄 刷新数据</button>
    </div>

    <div id="statGrid" class="stat-grid">
      <div class="loading">加载中...</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
      <div id="trendChart"></div>
      <div style="display:flex;flex-direction:column;gap:1rem">
        <div>
          <h3 style="font-size:0.9375rem;font-weight:600;margin-bottom:0.75rem">热门页面 TOP 10</h3>
          <div id="topPagesContainer"></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <h3 style="font-size:0.9375rem;font-weight:600;margin-bottom:0.75rem">访客国家分布</h3>
        <div id="topCountriesContainer"></div>
      </div>
      <div>
        <h3 style="font-size:0.9375rem;font-weight:600;margin-bottom:0.75rem">最近转化事件</h3>
        <div id="eventsContainer"></div>
      </div>
    </div>
  `;

  window.loadAnalytics = async () => {
    await loadSummary();
    await loadTrendData();
    await loadEvents();
  };

  await loadAnalytics();
});