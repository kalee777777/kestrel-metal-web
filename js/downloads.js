(function () {
  'use strict';

  /* ===== Static document data (13 docs) ===== */
  var DOCUMENTS = [
    { id: 1,  cat: 'datasheets', title: 'Wire Mesh Technical Datasheet', file: 'Kestrel_Wire_Mesh_Datasheet.pdf', size: '1.8 MB', date: '2024-01-15', type: 'pdf', desc: 'Comprehensive technical data for wire mesh products including material specifications, dimensions, and standards compliance.', kw: 'wire mesh technical datasheet material specifications dimensions standards compliance', url: 'download-wire-mesh-technical-datasheet.html' },
    { id: 2,  cat: 'datasheets', title: 'Fence Panel Load Capacity', file: 'Kestrel_Panel_Load_Capacity.pdf', size: '2.4 MB', date: '2024-02-20', type: 'pdf', desc: 'Engineering data on fence panel load capacity, safe working loads, and deflection characteristics for structural applications.', kw: 'fence panel load capacity safe working load deflection engineering data', url: 'download-fence-panel-load-capacity.html' },
    { id: 3,  cat: 'datasheets', title: 'Coating Specifications Guide', file: 'Kestrel_Coating_Specs_Guide.pdf', size: '1.2 MB', date: '2024-01-10', type: 'pdf', desc: 'Guide to coating specifications including powder coating, hot-dip galvanized, and PVC coating standards with recommended thickness values.', kw: 'coating specifications guide powder coating hot dip galvanized pvc standards', url: 'download-coating-specifications-guide.html' },
    { id: 4,  cat: 'datasheets', title: 'Stainless Screen Mesh Specification', file: 'Kestrel_Stainless_Screen_Mesh.pdf', size: '1.6 MB', date: '2024-03-12', type: 'pdf', desc: 'Detailed specification of stainless steel screen mesh including grades 304/316, aperture sizes, wire diameters, and mesh counts.', kw: 'stainless screen mesh specification 304 316 aperture wire diameter mesh count', url: 'download-stainless-screen-mesh-specification.html' },

    { id: 5,  cat: 'guides', title: '3D Panel Installation Manual', file: 'Kestrel_3D_Panel_Installation.pdf', size: '3.1 MB', date: '2024-02-08', type: 'pdf', desc: 'Step-by-step installation manual for 3D wire panel fencing including foundation preparation, post installation, and panel fixing.', kw: '3d panel installation manual step by step foundation posts assembly torx screws', url: 'download-3d-panel-installation-manual.html' },
    { id: 6,  cat: 'guides', title: 'Chain Link Installation Guide', file: 'Kestrel_Chain_Link_Installation.pdf', size: '2.8 MB', date: '2024-01-28', type: 'pdf', desc: 'Guide for installing chain link fencing including line posts, terminal posts, braces, and fabric tensioning techniques.', kw: 'chain link installation guide tensioning line posts terminal braces fabric', url: 'download-chain-link-installation-guide.html' },
    { id: 7,  cat: 'guides', title: 'Gabion Assembly Instructions', file: 'Kestrel_Gabion_Assembly.pdf', size: '2.2 MB', date: '2024-01-18', type: 'pdf', desc: 'Instructions for assembling wire mesh gabion baskets including folding, lacing, stone filling, and lid securing.', kw: 'gabion assembly instructions wire mesh baskets stones filling lacing wire', url: 'download-gabion-assembly-instructions.html' },

    { id: 8,  cat: 'cad', title: 'Fence Panel CAD Library', file: 'Kestrel_Fence_Panel_CAD.zip', size: '4.8 MB', date: '2024-03-05', type: 'cad', desc: 'CAD drawings and 3D models of fence panels in DWG, DXF, and STEP formats for integration into your design software.', kw: 'fence panel cad library dwg dxf step 2d 3d drawings models', url: 'download-fence-panel-cad-library.html' },
    { id: 9,  cat: 'cad', title: 'Post Foundation Details', file: 'Kestrel_Post_Foundation_Details.pdf', size: '1.9 MB', date: '2024-02-14', type: 'cad', desc: 'Technical drawings for post foundation and concrete footing details including depths, dimensions, and reinforcement guidance.', kw: 'post foundation details concrete footing depth dimensions drawings', url: 'download-post-foundation-details.html' },
    { id: 10, cat: 'cad', title: 'Gate Hardware CAD Models', file: 'Kestrel_Gate_Hardware_CAD.zip', size: '3.4 MB', date: '2024-03-20', type: 'cad', desc: 'Detailed CAD models of gate hinges, locks, and hardware components for use in automated gate and access control design.', kw: 'gate hardware cad models 3d hinges locks access control', url: 'download-gate-hardware-cad-models.html' },

    { id: 11, cat: 'certifications', title: 'ISO 9001 Certificate', file: 'Kestrel_ISO_9001_Certificate.pdf', size: '0.8 MB', date: '2024-01-05', type: 'pdf', desc: 'Official ISO 9001:2015 quality management system certificate for Kestrel Metal Products Co., Ltd.', kw: 'iso 9001 certificate quality management system compliance', url: 'download-iso-9001-certificate.html' },
    { id: 12, cat: 'certifications', title: 'CE Marking Declaration', file: 'Kestrel_CE_Declaration.pdf', size: '0.6 MB', date: '2024-01-05', type: 'pdf', desc: 'Declaration of Conformity for CE marking compliance with relevant European Union construction product regulations.', kw: 'ce marking declaration conformity european union compliance construction', url: 'download-ce-marking-declaration.html' },
    { id: 13, cat: 'certifications', title: 'Material Test Reports', file: 'Kestrel_Material_Test_Reports.pdf', size: '2.0 MB', date: '2024-01-25', type: 'pdf', desc: 'Independent material test reports from SGS including chemical composition and mechanical property verification.', kw: 'material test reports sgs chemical composition mechanical properties verification', url: 'download-material-test-reports.html' }
  ];

  var CATEGORIES = [
    { id: 'datasheets', label: 'Technical Datasheets', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
    { id: 'guides', label: 'Installation Guides', icon: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>' },
    { id: 'cad', label: 'CAD Drawings', icon: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
    { id: 'certifications', label: 'Certifications', icon: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>' }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
    initDownloads();
  });

  function initDownloads() {
    renderDocuments();
    initSearch();
    initSidebar();
    initDownloadToast();
  }

  /* ---------- Render ---------- */
  function renderDocuments() {
    var container = document.getElementById('downloadsContainer');
    if (!container) return;

    var html = '';
    CATEGORIES.forEach(function (cat) {
      var docs = DOCUMENTS.filter(function (d) { return d.cat === cat.id; });
      if (!docs.length) return;

      html += '<div class="download-category" id="' + cat.id + '">';
      html += '<div class="download-category-header">';
      html += '<div class="download-category-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cat.icon + '</svg></div>';
      html += '<h2 class="download-category-title">' + cat.label + '</h2>';
      html += '<span class="download-category-count">' + docs.length + ' document' + (docs.length > 1 ? 's' : '') + '</span>';
      html += '</div>';
      html += '<div class="download-grid">';

      docs.forEach(function (doc) {
        html += '<div class="download-card" data-search="' + escapeHtml(doc.kw) + '">';
        html += '<div class="download-card-header">';
        html += '<div class="file-icon ' + doc.type + '">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
        html += '</div>';
        html += '<div>';
        html += '<h3 class="download-card-title"><a href="' + doc.url + '">' + escapeHtml(doc.title) + '</a></h3>';
        html += '<p class="download-card-filename">' + escapeHtml(doc.file) + '</p>';
        html += '</div></div>';
        html += '<p class="download-card-desc">' + escapeHtml(doc.desc) + '</p>';
        html += '<div class="download-card-meta">';
        html += '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ' + doc.size + '</span>';
        html += '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' + doc.date + '</span>';
        html += '</div>';
        html += '<a class="download-btn" href="files/' + encodeURIComponent(doc.file) + '" download="' + escapeHtml(doc.file) + '" data-download="' + escapeHtml(doc.title) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span class="download-btn-text">Download</span></a>';
        html += '</div>';
      });

      html += '</div></div>';
    });

    container.innerHTML = html;
  }

  /* ---------- Search ---------- */
  function initSearch() {
    var input = document.getElementById('downloadSearch');
    var noResults = document.getElementById('downloadNoResults');
    if (!input) return;

    var debounceTimer;

    function filter() {
      var term = input.value.trim().toLowerCase();
      var anyVisible = false;

      document.querySelectorAll('.download-category').forEach(function (cat) {
        var catVisible = false;
        cat.querySelectorAll('.download-card').forEach(function (card) {
          var haystack = (card.dataset.search || '') + ' ' + card.querySelector('.download-card-title').textContent + ' ' + card.querySelector('.download-card-desc').textContent;
          var visible = !term || haystack.toLowerCase().indexOf(term) !== -1;
          card.classList.toggle('hidden-by-search', !visible);
          if (visible) catVisible = true;
        });
        cat.style.display = catVisible ? '' : 'none';
        if (catVisible) anyVisible = true;
      });

      if (noResults) {
        noResults.style.display = anyVisible ? 'none' : 'block';
      }
    }

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filter, 200);
    });
  }

  /* ---------- Sidebar scroll-spy ---------- */
  function initSidebar() {
    var links = document.querySelectorAll('#downloadSidebarLinks a');
    var sectionIds = Array.prototype.map.call(links, function (a) {
      return a.getAttribute('href').substring(1);
    });

    function onScroll() {
      var scrollPos = document.documentElement.scrollTop + 160;
      var currentId = sectionIds[0];
      sectionIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) currentId = id;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(this.getAttribute('href').substring(1));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* ---------- Download toast ---------- */
  function initDownloadToast() {
    var toast = document.createElement('div');
    toast.className = 'downloads-toast';
    toast.textContent = 'Download starting...';
    document.body.appendChild(toast);

    var timer;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.download-btn');
      if (!btn) return;
      toast.textContent = 'Download starting: ' + (btn.dataset.download || 'Document') + '...';
      toast.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () {
        toast.classList.remove('show');
      }, 3000);
    });
  }

  /* ---------- Helpers ---------- */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
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
