Router.register('/products', async function (container) {
  let products = [];
  let categories = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let categoryFilter = '';

  async function loadCategories() {
    try {
      categories = await API.get('/api/product-categories/all');
    } catch (err) {
      console.error('Load categories failed:', err);
    }
  }

  async function loadProducts(page = 1) {
    try {
      const params = new URLSearchParams({ page, pageSize: 20 });
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter) params.append('category_id', categoryFilter);

      const res = await API.get(`/api/products/admin/list?${params}`);
      products = res.data;
      currentPage = res.page;
      totalPages = res.totalPages;
      renderTable();
      renderPagination();
    } catch (err) {
      API.toast('加载产品失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.cover_image ? `<img src="${p.cover_image}" style="width:60px;height:60px;border-radius:4px;object-fit:cover">` : ''}</td>
        <td>${p.name}</td>
        <td>${p.category?.name || '-'}</td>
        <td>${p.slug}</td>
        <td>${p.price_range || '-'}</td>
        <td><span class="badge ${p.is_active ? 'badge-success' : 'badge-danger'}">${p.is_active ? '上架' : '下架'}</span></td>
        <td><span class="badge ${p.is_featured ? 'badge-info' : 'badge-gray'}">${p.is_featured ? '推荐' : '-'}</span></td>
        <td>${p.images?.length || 0}</td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editProduct(${p.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">删除</button>
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
    html += `<button onclick="loadProducts(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="loadProducts(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    html += `<button onclick="loadProducts(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = html;
  }

  window.editProduct = async (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;

    const form = document.getElementById('productForm');
    form.reset();
    form.id.value = p.id;
    form.category_id.value = p.category_id;
    form.name.value = p.name;
    form.slug.value = p.slug;
    form.subtitle.value = p.subtitle || '';
    form.description.value = p.description || '';
    form.specifications.value = p.specifications || '';
    form.price_range.value = p.price_range || '';
    form.meta_title.value = p.meta_title || '';
    form.meta_description.value = p.meta_description || '';
    form.cover_image.value = p.cover_image || '';
    form.is_featured.checked = p.is_featured;
    form.is_active.checked = p.is_active;
    form.sort_order.value = p.sort_order;
    document.getElementById('productModalTitle').textContent = '编辑产品';
    document.getElementById('productModal').classList.add('show');
  };

  window.deleteProduct = async (id) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    try {
      await API.delete(`/api/products/${id}`);
      API.toast('产品删除成功', 'success');
      await loadProducts(currentPage);
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddProduct = () => {
    document.getElementById('productForm').reset();
    document.getElementById('productForm').id.value = '';
    document.getElementById('productModalTitle').textContent = '新增产品';
    document.getElementById('productModal').classList.add('show');
  };

  window.closeProductModal = () => {
    document.getElementById('productModal').classList.remove('show');
    document.getElementById('productModal').classList.remove('show');
  };

  await loadCategories();

  const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  container.innerHTML = `
    <div class="page-header">
      <h1>产品管理</h1>
      <button class="btn btn-primary" onclick="openAddProduct()">+ 新增产品</button>
    </div>

    <div class="filter-bar">
      <input type="text" id="searchInput" class="form-control search" placeholder="搜索产品名称..." onkeyup="handleSearch(event)">
      <select id="categoryFilter" class="form-control" onchange="handleCategoryFilter(this.value)">
        <option value="">全部分类</option>
        ${categoryOptions}
      </select>
      <button class="btn" onclick="handleReset()">重置</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>封面</th>
            <th>名称</th>
            <th>分类</th>
            <th>Slug</th>
            <th>价格区间</th>
            <th>状态</th>
            <th>推荐</th>
            <th>图片数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="productTableBody"></tbody>
      </table>
    </div>

    <div id="pagination" class="pagination"></div>

    <div id="productModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <div class="modal-title" id="productModalTitle">新增产品</div>
          <button class="modal-close" onclick="closeProductModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="productForm">
            <input type="hidden" name="id">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group">
                <label>分类 *</label>
                <select name="category_id" class="form-control" required>
                  <option value="">请选择分类</option>
                  ${categoryOptions}
                </select>
              </div>
              <div class="form-group">
                <label>排序</label>
                <input type="number" name="sort_order" class="form-control" value="0">
              </div>
              <div class="form-group">
                <label>名称 *</label>
                <input type="text" name="name" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Slug *</label>
                <input type="text" name="slug" class="form-control" required>
              </div>
              <div class="form-group">
                <label>副标题</label>
                <input type="text" name="subtitle" class="form-control">
              </div>
              <div class="form-group">
                <label>价格区间</label>
                <input type="text" name="price_range" class="form-control" placeholder="如: $50-$150">
              </div>
              <div class="form-group">
                <label>封面图片 URL</label>
                <input type="text" name="cover_image" class="form-control">
              </div>
              <div class="form-group">
                <label>Meta Title</label>
                <input type="text" name="meta_title" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label>Meta Description</label>
              <textarea name="meta_description" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label>产品描述</label>
              <textarea name="description" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label>规格参数</label>
              <textarea name="specifications" class="form-control"></textarea>
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="is_featured"> 设为推荐</label>
              <label style="margin-left:1rem"><input type="checkbox" name="is_active" checked> 上架</label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeProductModal()">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('productForm').submit()">保存</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      category_id: parseInt(formData.get('category_id')),
      name: formData.get('name'),
      slug: formData.get('slug'),
      subtitle: formData.get('subtitle') || null,
      description: formData.get('description') || null,
      specifications: formData.get('specifications') || null,
      price_range: formData.get('price_range') || null,
      meta_title: formData.get('meta_title') || null,
      meta_description: formData.get('meta_description') || null,
      cover_image: formData.get('cover_image') || null,
      is_featured: formData.get('is_featured') === 'on',
      is_active: formData.get('is_active') === 'on',
      sort_order: parseInt(formData.get('sort_order')) || 0
    };

    const id = formData.get('id');
    try {
      if (id) {
        await API.put(`/api/products/${id}`, data);
        API.toast('产品更新成功', 'success');
      } else {
        await API.post('/api/products', data);
        API.toast('产品创建成功', 'success');
      }
      closeProductModal();
      await loadProducts(currentPage);
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  window.handleSearch = (e) => {
    if (e.key === 'Enter') {
      searchQuery = e.target.value;
      loadProducts(1);
    }
  };

  window.handleCategoryFilter = (val) => {
    categoryFilter = val;
    loadProducts(1);
  };

  window.handleReset = () => {
    searchQuery = '';
    categoryFilter = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    loadProducts(1);
  };

  await loadProducts();
});
