var BlogGenerator = (function () {
  'use strict';

  var STATIC_BLOG_FILES = [
    'blog-alloy-coating-salt-spray.html',
    'blog-architectural-wire-mesh.html',
    'blog-automated-production-line.html',
    'blog-barb-wire-gates-tips.html',
    'blog-barbed-wire-cost-calculation.html',
    'blog-border-razor-wire-deployment.html',
    'blog-ce-ukca-reach-wire-mesh-compliance.html',
    'blog-chain-link-evolution.html',
    'blog-chain-link-fence-buying-guide.html',
    'blog-chain-link-replace.html',
    'blog-chain-link-selection.html',
    'blog-chain-link-yard.html',
    'blog-dual-fence-security.html',
    'blog-epoxy-vs-galvanised-woven-wire-mesh.html',
    'blog-fence-comparison-3d-chain-link-palisade.html',
    'blog-fence-liability-escaped-animals.html',
    'blog-field-fence-installation.html',
    'blog-gabion-box-selection-guide.html',
    'blog-gabion-boxes-market-report-2034.html',
    'blog-galvanized-chain-link-fence-maintenance.html',
    'blog-galvanized-vs-pvc.html',
    'blog-history-of-gabion.html',
    'blog-hexagonal-vs-gabion-mesh.html',
    'blog-hexagonal-wire-mesh-global-impact.html',
    'blog-hs-codes-wire-mesh-fencing-export.html',
    'blog-installation-mistakes.html',
    'blog-materials-welded-wire-mesh.html',
    'blog-nato22-razor-wire.html',
    'blog-nato22-vs-astm-razor-wire.html',
    'blog-new-manufacturing-facility.html',
    'blog-plain-vs-twill-weave.html',
    'blog-razor-coils-7-things.html',
    'blog-razor-wire-vs-barbed-wire.html',
    'blog-sintered-filters.html',
    'blog-solar-farm-fence-specification-guide.html',
    'blog-specification-sheet.html',
    'blog-squirrel-proof-wire-mesh.html',
    'blog-ss-welded-wire-mesh-guide.html',
    'blog-steel-mesh-plastering.html',
    'blog-sustainable-infrastructure.html',
    'blog-sustainable-manufacturing-award.html',
    'blog-versatile-wire-mesh-products.html',
    'blog-welded-mesh-711-714.html',
    'blog-welded-mesh-715.html',
    'blog-welded-vs-twisted-gabion.html',
    'blog-welded-wire-mesh-technical.html',
    'blog-weld-strength-matters.html',
    'blog-wire-mesh-for-concrete-reinforcement.html'
  ];

  var FILE_SET = {};
  STATIC_BLOG_FILES.forEach(function (f) { FILE_SET[f] = true; });

  var SECTION_LABELS = {
    'featured': 'Featured',
    'product-info': 'Product Information',
    'tips': 'Tips &amp; Inspiration',
    'product-posts': 'Product Posts'
  };

  var PER_PAGE = 6;

  function getPublishedPosts() {
    var raw = localStorage.getItem('km_admin_blog_posts');
    var posts = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(posts)) return [];
    return posts.filter(function (p) {
      return p && p.status === 'published';
    });
  }

  function parseTags(val) {
    if (Array.isArray(val)) return val;
    if (typeof val !== 'string' || !val.trim()) return [];
    try {
      var parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return val.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    }
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function getStaticUrl(post) {
    if (post.static_url) return post.static_url;
    if (post.detail_url) return post.detail_url;
    var slugFile = post.slug + '.html';
    if (FILE_SET[slugFile]) return slugFile;
    return null;
  }

  function getCategory(post) {
    return post.category || post.section || 'Latest Articles';
  }

  function getSectionLabel(post) {
    var section = post.section || '';
    return SECTION_LABELS[section] || section || 'Latest Articles';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function getImage(post) {
    return post.cover_image || post.image || 'images/hero-blog.webp';
  }

  function getMappedPosts() {
    return getPublishedPosts()
      .map(function (p) {
        return {
          id: p.id,
          title: p.title || '',
          slug: p.slug || '',
          description: p.description || '',
          cover_image: getImage(p),
          category: getCategory(p),
          tags: parseTags(p.tags),
          section: p.section || '',
          sectionLabel: getSectionLabel(p),
          author: p.author || 'Kestrel Metal',
          read_time: p.read_time || '5 min read',
          created_at: p.created_at || '',
          static_url: getStaticUrl(p)
        };
      })
      .filter(function (p) { return p.static_url; })
      .sort(function (a, b) {
        var da = new Date(a.created_at || 0).getTime();
        var db = new Date(b.created_at || 0).getTime();
        return db - da;
      });
  }

  function renderFeaturedCard(post) {
    return '<a href="' + escapeHtml(post.static_url) + '" class="featured-card" data-post-id="' + escapeHtml(post.id) + '">'
      + '<div class="featured-card-img"><img src="' + escapeHtml(post.cover_image) + '" alt="' + escapeHtml(post.title) + '" loading="lazy"><span class="featured-badge">Featured</span></div>'
      + '<div class="featured-card-body"><span class="post-card-tag">' + escapeHtml(post.category) + '</span>'
      + '<h3 class="post-card-title">' + escapeHtml(post.title) + '</h3>'
      + '<div class="post-card-meta">' + escapeHtml(formatDate(post.created_at)) + ' &middot; ' + escapeHtml(post.read_time) + '</div>'
      + '<p>' + escapeHtml(post.description) + '</p></div></a>';
  }

  function renderPostCard(post) {
    return '<a href="' + escapeHtml(post.static_url) + '" class="post-card" data-post-id="' + escapeHtml(post.id) + '">'
      + '<div class="post-card-img"><img src="' + escapeHtml(post.cover_image) + '" alt="' + escapeHtml(post.title) + '" loading="lazy"></div>'
      + '<div class="post-card-body"><span class="post-card-tag">' + escapeHtml(post.category) + '</span>'
      + '<h3>' + escapeHtml(post.title) + '</h3>'
      + '<div class="post-card-meta">' + escapeHtml(formatDate(post.created_at)) + ' &middot; ' + escapeHtml(post.read_time) + '</div>'
      + '<p>' + escapeHtml(post.description) + '</p></div></a>';
  }

  function renderPaginationHtml(page, totalPages) {
    if (totalPages <= 1) return '';
    var html = '<button class="page-arrow" data-page="' + Math.max(1, page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>&laquo;</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button data-page="' + i + '"' + (i === page ? ' class="active"' : '') + '>' + i + '</button>';
    }
    html += '<button class="page-arrow" data-page="' + Math.min(totalPages, page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
    return html;
  }

  function renderCategorySection(posts, sectionKey, sectionLabel, index) {
    var totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
    var firstPage = posts.slice(0, PER_PAGE);

    var html = '<div class="blog-category-section" id="cat-' + index + '" data-section="' + escapeHtml(sectionKey) + '">'
      + '<div class="blog-category-header"><h3 class="blog-category-title">' + escapeHtml(sectionLabel)
      + ' <span class="count-badge">' + posts.length + ' posts</span></h3></div>'
      + '<div class="posts-grid" id="grid-' + index + '">';

    html += firstPage.map(renderPostCard).join('');
    html += '</div>';

    var allCards = posts.map(function (p, i) {
      return '<template class="post-card-template" data-page="' + (Math.floor(i / PER_PAGE) + 1) + '">' + renderPostCard(p) + '</template>';
    }).join('');

    html += '<div class="blog-pagination" id="pagination-' + index + '" data-total-pages="' + totalPages + '">'
      + renderPaginationHtml(1, totalPages)
      + '</div>';
    html += allCards;
    html += '</div>';

    return html;
  }

  function generateFeaturedHtml(posts) {
    var featured = posts.slice(0, 2);
    if (!featured.length) {
      return '<p class="blog-empty-state">No published articles yet.</p>';
    }
    return featured.map(renderFeaturedCard).join('');
  }

  function generateCategoriesHtml(posts) {
    var rest = posts.slice(2);
    if (!rest.length) return '';

    var groups = {};
    rest.forEach(function (p) {
      var key = p.section || 'other';
      if (!groups[key]) groups[key] = { label: p.sectionLabel, posts: [] };
      groups[key].posts.push(p);
    });

    var sections = Object.keys(groups);
    var index = 0;
    return sections.map(function (key) {
      var group = groups[key];
      var html = renderCategorySection(group.posts, key, group.label, index);
      index++;
      return html;
    }).join('');
  }

  function generateBlogNewsHtml() {
    var posts = getMappedPosts();
    var featuredHtml = generateFeaturedHtml(posts);
    var categoriesHtml = generateCategoriesHtml(posts);

    return '<!DOCTYPE html>\n'
      + '<html lang="en">\n'
      + '<head>\n'
      + '  <meta charset="UTF-8">\n'
      + '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
      + '  <meta name="description" content="KESTREL METAL Blog &amp; News - Insights, product information, installation tips, and industry news covering wire mesh, fencing, and metal solutions.">\n'
      + '  <title>KESTREL METAL - Blog &amp; News</title>\n\n'
      + '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
      + '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
      + '  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">\n\n'
      + '  <link rel="stylesheet" href="css/styles.css">\n'
      + '  <link rel="stylesheet" href="css/navbar.css">\n'
      + '  <link rel="stylesheet" href="css/blog-news.css">\n'
      + '  <link rel="stylesheet" href="css/footer.css">\n'
      + '  <script src="js/analytics-loader.js" async></scr' + 'ipt>\n'
      + '  <script src="js/seo-enhance.js" async></scr' + 'ipt>\n'
      + '</head>\n'
      + '<body>\n\n'
      + '  <div class="scroll-progress"><div id="scroll-progress" class="scroll-progress-bar"></div></div>\n\n'
      + '  <div id="navbar-placeholder"></div>\n\n'
      + '  <main>\n\n'
      + '    <section class="blog-hero">\n'
      + '      <div class="blog-hero-bg"></div>\n'
      + '      <div class="blog-hero-overlay"></div>\n'
      + '      <div class="blog-hero-content">\n'
      + '        <nav class="breadcrumb" aria-label="Breadcrumb">\n'
      + '          <a href="index.html">Home</a>\n'
      + '          <span class="breadcrumb-sep">/</span>\n'
      + '          <a href="resources.html">Resources</a>\n'
      + '          <span class="breadcrumb-sep">/</span>\n'
      + '          <span class="current">Blog &amp; News</span>\n'
      + '        </nav>\n'
      + '        <h1 class="blog-hero-title">Blog <span class="highlight">&amp; News</span></h1>\n'
      + '        <p class="blog-hero-description">\n'
      + '          Insights, product information, installation tips, and industry news from the KESTREL METAL team.\n'
      + '        </p>\n'
      + '      </div>\n'
      + '    </section>\n\n'
      + '    <section class="blog-featured-section">\n'
      + '      <div class="container">\n'
      + '        <div class="blog-section-heading" data-reveal>\n'
      + '          <span class="blog-section-label">Editor\'s Picks</span>\n'
      + '          <h2 class="blog-section-title">Featured Posts</h2>\n'
      + '        </div>\n'
      + '        <div class="blog-featured-grid" id="featuredGrid">\n'
      + featuredHtml + '\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </section>\n\n'
      + '    <section class="blog-listing-section">\n'
      + '      <div class="container">\n'
      + '        <div class="blog-section-heading" data-reveal>\n'
      + '          <span class="blog-section-label">Explore</span>\n'
      + '          <h2 class="blog-section-title">Latest Articles</h2>\n'
      + '        </div>\n'
      + '        <div id="blogCategories">\n'
      + categoriesHtml + '\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </section>\n\n'
      + '    <section class="blog-cta">\n'
      + '      <div class="blog-cta-bg"></div>\n'
      + '      <div class="blog-cta-overlay"></div>\n'
      + '      <div class="blog-cta-content">\n'
      + '        <h2 class="blog-cta-title">Stay Updated</h2>\n'
      + '        <p class="blog-cta-desc">Looking for a specific topic or need expert advice? Contact our team for product guidance and technical support.</p>\n'
      + '        <div class="blog-cta-buttons">\n'
      + '          <a href="contact.html" class="btn-hero-primary">CONTACT US\n'
      + '            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>\n'
      + '          </a>\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </section>\n\n'
      + '  </main>\n\n'
      + '  <div id="footer-placeholder"></div>\n\n'
      + '  <button class="back-to-top" id="backToTop" aria-label="Back to top">\n'
      + '    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>\n'
      + '  </button>\n\n'
      + '  <script src="js/includes.js"></scr' + 'ipt>\n'
      + '  <script src="js/blog-news.js"></scr' + 'ipt>\n'
      + '</body>\n'
      + '</html>\n';
  }

  function downloadFile(filename, content) {
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function generate() {
    var posts = getMappedPosts();
    var mapped = posts.length;
    var total = getPublishedPosts().length;
    var unmapped = total - mapped;

    var html = generateBlogNewsHtml();
    downloadFile('blog-news.html', html);

    return {
      mapped: mapped,
      total: total,
      unmapped: unmapped,
      html: html
    };
  }

  function getStats() {
    var posts = getMappedPosts();
    var total = getPublishedPosts().length;
    return {
      mapped: posts.length,
      total: total,
      unmapped: total - posts.length
    };
  }

  return {
    generate: generate,
    getStats: getStats,
    getMappedPosts: getMappedPosts
  };
})();
