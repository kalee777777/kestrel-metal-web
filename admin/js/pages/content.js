Router.register('/content', async function (container) {
  let currentTab = 'drafts';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function getStatusBadge(status) {
    const badges = {
      queued: '<span class="badge badge-info">待处理</span>',
      generating: '<span class="badge badge-warning">生成中</span>',
      image_gen: '<span class="badge badge-warning">图片生成中</span>',
      scoring: '<span class="badge badge-info">评分中</span>',
      deploying: '<span class="badge badge-success">部署中</span>',
      published: '<span class="badge badge-success">已发布</span>',
      skipped: '<span class="badge badge-secondary">已跳过</span>',
    };
    return badges[status] || status;
  }

  async function loadDrafts() {
    const data = await API.get('/api/content/drafts');
    return (data && data.drafts) || [];
  }

  async function loadPublished() {
    const data = await API.get('/api/content/published');
    return (data && data.published) || [];
  }

  async function triggerGeneration() {
    return await API.post('/api/trigger/generate', {});
  }

  async function load() {
    let content = '';

    if (currentTab === 'drafts') {
      const drafts = await loadDrafts();
      content = `
        <div class="page-header">
          <div><h1>内容草稿</h1><p class="text-muted">AI 生成的文章草稿</p></div>
          <div class="btn-group">
            <button class="btn btn-primary" id="triggerGenerate">生成新文章</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">总草稿数</div><div class="stat-value">${drafts.length}</div></div>
          <div class="stat-card"><div class="stat-label">待处理</div><div class="stat-value" style="color:#3b82f6">${drafts.filter(d => d.status === 'queued').length}</div></div>
          <div class="stat-card"><div class="stat-label">评分中</div><div class="stat-value" style="color:#f59e0b">${drafts.filter(d => d.status === 'scoring').length}</div></div>
        </div>

        <div class="card">
          <div class="card-body">
            ${drafts.length > 0 ? `
              <div class="table-wrap">
                <table>
                  <thead><tr><th>标题</th><th>关键词</th><th>状态</th><th>评分</th><th>创建时间</th><th>操作</th></tr></thead>
                  <tbody>
                    ${drafts.map(draft => `
                      <tr>
                        <td><strong>${escapeHtml(draft.title)}</strong></td>
                        <td>${escapeHtml(draft.keyword)}</td>
                        <td>${getStatusBadge(draft.status)}</td>
                        <td>${draft.score ? `${draft.score}/100` : '-'}</td>
                        <td>${new Date(draft.createdAt).toLocaleDateString()}</td>
                        <td><button class="btn btn-sm" onclick="previewDraft('${escapeHtml(draft.slug)}')">预览</button></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="empty-state"><p>暂无草稿</p><p style="color:#999;font-size:13px">点击"生成新文章"开始 AI 内容生成</p></div>'}
          </div>
        </div>`;
    } else {
      const published = await loadPublished();
      content = `
        <div class="page-header">
          <div><h1>已发布内容</h1><p class="text-muted">已部署到生产环境的文章</p></div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">已发布</div><div class="stat-value" style="color:#10b981">${published.length}</div></div>
        </div>

        <div class="card">
          <div class="card-body">
            ${published.length > 0 ? `
              <div class="table-wrap">
                <table>
                  <thead><tr><th>标题</th><th>关键词</th><th>评分</th><th>发布日期</th><th>操作</th></tr></thead>
                  <tbody>
                    ${published.map(item => `
                      <tr>
                        <td><strong>${escapeHtml(item.title)}</strong></td>
                        <td>${escapeHtml(item.keyword)}</td>
                        <td>${item.score ? `${item.score}/100` : '-'}</td>
                        <td>${new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</td>
                        <td><a href="https://kestrelmetal.com/blog/${escapeHtml(item.slug)}.html" target="_blank" class="btn btn-sm">查看</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div class="empty-state"><p>暂无已发布内容</p></div>'}
          </div>
        </div>`;
    }

    container.innerHTML = content;

    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        load().catch(error => API.toast(error.message, 'error'));
      });
    });

    const triggerBtn = document.getElementById('triggerGenerate');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', async () => {
        try {
          API.toast('开始生成文章...', 'info');
          await triggerGeneration();
          API.toast('文章生成任务已触发', 'success');
          setTimeout(() => load().catch(() => {}), 2000);
        } catch (error) {
          API.toast(error.message, 'error');
        }
      });
    }
  }

  await load();
});

window.previewDraft = async function(slug) {
  try {
    const draft = await API.get('/api/content/drafts/' + slug);
    if (!draft) {
      API.toast('草稿未找到', 'error');
      return;
    }

    // Remove existing modal
    const existing = document.getElementById('draftPreviewModal');
    if (existing) existing.remove();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'draftPreviewModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:8px;width:100%;max-width:800px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e5e7eb;';
    header.innerHTML = '<h3 style="margin:0;font-size:16px;">预览: ' + (draft.title || '') + '</h3>';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'border:none;background:none;font-size:20px;cursor:pointer;color:#666;padding:4px 8px;';
    closeBtn.onclick = function() { overlay.remove(); };
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'padding:20px;overflow-y:auto;flex:1;';
    body.innerHTML = draft.html || '<p>暂无内容</p>';

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  } catch (error) {
    API.toast('预览失败: ' + error.message, 'error');
  }
};
