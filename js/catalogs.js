(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initCatalogs();
  });

  function initCatalogs() {
    initFilterAndSearch();
    initDownloadToast();
  }

  /* ---------- Filter tags + Search ---------- */
  function initFilterAndSearch() {
    var searchInput = document.getElementById('catalogSearch');
    var noResults = document.getElementById('catalogNoResults');
    if (!searchInput) return;

    var debounceTimer;

    function filter() {
      var searchTerm = searchInput.value.trim().toLowerCase();
      var activeTag = document.querySelector('.catalog-filter-tag.active');
      var category = activeTag ? activeTag.dataset.filter : 'all';
      var visibleCount = 0;

      document.querySelectorAll('.catalog-card').forEach(function (card) {
        var cardCategory = card.dataset.category;
        var matchesCategory = category === 'all' || cardCategory === category || cardCategory === 'all';
        var matchesSearch = searchTerm === '' ||
          card.dataset.keywords.toLowerCase().indexOf(searchTerm) !== -1 ||
          card.querySelector('.catalog-title').textContent.toLowerCase().indexOf(searchTerm) !== -1 ||
          card.querySelector('.catalog-description').textContent.toLowerCase().indexOf(searchTerm) !== -1;

        if (matchesCategory && matchesSearch) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    document.querySelectorAll('.catalog-filter-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        document.querySelectorAll('.catalog-filter-tag').forEach(function (t) {
          t.classList.remove('active');
        });
        tag.classList.add('active');
        filter();
      });
    });

    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        filter();
      }, 200);
    });
  }

  /* ---------- Download toast ---------- */
  function initDownloadToast() {
    var toast = document.createElement('div');
    toast.className = 'catalog-toast';
    toast.id = 'catalogToast';
    toast.textContent = 'Download starting...';
    document.body.appendChild(toast);

    var timer;
    document.querySelectorAll('.catalog-download-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = btn.dataset.catalog || 'Catalog';
        toast.textContent = 'Download starting: ' + name + '...';
        toast.classList.add('show');
        clearTimeout(timer);
        timer = setTimeout(function () {
          toast.classList.remove('show');
        }, 3000);
      });
    });
  }

  function initScrollReveal() {
    var revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  function initScrollProgress() {
    var progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    }, { passive: true });
  }

  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      var show = (window.pageYOffset || document.documentElement.scrollTop) > 400;
      btn.classList.toggle('show', show);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
