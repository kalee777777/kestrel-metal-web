/**
 * CMS Sync - Frontend data bridge for Admin CMS
 * Reads localStorage (km_admin_*) and merges Admin data with static content
 */
var CMSSync = (function () {
  'use strict';

  var PREFIX = 'km_admin_';

  function getCollection(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function getSetting(key) {
    try {
      var raw = localStorage.getItem(PREFIX + 'site_settings');
      if (!raw) return null;
      var settings = JSON.parse(raw);
      return key ? settings[key] : settings;
    } catch (e) {
      return null;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderFAQs() {
    var container = document.getElementById('faqContainer');
    if (!container) return;

    var faqs = getCollection('faqs').filter(function (f) {
      return f.is_active !== false;
    });

    if (faqs.length === 0) return;

    var groups = {};
    var categoryMap = {
      'Orders': { id: 'orders', title: 'Ordering & Shipping', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      'Products': { id: 'products', title: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      'Quality': { id: 'quality', title: 'Quality & Standards', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      'Fence Products': { id: 'fence', title: 'Fence Products', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
      'Wire Mesh Products': { id: 'mesh', title: 'Wire Mesh Products', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z' },
      'Wire Products': { id: 'wire', title: 'Wire Products', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
    };

    faqs.forEach(function (f) {
      var cat = f.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });

    Object.keys(groups).forEach(function (cat) {
      var existingGroup = container.querySelector('[data-group="' + (categoryMap[cat] ? categoryMap[cat].id : cat.toLowerCase().replace(/\s+/g, '-')) + '"]');
      if (existingGroup) return;

      var catInfo = categoryMap[cat] || { id: cat.toLowerCase().replace(/\s+/g, '-'), title: cat, icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
      var groupHtml = '<div class="faq-group" data-group="' + catInfo.id + '" data-reveal>'
        + '<div class="faq-group-header"><span class="faq-group-tag">'
        + '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + catInfo.icon + '"/></svg> '
        + escapeHtml(catInfo.title) + '</span><div class="faq-group-line"></div></div>';

      groups[cat].sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
      groups[cat].forEach(function (f) {
        groupHtml += '<div class="faq-item" data-id="' + f.id + '">'
          + '<div class="faq-question"><span class="faq-question-text">' + escapeHtml(f.question) + '</span>'
          + '<svg width="18" height="18" class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div>'
          + '<div class="faq-answer-wrapper"><div class="faq-answer">' + escapeHtml(f.answer) + '</div></div></div>';
      });

      groupHtml += '</div>';
      container.insertAdjacentHTML('beforeend', groupHtml);
    });

    reinitFAQInteraction();
  }

  function reinitFAQInteraction() {
    var container = document.getElementById('faqContainer');
    if (!container) return;

    container.querySelectorAll('.faq-question').forEach(function (q) {
      if (q.dataset.bound) return;
      q.dataset.bound = '1';
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var group = q.closest('.faq-group');
        var openItems = group.querySelectorAll('.faq-item.active');
        openItems.forEach(function (open) { if (open !== item) open.classList.remove('active'); });
        item.classList.toggle('active');
      });
    });
  }

  function renderGlossary() {
    var container = document.getElementById('glossaryContainer');
    if (!container) return;

    var terms = getCollection('glossary').filter(function (g) {
      return g.enabled !== false;
    });

    if (terms.length === 0) return;

    var catNames = {
      'Products': 'Product Terms',
      'Technical': 'Technical Specifications',
      'Materials': 'Materials & Coatings'
    };

    var groups = {};
    terms.forEach(function (t) {
      var cat = t.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });

    var catIdx = container.querySelectorAll('.glossary-category').length;

    Object.keys(groups).forEach(function (cat) {
      var dataCat = cat.toLowerCase().replace(/\s+/g, '-');
      var existing = container.querySelector('[data-category="' + dataCat + '"]');
      if (existing) return;

      catIdx++;
      var catLabel = 'Category ' + String(catIdx).padStart(2, '0');
      var catTitle = catNames[cat] || cat;

      var catHtml = '<div class="glossary-category" data-category="' + dataCat + '" data-reveal>'
        + '<div class="glossary-category-header"><div class="glossary-category-header-inner">'
        + '<span class="glossary-category-label">' + catLabel + '</span>'
        + '<h2 class="glossary-category-title">' + escapeHtml(catTitle) + '</h2></div>'
        + '<svg width="20" height="20" class="glossary-category-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div>'
        + '<div class="glossary-category-body"><ul class="glossary-list">';

      groups[cat].sort(function (a, b) { return (a.term || '').localeCompare(b.term || ''); });
      groups[cat].forEach(function (t) {
        catHtml += '<li data-id="' + t.id + '"><span class="glossary-term">' + escapeHtml(t.term) + '</span>'
          + '<span class="glossary-def">' + escapeHtml(t.definition) + '</span></li>';
      });

      catHtml += '</ul></div></div>';
      container.insertAdjacentHTML('beforeend', catHtml);
    });

    reinitGlossaryInteraction();
  }

  function reinitGlossaryInteraction() {
    var container = document.getElementById('glossaryContainer');
    if (!container) return;

    container.querySelectorAll('.glossary-category-header').forEach(function (header) {
      if (header.dataset.bound) return;
      header.dataset.bound = '1';
      header.addEventListener('click', function () {
        header.closest('.glossary-category').classList.toggle('open');
      });
    });
  }

  function renderBlogPosts() {
    var blogGrid = document.getElementById('blogGrid') || document.getElementById('featuredGrid');
    if (!blogGrid) return;

    var posts = getCollection('blog_posts').filter(function (p) {
      return p.status === 'published';
    });

    if (posts.length === 0) return;

    posts.forEach(function (post) {
      if (document.querySelector('[data-post-id="' + post.id + '"]')) return;

      var cardHtml = '<article class="blog-card" data-post-id="' + post.id + '" data-reveal>'
        + '<a href="blog-detail.html?id=' + post.id + '" class="blog-card-link">'
        + '<div class="blog-card-image">'
        + '<img src="' + escapeHtml(post.cover_image || 'images/hero-blog.webp') + '" alt="' + escapeHtml(post.title) + '" loading="lazy">'
        + '<span class="blog-card-badge">' + escapeHtml(post.category || 'Uncategorized') + '</span>'
        + '</div>'
        + '<div class="blog-card-body">'
        + '<h3 class="blog-card-title">' + escapeHtml(post.title) + '</h3>'
        + '<p class="blog-card-desc">' + escapeHtml(post.description || '') + '</p>'
        + '<div class="blog-card-meta">'
        + '<span>' + escapeHtml(post.author || 'Kestrel Metal') + '</span>'
        + '<span>' + escapeHtml(post.read_time || '5 min read') + '</span>'
        + '</div></div></a></article>';

      blogGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  function renderCaseStudies() {
    var container = document.getElementById('caseStudiesGrid');
    if (!container) return;
    if (container.dataset.dynamic === 'true') return;
    if (container.dataset.casesRendered) return;
    if (container.querySelector('.casestudy-card')) return;

    var cases = getCollection('case_studies').filter(function (c) {
      return c.status === 'published';
    });

    if (cases.length === 0) return;
    container.dataset.casesRendered = '1';

    cases.sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    cases.forEach(function (cs) {
      if (document.querySelector('[data-case-id="' + cs.id + '"]')) return;

      var categoryLabels = {
        'water': 'Water & Wastewater', 'flood': 'Flood Control', 'mining': 'Mining & Quarry',
        'infrastructure': 'Infrastructure', 'energy': 'Energy & Power', 'agriculture': 'Agriculture',
        'oilgas': 'Oil & Gas', 'residential': 'Residential'
      };
      var cat = cs.category || 'other';
      var label = categoryLabels[cat] || cs.category || 'Case Study';
      var url = cs.static_url || cs.detail_url || '#';
      var cardHtml = '<a href="' + url + '" class="casestudy-card" data-case-id="' + cs.id + '" data-category="' + escapeHtml(cat) + '" data-keywords="' + escapeHtml((cs.title + ' ' + (cs.description || '')).toLowerCase()) + '" data-reveal>'
        + '<div class="casestudy-card-img">'
        + '<img src="' + escapeHtml(cs.cover_image || 'images/hero-case.webp') + '" alt="' + escapeHtml(cs.title) + '" loading="lazy">'
        + '</div>'
        + '<div class="casestudy-card-body">'
        + '<span class="casestudy-card-tag">' + escapeHtml(label) + '</span>'
        + '<h3 class="casestudy-card-title">' + escapeHtml(cs.title) + '</h3>'
        + '<div class="casestudy-card-location">' + escapeHtml(cs.location || '') + '</div>'
        + '<p class="casestudy-card-excerpt">' + escapeHtml(cs.description || '') + '</p>'
        + '<span class="casestudy-card-link">View Case Study &rarr;</span>'
        + '</div></a>';

      container.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  function syncContactInfo() {
    var settings = getSetting();
    if (!settings) return;

    var phoneEls = document.querySelectorAll('[data-cms="phone"]');
    var emailEls = document.querySelectorAll('[data-cms="email"]');
    var addressEls = document.querySelectorAll('[data-cms="address"]');

    phoneEls.forEach(function (el) { if (settings.site_phone) el.textContent = settings.site_phone; });
    emailEls.forEach(function (el) { if (settings.site_email) el.textContent = settings.site_email; });
    addressEls.forEach(function (el) { if (settings.site_address) el.textContent = settings.site_address; });
  }

  function init() {
    renderFAQs();
    renderGlossary();
    renderBlogPosts();
    renderCaseStudies();
    syncContactInfo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }

  return { init: init, getCollection: getCollection, getSetting: getSetting };
})();
