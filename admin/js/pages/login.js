/**
 * 登录页逻辑
 */
(function () {
  // 已登录则跳转后台
  if (API.isLoggedIn()) {
    window.location.href = '/admin';
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      errEl.textContent = '请填写用户名和密码';
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const res = await API.login(username, password);
      API.setToken(res.token);
      API.setUser(res.user);
      window.location.href = '/admin';
    } catch (err) {
      errEl.textContent = err.message || '登录失败,请重试';
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
})();