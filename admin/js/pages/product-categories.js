Router.register('/product-categories', async function (container) {
  let categories = [];

  async function loadCategories() {
    try {
      categories = await API.get('/api/product-categories/all');
      renderTable();
    } catch (err) {
      API.toast('加载分类失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('categoryTableBody');
    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td>${cat.image ? `<img src="${cat.image}" style="width:40px;height:40px;border-radius:4px;object-fit:cover">` : ''}</td>
        <td>${cat.name}</td>
        <td>${cat.slug}</td>
        <td>${cat.parent_id ? '子分类' : '主分类'}</td>
        <td>${cat.description || '-'}</td>
        <td><span class="badge ${cat.is_active ? 'badge-success' : 'badge-danger'}">${cat.is_active ? '启用' : '禁用'}</span></td>
        <td>${cat.sort_order}</td>
        <td>${cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '-'}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editCategory(${cat.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editCategory = async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const form = document.getElementById('categoryForm');
    form.reset();
    form.id.value = cat.id;
    form.name.value = cat.name;
    form.slug.value = cat.slug;
    form.description.value = cat.description || '';
    form.parent_id.value = cat.parent_id || '';
    form.sort_order.value = cat.sort_order;
    form.image.value = cat.image || '';
    form.is_active.checked = cat.is_active;
    document.getElementById('categoryModalTitle').textContent = '编辑分类';
    document.getElementById('categoryModal').classList.add('show');
  };

  window.deleteCategory = async (id) => {
    if (!confirm('确定要删除这个分类吗？')) return;
    try {
      await API.delete(`/api/product-categories/${id}`);
      API.toast('分类删除成功', 'success');
      await loadCategories();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddCategory = () => {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryForm').id.value = '';
    document.getElementById('categoryModalTitle').textContent = '新增分类';
    document.getElementById('categoryModal').classList.add('show');
  };

  window.closeModal = () => {
    document.getElementById('categoryModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>产品分类</h1>
      <button class="btn btn-primary" onclick="openAddCategory()">+ 新增分类</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>图标</th>
            <th>名称</th>
            <th>Slug</th>
            <th>层级</th>
            <th>描述</th>
            <th>状态</th>
            <th>排序</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="categoryTableBody"></tbody>
      </table>
    </div>

    <div id="categoryModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="categoryModalTitle">新增分类</div>
          <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="categoryForm">
            <input type="hidden" name="id">
            <div class="form-group">
              <label>名称 *</label>
              <input type="text" name="name" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Slug *</label>
              <input type="text" name="slug" class="form-control" required>
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea name="description" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label>父分类</label>
              <select name="parent_id" class="form-control">
                <option value="">无(作为主分类)</option>
                ${categories.filter(c => !c.parent_id).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>图标图片 URL</label>
              <input type="text" name="image" class="form-control" placeholder="/images/category-icon.png">
            </div>
            <div class="form-group">
              <label>排序</label>
              <input type="number" name="sort_order" class="form-control" value="0">
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="is_active" checked> 启用</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('categoryForm').submit()">保存</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      parent_id: formData.get('parent_id') || null,
      sort_order: parseInt(formData.get('sort_order')) || 0,
      image: formData.get('image') || null,
      is_active: formData.get('is_active') === 'on'
    };

    const id = formData.get('id');
    try {
      if (id) {
        await API.put(`/api/product-categories/${id}`, data);
        API.toast('分类更新成功', 'success');
      } else {
        await API.post('/api/product-categories', data);
        API.toast('分类创建成功', 'success');
      }
      closeModal();
      await loadCategories();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadCategories();
});