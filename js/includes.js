(function () {
  'use strict';

  var BASE = '';
  try {
    var path = window.location.pathname;
    var depth = path.split('/').filter(Boolean).length - 1;
    BASE = depth > 0 ? '../'.repeat(depth) : '';
  } catch (e) {}

  function loadComponent(url) {
    return fetch(BASE + url, { credentials: 'same-origin', cache: 'default' })
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

  var _analyticsLoaded = false;
  function ensureAnalytics() {
    if (_analyticsLoaded) return;
    _analyticsLoaded = true;
    try {
      var raw = localStorage.getItem('km_admin_site_settings');
      var settings = raw ? JSON.parse(raw) : null;
      if (!settings) return;

      if (settings.ga4_measurement_id && !document.querySelector('script[src*="gtag/js"]')) {
        var ga4 = document.createElement('script');
        ga4.async = true;
        ga4.src = 'https://www.googletagmanager.com/gtag/js?id=' + settings.ga4_measurement_id;
        document.head.appendChild(ga4);
        window.dataLayer = window.dataLayer || [];
        var gtag = function () { window.dataLayer.push(arguments); };
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', settings.ga4_measurement_id, { send_page_view: true, cookie_flags: 'SameSite=None;Secure' });
      }
    } catch (e) {}
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

  var _analyticsAutoTrackAttached = false;
  function attachAnalyticsAutoTrack() {
    if (_analyticsAutoTrackAttached) return;
    _analyticsAutoTrackAttached = true;
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;
      if (href.match(/\.(pdf|zip|doc|docx|xlsx|csv)$/i)) {
        trackAnalyticsEvent('file_download', { category: 'Downloads', label: href.split('/').pop() });
      }
      if (link.hostname && link.hostname !== window.location.hostname) {
        trackAnalyticsEvent('click', { category: 'Outbound Link', label: href });
      }
      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
        trackAnalyticsEvent('contact_click', { category: 'Contact', label: href.split(':')[1] });
      }
    });
  }

  function trackAnalyticsEvent(name, params) {
    if (window.gtag) {
      window.gtag('event', name, params || {});
    }
  }

  window.Analytics = window.Analytics || {
    trackEvent: trackAnalyticsEvent,
    trackInquiryForm: function (product) { trackAnalyticsEvent('generate_lead', { category: 'Inquiries', label: product || 'contact_form' }); },
    trackProductClick: function (id, name, cat) { trackAnalyticsEvent('select_item', { category: 'Products', label: name }); },
    trackDownload: function (file) { trackAnalyticsEvent('file_download', { category: 'Downloads', label: file }); },
    trackSearch: function (q) { trackAnalyticsEvent('search', { category: 'Search', label: q }); },
    trackFAQInteraction: function (q) { trackAnalyticsEvent('faq_expand', { category: 'FAQ', label: q ? q.substring(0, 100) : '' }); },
    trackBlogRead: function (title) { trackAnalyticsEvent('article_read', { category: 'Blog', label: title }); }
  };

  Promise.all([navbarReady, footerReady]).then(function () {
    initNavbar();
    initFooterSmoothScroll();
    ensureAnalytics();
    attachAnalyticsAutoTrack();
  }, function () {
    ensureAnalytics();
    attachAnalyticsAutoTrack();
  });

  function loadScript(src) {
    var s = document.createElement('script');
    s.src = BASE + src;
    s.defer = true;
    document.body.appendChild(s);
  }

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
