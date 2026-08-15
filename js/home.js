/* =========================================
   KESTREL METAL 官网 - 首页交互
   组件：DemoMap 世界地图 / MetalProducts 切换
   / ProjectManagement tab / Evidence hover
   ========================================= */
(function () {
  'use strict';

  /* ---------- 通用：滚动进场动画 ---------- */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('[data-reveal]');
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

  /* ---------- MetalProducts 切换 ---------- */
  function initMetalProducts() {
    var productBtns = document.querySelectorAll('.product-item');
    if (!productBtns.length) return;

    productBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        productBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var infoCard = document.querySelector('.info-card');
        var imageCard = document.querySelector('.image-card');
        if (!infoCard || !imageCard) return;

        infoCard.classList.add('fade');
        imageCard.classList.add('fade');

        setTimeout(function () {
          applyProductData(btn.dataset);
          setTimeout(function () {
            infoCard.classList.remove('fade');
            imageCard.classList.remove('fade');
          }, 50);
        }, 200);
      });
    });

    function applyProductData(d) {
      var infoCard = document.querySelector('.info-card');
      var imageCard = document.querySelector('.image-card');
      if (!infoCard || !imageCard) return;

      var numEl = infoCard.querySelector('.product-number');
      var symbolEl = infoCard.querySelector('.symbol-badge');
      var matEl = infoCard.querySelector('.material-title');
      var featEl = infoCard.querySelector('.feature-list');
      var priceEl = infoCard.querySelector('.price-value');
      var imgEl = imageCard.querySelector('img');
      var ovSymbol = imageCard.querySelector('.overlay-symbol');
      var ovName = imageCard.querySelector('.overlay-name');

      if (numEl) numEl.textContent = d.number;
      if (symbolEl) symbolEl.textContent = d.symbol;
      if (matEl) matEl.textContent = d.material;
      if (priceEl) priceEl.textContent = d.specs;
      if (imgEl) imgEl.src = d.image;
      if (ovSymbol) ovSymbol.textContent = d.symbol;
      if (ovName) ovName.textContent = d.name;

      if (featEl) {
        featEl.innerHTML = '';
        var features = (d.features || '').split('|');
        features.forEach(function (f) {
          if (!f) return;
          var li = document.createElement('li');
          li.textContent = f;
          featEl.appendChild(li);
        });
      }
    }
  }

  /* ---------- ProjectManagement tab ---------- */
  var PM_CONTENT = {
    consultation: {
      title: 'Consultation',
      desc: 'Project discussion & requirement analysis',
      details: ['Technical consultation', 'Requirement analysis', 'Product recommendation']
    },
    design: {
      title: 'Design & Sample',
      desc: 'Custom design and sample production for approval',
      details: ['Custom engineering design', 'Sample production', 'Client approval']
    },
    production: {
      title: 'Production',
      desc: 'Efficient manufacturing with strict scheduling',
      details: ['Material procurement', 'Automated production line', 'Scheduled manufacturing']
    },
    quality: {
      title: 'QC Inspection',
      desc: 'Multiple quality checkpoints before shipping',
      details: ['Incoming material QC', 'In-process inspection', 'Final product testing']
    },
    logistics: {
      title: 'Logistics',
      desc: 'Reliable worldwide shipping and delivery',
      details: ['Export documentation', 'Container loading', 'Global shipping']
    },
    support: {
      title: 'After-sales Support',
      desc: 'Comprehensive support throughout installation',
      details: ['Installation guidance', 'Technical documents', '24/7 support']
    }
  };

  function initProjectManagement() {
    var tabs = document.querySelectorAll('.pm-tabs .tab');
    var infoEl = document.querySelector('.pm-info');
    if (!tabs.length || !infoEl) return;

    function applyPmContent(key) {
      var content = PM_CONTENT[key];
      if (!content) return;
      var icon = window.KESTREL_PM_ICONS ? window.KESTREL_PM_ICONS[key] : '';
      var iconEl = infoEl.querySelector('.info-icon');
      var titleEl = infoEl.querySelector('#pm-title');
      var descEl = infoEl.querySelector('#pm-desc');
      var detailsEl = infoEl.querySelector('#pm-details');
      if (iconEl && icon) iconEl.innerHTML = icon;
      if (titleEl) titleEl.textContent = content.title;
      if (descEl) descEl.textContent = content.desc;
      if (detailsEl) {
        detailsEl.innerHTML = '';
        content.details.forEach(function (d) {
          var li = document.createElement('li');
          li.textContent = d;
          detailsEl.appendChild(li);
        });
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        infoEl.classList.add('fade-out');
        setTimeout(function () {
          applyPmContent(tab.dataset.target);
          infoEl.classList.remove('fade-out');
          infoEl.classList.add('fade-in');
          requestAnimationFrame(function () {
            infoEl.classList.remove('fade-in');
          });
        }, 150);
      });
    });
  }

  /* ---------- DemoMap 世界地图 ---------- */
  function initDemoMap() {
    var svgEl = document.querySelector('.world-map-svg');
    var mapSection = document.querySelector('.global-map-section');
    if (!svgEl || typeof topojson === 'undefined' || !window.d3) {
      renderMapFallback(svgEl);
      return;
    }

    var width = 900, height = 460;
    var d3 = window.d3;

    var projection = d3
      .geoNaturalEarth1()
      .scale(165)
      .translate([width / 2, height / 2 + 20]);

    var pathGen = d3.geoPath(projection);
    var svgSelection = d3.select(svgEl);

    var defs = svgSelection.append('defs');
    var radialGrad = defs.append('radialGradient')
      .attr('id', 'ocean-gradient')
      .attr('cx', '50%').attr('cy', '50%').attr('r', '65%');
    radialGrad.append('stop').attr('offset', '0%').attr('stop-color', '#1a2332');
    radialGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0f1420');

    var filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    var feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    svgSelection.append('rect')
      .attr('width', width).attr('height', height)
      .attr('fill', 'url(#ocean-gradient)');

    // graticule
    var graticulePath = pathGen(d3.geoGraticule10());
    if (graticulePath) {
      svgSelection.append('path')
        .attr('d', graticulePath)
        .attr('fill', 'none')
        .attr('stroke', '#2a3545')
        .attr('stroke-width', '0.5')
        .attr('stroke-dasharray', '2,3');
    }

    var projects = window.KESTREL_PROJECTS || [];

    // 加载国家边界
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load map data');
        return res.json();
      })
      .then(function (topology) {
        var geoJSON = topojson.feature(topology, topology.objects.countries);
        svgSelection.selectAll('.country-path')
          .data(geoJSON.features)
          .enter()
          .append('path')
          .attr('class', 'country-path')
          .attr('d', function (d) { return pathGen(d); })
          .attr('fill', '#2d3436')
          .attr('stroke', '#4a5568')
          .attr('stroke-width', 0.4);
        renderProjectPoints();
      })
      .catch(function () {
        renderMapFallback(svgEl);
        renderProjectPoints();
      });

    var currentAuto = 0;

    function pointsActive(foreignIdx) {
      return currentAuto === foreignIdx;
    }

    function renderProjectPoints() {
      // 清空旧点
      svgSelection.selectAll('.project-g').remove();
      svgSelection.selectAll('.route-line').remove();

      var g = svgSelection.append('g').attr('class', 'project-layer');

      // 航线（非 HQ）当前高亮项目 | HQ 接线
      var hqProject = projects[0];
      projects.forEach(function (p, idx) {
        if (idx === 0) return;
        var pxy = projection(p.coordinates);
        if (!pxy) return;
        if (currentAuto === idx) {
          var hqXY = projection(hqProject.coordinates);
          var midX = (hqXY[0] + pxy[0]) / 2;
          var midY = Math.min(hqXY[1], pxy[1]) - 40;
          svgSelection.append('path')
            .attr('class', 'route-line')
            .attr('d', 'M ' + hqXY[0] + ' ' + hqXY[1] + ' Q ' + midX + ' ' + midY + ' ' + pxy[0] + ' ' + pxy[1])
            .attr('fill', 'none')
            .attr('stroke', '#FF6B00')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '6,4')
            .attr('opacity', 0.7);
        }
      });

      projects.forEach(function (p, idx) {
        var xy = projection(p.coordinates);
        if (!xy) return;
        var cx = xy[0], cy = xy[1];
        var isHQ = p.isHQ;
        var isActive = currentAuto === idx && !isHQ;

        var cardG = g.append('g')
          .attr('class', 'project-g')
          .style('cursor', 'pointer');

        // 脉冲环
        var ring = cardG.append('circle')
          .attr('cx', cx).attr('cy', cy)
          .attr('r', isHQ ? 12 : (isActive ? 14 : 0))
          .attr('fill', 'none')
          .attr('stroke', '#FF6B00')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6);
        if (isHQ || isActive) {
          ring
            .append('animate')
            .attr('attributeName', 'r')
            .attr('values', isHQ ? '5;16;5' : '3;20;3')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');
          ring
            .append('animate')
            .attr('attributeName', 'opacity')
            .attr('values', '0.7;0;0.7')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');
        }

        var r = p.isHQ ? 5 : (isActive ? 4 : 2.8);
        var dot = cardG.append('circle')
          .attr('cx', cx).attr('cy', cy)
          .attr('r', r)
          .attr('fill', p.isHQ ? '#ffffff' : '#FF6B00')
          .attr('stroke', p.isHQ ? '#FF6B00' : 'none')
          .attr('stroke-width', p.isHQ ? 2 : 0)
          .attr('filter', isActive ? 'url(#glow)' : 'none');

        if (p.isHQ) {
          cardG.append('text')
            .attr('x', cx).attr('y', cy - 12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '13')
            .attr('font-weight', '700')
            .style('pointer-events', 'none')
            .text('HQ');
        }

        cardG.on('mouseenter', function () {
          updateInfoPanelWith(p);
        });
        cardG.on('mouseleave', function () {
          updateInfoPanel();
        });
      });

      updateInfoPanel();
    }

    function showTooltip(project, idx) {
      var tooltip = document.querySelector('.map-tooltip');
      if (!tooltip) return;
      tooltip.querySelector('.tooltip-header span').textContent = project.location;
      tooltip.querySelector('h3').textContent = project.name;
      tooltip.querySelector('.type').textContent = project.type;
      tooltip.querySelector('.desc').textContent = project.description;
      tooltip.querySelector('.row.capacity strong').textContent = project.capacity;
      tooltip.querySelector('.row.year strong').textContent = project.year;
      tooltip.classList.add('visible');
      // 高亮对应面板
      updateInfoPanelWith(project);
    }

    function hideTooltip() {
      var tooltip = document.querySelector('.map-tooltip');
      if (tooltip) tooltip.classList.remove('visible');
      updateInfoPanel();
    }

    function updateInfoPanelWith(project) {
      var highlight = document.querySelector('.project-highlight');
      if (!highlight) return;
      highlight.querySelector('h3').textContent = project.name;
      var loc = highlight.querySelector('.project-location');
      if (loc) loc.textContent = project.location;
      var meta = highlight.querySelector('.project-meta');
      if (meta) {
        var tags = meta.querySelectorAll('.meta-tag');
        if (tags.length >= 2) {
          tags[0].textContent = project.type;
          tags[1].textContent = project.year;
        }
      }
      var desc = highlight.querySelector('.project-desc');
      if (desc) desc.textContent = project.description;
    }

    function updateInfoPanel() {
      var p = projects[currentAuto];
      if (!p) return;
      updateInfoPanelWith(p);
    }

    // 自动轮播
    setInterval(function () {
      if (document.hidden) return;
      currentAuto = (currentAuto + 1) % projects.length;
      if (currentAuto === 0) currentAuto = 1;
      renderProjectPoints();
    }, 3500);
  }

  /* DemoMap 降级（无数据时显示占位） */
  function renderMapFallback(svgEl) {
    if (!svgEl) return;
    if (window.d3) {
      var d3 = window.d3;
      var width = 900, height = 460;
      var svgSelection = d3.select(svgEl);
      var viewW = svgEl.getAttribute('viewBox');
      if (viewW) {
        var vb = viewW.split(' ').map(Number);
        width = vb[2]; height = vb[3];
      }
      svgSelection.append('text')
        .attr('x', width / 2).attr('y', height / 2)
        .attr('fill', '#888')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14')
        .text('Loading world map...');
    } else {
      var span = document.createElement('div');
      span.className = 'map-fallback';
      span.textContent = 'World map unavailable';
      svgEl.parentNode.appendChild(span);
    }
  }

  /* ---------- Evidence 联动交互 ---------- */
  function initEvidence() {
    var mainCard = document.querySelector('.evidence-card.main');
    var statCards = Array.prototype.slice.call(document.querySelectorAll('.evidence-card.stat'));
    if (!mainCard) return;
    var hoveredIdx = 0;

    function applyCollapse() {
      // 主卡片折叠当且仅当 hover 的是 stat 卡片
      var shouldCollapse = hoveredIdx !== 0;
      mainCard.classList.toggle('collapsed', shouldCollapse);
      mainCard.classList.toggle('hovered', hoveredIdx === 0);
    }

    statCards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () {
        hoveredIdx = i + 1;
        applyCollapse();
      });
      card.addEventListener('mouseleave', function () {
        hoveredIdx = 0;
        applyCollapse();
      });
      card.addEventListener('focus', function () {
        hoveredIdx = i + 1;
        applyCollapse();
      });
      card.addEventListener('blur', function () {
        hoveredIdx = 0;
        applyCollapse();
      });
      card.tabIndex = 0;
    });

    mainCard.addEventListener('mouseenter', function () {
      hoveredIdx = 0;
      applyCollapse();
    });
    mainCard.addEventListener('mouseleave', function () {
      hoveredIdx = 0;
      applyCollapse();
    });
  }

  /* ---------- What We Do 轮播导航 ---------- */
  function initWhatWeDo() {
    var track = document.querySelector('.wwd-track');
    if (!track) return;

    var prevBtn = document.querySelector('.wwd-prev');
    var nextBtn = document.querySelector('.wwd-next');
    if (!prevBtn && !nextBtn) return;

    var card = track.querySelector('.wwd-card');
    if (!card) return;

    function getCardWidth() {
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function scrollNext() {
      var maxScroll = track.scrollWidth - track.parentElement.clientWidth;
      var step = getCardWidth();
      var current = track._scrollX || 0;
      var next = current + step;
      if (next > maxScroll) next = 0;
      track._scrollX = next;
      track.style.transform = 'translateX(-' + next + 'px)';
    }

    function scrollPrev() {
      var maxScroll = track.scrollWidth - track.parentElement.clientWidth;
      var step = getCardWidth();
      var current = track._scrollX || 0;
      var next = current - step;
      if (next < 0) next = Math.max(0, maxScroll - (Math.ceil(maxScroll / step) - 1) * step);
      track._scrollX = next;
      track.style.transform = 'translateX(-' + next + 'px)';
    }

    if (nextBtn) nextBtn.addEventListener('click', scrollNext);
    if (prevBtn) prevBtn.addEventListener('click', scrollPrev);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        track._scrollX = 0;
        track.style.transform = '';
      }, 200);
    });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initMetalProducts();
    initProjectManagement();
    initDemoMap();
    initEvidence();
    initScrollReveal();
    initWhatWeDo();
  });
})();
