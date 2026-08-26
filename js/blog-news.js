(function () {
  'use strict';

  var PER_PAGE = 6;

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initStaticPagination();
  });

  function initStaticPagination() {
    var container = document.getElementById('blogCategories');
    if (!container) return;

    container.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-page]');
      if (!button || button.disabled) return;

      var pagination = button.closest('.blog-pagination');
      if (!pagination) return;

      var section = pagination.closest('.blog-category-section');
      if (!section) return;

      var targetPage = parseInt(button.dataset.page, 10);
      var grid = section.querySelector('.posts-grid');
      var totalPages = parseInt(pagination.dataset.totalPages || '1', 10);

      if (!grid) return;

      var templates = section.querySelectorAll('.post-card-template[data-page="' + targetPage + '"]');
      if (!templates.length) return;

      grid.innerHTML = '';
      templates.forEach(function (tpl) {
        grid.insertAdjacentHTML('beforeend', tpl.innerHTML);
      });

      pagination.innerHTML = buildPagination(targetPage, totalPages);
    });
  }

  function buildPagination(page, totalPages) {
    if (totalPages <= 1) return '';
    var html = '<button class="page-arrow" data-page="' + Math.max(1, page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>&laquo;</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button data-page="' + i + '"' + (i === page ? ' class="active"' : '') + '>' + i + '</button>';
    }
    return html + '<button class="page-arrow" data-page="' + Math.min(totalPages, page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
  }

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (element) { observer.observe(element); });
  }

  function initScrollProgress() {
    var progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    }, { passive: true });
  }

  function initBackToTop() {
    var button = document.getElementById('backToTop');
    if (!button) return;
    window.addEventListener('scroll', function () {
      button.classList.toggle('show', (window.pageYOffset || document.documentElement.scrollTop) > 400);
    }, { passive: true });
    button.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();
