Router.register('/cases', async function (container) {
  let cases = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let statusFilter = '';

  async function loadCases(page = 1) {
    try {
      const params = new URLSearchParams({ page, pageSize: 20 });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await API.get(`/api/cases?${params}`);
      cases = res.data;
      currentPage = res.page;
      totalPages = res.totalPages;
      renderTable();
      renderPagination();
    } catch (err) {
      API.toast('加载案例失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('caseTableBody');
    tbody.innerHTML = cases.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${c.cover_image ? `<img src="${c.cover_image}" style="width:60px;height:60px;border-radius:4px;object-fit:cover">` : ''}</td>
        <td>${c.title}</td>
        <td>${c.client || '-'}</td>
        <td>${c.location || '-'}</td>
        <td>${c.category || '-'}</td>
        <td><span class="badge ${c.status === 'published' ? 'badge-success' : 'badge-warning'}">${c.status === 'published' ? '已发布' : '草稿'}</span></td>
        <td>${c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editCase(${c.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCase(${c.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    let html = '';
    html += `<button onclick="loadCases(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="loadCases(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    html += `<button onclick="loadCases(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = html;
  }

  window.editCase = async (id) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;

    const form = document.getElementById('caseForm');
    form.reset();
    form.id.value = c.id;
    form.title.value = c.title;
    form.slug.value = c.slug;
    form.description.value = c.description || '';
    form.content_md.value = c.content_md || '';
    form.cover_image.value = c.cover_image || '';
    form.client.value = c.client || '';
    form.location.value = c.location || '';
    form.category.value = c.category || '';
    form.status.value = c.status || 'draft';
    document.getElementById('caseModalTitle').textContent = '编辑案例';
    document.getElementById('caseModal').classList.add('show');
  };

  window.deleteCase = async (id) => {
    if (!confirm('确定要删除这个案例吗？')) return;
    try {
      await API.delete(`/api/cases/${id}`);
      API.toast('案例删除成功', 'success');
      await loadCases(currentPage);
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddCase = () => {
    document.getElementById('caseForm').reset();
    document.getElementById('caseForm').id.value = '';
    document.getElementById('caseModalTitle').textContent = '新增案例';
    document.getElementById('caseModal').classList.add('show');
  };

  window.closeCaseModal = () => {
    document.getElementById('caseModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>案例研究</h1>
      <button class="btn btn-primary" onclick="openAddCase()">+ 新增案例</button>
    </div>

    <div class="filter-bar">
      <input type="text" id="searchInput" class="form-control search" placeholder="搜索案例标题..." onkeyup="handleSearch(event)">
      <select id="statusFilter" class="form-control" onchange="handleStatusFilter(this.value)">
        <option value="">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>
      <button class="btn" onclick="handleReset()">重置</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>封面</th>
            <th>标题</th>
            <th>客户</th>
            <th>地点</th>
            <th>分类</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="caseTableBody"></tbody>
      </table>
    </div>

    <div id="pagination" class="pagination"></div>

    <div id="caseModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <div class="modal-title" id="caseModalTitle">新增案例</div>
          <button class="modal-close" onclick="closeCaseModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="caseForm">
            <input type="hidden" name="id">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group">
                <label>标题 *</label>
                <input type="text" name="title" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Slug *</label>
                <input type="text" name="slug" class="form-control" required>
              </div>
              <div class="form-group">
                <label>客户</label>
                <input type="text" name="client" class="form-control">
              </div>
              <div class="form-group">
                <label>地点</label>
                <input type="text" name="location" class="form-control">
              </div>
              <div class="form-group">
                <label>分类</label>
                <input type="text" name="category" class="form-control">
              </div>
              <div class="form-group">
                <label>封面图片 URL</label>
                <input type="text" name="cover_image" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea name="description" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label>内容 (Markdown)</label>
              <textarea name="content_md" class="form-control" style="min-height:300px"></textarea>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select name="status" class="form-control">
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeCaseModal()">取消</button>
          <button class="btn btn-primary" id="caseFormSubmitBtn">保存</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('caseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      content_md: formData.get('content_md') || null,
      cover_image: formData.get('cover_image') || null,
      client: formData.get('client') || null,
      location: formData.get('location') || null,
      category: formData.get('category') || null,
      status: formData.get('status') || 'draft'
    };

    const id = formData.get('id');
    try {
      if (id) {
        await API.put(`/api/cases/${id}`, data);
        API.toast('案例更新成功', 'success');
      } else {
        await API.post('/api/cases', data);
        API.toast('案例创建成功', 'success');
      }
      closeCaseModal();
      await loadCases(currentPage);
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  document.getElementById('caseFormSubmitBtn').addEventListener('click', () => {
    document.getElementById('caseForm').requestSubmit();
  });

  window.handleSearch = (e) => {
    if (e.key === 'Enter') {
      searchQuery = e.target.value;
      loadCases(1);
    }
  };

  window.handleStatusFilter = (val) => {
    statusFilter = val;
    loadCases(1);
  };

  window.handleReset = () => {
    searchQuery = '';
    statusFilter = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    loadCases(1);
  };

  await loadCases();
});