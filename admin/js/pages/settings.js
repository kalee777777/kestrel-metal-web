Router.register('/settings', async function (container) {
  let configs = {};
  let admins = [];
  let logs = [];

  async function loadConfigs() {
    try {
      configs = await API.get('/api/settings');
      renderSettings();
    } catch (err) {
      API.toast('加载设置失败: ' + err.message, 'error');
    }
  }

  async function loadAdmins() {
    try {
      admins = await API.get('/api/settings/admins');
      renderAdmins();
    } catch (err) {
      API.toast('加载管理员失败: ' + err.message, 'error');
    }
  }

  async function loadLogs() {
    try {
      logs = await API.get('/api/settings/logs');
      renderLogs();
    } catch (err) {
      API.toast('加载日志失败: ' + err.message, 'error');
    }
  }

  function renderSettings() {
    document.getElementById('siteName').value = configs.site_name || '';
    document.getElementById('siteEmail').value = configs.site_email || '';
    document.getElementById('sitePhone').value = configs.site_phone || '';
    document.getElementById('siteAddress').value = configs.site_address || '';
    document.getElementById('siteDescription').value = configs.site_description || '';
    document.getElementById('socialFacebook').value = configs.social_facebook || '';
    document.getElementById('socialTwitter').value = configs.social_twitter || '';
    document.getElementById('socialLinkedIn').value = configs.social_linkedin || '';
    if (document.getElementById('ga4MeasurementId')) {
      document.getElementById('ga4MeasurementId').value = configs.ga4_measurement_id || '';
    }
  }

  function renderAdmins() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = admins.map(a => `
      <tr>
        <td>${a.id}</td>
        <td>${a.username}</td>
        <td>${a.email}</td>
        <td><span class="badge ${a.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${a.role === 'admin' ? '管理员' : '编辑'}</span></td>
        <td>${a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
        <td>${a.last_login_at ? new Date(a.last_login_at).toLocaleString() : '-'}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editAdmin(${a.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAdmin(${a.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderLogs() {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>${l.id}</td>
        <td>${l.admin ? l.admin.username : '-'}</td>
        <td>${l.action}</td>
        <td>${l.resource_type || '-'}</td>
        <td>${l.resource_id || '-'}</td>
        <td>${l.ip_address || '-'}</td>
        <td>${new Date(l.created_at).toLocaleString()}</td>
      </tr>
    `).join('');
  }

  window.editAdmin = async (id) => {
    const a = admins.find(x => x.id === id);
    if (!a) return;
    document.getElementById('adminForm').reset();
    document.getElementById('adminForm').id.value = a.id;
    document.getElementById('adminForm').username.value = a.username;
    document.getElementById('adminForm').email.value = a.email;
    document.getElementById('adminForm').role.value = a.role;
    document.getElementById('adminModalTitle').textContent = '编辑管理员';
    document.getElementById('adminModal').classList.add('show');
  };

  window.deleteAdmin = async (id) => {
    if (!confirm('确定要删除这个管理员吗？')) return;
    try {
      await API.delete(`/api/settings/admins/${id}`);
      API.toast('管理员删除成功', 'success');
      await loadAdmins();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddAdmin = () => {
    document.getElementById('adminForm').reset();
    document.getElementById('adminForm').id.value = '';
    document.getElementById('adminModalTitle').textContent = '新增管理员';
    document.getElementById('adminModal').classList.add('show');
  };

  window.closeAdminModal = () => {
    document.getElementById('adminModal').classList.remove('show');
  };

  let activeTab = 'site';
  window.showTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== tab + 'Tab'));
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>系统设置</h1>
    </div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="site" onclick="showTab('site')">站点设置</button>
      <button class="tab-btn" data-tab="analytics" onclick="showTab('analytics')">数据埋点</button>
      <button class="tab-btn" data-tab="admins" onclick="showTab('admins')">管理员管理</button>
      <button class="tab-btn" data-tab="logs" onclick="showTab('logs')">操作日志</button>
    </div>

    <div id="siteTab" class="tab-content">
      <form id="siteForm">
        <h3>基本信息</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group"><label>站点名称</label><input type="text" name="site_name" id="siteName" class="form-control"></div>
          <div class="form-group"><label>站点邮箱</label><input type="email" name="site_email" id="siteEmail" class="form-control"></div>
          <div class="form-group"><label>联系电话</label><input type="text" name="site_phone" id="sitePhone" class="form-control"></div>
          <div class="form-group"><label>公司地址</label><input type="text" name="site_address" id="siteAddress" class="form-control"></div>
        </div>
        <div class="form-group"><label>站点描述</label><textarea name="site_description" id="siteDescription" class="form-control"></textarea></div>
        <h3>社交媒体</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">
          <div class="form-group"><label>Facebook</label><input type="text" name="social_facebook" id="socialFacebook" class="form-control"></div>
          <div class="form-group"><label>Twitter</label><input type="text" name="social_twitter" id="socialTwitter" class="form-control"></div>
          <div class="form-group"><label>LinkedIn</label><input type="text" name="social_linkedin" id="socialLinkedIn" class="form-control"></div>
        </div>
        <div class="form-actions"><button class="btn btn-primary">保存设置</button></div>
      </form>
    </div>

    <div id="analyticsTab" class="tab-content hidden">
      <form id="analyticsForm">
        <h3>Google Analytics (GA4)</h3>
        <div class="form-group"><label>Measurement ID</label>
          <input type="text" name="ga4_measurement_id" id="ga4MeasurementId" class="form-control" placeholder="G-XXXXXXXXXX">
          <small style="color:#999;font-size:12px">在 Google Analytics 后台 → 管理 → 数据流 → 概览 中获取</small>
        </div>
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:1rem;margin:1rem 0;font-size:13px;color:#856404">
          <strong>说明：</strong>配置 ID 后，前端会自动加载对应统计脚本。支持自动追踪页面浏览、产品点击、询盘表单提交、文件下载、站外链接等事件。
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">保存埋点配置</button></div>
      </form>
    </div>

    <div id="adminsTab" class="tab-content hidden">
      <button class="btn btn-primary mb-4" onclick="openAddAdmin()">+ 新增管理员</button>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>创建时间</th><th>最后登录</th><th>操作</th></tr></thead>
          <tbody id="adminTableBody"></tbody>
        </table>
      </div>
    </div>

    <div id="logsTab" class="tab-content hidden">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>管理员</th><th>操作</th><th>资源类型</th><th>资源ID</th><th>IP</th><th>时间</th></tr></thead>
          <tbody id="logTableBody"></tbody>
        </table>
      </div>
    </div>

    <div id="adminModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="adminModalTitle">新增管理员</div><button class="modal-close" onclick="closeAdminModal()">×</button></div>
        <div class="modal-body">
          <form id="adminForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>用户名 *</label><input type="text" name="username" class="form-control" required></div>
            <div class="form-group"><label>邮箱 *</label><input type="email" name="email" class="form-control" required></div>
            <div class="form-group"><label>密码 ${document.getElementById('adminForm')?.id?.value ? '(留空不修改)' : '*'}</label><input type="password" name="password" class="form-control"></div>
            <div class="form-group"><label>角色</label><select name="role" class="form-control"><option value="editor">编辑</option><option value="admin">管理员</option></select></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeAdminModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('adminForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  document.getElementById('siteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await API.put('/api/settings', data);
      API.toast('设置保存成功', 'success');
    } catch (err) {
      API.toast('保存失败: ' + err.message, 'error');
    }
  });

  document.getElementById('analyticsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await API.put('/api/settings', data);
      API.toast('埋点配置保存成功', 'success');
    } catch (err) {
      API.toast('保存失败: ' + err.message, 'error');
    }
  });

  document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const id = data.id;
    delete data.id;
    if (!data.password) delete data.password;
    try {
      if (id) await API.put(`/api/settings/admins/${id}`, data);
      else await API.post('/api/settings/admins', data);
      API.toast(id ? '管理员更新成功' : '管理员创建成功', 'success');
      closeAdminModal();
      await loadAdmins();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadConfigs();
  await loadAdmins();
  await loadLogs();
});