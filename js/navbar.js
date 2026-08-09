/* =========================================
   KESTREL METAL 官网 - 导航栏交互
   （按 2b43213 基准提交格式对齐）
   ========================================= */

(function () {
  'use strict';

  var navbar = document.querySelector('.navbar');
  var mobileToggle = document.querySelector('.mobile-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var iconMenu = mobileToggle ? mobileToggle.querySelector('.icon-menu') : null;
  var iconClose = mobileToggle ? mobileToggle.querySelector('.icon-close') : null;

  if (!navbar || !mobileToggle || !mobileMenu) return;

  // 滚动时添加 .scrolled 状态（基准阈值 > 50）
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // 更新汉堡图标（菜单 / 关闭）
  function updateToggleIcon() {
    if (!iconMenu || !iconClose) return;
    var open = mobileMenu.classList.contains('active');
    iconMenu.style.display = open ? 'none' : 'block';
    iconClose.style.display = open ? 'block' : 'none';
  }

  // 移动端菜单开关（侧滑抽屉）
  function toggleMobileMenu(forceOpen) {
    var willOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !mobileMenu.classList.contains('active');
    mobileMenu.classList.toggle('active', willOpen);
    document.body.style.overflow = willOpen ? 'hidden' : '';
    updateToggleIcon();
  }

  // 移动端 Products 子菜单展开/收起
  var productsToggle = document.getElementById('mobile-products-toggle');
  var productsSubmenu = document.getElementById('mobile-products-submenu');
  if (productsToggle && productsSubmenu) {
    productsToggle.addEventListener('click', function () {
      productsSubmenu.classList.toggle('open');
    });
  }

  // 移动端点击链接后关闭菜单（含 CTA / 子菜单项）
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggleMobileMenu(false);
    });
  });

  // 事件绑定
  window.addEventListener('scroll', handleScroll, { passive: true });
  mobileToggle.addEventListener('click', function () {
    toggleMobileMenu();
  });
  handleScroll();
})();
