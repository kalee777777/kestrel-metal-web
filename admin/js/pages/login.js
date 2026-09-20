/**
 * 登录页逻辑
 */
(function () {
  // 校验当前已存 token 是否仍有效（调一次需要鉴权的接口）。
  // 有效才放行进入后台，否则清除残留 token 停留在登录页，
  // 避免旧的 mock/错误 token 导致进入后台后所有请求 401。
  async function validateExistingToken() {
    const token = API.getToken && API.getToken();
    if (!token) return false;
    try {
      const res = await fetch('/api/inquiries?page=1&pageSize=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  (async function bootstrap() {
    if (API.isLoggedIn()) {
      const ok = await validateExistingToken();
      if (ok) {
        window.location.href = '/admin';
      } else {
        // token 无效/过期：清除后停在登录页重新输入
        API.logout && API.logout();
      }
      return;
    }
  })();

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
      // 登录失败：清掉可能残留的错误 token，避免下次误判为已登录
      API.setToken && API.setToken(null);
      errEl.textContent = err.message || '登录失败,请重试';
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
})();
