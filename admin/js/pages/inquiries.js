Router.register('/inquiries', async function (container) {
  let inquiries = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchQuery = '';
  let statusFilter = '';

  async function loadInquiries(page = 1) {
    try {
      const params = new URLSearchParams({ page, pageSize: 20 });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const res = await API.get(`/api/inquiries?${params}`);
      inquiries = res.data;
      currentPage = res.page;
      totalPages = res.totalPages;
      renderTable();
      renderPagination();
      updateBadge();
    } catch (err) {
      API.toast('加载询盘失败: ' + err.message, 'error');
    }
  }

  async function updateBadge() {
    try {
      const stats = await API.get('/api/inquiries/stats/count');
      const badge = document.getElementById('inquiryBadge');
      if (badge) {
        if (stats.pending > 0) {
          badge.textContent = stats.pending;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Update badge failed:', err);
    }
  }

  function renderTable() {
    const tbody = document.getElementById('inquiryTableBody');
    tbody.innerHTML = inquiries.map(inq => `
      <tr>
        <td>${inq.id}</td>
        <td>${inq.name}</td>
        <td>${inq.email}</td>
        <td>${inq.phone || '-'}</td>
        <td>${inq.company || '-'}</td>
        <td>${inq.country || '-'}</td>
        <td>${inq.product_name || (inq.product?.name || '-')}</td>
        <td>${inq.quantity || '-'}</td>
        <td><span class="badge ${inq.status === 'pending' ? 'badge-warning' : inq.status === 'replied' ? 'badge-success' : 'badge-gray'}">${inq.status === 'pending' ? '待回复' : inq.status === 'replied' ? '已回复' : '已关闭'}</span></td>
        <td>${inq.created_at ? new Date(inq.created_at).toLocaleString() : '-'}</td>
        <td>${inq.replies?.length || 0}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm" onclick="viewInquiry(${inq.id})">查看</button>
            <button class="btn btn-sm btn-danger" onclick="deleteInquiry(${inq.id})">删除</button>
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
    html += `<button onclick="loadInquiries(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button onclick="loadInquiries(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    html += `<button onclick="loadInquiries(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>→</button>`;
    pagination.innerHTML = html;
  }

  window.viewInquiry = async (id) => {
    try {
      const inq = await API.get(`/api/inquiries/${id}`);
      document.getElementById('viewInquiryId').textContent = inq.id;
      document.getElementById('viewName').textContent = inq.name;
      document.getElementById('viewEmail').textContent = inq.email;
      document.getElementById('viewPhone').textContent = inq.phone || '-';
      document.getElementById('viewCompany').textContent = inq.company || '-';
      document.getElementById('viewCountry').textContent = inq.country || '-';
      document.getElementById('viewProduct').textContent = inq.product_name || (inq.product?.name || '-');
      document.getElementById('viewQuantity').textContent = inq.quantity || '-';
      document.getElementById('viewMessage').textContent = inq.message || '-';
      document.getElementById('viewSource').textContent = inq.source_page || '-';
      document.getElementById('viewStatus').textContent = inq.status === 'pending' ? '待回复' : inq.status === 'replied' ? '已回复' : '已关闭';
      document.getElementById('viewCreated').textContent = new Date(inq.created_at).toLocaleString();
      document.getElementById('viewReplied').textContent = inq.replied_at ? new Date(inq.replied_at).toLocaleString() : '-';

      document.getElementById('replyForm').reset();
      document.getElementById('replyForm').dataset.id = id;

      const repliesContainer = document.getElementById('repliesContainer');
      if (inq.replies && inq.replies.length > 0) {
        repliesContainer.innerHTML = inq.replies.map(r => `
          <div style="margin-bottom:1rem;padding:1rem;background:var(--gray-50);border-radius:var(--radius-md)">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
              <span style="font-weight:500">${r.admin?.username || '系统'}</span>
              <span style="font-size:0.75rem;color:var(--gray-500)">${new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p style="font-size:0.875rem">${r.content}</p>
          </div>
        `).join('');
      } else {
        repliesContainer.innerHTML = '<p style="color:var(--gray-500)">暂无回复</p>';
      }

      document.getElementById('inquiryModal').classList.add('show');
    } catch (err) {
      API.toast('加载询盘详情失败: ' + err.message, 'error');
    }
  };

  window.deleteInquiry = async (id) => {
    if (!confirm('确定要删除这个询盘吗？')) return;
    try {
      await API.delete(`/api/inquiries/${id}`);
      API.toast('询盘删除成功', 'success');
      await loadInquiries(currentPage);
    } catch (err) {
      API.toast('删除失败: ' + err.message, 'error');
    }
  };

  window.closeInquiryModal = () => {
    document.getElementById('inquiryModal').classList.remove('show');
  };

  container.innerHTML = `
    <div class="page-header">
      <h1>询盘管理</h1>
      <div class="btn-group">
        <a href="/api/inquiries/export/csv" class="btn" download>📥 导出 CSV</a>
      </div>
    </div>

    <div class="filter-bar">
      <input type="text" id="searchInput" class="form-control search" placeholder="搜索姓名/邮箱/产品..." onkeyup="handleSearch(event)">
      <select id="statusFilter" class="form-control" onchange="handleStatusFilter(this.value)">
        <option value="">全部状态</option>
        <option value="pending">待回复</option>
        <option value="replied">已回复</option>
        <option value="closed">已关闭</option>
      </select>
      <button class="btn" onclick="handleReset()">重置</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>电话</th>
            <th>公司</th>
            <th>国家</th>
            <th>产品</th>
            <th>数量</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>回复数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="inquiryTableBody"></tbody>
      </table>
    </div>

    <div id="pagination" class="pagination"></div>

    <div id="inquiryModal" class="modal-overlay">
      <div class="modal" style="max-width:700px">
        <div class="modal-header">
          <div class="modal-title">询盘详情 #<span id="viewInquiryId"></span></div>
          <button class="modal-close" onclick="closeInquiryModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div><strong>姓名:</strong> <span id="viewName"></span></div>
            <div><strong>邮箱:</strong> <span id="viewEmail"></span></div>
            <div><strong>电话:</strong> <span id="viewPhone"></span></div>
            <div><strong>公司:</strong> <span id="viewCompany"></span></div>
            <div><strong>国家:</strong> <span id="viewCountry"></span></div>
            <div><strong>产品:</strong> <span id="viewProduct"></span></div>
            <div><strong>数量:</strong> <span id="viewQuantity"></span></div>
            <div><strong>状态:</strong> <span id="viewStatus"></span></div>
            <div><strong>来源:</strong> <span id="viewSource"></span></div>
            <div><strong>创建时间:</strong> <span id="viewCreated"></span></div>
            <div><strong>回复时间:</strong> <span id="viewReplied"></span></div>
          </div>
          <div style="margin-bottom:1.5rem">
            <strong>询盘内容:</strong>
            <p id="viewMessage" style="margin-top:0.5rem;white-space:pre-wrap"></p>
          </div>
          <div style="margin-bottom:1.5rem">
            <strong>回复记录:</strong>
            <div id="repliesContainer"></div>
          </div>
          <div>
            <strong>回复询盘:</strong>
            <form id="replyForm">
              <textarea name="content" class="form-control" style="min-height:100px;margin-top:0.5rem" placeholder="输入回复内容..."></textarea>
            </form>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeInquiryModal()">关闭</button>
          <button class="btn btn-primary" onclick="submitReply()">发送回复</button>
        </div>
      </div>
    </div>
  `;

  window.submitReply = async () => {
    const form = document.getElementById('replyForm');
    const content = form.content.value.trim();
    const id = form.dataset.id;

    if (!content) {
      API.toast('请输入回复内容', 'error');
      return;
    }

    try {
      await API.post(`/api/inquiries/${id}/replies`, { content });
      API.toast('回复发送成功', 'success');
      await viewInquiry(id);
      await loadInquiries(currentPage);
    } catch (err) {
      API.toast('发送失败: ' + err.message, 'error');
    }
  };

  window.handleSearch = (e) => {
    if (e.key === 'Enter') {
      searchQuery = e.target.value;
      loadInquiries(1);
    }
  };

  window.handleStatusFilter = (val) => {
    statusFilter = val;
    loadInquiries(1);
  };

  window.handleReset = () => {
    searchQuery = '';
    statusFilter = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    loadInquiries(1);
  };

  await loadInquiries();
});