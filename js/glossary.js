(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initGlossary();
  });

  function initGlossary() {
    initAccordion();
    initSearchAndFilter();
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    var headers = document.querySelectorAll('.glossary-category-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var category = header.closest('.glossary-category');
        category.classList.toggle('open');
      });
    });
  }

  /* ---------- Search + Alphabet + Category filter ---------- */
  function initSearchAndFilter() {
    var searchInput = document.getElementById('glossarySearch');
    var alphaBtns = document.querySelectorAll('.glossary-alpha-btn');
    var catBtns = document.querySelectorAll('.glossary-cat-btn');
    var noResult = document.getElementById('glossaryNoResult');
    var categories = document.querySelectorAll('.glossary-category');

    var currentLetter = 'ALL';
    var currentCat = 'all';

    function filterAll() {
      var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var groupHasVisible = false;

      categories.forEach(function (cat) {
        var catMatches = currentCat === 'all' || cat.getAttribute('data-category') === currentCat;
        var catAnyVisible = false;

        if (!catMatches) {
          cat.classList.add('cat-hidden');
        } else {
          cat.classList.remove('cat-hidden');
        }

        cat.querySelectorAll('.glossary-list li').forEach(function (li) {
          var termEl = li.querySelector('.glossary-term');
          var defEl = li.querySelector('.glossary-def');
          var term = termEl ? termEl.textContent : '';
          var def = defEl ? defEl.textContent : '';
          var haystack = term + ' ' + def;
          haystack = haystack.toLowerCase();

          var letterOk = currentLetter === 'ALL' || term.charAt(0).toUpperCase() === currentLetter;
          var searchOk = !q || haystack.indexOf(q) !== -1;
          var visibleCurrent = letterOk && searchOk && catMatches;

          if (visibleCurrent) {
            li.classList.remove('hidden');
            if (termEl && q) termEl.innerHTML = highlight(term, q, true);
            if (defEl && q) defEl.innerHTML = highlight(def, q, false);
            catAnyVisible = true;
          } else {
            li.classList.add('hidden');
          }
        });

        if (catMatches && catAnyVisible) {
          cat.classList.remove('cat-hidden');
          groupHasVisible = true;
        } else if (catMatches) {
          cat.classList.add('cat-hidden');
        }
      });

      if (noResult) {
        noResult.style.display = groupHasVisible ? 'none' : 'block';
      }
    }

    function highlight(text, term, isTerm) {
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

    // Alphabet
    alphaBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        alphaBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentLetter = btn.getAttribute('data-letter');
        filterAll();
      });
    });

    // Category
    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        catBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentCat = btn.getAttribute('data-cat');
        filterAll();
      });
    });

    // Search
    if (searchInput) {
      var debounceTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterAll, 200);
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
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
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
