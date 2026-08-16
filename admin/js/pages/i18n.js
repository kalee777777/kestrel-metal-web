Router.register('/i18n', async function (container) {
  let translations = [];

  async function loadTranslations() {
    try {
      translations = await API.get('/api/i18n/all');
      renderTable();
    } catch (err) {
      API.toast('加载翻译失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('i18nTableBody');
    tbody.innerHTML = translations.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.module || '-'}</td>
        <td>${t.key}</td>
        <td>${t.en ? t.en.slice(0, 40) + (t.en.length > 40 ? '...' : '') : '<span style="color:var(--danger)">缺失</span>'}</td>
        <td>${t.zh ? t.zh.slice(0, 40) + (t.zh.length > 40 ? '...' : '') : '<span style="color:var(--danger)">缺失</span>'}</td>
        <td><span class="badge ${t.is_active ? 'badge-success' : 'badge-danger'}">${t.is_active ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editTranslation(${t.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTranslation(${t.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editTranslation = async (id) => {
    const t = translations.find(x => x.id === id);
    if (!t) return;
    document.getElementById('i18nForm').reset();
    document.getElementById('i18nForm').id.value = t.id;
    document.getElementById('i18nForm').key.value = t.key;
    document.getElementById('i18nForm').en.value = t.en || '';
    document.getElementById('i18nForm').zh.value = t.zh || '';
    document.getElementById('i18nForm').module.value = t.module || '';
    document.getElementById('i18nForm').is_active.checked = t.is_active;
    document.getElementById('i18nModalTitle').textContent = '编辑翻译';
    document.getElementById('i18nModal').classList.add('show');
  };

  window.deleteTranslation = async (id) => {
    if (!confirm('确定要删除这个翻译吗？')) return;
    try {
      await API.delete(`/api/i18n/${id}`);
      API.toast('翻译删除成功', 'success');
      await loadTranslations();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddTranslation = () => {
    document.getElementById('i18nForm').reset();
    document.getElementById('i18nForm').id.value = '';
    document.getElementById('i18nModalTitle').textContent = '新增翻译';
    document.getElementById('i18nModal').classList.add('show');
  };

  window.closeI18nModal = () => {
    document.getElementById('i18nModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>国际化管理</h1>
      <button class="btn btn-primary" onclick="openAddTranslation()">+ 新增翻译</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>模块</th><th>Key</th><th>English</th><th>中文</th><th>状态</th><th>操作</th></tr>
        </thead>
        <tbody id="i18nTableBody"></tbody>
      </table>
    </div>
    <div id="i18nModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="i18nModalTitle">新增翻译</div><button class="modal-close" onclick="closeI18nModal()">×</button></div>
        <div class="modal-body">
          <form id="i18nForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>Key *</label><input type="text" name="key" class="form-control" required></div>
            <div class="form-group"><label>English</label><textarea name="en" class="form-control"></textarea></div>
            <div class="form-group"><label>中文</label><textarea name="zh" class="form-control"></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group"><label>模块</label><input type="text" name="module" class="form-control"></div>
              <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
            </div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeI18nModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('i18nForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  document.getElementById('i18nForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/i18n/${id}`, data);
      else await API.post('/api/i18n', data);
      API.toast(id ? '翻译更新成功' : '翻译创建成功', 'success');
      closeI18nModal();
      await loadTranslations();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadTranslations();
});