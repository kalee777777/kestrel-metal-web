Router.register('/i18n', async function (container) {
  let translations = [];
  let page = 1;
  const PAGE_SIZE = 20;
  const LANGS_KEY = 'km_i18n_langs';

  // 语言列表数据驱动:默认 en/zh,可扩展(es/de/ar 等),存 localStorage
  function loadLangs() {
    try {
      const saved = JSON.parse(localStorage.getItem(LANGS_KEY) || 'null');
      if (Array.isArray(saved) && saved.length && saved.every(l => l.code && l.label)) return saved;
    } catch {}
    return [{ code: 'en', label: 'English' }, { code: 'zh', label: '中文' }];
  }
  let langs = loadLangs();
  const saveLangs = () => localStorage.setItem(LANGS_KEY, JSON.stringify(langs));

  async function loadTranslations() {
    try {
      translations = await API.get('/api/i18n/all');
      render();
    } catch (err) {
      API.toast('加载翻译失败: ' + err.message, 'error');
    }
  }

  // 搜索 + 模块筛选 + 只看缺失
  function filtered() {
    const q = (document.getElementById('i18nSearch')?.value || '').trim().toLowerCase();
    const mod = document.getElementById('i18nModuleFilter')?.value || '';
    const missingOnly = document.getElementById('i18nMissingOnly')?.checked;
    return translations.filter(t => {
      if (mod && (t.module || '') !== mod) return false;
      if (missingOnly && langs.some(l => (t[l.code] || '').trim())) return false;
      if (q) {
        const hay = [(t.key || ''), ...langs.map(l => t[l.code] || '')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    renderModuleOptions();
    renderTable();
  }

  function renderModuleOptions() {
    const sel = document.getElementById('i18nModuleFilter');
    const dl = document.getElementById('i18nModuleList');
    const mods = [...new Set(translations.map(t => t.module || '').filter(Boolean))].sort();
    const esc = API.escapeHtml;
    if (sel) {
      const current = sel.value;
      sel.innerHTML = '<option value="">全部模块</option>' + mods.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
      if (mods.includes(current)) sel.value = current;
    }
    if (dl) dl.innerHTML = mods.map(m => `<option value="${esc(m)}">`).join('');
  }

  function renderTable() {
    const tbody = document.getElementById('i18nTableBody');
    if (!tbody) return;
    const esc = API.escapeHtml;
    const rows = filtered();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > pages) page = pages;
    const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const countEl = document.getElementById('i18nCount');
    if (countEl) countEl.textContent = `共 ${translations.length} 条,筛选出 ${rows.length} 条`;

    if (!slice.length) {
      tbody.innerHTML = `<tr><td colspan="${3 + langs.length + 2}" style="text-align:center;padding:2rem;color:var(--text-secondary)">${translations.length ? '没有符合筛选条件的翻译' : '暂无翻译,点击「+ 新增翻译」录入后可导出语言包'}</td></tr>`;
    } else {
      tbody.innerHTML = slice.map(t => `
        <tr>
          <td>${t.id}</td>
          <td>${esc(t.module || '-')}</td>
          <td>${esc(t.key)}</td>
          ${langs.map(l => {
            const val = (t[l.code] || '').trim();
            return `<td>${val ? esc(val.slice(0, 40)) + (val.length > 40 ? '...' : '') : '<span style="color:var(--danger)">缺失</span>'}</td>`;
          }).join('')}
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

    const pager = document.getElementById('i18nPager');
    if (pager) {
      pager.innerHTML = pages <= 1 ? '' : `
        <button class="btn btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="i18nPage(${page - 1})">上一页</button>
        <span style="align-self:center;font-size:0.85rem">第 ${page} / ${pages} 页</span>
        <button class="btn btn-sm" ${page >= pages ? 'disabled' : ''} onclick="i18nPage(${page + 1})">下一页</button>`;
    }
  }

  // 表头 / 导出按钮 / 导入语言下拉 / 表单语言字段 —— 随语言列表动态重建
  function renderChrome() {
    const esc = API.escapeHtml;
    const exportBtns = document.getElementById('i18nExportBtns');
    if (exportBtns) {
      exportBtns.innerHTML = langs.map(l => `<button class="btn" onclick="exportLocale('${esc(l.code)}')">📤 导出 ${esc(l.code)}.json</button>`).join('')
        + '<button class="btn btn-primary" onclick="openAddTranslation()">+ 新增翻译</button>';
    }
    const thead = document.getElementById('i18nThead');
    if (thead) {
      thead.innerHTML = '<tr><th>ID</th><th>模块</th><th>Key</th>'
        + langs.map(l => `<th>${esc(l.label)}</th>`).join('')
        + '<th>状态</th><th>操作</th></tr>';
    }
    const importSel = document.getElementById('i18nImportLang');
    if (importSel) importSel.innerHTML = langs.map(l => `<option value="${esc(l.code)}">导入到 ${esc(l.code)}</option>`).join('');
    renderFormLangs();
  }

  function renderFormLangs(values = {}) {
    const wrap = document.getElementById('i18nLangFields');
    if (!wrap) return;
    wrap.innerHTML = langs.map(l => `
      <div class="form-group"><label>${API.escapeHtml(l.label)} (${API.escapeHtml(l.code)})</label>
        <textarea name="lang_${API.escapeHtml(l.code)}" class="form-control">${API.escapeHtml(values[l.code] || '')}</textarea></div>`).join('');
  }

  window.i18nPage = (p) => { page = p; renderTable(); };
  window.i18nFilterChange = () => { page = 1; renderTable(); };

  window.editTranslation = async (id) => {
    const t = translations.find(x => x.id === id);
    if (!t) return;
    document.getElementById('i18nForm').reset();
    document.getElementById('i18nForm').id.value = t.id;
    document.getElementById('i18nForm').key.value = t.key;
    document.getElementById('i18nForm').module.value = t.module || '';
    document.getElementById('i18nForm').is_active.checked = t.is_active;
    renderFormLangs(t);
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
    renderFormLangs();
    document.getElementById('i18nModalTitle').textContent = '新增翻译';
    document.getElementById('i18nModal').classList.add('show');
  };

  window.closeI18nModal = () => {
    document.getElementById('i18nModal').classList.remove('show');
  };

  // 导出语言包:扁平 key→value,仅启用条目;缺失/重复在 toast 中汇总
  // 导出文件放置于 kestrel-site/js/locales/,站点多语言上线后由构建期消费
  window.exportLocale = (code) => {
    const map = {};
    let missing = 0, skipped = 0, dupes = 0;
    translations.forEach(t => {
      if (!t.is_active) { skipped++; return; }
      const val = (t[code] || '').trim();
      if (!val) { missing++; return; }
      if (map[t.key] !== undefined) dupes++;
      map[t.key] = val;
    });
    const count = Object.keys(map).length;
    if (count === 0) { API.toast(`没有可导出的 ${code} 翻译(全部缺失或停用)`, 'error'); return; }
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = code + '.json';
    a.click();
    URL.revokeObjectURL(url);
    const notes = [`已导出 ${count} 条`];
    if (missing) notes.push(`缺失 ${missing} 条未包含`);
    if (dupes) notes.push(`key 重复 ${dupes} 条(取最后一条)`);
    if (skipped) notes.push(`停用跳过 ${skipped} 条`);
    API.toast(notes.join(', '), missing || dupes ? 'warning' : 'success');
  };

  // 导入语言包:{ "key": "译文" } 扁平映射,覆盖同名 key,新 key 归入 import 模块
  window.importLocale = () => {
    const fileInput = document.getElementById('i18nImportFile');
    const langCode = document.getElementById('i18nImportLang').value;
    const file = fileInput.files && fileInput.files[0];
    if (!file) { API.toast('请先选择 JSON 文件', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      let map;
      try { map = JSON.parse(reader.result); } catch (err) { API.toast('JSON 解析失败: ' + err.message, 'error'); return; }
      if (typeof map !== 'object' || Array.isArray(map) || !map) { API.toast('格式应为 { "key": "译文" } 扁平映射', 'error'); return; }
      const entries = Object.entries(map).filter(([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim());
      if (!entries.length) { API.toast('文件中没有可导入的 key→文本条目', 'error'); return; }
      if (!confirm(`将导入 ${entries.length} 条到「${langCode}」:已有 key 会覆盖同名译文,确认?`)) return;
      let created = 0, updated = 0, failed = 0;
      for (const [key, value] of entries) {
        try {
          const existing = translations.find(t => t.key === key);
          if (existing) {
            await API.put('/api/i18n/' + existing.id, { [langCode]: value });
            updated++;
          } else {
            await API.post('/api/i18n', { key, module: 'import', is_active: true, [langCode]: value });
            created++;
          }
        } catch { failed++; }
      }
      fileInput.value = '';
      API.toast(`导入完成:新增 ${created} 条,更新 ${updated} 条${failed ? ',失败 ' + failed + ' 条' : ''}`, failed ? 'warning' : 'success');
      await loadTranslations();
    };
    reader.readAsText(file);
  };

  // 添加语言(数据驱动,列/导出/表单即时扩展)
  window.addI18nLang = () => {
    const code = (prompt('语言代码(如 es / de / ar):') || '').trim().toLowerCase();
    if (!code) return;
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code)) { API.toast('语言代码应为 2 位字母,可选 - 地区后缀', 'error'); return; }
    if (langs.some(l => l.code === code)) { API.toast('该语言已存在', 'error'); return; }
    const label = (prompt('语言显示名(如 Español):') || '').trim() || code;
    langs = [...langs, { code, label }];
    saveLangs();
    renderChrome();
    render();
    API.toast(`已添加语言 ${label},表格新列即可录入`, 'success');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>国际化管理</h1>
      <div id="i18nExportBtns" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap"></div>
    </div>
    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.8rem">
      ℹ️ 翻译以 <strong>扁平 key→value</strong> 导出为语言包(仅启用条目),放置于 <code>kestrel-site/js/locales/</code>;站点当前单语言,多语言上线后由构建期消费。语言列表可扩展(数据驱动)。
    </p>
    <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
      <input id="i18nSearch" class="form-control" style="max-width:220px" placeholder="搜索 key 或译文…" oninput="i18nFilterChange()">
      <select id="i18nModuleFilter" class="form-control" style="max-width:160px" onchange="i18nFilterChange()"><option value="">全部模块</option></select>
      <label style="font-size:0.85rem;display:flex;align-items:center;gap:0.3rem"><input type="checkbox" id="i18nMissingOnly" onchange="i18nFilterChange()"> 只看缺失</label>
      <span id="i18nCount" style="font-size:0.85rem;color:var(--text-secondary)"></span>
      <div style="flex:1"></div>
      <select id="i18nImportLang" class="form-control" style="max-width:130px"></select>
      <input type="file" id="i18nImportFile" accept=".json,application/json" style="display:none" onchange="importLocale()">
      <button class="btn" onclick="document.getElementById('i18nImportFile').click()">📥 导入 JSON</button>
      <button class="btn" onclick="addI18nLang()">+ 添加语言</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead id="i18nThead"></thead>
        <tbody id="i18nTableBody"></tbody>
      </table>
    </div>
    <div id="i18nPager" style="display:flex;gap:0.6rem;margin-top:0.8rem"></div>
    <datalist id="i18nModuleList"></datalist>
    <div id="i18nModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><div class="modal-title" id="i18nModalTitle">新增翻译</div><button class="modal-close" onclick="closeI18nModal()">×</button></div>
        <div class="modal-body">
          <form id="i18nForm">
            <input type="hidden" name="id">
            <div class="form-group"><label>Key *</label><input type="text" name="key" class="form-control" required placeholder="如 nav.products"></div>
            <div id="i18nLangFields" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
              <div class="form-group"><label>模块</label><input type="text" name="module" class="form-control" list="i18nModuleList"></div>
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
    const raw = Object.fromEntries(new FormData(e.target));
    const id = raw.id;
    const payload = { key: (raw.key || '').trim(), module: (raw.module || '').trim(), is_active: raw.is_active === 'on' };
    if (!payload.key) { API.toast('Key 不能为空', 'error'); return; }
    langs.forEach(l => { payload[l.code] = (raw['lang_' + l.code] || '').trim(); });
    // key 重复检测(非阻断,确认后可保存)
    const dupe = translations.find(t => t.key === payload.key && String(t.id) !== String(id));
    if (dupe && !confirm(`Key "${payload.key}" 已存在(ID ${dupe.id}),仍要保存吗?导出时同名 key 取最后一条。`)) return;
    // 命名规范提醒(非阻断)
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/i.test(payload.key) && !confirm(`Key "${payload.key}" 不符合推荐命名(如 nav.products / btn.inquire),仍要保存吗?`)) return;
    try {
      if (id) await API.put(`/api/i18n/${id}`, payload);
      else await API.post('/api/i18n', payload);
      API.toast(id ? '翻译更新成功' : '翻译创建成功', 'success');
      closeI18nModal();
      await loadTranslations();
    } catch (err) {
      API.toast('操作失败: ' + err.message, 'error');
    }
  });

  renderChrome();
  await loadTranslations();
});
