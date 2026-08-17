/**
 * Analytics - Unified tracking module for GA4 + Baidu Statistics
 *
 * GA4 Measurement ID and Baidu Token are loaded from Admin site_settings.
 * Falls back to placeholder values if not configured.
 */
var Analytics = (function () {
  'use strict';

  var GA_MEASUREMENT_ID = '';
  var BAIDU_TOKEN = '';
  var isInitialized = false;

  function getSetting(key) {
    try {
      var raw = localStorage.getItem('km_admin_site_settings');
      if (!raw) return null;
      var settings = JSON.parse(raw);
      return key ? settings[key] : settings;
    } catch (e) {
      return null;
    }
  }

  function loadGA4(measurementId) {
    if (!measurementId || document.querySelector('script[src*="gtag/js"]')) return;
    GA_MEASUREMENT_ID = measurementId;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure'
    });
  }

  function loadBaidu(token) {
    if (!token || document.querySelector('script[src*="hm.js"]')) return;
    BAIDU_TOKEN = token;

    var hm = document.createElement('script');
    hm.async = true;
    hm.src = 'https://hm.baidu.com/hm.js?' + token;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(hm, s);

    window._hmt = window._hmt || [];
  }

  function trackEvent(eventName, params) {
    if (window.gtag) {
      window.gtag('event', eventName, params || {});
    }
    if (window._hmt) {
      window._hmt.push(['_trackEvent', (params && params.category) || 'engagement', eventName, (params && params.label) || '', (params && params.value) || 0]);
    }
  }

  function trackPageView(pagePath, pageTitle) {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pagePath || window.location.pathname,
        page_title: pageTitle || document.title
      });
    }
    if (window._hmt) {
      window._hmt.push(['_trackPageView', pagePath || window.location.pathname, { page_title: pageTitle || document.title }]);
    }
  }

  function trackProductClick(productId, productName, category) {
    trackEvent('select_item', {
      category: 'Products',
      label: productName,
      value: 1,
      items: [{ item_id: productId, item_name: productName, item_category: category }]
    });
  }

  function trackInquiryForm(productName) {
    trackEvent('generate_lead', {
      category: 'Inquiries',
      label: productName || 'contact_form',
      value: 1
    });
  }

  function trackDownload(fileName) {
    trackEvent('file_download', {
      category: 'Downloads',
      label: fileName,
      value: 1
    });
  }

  function trackSearch(searchTerm) {
    trackEvent('search', {
      category: 'Search',
      label: searchTerm,
      value: 1
    });
  }

  function trackOutboundLink(url, text) {
    trackEvent('click', {
      category: 'Outbound Link',
      label: text || url,
      value: 1
    });
  }

  function trackFAQInteraction(question) {
    trackEvent('faq_expand', {
      category: 'FAQ',
      label: question,
      value: 1
    });
  }

  function trackBlogRead(articleTitle) {
    trackEvent('article_read', {
      category: 'Blog',
      label: articleTitle,
      value: 1
    });
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    var settings = getSetting();
    if (!settings) return;

    if (settings.ga4_measurement_id) {
      loadGA4(settings.ga4_measurement_id);
    }
    if (settings.baidu_stat_token) {
      loadBaidu(settings.baidu_stat_token);
    }

    attachAutoTrack();
  }

  function attachAutoTrack() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href) return;

      if (href.match(/\.(pdf|zip|doc|docx|xlsx|csv)$/i)) {
        trackDownload(href.split('/').pop());
      }

      if (link.hostname && link.hostname !== window.location.hostname) {
        trackOutboundLink(href, link.textContent.trim());
      }

      if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
        trackEvent('contact_click', {
          category: 'Contact',
          label: href.split(':')[1],
          value: 1
        });
      }
    });

    var searchInputs = document.querySelectorAll('input[type="search"], input[name="search"], input[name="q"]');
    searchInputs.forEach(function (input) {
      input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && input.value.trim()) {
          trackSearch(input.value.trim());
        }
      });
    });

    var faqQuestions = document.querySelectorAll('.faq-question, .accordion-header');
    faqQuestions.forEach(function (q) {
      q.addEventListener('click', function () {
        var text = q.textContent.trim().substring(0, 100);
        trackFAQInteraction(text);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }

  return {
    init: init,
    trackEvent: trackEvent,
    trackPageView: trackPageView,
    trackProductClick: trackProductClick,
    trackInquiryForm: trackInquiryForm,
    trackDownload: trackDownload,
    trackSearch: trackSearch,
    trackBlogRead: trackBlogRead,
    trackFAQInteraction: trackFAQInteraction
  };
})();
