Router.register('/geo', async function (container) {
  let questions = [];
  let templates = [];
  let scores = [];

  async function loadQuestions() {
    try {
      questions = await API.get('/api/geo/questions');
      renderQuestions();
    } catch (err) {
      API.toast('加载 GEO 问题失败: ' + err.message, 'error');
    }
  }

  async function loadTemplates() {
    try {
      templates = await API.get('/api/geo/schema-templates');
      renderTemplates();
    } catch (err) {
      API.toast('加载 Schema 模板失败: ' + err.message, 'error');
    }
  }

  async function loadScores() {
    try {
      scores = await API.get('/api/geo/scores');
      renderScores();
    } catch (err) {
      API.toast('加载 GEO 评分失败: ' + err.message, 'error');
    }
  }

  function renderQuestions() {
    const tbody = document.getElementById('geoQuestionTable');
    tbody.innerHTML = questions.map(q => `
      <tr>
        <td>${q.id}</td>
        <td>${q.category || '-'}</td>
        <td>${q.language}</td>
        <td>${q.question.slice(0, 50)}${q.question.length > 50 ? '...' : ''}</td>
        <td>${q.priority}</td>
        <td><span class="badge ${q.is_active ? 'badge-success' : 'badge-danger'}">${q.is_active ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editGeoQuestion(${q.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteGeoQuestion(${q.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderTemplates() {
    const tbody = document.getElementById('templateTable');
    tbody.innerHTML = templates.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.type}</td>
        <td>${t.name}</td>
        <td>${t.jsonld_template ? t.jsonld_template.slice(0, 50) + '...' : '-'}</td>
        <td><span class="badge ${t.is_active ? 'badge-success' : 'badge-danger'}">${t.is_active ? '启用' : '禁用'}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="editTemplate(${t.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${t.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderScores() {
    const tbody = document.getElementById('scoreTable');
    tbody.innerHTML = scores.map(s => `
      <tr>
        <td><a href="${s.page_url}" target="_blank">${s.page_url}</a></td>
        <td><span class="badge ${s.score >= 80 ? 'badge-success' : s.score >= 60 ? 'badge-warning' : 'badge-danger'}">${s.score}</span></td>
        <td>${s.schema_completeness}%</td>
        <td>${s.citation_friendliness}%</td>
        <td>${s.fact_density}%</td>
        <td><button class="btn btn-sm" onclick="generateScore('${s.page_url}')">重新评分</button></td>
      </tr>
    `).join('');
  }

  window.editGeoQuestion = async (id) => {
    const q = questions.find(x => x.id === id);
    if (!q) return;
    document.getElementById('geoQuestionForm').reset();
    document.getElementById('geoQuestionForm').id.value = q.id;
    document.getElementById('geoQuestionForm').question.value = q.question;
    document.getElementById('geoQuestionForm').answer.value = q.answer;
    document.getElementById('geoQuestionForm').category.value = q.category || '';
    document.getElementById('geoQuestionForm').language.value = q.language;
    document.getElementById('geoQuestionForm').priority.value = q.priority;
    document.getElementById('geoQuestionForm').is_active.checked = q.is_active;
    document.getElementById('geoModalTitle').textContent = '编辑 GEO 问题';
    document.getElementById('geoModal').classList.add('show');
  };

  window.deleteGeoQuestion = async (id) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await API.delete(`/api/geo/questions/${id}`);
      API.toast('删除成功', 'success');
      await loadQuestions();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.editTemplate = async (id) => {
    const t = templates.find(x => x.id === id);
    if (!t) return;
    const form = document.getElementById('templateForm');
    form.reset();
    form.id.value = t.id;
    form.type.value = t.type || '';
    form.name.value = t.name || '';
    form.jsonld_template.value = t.jsonld_template || '';
    form.is_active.checked = t.is_active !== false;
    document.getElementById('templateModalTitle').textContent = '编辑 Schema 模板';
    document.getElementById('templateModal').classList.add('show');
  };

  window.deleteTemplate = async (id) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await API.delete(`/api/geo/schema-templates/${id}`);
      API.toast('模板删除成功', 'success');
      await loadTemplates();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.openAddGeoQuestion = () => {
    document.getElementById('geoQuestionForm').reset();
    document.getElementById('geoQuestionForm').id.value = '';
    document.getElementById('geoModalTitle').textContent = '新增 GEO 问题';
    document.getElementById('geoModal').classList.add('show');
  };

  window.openAddTemplate = () => {
    const form = document.getElementById('templateForm');
    form.reset();
    form.id.value = '';
    form.is_active.checked = true;
    document.getElementById('templateModalTitle').textContent = '新增 Schema 模板';
    document.getElementById('templateModal').classList.add('show');
  };

  window.closeGeoModal = () => {
    document.getElementById('geoModal').classList.remove('show');
  };

  window.closeTemplateModal = () => {
    document.getElementById('templateModal').classList.remove('show');
  };

  window.generateScore = async (pageUrl) => {
    try {
      const res = await API.post(`/api/geo/scores/${encodeURIComponent(pageUrl)}/generate`);
      API.toast('评分完成: ' + res.score, 'success');
      await loadScores();
    } catch (err) {
      API.toast('评分失败: ' + err.message, 'error');
    }
  };

  let activeTab = 'questions';
  window.showGeoTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('.geo-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.geo-tab-content').forEach(c => c.classList.toggle('hidden', c.id !== tab + 'Tab'));
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>GEO 优化</h1>
    </div>
    <div class="tabs">
      <button class="geo-tab-btn active" data-tab="questions" onclick="showGeoTab('questions')">GEO 问答</button>
      <button class="geo-tab-btn" data-tab="templates" onclick="showGeoTab('templates')">Schema 模板</button>
      <button class="geo-tab-btn" data-tab="scores" onclick="showGeoTab('scores')">GEO 评分</button>
    </div>

    <div id="questionsTab" class="geo-tab-content">
      <button class="btn btn-primary mb-4" onclick="openAddGeoQuestion()">+ 新增 GEO 问答</button>
      <div class="table-wrap">
        <table><thead><tr><th>ID</th><th>分类</th><th>语言</th><th>问题</th><th>优先级</th><th>状态</th><th>操作</th></tr></thead><tbody id="geoQuestionTable"></tbody></table>
      </div>
    </div>

    <div id="templatesTab" class="geo-tab-content hidden">
      <button class="btn btn-primary mb-4" onclick="openAddTemplate()">+ 新增 Schema 模板</button>
      <div class="table-wrap">
        <table><thead><tr><th>ID</th><th>类型</th><th>名称</th><th>模板内容</th><th>状态</th><th>操作</th></tr></thead><tbody id="templateTable"></tbody></table>
      </div>
    </div>

    <div id="scoresTab" class="geo-tab-content hidden">
      <div class="table-wrap">
        <table><thead><tr><th>页面</th><th>GEO 评分</th><th>Schema 完整性</th><th>引用友好度</th><th>事实密度</th><th>操作</th></tr></thead><tbody id="scoreTable"></tbody></table>
      </div>
    </div>

    <div id="templateModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header"><div class="modal-title" id="templateModalTitle">新增 Schema 模板</div><button class="modal-close" onclick="closeTemplateModal()">×</button></div>
        <div class="modal-body">
          <form id="templateForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>类型 *</label><input type="text" name="type" class="form-control" required placeholder="如: Product, Organization, Article"></div>
            <div class="form-group"><label>名称 *</label><input type="text" name="name" class="form-control" required></div>
            <div class="form-group"><label>JSON-LD 模板 *</label><textarea name="jsonld_template" class="form-control" style="min-height:200px" required placeholder='{"@context":"https://schema.org","@type":"Product",...}'></textarea></div>
            <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeTemplateModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('templateForm').submit()">保存</button></div>
      </div>
    </div>

    <div id="geoModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="geoModalTitle">新增 GEO 问答</div><button class="modal-close" onclick="closeGeoModal()">×</button></div>
        <div class="modal-body">
          <form id="geoQuestionForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>问题 *</label><input type="text" name="question" class="form-control" required></div>
            <div class="form-group"><label>答案 *</label><textarea name="answer" class="form-control" required></textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group"><label>分类</label><input type="text" name="category" class="form-control"></div>
              <div class="form-group"><label>语言</label><select name="language" class="form-control"><option value="en">English</option><option value="zh">中文</option></select></div>
              <div class="form-group"><label>优先级</label><input type="number" name="priority" class="form-control" value="0"></div>
              <div class="form-group"><label><input type="checkbox" name="is_active" checked> 启用</label></div>
            </div>
          </form>
        </div>
        <div class="modal-footer"><button class="btn" onclick="closeGeoModal()">取消</button><button class="btn btn-primary" onclick="document.getElementById('geoQuestionForm').submit()">保存</button></div>
      </div>
    </div>
  `;

  document.getElementById('geoQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/geo/questions/${id}`, data);
      else await API.post('/api/geo/questions', data);
      API.toast(id ? '更新成功' : '创建成功', 'success');
      closeGeoModal();
      await loadQuestions();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  document.getElementById('templateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.is_active = data.is_active === 'on';
    const id = data.id;
    delete data.id;
    try {
      if (id) await API.put(`/api/geo/schema-templates/${id}`, data);
      else await API.post('/api/geo/schema-templates', data);
      API.toast(id ? '模板更新成功' : '模板创建成功', 'success');
      closeTemplateModal();
      await loadTemplates();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  await loadQuestions();
  await loadTemplates();
  await loadScores();
});