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

        var backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', scrollToTop);
        }
    });
})();