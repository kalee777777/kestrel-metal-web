/**
 * Admin API Client - 封装所有后端请求
 */
const API = (function () {
  const TOKEN_KEY = 'km_admin_token';
  const USER_KEY = 'km_admin_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function request(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();

      if (res.status === 401) {
        logout();
        window.location.href = '/admin/login.html';
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      if (err.message === 'Unauthorized') throw err;
      console.error('API Error:', err);
      throw err;
    }
  }

  return {
    // Auth
    login: (username, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    getMe: () => request('/api/auth/me'),
    changePassword: (current_password, new_password) =>
      request('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password, new_password })
      }),

    // Dashboard
    getDashboardSummary: () => request('/api/dashboard/summary'),

    // Token & User 管理
    getToken, setToken, getUser, setUser, isLoggedIn, logout,

    // 通用请求
    get: (url) => request(url),
    post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (url) => request(url, { method: 'DELETE' }),

    // 上传文件
    upload: (url, formData) => fetch(url, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body: formData
    }).then(r => r.json()),

    // Toast 通知
    toast(msg, type = 'info') {
      const t = document.createElement('div');
      t.className = 'toast ' + type;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    }
  };
})();