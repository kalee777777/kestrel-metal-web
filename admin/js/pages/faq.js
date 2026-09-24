Router.register('/faq', async function (container) {
  let faqs = [];

  async function loadFAQs() {
    try {
      faqs = await API.get('/api/faq/all');
      renderTable();
    } catch (err) {
      API.toast('加载 FAQ 失败: ' + err.message, 'error');
    }
  }

  function renderTable() {
    const tbody = document.getElementById('faqTableBody');
    tbody.innerHTML = faqs.map(f => `
      <tr>
        <td>${f.id}</td>
        <td>${f.category || '-'}</td>
        <td>${f.language}</td>
        <td>${f.question.slice(0, 50)}${f.question.length > 50 ? '...' : ''}</td>
        <td>${f.answer ? f.answer.slice(0, 50) + (f.answer.length > 50 ? '...' : '') : '-'}</td>
        <td><span class="badge ${f.is_active ? 'badge-success' : (f.source === 'auto' ? 'badge-warning' : 'badge-danger')}">${f.is_active ? '启用' : (f.source === 'auto' ? '待审核' : '禁用')}</span></td>
        <td>${f.source === 'auto' ? '🤖 自动' : '✍️ 手工'}</td>
        <td>${f.sort_order}</td>
        <td>
          <div class="btn-group">
            ${!f.is_active && f.source === 'auto' ? `<button class="btn btn-sm btn-success" onclick="approveFAQ(${f.id})">✓ 启用</button>` : ''}
            <button class="btn btn-sm" onclick="editFAQ(${f.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${f.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.approveFAQ = async (id) => {
    try {
      await API.put(`/api/faq/${id}`, { is_active: true });
      API.toast('已启用,faq.html 与 GEO 渲染即时生效', 'success');
      await loadFAQs();
    } catch (err) {
      API.toast('启用失败: ' + err.message, 'error');
    }
  };

  window.editFAQ = async (id) => {
    const f = faqs.find(x => x.id === id);
    if (!f) return;
    document.getElementById('faqForm').reset();
    document.getElementById('faqForm').id.value = f.id;
    document.getElementById('faqForm').question.value = f.question;
    document.getElementById('faqForm').answer.value = f.answer || '';
    document.getElementById('faqForm').category.value = f.category || '';
    document.getElementById('faqForm').language.value = f.language;
    document.getElementById('faqForm').sort_order.value = f.sort_order;
    document.getElementById('faqForm').is_active.checked = f.is_active;
    document.getElementById('faqModalTitle').textContent = '编辑 FAQ';
    document.getElementById('faqModal').classList.add('show');
  };

  window.deleteFAQ = async (id) => {
    if (!confirm('确定要删除这个 FAQ 吗？')) return;
    try {
      await API.delete(`/api/faq/${id}`);
      API.toast('FAQ 删除成功', 'success');
      await loadFAQs();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddFAQ = () => {
    document.getElementById('faqForm').reset();
    document.getElementById('faqForm').id.value = '';
    document.getElementById('faqModalTitle').textContent = '新增 FAQ';
    document.getElementById('faqModal').classList.add('show');
  };

  window.closeFAQModal = () => {
    document.getElementById('faqModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>FAQ 管理</h1>
      <button class="btn btn-primary" onclick="openAddFAQ()">+ 新增 FAQ</button>
    </div>
    <div id="faqSourceBanner" style="display:none;margin-bottom:1rem;padding:0.75rem 1rem;border-radius:8px;font-size:0.85rem"></div>
    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">
      ℹ️ 本列表与「GEO 优化 → GEO 问答」共享同一数据源(GEO 流水线服务端 KV),两边编辑实时同步;站点 faq.html 自动渲染 <strong>启用 + 非中文</strong> 的条目。geo-faq 每周自动生成的条目以「待审核」状态出现在列表里,勾选启用后上线。
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>分类</th><th>语言</th><th>问题</th><th>答案</th><th>状态</th><th>来源</th><th>排序</th><th>操作</th></tr>
        </thead>
        <tbody id="faqTableBody"></tbody>
      </table>
    </div>
    <div id="faqModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="faqModalTitle">新增 FAQ</div><button class="modal-close" onclick="closeFAQModal()">×</button></div>
        <div class="modal-body">
          <form id="faqForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>问题 *</label><input type="text" name="question" class="form-control" required></div>
            <div class="form-group"><label>答案</label><textarea name="answer" class="form-control"></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group"><label>分类</label><input type="text" name="category" class="form-control"></div>
              <div class="form-group"><label>语言</label><select name="language" class="form-control"><option value="en">English</option><option value="zh">中文</option></select></div>
              <div class="form-group"><label>排序</label><input type="number" name="sort_order" class="form-control" value="0"></div>
              <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
            </div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeFAQModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('faqForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  // 数据源状态 + 一次性迁移:服务器可达但 KV 为空、本地有存量时提示一键上传
  (async function detectSource() {
    const banner = document.getElementById('faqSourceBanner');
    try {
      const resp = await fetch('/api/faq/all');
      if (!resp.ok) return; // Worker 路由未部署,保持 localStorage 模式,不打扰
      const serverFaqs = await resp.json();
      if (Array.isArray(serverFaqs) && serverFaqs.length > 0) {
        banner.style.display = 'block';
        banner.style.background = 'rgba(34,197,94,0.12)';
        banner.style.color = '#16a34a';
        banner.textContent = `✅ 数据源:服务端 KV(geo:faqs,共 ${serverFaqs.length} 条)—— cron 自动扩容与 faq.html 渲染均读取此数据源`;
        return;
      }
      let localFaqs = [];
      try { localFaqs = JSON.parse(localStorage.getItem('km_admin_faqs') || '[]'); } catch {}
      if (localFaqs.length > 0) {
        banner.style.display = 'block';
        banner.style.background = 'rgba(245,158,11,0.12)';
        banner.style.color = '#d97706';
        banner.innerHTML = `⚠️ 服务端 KV 为空,本地浏览器存有 ${localFaqs.length} 条 FAQ。<button class="btn btn-sm btn-primary" style="margin-left:0.5rem" onclick="migrateLocalFaqs()">⬆ 一键上传到服务器</button>(上传后 GEO 流水线才能使用这些数据)`;
      }
    } catch {}
  })();

  window.migrateLocalFaqs = async () => {
    let localFaqs = [];
    try { localFaqs = JSON.parse(localStorage.getItem('km_admin_faqs') || '[]'); } catch {}
    if (!localFaqs.length) { API.toast('本地没有可迁移的 FAQ', 'error'); return; }
    try {
      const result = await API.post('/api/faq/import', localFaqs);
      API.toast(`迁移完成:导入 ${result.imported} 条,跳过 ${result.skipped} 条(空缺/重复)`, 'success');
      await loadFAQs();
      const banner = document.getElementById('faqSourceBanner');
      if (banner) { banner.style.display = 'none'; }
    } catch (err) {
      API.toast('迁移失败: ' + err.message, 'error');
    }
  };

  document.getElementById('faqForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/faq/${id}`, data);
      else await API.post('/api/faq', data);
      API.toast(id ? 'FAQ 更新成功' : 'FAQ 创建成功', 'success');
      closeFAQModal();
      await loadFAQs();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadFAQs();
});