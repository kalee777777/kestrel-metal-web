(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initFAQ();
  });

  function initFAQ() {
    initAccordion();
    initSearch();
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    var questions = document.querySelectorAll('.faq-question');
    questions.forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq-item');
        var group = q.closest('.faq-group');
        // same group only
        var openItems = group.querySelectorAll('.faq-item.active');
        openItems.forEach(function (open) {
          if (open !== item) open.classList.remove('active');
        });
        item.classList.toggle('active');
      });
    });
  }

  /* ---------- Search filter ---------- */
  function initSearch() {
    var input = document.getElementById('faqSearch');
    var clearBtn = document.getElementById('faqSearchClear');
    var noResults = document.getElementById('faqNoResults');
    if (!input) return;

    var debounceTimer;

    function filter(text) {
      var q = text.trim().toLowerCase();
      var anyVisible = false;

      document.querySelectorAll('.faq-group').forEach(function (group) {
        var groupHasVisible = false;

        group.querySelectorAll('.faq-item').forEach(function (item) {
          var questionText = item.querySelector('.faq-question-text');
          var answerText = item.querySelector('.faq-answer');
          var haystack = (questionText ? questionText.textContent : '') + ' ' + (answerText ? answerText.textContent : '');
          haystack = haystack.toLowerCase();

          if (!q || haystack.indexOf(q) !== -1) {
            item.classList.remove('hidden-by-search');
            if (questionText) {
              questionText.innerHTML = highlight(questionText.textContent, text.trim());
            }
            groupHasVisible = true;
          } else {
            item.classList.add('hidden-by-search');
          }
        });

        if (groupHasVisible) {
          group.style.display = '';
          anyVisible = true;
        } else {
          group.style.display = 'none';
        }
      });

      if (noResults) {
        var groupsAllHidden = !anyVisible;
        noResults.style.display = groupsAllHidden ? 'block' : 'none';
      }

      if (clearBtn) {
        clearBtn.classList.toggle('visible', !q.length);
      }
    }

    function highlight(text, term) {
      if (!term) return escapeHtml(text);
      var idx = text.toLowerCase().indexOf(term.toLowerCase());
      if (idx === -1) return escapeHtml(text);
      return escapeHtml(text.substring(0, idx))
        + '<mark>' + escapeHtml(text.substr(idx, term.length)) + '</mark>'
        + escapeHtml(text.substring(idx + term.length));
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        filter(input.value);
      }, 200);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        filter('');
        input.focus();
      });
    }
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
