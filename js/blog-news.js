(function () {
  'use strict';

  /* ===== Blog posts data (34 posts across 3 categories + featured) ===== */
  var POSTS = {
    featured: [
      { title: 'Tips for Opening and Closing Barb Wire Gates', url: 'blog-barb-wire-gates-tips.html', tag: 'How-To', date: 'January 12, 2026', read: '5 min read', desc: 'Practical safety tips and best practices for opening and closing barb wire gates without damaging the fence or risking injury.', img: 'images/blog/blog-gates-hero.jpg', alt: 'Tips for opening and closing barb wire gates' },
      { title: 'Razor Wire Is Most Visible Result of $210M Troop Deployment to US-Mexico Border', url: 'blog-border-razor-wire-deployment.html', tag: 'Border Security', date: 'February 5, 2026', read: '4 min read', desc: 'Analysis of razor wire deployment in border security operations and what it means for manufacturers and specifiers.', img: 'images/blog/blog-border-razor-hero.avif', alt: 'Razor wire border security deployment' }
    ],
    'Product Information': [
      { title: 'Architectural Wire Mesh: Blending Security with Modern Aesthetics', url: 'blog-architectural-wire-mesh.html', tag: 'Design', date: 'June 18, 2025', read: '7 min read', desc: 'How architectural wire mesh combines security with modern building aesthetics for facades, partitions, and cladding.', img: 'images/blog/architectural-facades-application.jpg', alt: 'Architectural wire mesh facade' },
      { title: 'Epoxy Coated vs Galvanised Woven Wire Mesh: A Complete Comparison', url: 'blog-epoxy-vs-galvanised-woven-wire-mesh.html', tag: 'Materials', date: 'October 9, 2025', read: '8 min read', desc: 'A detailed head-to-head comparison of epoxy coated and galvanised woven wire mesh across performance, cost, and lifespan.', img: 'images/blog/epoxy-coated-wire-mesh.jpg', alt: 'Epoxy coated wire mesh' },
      { title: 'Galvanized vs PVC Coated: Which Fencing Lasts Longer in Coastal Areas?', url: 'blog-galvanized-vs-pvc.html', tag: 'Maintenance', date: 'November 5, 2025', read: '5 min read', desc: 'Comparative analysis of galvanized and PVC-coated fencing in saltwater environments, with real-world durability data.', img: 'images/blog/pvc-coated-wire.jpg', alt: 'PVC coated fencing' },
      { title: 'Hexagonal Wire Mesh vs Gabion Mesh: Key Differences & How to Choose', url: 'blog-hexagonal-vs-gabion-mesh.html', tag: 'Guide', date: 'July 22, 2025', read: '8 min read', desc: 'Understand the structural and application differences between hexagonal wire mesh and gabion mesh to pick the right product.', img: 'images/blog/galvanized-hexagonal-wire-netting.png', alt: 'Hexagonal wire mesh' },
      { title: 'Materials for Welded Wire Mesh', url: 'blog-materials-welded-wire-mesh.html', tag: 'Materials', date: 'May 14, 2025', read: '6 min read', desc: 'Explore the base materials, wire grades, and coatings used to manufacture durable welded wire mesh.', img: 'images/blog/blog-materials-welded-wire-mesh-hero.jpg', alt: 'Welded wire mesh materials' },
      { title: 'Plain vs Twill Weave Stainless Steel Wire Mesh: A Complete Comparison', url: 'blog-plain-vs-twill-weave.html', tag: 'Materials', date: 'August 30, 2025', read: '9 min read', desc: 'Technical comparison of plain and twill weave stainless steel wire mesh for filtration and screening applications.', img: 'images/blog/plain-vs-twill-weave-blog.jpg', alt: 'Plain and twill weave stainless steel mesh' },
      { title: 'Comprehensive Guide to Stainless Steel Welded Wire Mesh Panels and Applications', url: 'blog-ss-welded-wire-mesh-guide.html', tag: 'Guide', date: 'March 8, 2025', read: '10 min read', desc: 'An in-depth guide covering stainless steel welded wire mesh panels, their specifications, and where they are best used.', img: 'images/blog/blog-ss-welded-mesh-hero.jpg', alt: 'Stainless steel welded wire mesh panels' },
      { title: 'Sintered Wire Mesh Filters: Technology & Applications', url: 'blog-sintered-filters.html', tag: 'Technical', date: 'April 3, 2025', read: '7 min read', desc: 'How sintered wire mesh multilayer filters work and their role in precision filtration for demanding industries.', img: 'images/blog/stainless-steel-screen-mesh.webp', alt: 'Sintered wire mesh filters' },
      { title: 'Versatile Wire Mesh Products For Your Market', url: 'blog-versatile-wire-mesh-products.html', tag: 'Product', date: 'February 20, 2025', read: '6 min read', desc: 'A broad look at the many sectors served by versatile wire mesh products, from construction to agriculture.', img: 'images/blog/welded-wire-mesh-panel.jpg', alt: 'Versatile welded wire mesh panels' },
      { title: "Who's Really Protecting Your Perimeter? Why Weld Strength Matters More Than Wire Gauge", url: 'blog-weld-strength-matters.html', tag: 'Security', date: 'September 12, 2025', read: '8 min read', desc: 'Learn why weld strength is the true measure of fence panel quality and why wire gauge alone is not enough.', img: 'images/blog/weld-test-hero.png', alt: 'Weld strength testing' },
      { title: 'Steel Mesh & Expanded Metal Plastering for Masonry Wall Reinforcement', url: 'blog-steel-mesh-plastering.html', tag: 'Construction', date: 'October 2, 2025', read: '6 min read', desc: 'How steel mesh and expanded metal are used in plastering and masonry wall reinforcement to prevent cracking.', img: 'images/blog/blog-plaster-steel-mesh.jpg', alt: 'Steel mesh plastering reinforcement' }
    ],
    'Tips & Inspiration': [
      { title: 'How to Calculate the Cost of Wire Mesh for Fence Installation', url: 'blog-barbed-wire-cost-calculation.html', tag: 'Cost Guide', date: 'January 28, 2026', read: '6 min read', desc: 'A step-by-step method for estimating the total cost of wire mesh for a fence installation, including wastage and freight.', img: 'images/blog/blog-barbed-cost-hero.webp', alt: 'Calculating wire mesh fence cost' },
      { title: 'When to Replace Your Chain-Link Fence', url: 'blog-chain-link-replace.html', tag: 'Maintenance', date: 'December 15, 2025', read: '5 min read', desc: 'Signs that your chain-link fence needs replacement and how to plan a cost-effective upgrade.', img: 'images/blog/blog-chain-link-replace-hero.png', alt: 'Replacing a chain-link fence' },
      { title: 'Why You Should Install a Chain-Link Fence in Your Yard', url: 'blog-chain-link-yard.html', tag: 'Tips', date: '2024', read: '4 min read', desc: 'Durability, low maintenance, budget-friendly pricing, and good visibility make chain-link a smart backyard choice.', img: 'images/blog/blog-chain-link-yard-hero.jpg', alt: 'Chain-link fence in a backyard' },
      { title: 'Field Fence Installation Guide: End Posts, Line Posts & Wire Mesh', url: 'blog-field-fence-installation.html', tag: 'Installation', date: 'March 22, 2025', read: '9 min read', desc: 'Complete field fence installation guide covering end posts, line posts, bracing, and proper wire mesh tensioning.', img: 'images/blog/blog-field-fence-installation-hero.jpg', alt: 'Field fence installation' },
      { title: 'How to Install Welded Gabion Boxes: A Complete Step-by-Step Guide', url: 'blog-how-to-install-welded-gabion-boxes.html', tag: 'Installation', date: 'May 6, 2025', read: '10 min read', desc: 'From foundation preparation to stone filling, a complete guide to installing welded gabion boxes for walls and structures.', img: 'images/blog/blog-gabion-install-hero.jpg', alt: 'Installing welded gabion boxes' },
      { title: '10 Common Mistakes When Installing Wire Mesh Fencing', url: 'blog-installation-mistakes.html', tag: 'Installation', date: 'November 20, 2025', read: '7 min read', desc: 'Avoid these ten frequent errors when installing wire mesh fencing to ensure a long-lasting, secure result.', img: 'images/blog/fabrication-welding-framing.png', alt: 'Wire mesh fencing installation' },
      { title: 'NATO-22 Certified Razor Wire: Meeting Global Military Security Standards', url: 'blog-nato22-razor-wire.html', tag: 'Razor Wire', date: 'September 28, 2025', read: '6 min read', desc: 'Overview of BTC barbed tape concertina products meeting NATO-22 military specifications, with testing and deployment guidance.', img: 'images/blog/btc-razor-wire.jpg', alt: 'NATO-22 certified razor wire' },
      { title: "7 Things You Probably Didn't Know About Razor Coils", url: 'blog-razor-coils-7-things.html', tag: 'Security', date: 'February 22, 2026', read: '6 min read', desc: 'From installation regulations to types and materials, everything you need to know about razor coils.', img: 'images/blog/blog-razor-coils-hero.avif', alt: 'Razor wire coils' },
      { title: 'How to Squirrel-Proof Your Home & Yard With Wire Mesh Screens', url: 'blog-squirrel-proof-wire-mesh.html', tag: 'Tips', date: 'April 18, 2025', read: '5 min read', desc: 'Practical ways to use wire mesh screens to keep squirrels out of gardens, attics, and bird feeders.', img: 'images/blog/blog-squirrel-proof-header.jpg', alt: 'Squirrel-proof wire mesh screens' },
      { title: 'Wire Mesh Specification Sheet: How to Read and Interpret Technical Data', url: 'blog-specification-sheet.html', tag: 'Technical Guide', date: 'September 15, 2025', read: '9 min read', desc: 'Understand wire diameter, aperture size, tensile strength, and coating weight measurements on specification sheets.', img: 'images/blog/wire-size-diameters.png', alt: 'Wire mesh specification sheet' }
    ],
    'Product Posts': [
      { title: 'The Evolution of Chain Link Fence: 2024 and Beyond', url: 'blog-chain-link-evolution.html', tag: 'Trends', date: 'June 2, 2025', read: '6 min read', desc: 'How chain link fence technology and applications are evolving with new coatings and manufacturing methods.', img: 'images/blog/blog-evolution-chain-link.png', alt: 'Chain link fence evolution' },
      { title: 'How to Select the Right Chain Link Fence', url: 'blog-chain-link-selection.html', tag: 'Selection', date: 'July 15, 2025', read: '7 min read', desc: 'Key selection criteria for chain link fencing including gauge, coating, mesh size, and post spacing.', img: 'images/blog/blog-chain-link-2.png', alt: 'Selecting chain link fencing' },
      { title: 'Dual Fence Security System: Why Two Perimeter Barriers Multiply Security Exponentially', url: 'blog-dual-fence-security.html', tag: 'Security', date: 'August 5, 2025', read: '9 min read', desc: 'Why a dual fence security system dramatically increases protection compared to a single perimeter barrier.', img: 'images/blog/dual-fence-hero.jpg', alt: 'Dual fence security system' },
      { title: 'Fence Liability: Escaped Animals', url: 'blog-fence-liability-escaped-animals.html', tag: 'Liability', date: 'May 28, 2025', read: '5 min read', desc: 'Understanding your fence liability for escaped animals and how proper fencing reduces legal risk.', img: 'images/blog/blog-fence-liability-hero.jpg', alt: 'Fence liability and escaped animals' },
      { title: 'Gabion Boxes Market Research Report 2034', url: 'blog-gabion-boxes-market-report-2034.html', tag: 'Market', date: 'January 30, 2026', read: '8 min read', desc: 'Key findings from the 2034 gabion boxes market report, including growth drivers and regional trends.', img: 'images/blog/blog-gabion-market-hero.webp', alt: 'Gabion boxes market report' },
      { title: 'Hexagonal Wire Mesh: A Simple Solution with Global Impact', url: 'blog-hexagonal-wire-mesh-global-impact.html', tag: 'Global', date: 'March 15, 2025', read: '6 min read', desc: 'How a simple hexagonal wire mesh product delivers outsized impact in agriculture and construction globally.', img: 'images/blog/blog-hex-mesh-hero.jpg', alt: 'Hexagonal wire mesh global impact' },
      { title: 'Kestrel Metal Expands Production Capacity', url: 'blog-new-manufacturing-facility.html', tag: 'Company News', date: 'April 26, 2025', read: '4 min read', desc: 'Kestrel Metal announces expanded production capacity to better serve growing global demand for wire mesh.', img: 'images/blog/blog-welded-mesh-roll-warehouse.jpg', alt: 'Expanded production capacity' },
      { title: 'The Future of Wire Mesh in Sustainable Infrastructure', url: 'blog-sustainable-infrastructure.html', tag: 'Sustainability', date: 'October 25, 2025', read: '7 min read', desc: 'How wire mesh is shaping greener, more sustainable infrastructure projects across the globe.', img: 'images/blog/blog-sustainable-infrastructure.jpg', alt: 'Wire mesh in sustainable infrastructure' },
      { title: 'Understanding KESTREL WELDED MESH 711-714', url: 'blog-welded-mesh-711-714.html', tag: 'Product', date: 'November 10, 2025', read: '6 min read', desc: 'Technical breakdown of the KESTREL WELDED MESH 711-714 series and its recommended applications.', img: 'images/blog/welded-mesh-711.jpg', alt: 'KESTREL welded mesh 711-714' },
      { title: 'Introducing KESTREL WELDED MESH 715', url: 'blog-welded-mesh-715.html', tag: 'Product', date: 'December 5, 2025', read: '5 min read', desc: 'Meet the latest addition to the KESTREL WELDED MESH family and the features that set it apart.', img: 'images/blog/welded-mesh-715.jpg', alt: 'KESTREL welded mesh 715' },
      { title: 'Welded Gabion vs. Twisted Gabion Baskets: Which Is Better for Your Project?', url: 'blog-welded-vs-twisted-gabion.html', tag: 'Guide', date: 'July 8, 2025', read: '8 min read', desc: 'Understand the strengths of welded versus twisted gabion baskets to choose the right option for your build.', img: 'images/blog/blog-gabion-welded-vs-twisted-hero.jpg', alt: 'Welded vs twisted gabion baskets' }
    ]
  };

  var CATEGORY_ORDER = ['Product Information', 'Tips & Inspiration', 'Product Posts'];
  var PER_PAGE = 6;

  document.addEventListener('DOMContentLoaded', function () {
    initCommon();
    renderFeatured();
    renderCategories();
  });

  function initCommon() {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
  }

  /* ---------- Featured ---------- */
  function renderFeatured() {
    var grid = document.getElementById('featuredGrid');
    if (!grid) return;
    var html = '';
    POSTS.featured.forEach(function (post) {
      html += '<a href="' + post.url + '" class="featured-card">';
      html += '<div class="featured-card-img">';
      html += '<img src="' + post.img + '" alt="' + post.alt + '" loading="lazy">';
      html += '<span class="featured-badge">Featured</span>';
      html += '</div>';
      html += '<div class="featured-card-body">';
      html += '<span class="post-card-tag">' + post.tag + '</span>';
      html += '<h3 class="post-card-title">' + post.title + '</h3>';
      html += '<div class="post-card-meta">' + post.date + ' &middot; ' + post.read + '</div>';
      html += '<p>' + post.desc + '</p>';
      html += '</div></a>';
    });
    grid.innerHTML = html;
  }

  /* ---------- Categories + pagination ---------- */
  var pageState = {};

  function renderCategories() {
    var container = document.getElementById('blogCategories');
    if (!container) return;

    var html = '';
    CATEGORY_ORDER.forEach(function (cat, idx) {
      var posts = POSTS[cat];
      pageState[idx] = 1;
      html += '<div class="blog-category-section" id="cat-' + idx + '">';
      html += '<div class="blog-category-header">';
      html += '<h3 class="blog-category-title">' + cat + ' <span class="count-badge">' + posts.length + ' posts</span></h3>';
      html += '</div>';
      html += '<div class="posts-grid" id="grid-' + idx + '"></div>';
      html += '<div class="blog-pagination" id="pagination-' + idx + '"></div>';
      html += '</div>';
    });
    container.innerHTML = html;

    CATEGORY_ORDER.forEach(function (cat, idx) {
      renderPage(idx);
    });

    // pagination clicks (event delegation on container)
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      var pag = btn.closest('.blog-pagination');
      if (!pag) return;
      var idx = parseInt(pag.id.split('-')[1], 10);
      pageState[idx] = parseInt(btn.dataset.page, 10);
      renderPage(idx);
    });
  }

  /* ---------- render one category page ---------- */
  function renderPage(catIdx) {
    var catKey = CATEGORY_ORDER[catIdx];
    var posts = POSTS[catKey];
    var total = posts.length;
    var state = pageState[catIdx] || 1;
    var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    var start = (state - 1) * PER_PAGE;
    var slice = posts.slice(start, start + PER_PAGE);

    var grid = document.getElementById('grid-' + catIdx);
    var pag = document.getElementById('pagination-' + catIdx);
    if (!grid) return;

    var html = '';
    slice.forEach(function (post) {
      html += '<a href="' + post.url + '" class="post-card">';
      html += '<div class="post-card-img"><img src="' + post.img + '" alt="' + post.alt + '" loading="lazy"></div>';
      html += '<div class="post-card-body">';
      html += '<span class="post-card-tag">' + post.tag + '</span>';
      html += '<h3>' + post.title + '</h3>';
      html += '<div class="post-card-meta">' + post.date + ' &middot; ' + post.read + '</div>';
      html += '<p>' + post.desc + '</p>';
      html += '</div></a>';
    });
    grid.innerHTML = html;

    if (pag) {
      pag.innerHTML = buildPagination(state, totalPages);
    }
  }

  function buildPagination(page, totalPages) {
    if (totalPages <= 1) return '';
    var html = '';
    html += '<button class="page-arrow" data-page="' + Math.max(1, page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + '>&laquo;</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button data-page="' + i + '" class="' + (i === page ? 'active' : '') + '">' + i + '</button>';
    }
    html += '<button class="page-arrow" data-page="' + Math.min(totalPages, page + 1) + '" ' + (page >= totalPages ? 'disabled' : '') + '>&raquo;</button>';
    return html;
  }

  /* ---------- common helpers ---------- */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('[data-reveal], [data-reveal] .blog-category-section');
    if (!('IntersectionObserver' in window)) return;
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
