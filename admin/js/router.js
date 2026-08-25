/**
 * 简单的 hash 路由
 */
const Router = (function () {
  const routes = {};

  function register(route, handler) {
    routes[route] = handler;
  }

  function start() {
    window.addEventListener('hashchange', render);
    render();
  }

  function getRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    return hash;
  }

  function navigate(route) {
    window.location.hash = route;
  }

  async function render() {
    const path = getRoute();
    const route = path.split('?')[0];
    const handler = routes[route];

    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
      const r = item.dataset.route;
      if (r && ('/' + r) === route) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // 更新页面标题
    const titles = {
      '/dashboard': '数据看板',
      '/products': '产品列表',
      '/product-categories': '产品分类',
      '/blog': '博客文章',
      '/content': 'AI 内容',
      '/cases': '案例研究',
      '/faq': 'FAQ 管理',
      '/glossary': '术语表',
      '/inquiries': '询盘管理',
      '/analytics': '访客分析',
      '/keywords': '关键词监控',
      '/opportunities': '内容机会',
      '/i18n': '国际化',
      '/seo': 'SEO 管理',
      '/geo': 'GEO 优化',
      '/media': '媒体库',
      '/settings': '系统设置'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[route] || '管理后台';

    const content = document.getElementById('pageContent');
    if (!content) return;

    if (handler) {
      content.innerHTML = '<div class="loading">加载中...</div>';
      try {
        await handler(content);
      } catch (err) {
        content.innerHTML = '<div class="empty-state"><p>加载失败: ' + (err.message || err) + '</p></div>';
      }
    } else {
      content.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>页面建设中...</p></div>';
    }
  }

  return { register, start, navigate, getRoute };
})();