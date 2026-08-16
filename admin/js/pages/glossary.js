Router.register('/glossary', async function (container) {
  let terms = [];

  async function loadTerms() {
    try {
      const res = await API.get('/api/glossary/all');
      terms = res;
      renderTable();
    } catch (err) {
      API.toast('加载术语表失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('glossaryTableBody');
    tbody.innerHTML = terms.map(t => `
      <tr>
        <td>${t.term}</td>
        <td>${t.definition}</td>
        <td>${t.category || '-'}</td>
        <td>${t.language || 'English'}</td>
        <td><span class="badge ${t.enabled ? 'badge-success' : 'badge-gray'}">${t.enabled ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editTerm(${t.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTerm(${t.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editTerm = async (id) => {
    const t = terms.find(x => x.id === id);
    if (!t) return;
    const form = document.getElementById('termForm');
    form.reset();
    form.id.value = t.id;
    form.term.value = t.term;
    form.definition.value = t.definition || '';
    form.category.value = t.category || '';
    form.language.value = t.language || 'English';
    form.enabled.checked = t.enabled !== false;
    document.getElementById('termModalTitle').textContent = '编辑术语';
    document.getElementById('termModal').classList.add('show');
  };

  window.deleteTerm = async (id) => {
    if (!confirm('确定要删除这个术语吗？')) return;
    try {
      await API.delete(`/api/glossary/${id}`);
      API.toast('删除成功', 'success');
      await loadTerms();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddTerm = () => {
    const form = document.getElementById('termForm');
    form.reset();
    form.id.value = '';
    form.language.value = 'English';
    form.enabled.checked = true;
    document.getElementById('termModalTitle').textContent = '新增术语';
    document.getElementById('termModal').classList.add('show');
  };

  window.closeTermModal = () => {
    document.getElementById('termModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>术语表</h1>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">术语管理</div>
        <button class="btn btn-primary" onclick="openAddTerm()">+ 新增术语</button>
      </div>
      <div class="card-body">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>术语</th>
                <th>定义</th>
                <th>分类</th>
                <th>语言</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="glossaryTableBody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div id="termModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="termModalTitle">新增术语</div>
          <button class="modal-close" onclick="closeTermModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="termForm">
            <input type="hidden" name="id">
            <div class="form-group">
              <label>术语名称</label>
              <input type="text" name="term" class="form-control" required>
            </div>
            <div class="form-group">
              <label>定义说明</label>
              <textarea name="definition" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label>分类</label>
              <input type="text" name="category" class="form-control">
            </div>
            <div class="form-group">
              <label>语言</label>
              <select name="language" class="form-control">
                <option value="English">English</option>
                <option value="zh-CN">中文</option>
              </select>
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="enabled" checked> 启用</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeTermModal()">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('termForm').submit()">保存</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('termForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      term: formData.get('term'),
      definition: formData.get('definition') || null,
      category: formData.get('category') || null,
      language: formData.get('language') || 'en',
      enabled: formData.get('enabled') === 'on'
    };

    const id = formData.get('id');
    try {
      if (id) {
        await API.put(`/api/glossary/${id}`, data);
        API.toast('术语更新成功', 'success');
      } else {
        await API.post('/api/glossary', data);
        API.toast('术语创建成功', 'success');
      }
      closeTermModal();
      await loadTerms();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadTerms();
});