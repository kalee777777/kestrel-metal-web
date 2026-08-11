(function () {
  'use strict';

  var BASE = '';
  try {
    var path = window.location.pathname;
    var depth = path.split('/').filter(Boolean).length - 1;
    BASE = depth > 0 ? '../'.repeat(depth) : '';
  } catch (e) {}

  function loadComponent(url) {
    return fetch(BASE + url, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load ' + url + ': ' + r.status);
        return r.text();
      });
  }

  function waitForElement(selector) {
    return new Promise(function (resolve) {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        return;
      }
      var observer = new MutationObserver(function () {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  var navbarReady = loadComponent('components/navbar.html').then(function (html) {
    var placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) placeholder = document.getElementById('navbar');
    if (placeholder) {
      placeholder.outerHTML = html;
    } else {
      document.body.insertAdjacentHTML('afterbegin', html);
    }
  });

  var footerReady = loadComponent('components/footer.html').then(function (html) {
    var placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
      placeholder.outerHTML = html;
    } else {
      document.body.insertAdjacentHTML('beforeend', html);
    }
  });

  Promise.all([navbarReady, footerReady]).then(function () {
    initNavbar();
    initFooterSmoothScroll();
  });

  function initNavbar() {
    var navbar = document.querySelector('.navbar');
    var mobileToggle = document.querySelector('.mobile-toggle');
    var mobileMenu = document.querySelector('.mobile-menu');
    var iconMenu = mobileToggle ? mobileToggle.querySelector('.icon-menu') : null;
    var iconClose = mobileToggle ? mobileToggle.querySelector('.icon-close') : null;

    if (!navbar) return;

    function handleScroll() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    function updateToggleIcon() {
      if (!iconMenu || !iconClose) return;
      var open = mobileMenu && mobileMenu.classList.contains('active');
      iconMenu.style.display = open ? 'none' : 'block';
      iconClose.style.display = open ? 'block' : 'none';
    }

    function toggleMobileMenu(forceOpen) {
      if (!mobileMenu) return;
      var willOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : !mobileMenu.classList.contains('active');
      mobileMenu.classList.toggle('active', willOpen);
      document.body.style.overflow = willOpen ? 'hidden' : '';
      updateToggleIcon();
    }

    var productsToggle = document.getElementById('mobile-products-toggle');
    var productsSubmenu = document.getElementById('mobile-products-submenu');
    if (productsToggle && productsSubmenu) {
      productsToggle.addEventListener('click', function () {
        productsSubmenu.classList.toggle('open');
      });
    }

    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          toggleMobileMenu(false);
        });
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (mobileToggle) {
      mobileToggle.addEventListener('click', function () {
        toggleMobileMenu();
      });
    }
    handleScroll();
  }

  function initFooterSmoothScroll() {
    var footerContact = document.querySelector('.footer #contact');
    if (footerContact) {
      var triggers = document.querySelectorAll('a[href="#contact"]');
      triggers.forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          footerContact.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }
})();
