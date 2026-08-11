(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initShareButtons();
  });

  function initShareButtons() {
    var section = document.querySelector('.share-section');
    var btns = document.querySelectorAll('.share-btn[data-share]');
    if (!section || !btns.length) return;
    var pageUrl = section.getAttribute('data-page-url') || window.location.href;
    var pageTitle = section.getAttribute('data-page-title') || document.title;
    var encodedUrl = encodeURIComponent(pageUrl);
    var encodedTitle = encodeURIComponent(pageTitle);
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var type = btn.getAttribute('data-share');
        var href;
        if (type === 'linkedin') {
          href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl;
        } else if (type === 'twitter') {
          href = 'https://twitter.com/intent/tweet?text=' + encodedTitle + '&url=' + encodedUrl;
        } else if (type === 'email') {
          href = 'mailto:?subject=' + encodedTitle + '&body=' + encodedUrl;
        } else {
          return;
        }
        window.open(href, '_blank', 'noopener');
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
