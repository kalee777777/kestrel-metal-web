/**
 * Admin App 主入口 - 处理后台初始化、菜单、登出
 */
(function () {
  // 未登录则跳转登录页
  if (!API.isLoggedIn()) {
    window.location.href = '/admin/login.html';
    return;
  }

  // 加载当前用户信息
  (async function loadUser() {
    try {
      const user = await API.getMe();
      API.setUser(user);
      const avatarEl = document.getElementById('userAvatar');
      const nameEl = document.getElementById('userName');
      if (avatarEl) avatarEl.textContent = (user.username || 'A').charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = user.username;
    } catch (err) {
      console.error('Load user failed:', err);
    }
  })();

  // 用户菜单下拉
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('userDropdown').classList.toggle('show');
    });
    document.addEventListener('click', () => {
      document.getElementById('userDropdown').classList.remove('show');
    });
  }

  // 退出登录
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('确定要退出登录吗?')) {
        API.logout();
        window.location.href = '/admin/login.html';
      }
    });
  }

  // 侧边栏折叠切换
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar.classList.toggle('show');
      } else {
        // 暂时只是简单的显示/隐藏切换
        sidebar.classList.toggle('show');
      }
    });
  }

  // 启动路由
  Router.start();
})();