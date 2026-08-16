Router.register('/media', async function (container) {
  let files = [];

  async function loadFiles() {
    try {
      const res = await API.get('/api/media');
      files = res;
      renderGrid();
    } catch (err) {
      API.toast('加载媒体文件失败: ' + err.message, 'error');
    }
  }

  function renderGrid() {
    const grid = document.getElementById('mediaGrid');
    if (files.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>暂无媒体文件</p></div>';
      return;
    }

    grid.innerHTML = files.map(f => `
      <div class="media-item" onclick="selectMedia(${f.id})">
        <div class="media-thumb">
          <img src="${f.url}" alt="${f.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;100&quot; height=&quot;100&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;%239CA3AF&quot; stroke-width=&quot;2&quot;%3E%3Crect x=&quot;3&quot; y=&quot;3&quot; width=&quot;18&quot; height=&quot;18&quot; rx=&quot;2&quot; ry=&quot;2&quot;/%3E%3Ccircle cx=&quot;8.5&quot; cy=&quot;8.5&quot; r=&quot;1.5&quot;/%3E%3Cpolyline points=&quot;21 15 16 10 5 21&quot;/%3E%3C/svg%3E'">
        </div>
        <div class="media-info">
          <span class="media-name">${f.name}</span>
          <span class="media-size">${formatSize(f.size)}</span>
        </div>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteMedia(${f.id})">删除</button>
      </div>
    `).join('');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  window.selectMedia = (id) => {
    const f = files.find(x => x.id === id);
    if (!f) return;
    API.toast('已选择: ' + f.name, 'success');
  };

  window.deleteMedia = async (id) => {
    if (!confirm('确定要删除这个文件吗？')) return;
    try {
      await API.delete(`/api/media/${id}`);
      API.toast('删除成功', 'success');
      await loadFiles();
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const btn = document.getElementById('uploadBtn');
    const oldText = btn.textContent;
    btn.textContent = '上传中...';
    btn.disabled = true;

    try {
      const formData = new FormData();
      formData.append('file', file);
      await API.upload('/api/media/upload', formData);
      API.toast('上传成功', 'success');
      await loadFiles();
    } catch (err) {
      API.toast('上传失败: ' + err.message, 'error');
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
      e.target.value = '';
    }
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>媒体库</h1>
      <label class="btn btn-primary" id="uploadBtn">
        📤 上传文件
        <input type="file" accept="image/*" style="display:none" onchange="handleUpload(event)">
      </label>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">文件列表</div>
        <span class="badge badge-gray">共 ${files.length} 个文件</span>
      </div>
      <div class="card-body">
        <div id="mediaGrid" class="media-grid"></div>
      </div>
    </div>
  `;

  await loadFiles();
});