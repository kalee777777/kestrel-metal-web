(function () {
    'use strict';

    function updateScrollProgress() {
        var bar = document.getElementById('scroll-progress');
        if (!bar) return;
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    }

    function handleBackToTop() {
        var btn = document.getElementById('backToTop');
        if (!btn) return;
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function initScrollReveal() {
        var elements = document.querySelectorAll('[data-reveal]');
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(function (el) {
                el.classList.add('revealed');
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
        }, { threshold: 0.15 });

        elements.forEach(function (el) {
            observer.observe(el);
        });
    }

    function initTableOfContents() {
        var toc = document.querySelector('.legal-toc');
        var tocMobile = document.querySelector('.legal-toc-mobile');
        var toggleBtn = document.querySelector('.legal-toc-toggle');
        if (!toc && !tocMobile) return;

        var links = document.querySelectorAll('.legal-toc-list a');
        if (!links.length) return;

        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                var targetId = link.getAttribute('href');
                if (!targetId || targetId.charAt(0) !== '#') return;
                e.preventDefault();
                var target = document.querySelector(targetId);
                if (!target) return;
                var navHeight = 80;
                var targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
                if (tocMobile) tocMobile.classList.remove('open');
                if (toggleBtn) toggleBtn.classList.remove('open');
                history.replaceState(null, '', targetId);
            });
        });

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                toggleBtn.classList.toggle('open');
                if (tocMobile) tocMobile.classList.toggle('open');
            });
        }

        if (!('IntersectionObserver' in window)) return;

        var headings = [];
        links.forEach(function (link) {
            var id = link.getAttribute('href');
            if (id && id.charAt(0) === '#') {
                var h = document.querySelector(id);
                if (h) headings.push({ id: id, element: h, link: link });
            }
        });

        if (!headings.length) return;

        var activeLink = null;

        function setActive(link) {
            if (activeLink === link) return;
            links.forEach(function (l) { l.classList.remove('active'); });
            if (link) link.classList.add('active');
            activeLink = link;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = '#' + entry.target.id;
                    var match = headings.find(function (h) { return h.id === id; });
                    if (match) setActive(match.link);
                }
            });
        }, {
            rootMargin: '-100px 0px -70% 0px',
            threshold: [0, 1]
        });

        headings.forEach(function (h) {
            if (h.element.id) observer.observe(h.element);
        });

        var scrollTimer;
        window.addEventListener('scroll', function () {
            if (scrollTimer) return;
            scrollTimer = requestAnimationFrame(function () {
                var scrollPos = window.scrollY + 120;
                var current = null;
                headings.forEach(function (h) {
                    if (h.element.offsetTop <= scrollPos) current = h;
                });
                if (current) setActive(current.link);
                scrollTimer = null;
            });
        }, { passive: true });

        var hash = window.location.hash;
        if (hash) {
            var target = document.querySelector(hash);
            if (target) {
                var navHeight = 80;
                var targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight;
                setTimeout(function () {
                    window.scrollTo({ top: targetTop, behavior: 'smooth' });
                }, 100);
            }
        }
    }

    var scrollTimer;
    window.addEventListener('scroll', function () {
        if (scrollTimer) return;
        scrollTimer = requestAnimationFrame(function () {
            updateScrollProgress();
            handleBackToTop();
            scrollTimer = null;
        });
    }, { passive: true });

    window.addEventListener('DOMContentLoaded', function () {
        updateScrollProgress();
        handleBackToTop();
        initScrollReveal();
        initTableOfContents();

        var backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', scrollToTop);
        }
    });
})();