(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initFilterSearch();
  });

  function initFilterSearch() {
    var searchInput = document.getElementById('caseStudySearch');
    var noResults = document.getElementById('caseNoResults');
    if (!searchInput) return;

    var debounceTimer;

    function filter() {
      var searchTerm = searchInput.value.trim().toLowerCase();
      var activeTag = document.querySelector('.casestudy-filter-tag.active');
      var category = activeTag ? activeTag.dataset.filter : 'all';
      var visibleCount = 0;

      document.querySelectorAll('.casestudy-card').forEach(function (card) {
        var cardCategory = card.dataset.category;
        var matchesCategory = category === 'all' || cardCategory === category;
        var matchesSearch = searchTerm === '' ||
          card.dataset.keywords.toLowerCase().indexOf(searchTerm) !== -1 ||
          card.querySelector('.casestudy-card-title').textContent.toLowerCase().indexOf(searchTerm) !== -1 ||
          card.querySelector('.casestudy-card-excerpt').textContent.toLowerCase().indexOf(searchTerm) !== -1;

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

    document.querySelectorAll('.casestudy-filter-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        document.querySelectorAll('.casestudy-filter-tag').forEach(function (t) {
          t.classList.remove('active');
        });
        tag.classList.add('active');
        filter();
      });
    });

    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filter, 200);
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
