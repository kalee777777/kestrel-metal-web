Router.register('/blog', async function (container) {
  let posts = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let statusFilter = '';

  async function loadPosts(page = 1) {
    try {
      const params = new URLSearchParams({ page, pageSize: 20 });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await API.get(`/api/blog?${params}`);
      posts = res.data;
      currentPage = res.page;
      totalPages = res.totalPages;
      renderTable();
      renderPagination();
    } catch (err) {
      API.toast('加载博客失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('blogTableBody');
    tbody.innerHTML = posts.map(p => {
      const tags = p.tags ? JSON.parse(p.tags) : [];
      return `
        <tr>
          <td>${p.id}</td>
          <td>${p.cover_image ? `<img src="${p.cover_image}" style="width:60px;height:60px;border-radius:4px;object-fit:cover">` : ''}</td>
          <td>${p.title}</td>
          <td>${p.category || '-'}</td>
          <td>${p.section || '-'}</td>
          <td>${tags.map(t => `<span class="badge badge-gray">${t}</span>`).join(' ') || '-'}</td>
          <td><span class="badge ${p.status === 'published' ? 'badge-success' : p.status === 'draft' ? 'badge-warning' : 'badge-gray'}">${p.status === 'published' ? '已发布' : p.status === 'draft' ? '草稿' : '下线'}</span></td>
          <td>${p.is_ai_generated ? '🤖 AI' : p.author || '-'}</td>
          <td>${p.read_time || '-'}</td>
          <td>${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-sm" onclick="editPost(${p.id})">编辑</button>
              <button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPagination() {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    let html = '';
    html += `<button onclick="loadPosts(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="loadPosts(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    html += `<button onclick="loadPosts(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = html;
  }

  window.editPost = async (id) => {
    const p = posts.find(x => x.id === id);
    if (!p) return;

    const form = document.getElementById('blogForm');
    form.reset();
    form.id.value = p.id;
    form.title.value = p.title;
    form.slug.value = p.slug;
    form.description.value = p.description || '';
    form.content_md.value = p.content_md || '';
    form.cover_image.value = p.cover_image || '';
    form.category.value = p.category || '';
    form.tags.value = p.tags ? JSON.parse(p.tags).join(', ') : '';
    form.section.value = p.section || '';
    form.author.value = p.author || '';
    form.read_time.value = p.read_time || '';
    form.status.value = p.status || 'draft';
    document.getElementById('blogModalTitle').textContent = '编辑博客';
    document.getElementById('blogModal').classList.add('show');
  };

  window.deletePost = async (id) => {
    if (!confirm('确定要删除这篇博客吗？')) return;
    try {
      await API.delete(`/api/blog/${id}`);
      API.toast('博客删除成功', 'success');
      await loadPosts(currentPage);
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddPost = () => {
    document.getElementById('blogForm').reset();
    document.getElementById('blogForm').id.value = '';
    document.getElementById('blogModalTitle').textContent = '新增博客';
    document.getElementById('blogModal').classList.add('show');
  };

  window.openAiPublish = () => {
    document.getElementById('aiForm').reset();
    document.getElementById('aiModal').classList.add('show');
  };

  window.closeBlogModal = () => {
    document.getElementById('blogModal').classList.remove('show');
  };

  window.closeAiModal = () => {
    document.getElementById('aiModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>博客文章</h1>
      <div class="btn-group">
        <button class="btn btn-primary" onclick="openAddPost()">+ 新建文章</button>
        <button class="btn" onclick="openAiPublish()">🤖 AI 发布</button>
      </div>
    </div>

    <div class="filter-bar">
      <input type="text" id="searchInput" class="form-control search" placeholder="搜索文章标题..." onkeyup="handleSearch(event)">
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
            <th>分类</th>
            <th>版块</th>
            <th>标签</th>
            <th>状态</th>
            <th>作者</th>
            <th>阅读时间</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="blogTableBody"></tbody>
      </table>
    </div>

    <div id="pagination" class="pagination"></div>

    <div id="blogModal" class="modal-overlay">
      <div class="modal" style="max-width:800px;max-height:90vh">
        <div class="modal-header">
          <div class="modal-title" id="blogModalTitle">新增博客</div>
          <button class="modal-close" onclick="closeBlogModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="blogForm">
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
                <label>分类</label>
                <input type="text" name="category" class="form-control">
              </div>
              <div class="form-group">
                <label>版块</label>
                <select name="section" class="form-control">
                  <option value="">选择版块</option>
                  <option value="featured">Featured</option>
                  <option value="product-info">Product Information</option>
                  <option value="tips">Tips & Inspiration</option>
                  <option value="product-posts">Product Posts</option>
                </select>
              </div>
              <div class="form-group">
                <label>作者</label>
                <input type="text" name="author" class="form-control">
              </div>
              <div class="form-group">
                <label>阅读时间</label>
                <input type="text" name="read_time" class="form-control" placeholder="如: 5 min read">
              </div>
              <div class="form-group">
                <label>封面图片 URL</label>
                <input type="text" name="cover_image" class="form-control">
              </div>
              <div class="form-group">
                <label>标签 (逗号分隔)</label>
                <input type="text" name="tags" class="form-control" placeholder="tag1, tag2, tag3">
              </div>
            </div>
            <div class="form-group">
              <label>SEO 描述</label>
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
          <button class="btn" onclick="closeBlogModal()">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('blogForm').submit()">保存</button>
        </div>
      </div>
    </div>

    <div id="aiModal" class="modal-overlay">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <div class="modal-title">🤖 AI 发布文章</div>
          <button class="modal-close" onclick="closeAiModal()">×</button>
        </div>
        <div class="modal-body">
          <form id="aiForm">
            <div class="form-group">
              <label>文章标题 *</label>
              <input type="text" name="title" class="form-control" required placeholder="输入文章主题">
            </div>
            <div class="form-group">
              <label>分类</label>
              <input type="text" name="category" class="form-control">
            </div>
            <div class="form-group">
              <label>版块</label>
              <select name="section" class="form-control">
                <option value="product-info">Product Information</option>
                <option value="featured">Featured</option>
                <option value="tips">Tips & Inspiration</option>
                <option value="product-posts">Product Posts</option>
              </select>
            </div>
            <div class="form-group">
              <label>标签 (逗号分隔)</label>
              <input type="text" name="tags" class="form-control" placeholder="tag1, tag2">
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="publish_now" checked> 立即发布</label>
            </div>
            <div style="background:var(--primary-bg);padding:1rem;border-radius:var(--radius-md)">
              <p style="font-size:0.8125rem;color:var(--primary-dark)">💡 AI 发布说明:</p>
              <p style="font-size:0.75rem;color:var(--gray-600)">此接口预留供外部 AI Agent 使用。上传图片和主题后,AI 将自动生成内容并发布。</p>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeAiModal()">取消</button>
          <button class="btn btn-primary" onclick="submitAiPost()">提交给 AI</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [];
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      content_md: formData.get('content_md') || null,
      cover_image: formData.get('cover_image') || null,
      category: formData.get('category') || null,
      tags,
      section: formData.get('section') || null,
      author: formData.get('author') || null,
      read_time: formData.get('read_time') || null,
      status: formData.get('status') || 'draft'
    };

    const id = formData.get('id');
    try {
      if (id) {
        await API.put(`/api/blog/${id}`, data);
        API.toast('博客更新成功', 'success');
      } else {
        await API.post('/api/blog', data);
        API.toast('博客创建成功', 'success');
      }
      closeBlogModal();
      await loadPosts(currentPage);
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  window.submitAiPost = async () => {
    const formData = new FormData(document.getElementById('aiForm'));
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(Boolean) : [];
    const data = {
      title: formData.get('title'),
      content: '',
      category: formData.get('category') || '',
      tags,
      section: formData.get('section') || 'product-info',
      publish_now: formData.get('publish_now') === 'on',
      images: []
    };

    if (!data.title) {
      API.toast('请输入文章标题', 'error');
      return;
    }

    try {
      await API.post('/api/blog/ai-publish', data);
      API.toast('AI 发布请求已提交', 'success');
      closeAiModal();
      await loadPosts(1);
    } catch (err) {
      API.toast('发布失败: ' + err.message, 'error');
    }
  };

  window.handleSearch = (e) => {
    if (e.key === 'Enter') {
      searchQuery = e.target.value;
      loadPosts(1);
    }
  };

  window.handleStatusFilter = (val) => {
    statusFilter = val;
    loadPosts(1);
  };

  window.handleReset = () => {
    searchQuery = '';
    statusFilter = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    loadPosts(1);
  };

  await loadPosts();
});