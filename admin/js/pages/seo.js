Router.register('/seo', async function (container) {
  let metas = [];

  async function loadMetas() {
    try {
      metas = await API.get('/api/seo');
      renderTable();
    } catch (err) {
      API.toast('加载 SEO 数据失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('seoTableBody');
    tbody.innerHTML = metas.map(m => `
      <tr>
        <td>${m.id}</td>
        <td><a href="${m.page_url}" target="_blank">${m.page_url}</a></td>
        <td>${m.meta_title ? m.meta_title.slice(0, 40) + (m.meta_title.length > 40 ? '...' : '') : '-'}</td>
        <td>${m.meta_description ? m.meta_description.slice(0, 50) + (m.meta_description.length > 50 ? '...' : '') : '-'}</td>
        <td>${m.meta_keywords ? m.meta_keywords.slice(0, 40) + (m.meta_keywords.length > 40 ? '...' : '') : '-'}</td>
        <td><span class="badge ${m.noindex ? 'badge-warning' : 'badge-success'}">${m.noindex ? 'NoIndex' : 'Index'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editMeta(${m.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMeta(${m.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editMeta = async (id) => {
    const m = metas.find(x => x.id === id);
    if (!m) return;
    document.getElementById('seoForm').reset();
    document.getElementById('seoForm').id.value = m.id;
    document.getElementById('seoForm').page_url.value = m.page_url;
    document.getElementById('seoForm').title.value = m.title || '';
    document.getElementById('seoForm').meta_title.value = m.meta_title || '';
    document.getElementById('seoForm').meta_description.value = m.meta_description || '';
    document.getElementById('seoForm').meta_keywords.value = m.meta_keywords || '';
    document.getElementById('seoForm').og_image.value = m.og_image || '';
    document.getElementById('seoForm').canonical_url.value = m.canonical_url || '';
    document.getElementById('seoForm').noindex.checked = m.noindex;
    document.getElementById('seoModalTitle').textContent = '编辑 SEO';
    document.getElementById('seoModal').classList.add('show');
  };

  window.deleteMeta = async (id) => {
    if (!confirm('确定要删除这个 SEO 设置吗？')) return;
    try {
      await API.delete(`/api/seo/${id}`);
      API.toast('SEO 删除成功', 'success');
      await loadMetas();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddMeta = () => {
    document.getElementById('seoForm').reset();
    document.getElementById('seoForm').id.value = '';
    document.getElementById('seoModalTitle').textContent = '新增 SEO 设置';
    document.getElementById('seoModal').classList.add('show');
  };

  window.closeSeoModal = () => {
    document.getElementById('seoModal').classList.remove('show');
  };

  window.generateSitemap = async () => {
    try {
      const res = await API.get('/api/seo/generate/sitemap');
      API.toast('Sitemap 生成成功，共 ' + res.file_count + ' 个页面', 'success');
    } catch (err) {
      API.toast('生成失败: ' + err.message, 'error');
    }
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>SEO 管理</h1>
      <div>
        <button class="btn btn-primary" onclick="openAddMeta()">+ 新增 SEO 设置</button>
        <button class="btn" onclick="generateSitemap()">生成 Sitemap</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>页面 URL</th><th>Meta Title</th><th>Meta Description</th><th>Keywords</th><th>索引</th><th>操作</th></tr>
        </thead>
        <tbody id="seoTableBody"></tbody>
      </table>
    </div>
    <div id="seoModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="seoModalTitle">新增 SEO 设置</div><button class="modal-close" onclick="closeSeoModal()">×</button></div>
        <div class="modal-body">
          <form id="seoForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>页面 URL *</label><input type="text" name="page_url" class="form-control" required placeholder="/products/chain-link-fence"></div>
            <div class="form-group"><label>页面标题</label><input type="text" name="title" class="form-control"></div>
            <div class="form-group"><label>Meta Title</label><input type="text" name="meta_title" class="form-control"></div>
            <div class="form-group"><label>Meta Description</label><textarea name="meta_description" class="form-control"></textarea></div>
            <div class="form-group"><label>Meta Keywords</label><input type="text" name="meta_keywords" class="form-control" placeholder="用逗号分隔"></div>
            <div class="form-group"><label>OG Image</label><input type="text" name="og_image" class="form-control"></div>
            <div class="form-group"><label>Canonical URL</label><input type="text" name="canonical_url" class="form-control"></div>
            <div class="form-group"><label><input type="checkbox" name="noindex"> NoIndex</label></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeSeoModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('seoForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  document.getElementById('seoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.noindex = data.noindex === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/seo/${id}`, data);
      else await API.post('/api/seo', data);
      API.toast(id ? 'SEO 更新成功' : 'SEO 创建成功', 'success');
      closeSeoModal();
      await loadMetas();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadMetas();
});