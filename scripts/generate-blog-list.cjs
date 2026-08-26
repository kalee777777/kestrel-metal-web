const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(SITE_DIR, 'blog-news.html');

const STATIC_BLOG_FILES = fs.readdirSync(SITE_DIR)
  .filter(f => /^blog-.+\.html$/.test(f) && f !== 'blog-news.html')
  .sort();

const FILE_SET = {};
STATIC_BLOG_FILES.forEach(f => { FILE_SET[f] = true; });

const SEED_POSTS = [
  { id: 1, title: 'The Evolution of Chain Link Fence Technology', slug: 'evolution-chain-link', description: 'Explore how chain link fencing has evolved over the decades', cover_image: '/images/blog-chain-link-evolution-1.webp', category: 'Industry Insights', tags: ['chain-link', 'fence', 'history'], section: 'featured', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 2, title: 'How to Choose the Right Wire Mesh for Your Project', slug: 'choose-right-wire-mesh', description: 'A comprehensive guide to selecting the perfect wire mesh', cover_image: '/images/blog-welded-mesh-715.jpg', category: 'Product Guide', tags: ['wire-mesh', 'guide', 'selection'], section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
  { id: 3, title: 'Gabion Installation: Step-by-Step Guide', slug: 'gabion-installation-guide', description: 'Complete guide to installing gabion boxes', cover_image: '/images/blog-gabion-install-hero.webp', category: 'Installation', tags: ['gabion', 'installation', 'guide'], section: 'tips', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', created_at: new Date(Date.now() - 86400000 * 21).toISOString() },
  { id: 101, title: 'Tips for Opening and Closing Barb Wire Gates', slug: 'blog-barb-wire-gates-tips', description: 'Practical safety tips and best practices for opening and closing barb wire gates without damaging the fence or risking injury.', cover_image: 'images/blog/blog-gates-hero.jpg', category: 'How-To', tags: ['how-to', 'barbed-wire', 'gates', 'safety'], section: 'featured', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2026-01-12T00:00:00.000Z' },
  { id: 102, title: 'Razor Wire Is Most Visible Result of $210M Troop Deployment to US-Mexico Border', slug: 'blog-border-razor-wire-deployment', description: 'Analysis of razor wire deployment in border security operations and what it means for manufacturers and specifiers.', cover_image: 'images/blog/blog-border-razor-hero.avif', category: 'Border Security', tags: ['border-security', 'razor-wire', 'deployment'], section: 'featured', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', created_at: '2026-02-05T00:00:00.000Z' },
  { id: 201, title: 'Architectural Wire Mesh: Blending Security with Modern Aesthetics', slug: 'blog-architectural-wire-mesh', description: 'How architectural wire mesh combines security with modern building aesthetics for facades, partitions, and cladding.', cover_image: 'images/blog/architectural-facades-application.jpg', category: 'Design', tags: ['design', 'architectural', 'facade'], section: 'product-info', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', created_at: '2025-06-18T00:00:00.000Z' },
  { id: 202, title: 'Epoxy Coated vs Galvanised Woven Wire Mesh: A Complete Comparison', slug: 'blog-epoxy-vs-galvanised-woven-wire-mesh', description: 'A detailed head-to-head comparison of epoxy coated and galvanised woven wire mesh across performance, cost, and lifespan.', cover_image: 'images/blog/epoxy-coated-wire-mesh.jpg', category: 'Materials', tags: ['materials', 'epoxy', 'galvanised', 'comparison'], section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: '2025-10-09T00:00:00.000Z' },
  { id: 203, title: 'Galvanized vs PVC Coated: Which Fencing Lasts Longer in Coastal Areas?', slug: 'blog-galvanized-vs-pvc', description: 'Comparative analysis of galvanized and PVC-coated fencing in saltwater environments, with real-world durability data.', cover_image: 'images/blog/pvc-coated-wire.jpg', category: 'Maintenance', tags: ['maintenance', 'coastal', 'pvc', 'galvanized'], section: 'product-info', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2025-11-05T00:00:00.000Z' },
  { id: 204, title: 'Hexagonal Wire Mesh vs Gabion Mesh: Key Differences & How to Choose', slug: 'blog-hexagonal-vs-gabion-mesh', description: 'Understand the structural and application differences between hexagonal wire mesh and gabion mesh to pick the right product.', cover_image: 'images/blog/galvanized-hexagonal-wire-netting.png', category: 'Guide', tags: ['guide', 'hexagonal', 'gabion', 'comparison'], section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: '2025-07-22T00:00:00.000Z' },
  { id: 205, title: 'Materials for Welded Wire Mesh', slug: 'blog-materials-welded-wire-mesh', description: 'Explore the base materials, wire grades, and coatings used to manufacture durable welded wire mesh.', cover_image: 'images/blog/blog-materials-welded-wire-mesh-hero.jpg', category: 'Materials', tags: ['materials', 'welded', 'wire-mesh'], section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-05-14T00:00:00.000Z' },
  { id: 206, title: 'Plain vs Twill Weave Stainless Steel Wire Mesh: A Complete Comparison', slug: 'blog-plain-vs-twill-weave', description: 'Technical comparison of plain and twill weave stainless steel wire mesh for filtration and screening applications.', cover_image: 'images/blog/plain-vs-twill-weave-blog.jpg', category: 'Materials', tags: ['materials', 'stainless-steel', 'weave', 'filtration'], section: 'product-info', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', created_at: '2025-08-30T00:00:00.000Z' },
  { id: 207, title: 'Comprehensive Guide to Stainless Steel Welded Wire Mesh Panels and Applications', slug: 'blog-ss-welded-wire-mesh-guide', description: 'An in-depth guide covering stainless steel welded wire mesh panels, their specifications, and where they are best used.', cover_image: 'images/blog/blog-ss-welded-mesh-hero.jpg', category: 'Guide', tags: ['guide', 'stainless-steel', 'welded', 'panels'], section: 'product-info', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', created_at: '2025-03-08T00:00:00.000Z' },
  { id: 208, title: 'Sintered Wire Mesh Filters: Technology & Applications', slug: 'blog-sintered-filters', description: 'How sintered wire mesh multilayer filters work and their role in precision filtration for demanding industries.', cover_image: 'images/blog/stainless-steel-screen-mesh.webp', category: 'Technical', tags: ['technical', 'sintered', 'filters', 'filtration'], section: 'product-info', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', created_at: '2025-04-03T00:00:00.000Z' },
  { id: 209, title: 'Versatile Wire Mesh Products For Your Market', slug: 'blog-versatile-wire-mesh-products', description: 'A broad look at the many sectors served by versatile wire mesh products, from construction to agriculture.', cover_image: 'images/blog/welded-wire-mesh-panel.jpg', category: 'Product', tags: ['product', 'versatile', 'applications'], section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-02-20T00:00:00.000Z' },
  { id: 210, title: "Who's Really Protecting Your Perimeter? Why Weld Strength Matters More Than Wire Gauge", slug: 'blog-weld-strength-matters', description: 'Learn why weld strength is the true measure of fence panel quality and why wire gauge alone is not enough.', cover_image: 'images/blog/weld-test-hero.png', category: 'Security', tags: ['security', 'weld-strength', 'quality'], section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: '2025-09-12T00:00:00.000Z' },
  { id: 211, title: 'Steel Mesh & Expanded Metal Plastering for Masonry Wall Reinforcement', slug: 'blog-steel-mesh-plastering', description: 'How steel mesh and expanded metal are used in plastering and masonry wall reinforcement to prevent cracking.', cover_image: 'images/blog/blog-plaster-steel-mesh.jpg', category: 'Construction', tags: ['construction', 'plastering', 'reinforcement'], section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-10-02T00:00:00.000Z' },
  { id: 301, title: 'How to Calculate the Cost of Wire Mesh for Fence Installation', slug: 'blog-barbed-wire-cost-calculation', description: 'A step-by-step method for estimating the total cost of wire mesh for a fence installation, including wastage and freight.', cover_image: 'images/blog/blog-barbed-cost-hero.webp', category: 'Cost Guide', tags: ['cost-guide', 'wire-mesh', 'installation', 'budget'], section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2026-01-28T00:00:00.000Z' },
  { id: 302, title: 'When to Replace Your Chain-Link Fence', slug: 'blog-chain-link-replace', description: 'Signs that your chain-link fence needs replacement and how to plan a cost-effective upgrade.', cover_image: 'images/blog/blog-chain-link-replace-hero.png', category: 'Maintenance', tags: ['maintenance', 'chain-link', 'replacement'], section: 'tips', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2025-12-15T00:00:00.000Z' },
  { id: 303, title: 'Why You Should Install a Chain-Link Fence in Your Yard', slug: 'blog-chain-link-yard', description: 'Durability, low maintenance, budget-friendly pricing, and good visibility make chain-link a smart backyard choice.', cover_image: 'images/blog/blog-chain-link-yard-hero.jpg', category: 'Tips', tags: ['tips', 'chain-link', 'residential', 'backyard'], section: 'tips', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', created_at: '2024-01-01T00:00:00.000Z' },
  { id: 304, title: 'Field Fence Installation Guide: End Posts, Line Posts & Wire Mesh', slug: 'blog-field-fence-installation', description: 'Complete field fence installation guide covering end posts, line posts, bracing, and proper wire mesh tensioning.', cover_image: 'images/blog/blog-field-fence-installation-hero.jpg', category: 'Installation', tags: ['installation', 'field-fence', 'posts'], section: 'tips', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', created_at: '2025-03-22T00:00:00.000Z' },
  { id: 305, title: 'How to Install Welded Gabion Boxes: A Complete Step-by-Step Guide', slug: 'blog-how-to-install-welded-gabion-boxes', description: 'From foundation preparation to stone filling, a complete guide to installing welded gabion boxes for walls and structures.', cover_image: 'images/blog/blog-gabion-install-hero.jpg', category: 'Installation', tags: ['installation', 'gabion', 'welded', 'step-by-step'], section: 'tips', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', created_at: '2025-05-06T00:00:00.000Z' },
  { id: 306, title: '10 Common Mistakes When Installing Wire Mesh Fencing', slug: 'blog-installation-mistakes', description: 'Avoid these ten frequent errors when installing wire mesh fencing to ensure a long-lasting, secure result.', cover_image: 'images/blog/fabrication-welding-framing.png', category: 'Installation', tags: ['installation', 'mistakes', 'tips'], section: 'tips', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', created_at: '2025-11-20T00:00:00.000Z' },
  { id: 307, title: 'NATO-22 Certified Razor Wire: Meeting Global Military Security Standards', slug: 'blog-nato22-razor-wire', description: 'Overview of BTC barbed tape concertina products meeting NATO-22 military specifications, with testing and deployment guidance.', cover_image: 'images/blog/btc-razor-wire.jpg', category: 'Razor Wire', tags: ['razor-wire', 'nato', 'military', 'security'], section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-09-28T00:00:00.000Z' },
  { id: 308, title: "7 Things You Probably Didn't Know About Razor Coils", slug: 'blog-razor-coils-7-things', description: 'From installation regulations to types and materials, everything you need to know about razor coils.', cover_image: 'images/blog/blog-razor-coils-hero.avif', category: 'Security', tags: ['security', 'razor-coils', 'facts'], section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2026-02-22T00:00:00.000Z' },
  { id: 309, title: 'How to Squirrel-Proof Your Home & Yard With Wire Mesh Screens', slug: 'blog-squirrel-proof-wire-mesh', description: 'Practical ways to use wire mesh screens to keep squirrels out of gardens, attics, and bird feeders.', cover_image: 'images/blog/blog-squirrel-proof-header.jpg', category: 'Tips', tags: ['tips', 'squirrel', 'pest-control', 'home'], section: 'tips', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2025-04-18T00:00:00.000Z' },
  { id: 310, title: 'Wire Mesh Specification Sheet: How to Read and Interpret Technical Data', slug: 'blog-specification-sheet', description: 'Understand wire diameter, aperture size, tensile strength, and coating weight measurements on specification sheets.', cover_image: 'images/blog/wire-size-diameters.png', category: 'Technical Guide', tags: ['technical-guide', 'specifications', 'wire-mesh'], section: 'tips', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', created_at: '2025-09-15T00:00:00.000Z' },
  { id: 401, title: 'The Evolution of Chain Link Fence: 2024 and Beyond', slug: 'blog-chain-link-evolution', description: 'How chain link fence technology and applications are evolving with new coatings and manufacturing methods.', cover_image: 'images/blog/blog-evolution-chain-link.png', category: 'Trends', tags: ['trends', 'chain-link', 'evolution'], section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-06-02T00:00:00.000Z' },
  { id: 402, title: 'How to Select the Right Chain Link Fence', slug: 'blog-chain-link-selection', description: 'Key selection criteria for chain link fencing including gauge, coating, mesh size, and post spacing.', cover_image: 'images/blog/blog-chain-link-2.png', category: 'Selection', tags: ['selection', 'chain-link', 'guide'], section: 'product-posts', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', created_at: '2025-07-15T00:00:00.000Z' },
  { id: 403, title: 'Dual Fence Security System: Why Two Perimeter Barriers Multiply Security Exponentially', slug: 'blog-dual-fence-security', description: 'Why a dual fence security system dramatically increases protection compared to a single perimeter barrier.', cover_image: 'images/blog/dual-fence-hero.jpg', category: 'Security', tags: ['security', 'dual-fence', 'perimeter'], section: 'product-posts', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', created_at: '2025-08-05T00:00:00.000Z' },
  { id: 404, title: 'Fence Liability: Escaped Animals', slug: 'blog-fence-liability-escaped-animals', description: 'Understanding your fence liability for escaped animals and how proper fencing reduces legal risk.', cover_image: 'images/blog/blog-fence-liability-hero.jpg', category: 'Liability', tags: ['liability', 'escaped-animals', 'legal'], section: 'product-posts', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2025-05-28T00:00:00.000Z' },
  { id: 405, title: 'Gabion Boxes Market Research Report 2034', slug: 'blog-gabion-boxes-market-report-2034', description: 'Key findings from the 2034 gabion boxes market report, including growth drivers and regional trends.', cover_image: 'images/blog/blog-gabion-market-hero.webp', category: 'Market', tags: ['market', 'gabion', 'report', '2034'], section: 'product-posts', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: '2026-01-30T00:00:00.000Z' },
  { id: 406, title: 'Hexagonal Wire Mesh: A Simple Solution with Global Impact', slug: 'blog-hexagonal-wire-mesh-global-impact', description: 'How a simple hexagonal wire mesh product delivers outsized impact in agriculture and construction globally.', cover_image: 'images/blog/blog-hex-mesh-hero.jpg', category: 'Global', tags: ['global', 'hexagonal', 'agriculture', 'impact'], section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-03-15T00:00:00.000Z' },
  { id: 407, title: 'Kestrel Metal Expands Production Capacity', slug: 'blog-new-manufacturing-facility', description: 'Kestrel Metal announces expanded production capacity to better serve growing global demand for wire mesh.', cover_image: 'images/blog/blog-welded-mesh-roll-warehouse.jpg', category: 'Company News', tags: ['company-news', 'production', 'capacity'], section: 'product-posts', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', created_at: '2025-04-26T00:00:00.000Z' },
  { id: 408, title: 'The Future of Wire Mesh in Sustainable Infrastructure', slug: 'blog-sustainable-infrastructure', description: 'How wire mesh is shaping greener, more sustainable infrastructure projects across the globe.', cover_image: 'images/blog/blog-sustainable-infrastructure.jpg', category: 'Sustainability', tags: ['sustainability', 'infrastructure', 'green'], section: 'product-posts', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', created_at: '2025-10-25T00:00:00.000Z' },
  { id: 409, title: 'Understanding KESTREL WELDED MESH 711-714', slug: 'blog-welded-mesh-711-714', description: 'Technical breakdown of the KESTREL WELDED MESH 711-714 series and its recommended applications.', cover_image: 'images/blog/welded-mesh-711.jpg', category: 'Product', tags: ['product', 'welded-mesh', '711-714', 'technical'], section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', created_at: '2025-11-10T00:00:00.000Z' },
  { id: 410, title: 'Introducing KESTREL WELDED MESH 715', slug: 'blog-welded-mesh-715', description: 'Meet the latest addition to the KESTREL WELDED MESH family and the features that set it apart.', cover_image: 'images/blog/welded-mesh-715.jpg', category: 'Product', tags: ['product', 'welded-mesh', '715'], section: 'product-posts', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', created_at: '2025-12-05T00:00:00.000Z' },
  { id: 411, title: 'Welded Gabion vs. Twisted Gabion Baskets: Which Is Better for Your Project?', slug: 'blog-welded-vs-twisted-gabion', description: 'Understand the strengths of welded versus twisted gabion baskets to choose the right option for your build.', cover_image: 'images/blog/blog-gabion-welded-vs-twisted-hero.jpg', category: 'Guide', tags: ['guide', 'gabion', 'welded', 'twisted'], section: 'product-posts', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', created_at: '2025-07-08T00:00:00.000Z' },
];

const SECTION_LABELS = {
  'featured': 'Featured',
  'product-info': 'Product Information',
  'tips': 'Tips &amp; Inspiration',
  'product-posts': 'Product Posts'
};

const PER_PAGE = 6;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStaticUrl(post) {
  var slugFile = post.slug + '.html';
  if (FILE_SET[slugFile]) return slugFile;
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getCategory(post) {
  return post.category || post.section || 'Latest Articles';
}

function getSectionLabel(post) {
  var section = post.section || '';
  return SECTION_LABELS[section] || section || 'Latest Articles';
}

function getImage(post) {
  return post.cover_image || post.image || 'images/hero-blog.jpg';
}

var mappedPosts = SEED_POSTS
  .filter(p => p.status === 'published')
  .map(p => ({
    ...p,
    static_url: getStaticUrl(p),
    sectionLabel: getSectionLabel(p)
  }))
  .filter(p => p.static_url)
  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

var featured = mappedPosts.slice(0, 2);
var rest = mappedPosts.slice(2);

var featuredHtml = featured.map(p => {
  return '<a href="' + escapeHtml(p.static_url) + '" class="featured-card" data-post-id="' + escapeHtml(p.id) + '">'
    + '<div class="featured-card-img"><img src="' + escapeHtml(getImage(p)) + '" alt="' + escapeHtml(p.title) + '" loading="lazy"><span class="featured-badge">Featured</span></div>'
    + '<div class="featured-card-body"><span class="post-card-tag">' + escapeHtml(getCategory(p)) + '</span>'
    + '<h3 class="post-card-title">' + escapeHtml(p.title) + '</h3>'
    + '<div class="post-card-meta">' + escapeHtml(formatDate(p.created_at)) + ' &middot; ' + escapeHtml(p.read_time) + '</div>'
    + '<p>' + escapeHtml(p.description) + '</p></div></a>';
}).join('\n          ');

var groups = {};
rest.forEach(p => {
  var key = p.section || 'other';
  if (!groups[key]) groups[key] = { label: p.sectionLabel, posts: [] };
  groups[key].posts.push(p);
});

var categoriesHtml = Object.keys(groups).map((key, index) => {
  var group = groups[key];
  var posts = group.posts;
  var totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  var firstPage = posts.slice(0, PER_PAGE);

  var cardsHtml = firstPage.map(p => {
    return '<a href="' + escapeHtml(p.static_url) + '" class="post-card" data-post-id="' + escapeHtml(p.id) + '">'
      + '<div class="post-card-img"><img src="' + escapeHtml(getImage(p)) + '" alt="' + escapeHtml(p.title) + '" loading="lazy"></div>'
      + '<div class="post-card-body"><span class="post-card-tag">' + escapeHtml(getCategory(p)) + '</span>'
      + '<h3>' + escapeHtml(p.title) + '</h3>'
      + '<div class="post-card-meta">' + escapeHtml(formatDate(p.created_at)) + ' &middot; ' + escapeHtml(p.read_time) + '</div>'
      + '<p>' + escapeHtml(p.description) + '</p></div></a>';
  }).join('\n          ');

  var paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = '<button class="page-arrow" data-page="1" disabled>&laquo;</button>';
    for (var i = 1; i <= totalPages; i++) {
      paginationHtml += '<button data-page="' + i + '"' + (i === 1 ? ' class="active"' : '') + '>' + i + '</button>';
    }
    paginationHtml += '<button class="page-arrow" data-page="2">»</button>';
  }

  var templatesHtml = posts.map((p, i) => {
    var page = Math.floor(i / PER_PAGE) + 1;
    if (page === 1) return '';
    var cardHtml = '<a href="' + escapeHtml(p.static_url) + '" class="post-card" data-post-id="' + escapeHtml(p.id) + '">'
      + '<div class="post-card-img"><img src="' + escapeHtml(getImage(p)) + '" alt="' + escapeHtml(p.title) + '" loading="lazy"></div>'
      + '<div class="post-card-body"><span class="post-card-tag">' + escapeHtml(getCategory(p)) + '</span>'
      + '<h3>' + escapeHtml(p.title) + '</h3>'
      + '<div class="post-card-meta">' + escapeHtml(formatDate(p.created_at)) + ' &middot; ' + escapeHtml(p.read_time) + '</div>'
      + '<p>' + escapeHtml(p.description) + '</p></div></a>';
    return '<template class="post-card-template" data-page="' + page + '">' + cardHtml + '</template>';
  }).join('\n          ');

  return '<div class="blog-category-section" id="cat-' + index + '" data-section="' + escapeHtml(key) + '">'
    + '<div class="blog-category-header"><h3 class="blog-category-title">' + escapeHtml(group.label)
    + ' <span class="count-badge">' + posts.length + ' posts</span></h3></div>'
    + '<div class="posts-grid" id="grid-' + index + '">\n          ' + cardsHtml + '\n          </div>'
    + '<div class="blog-pagination" id="pagination-' + index + '" data-total-pages="' + totalPages + '">' + paginationHtml + '</div>'
    + templatesHtml
    + '</div>';
}).join('\n        ');

var html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="KESTREL METAL Blog & News - Insights, product information, installation tips, and industry news covering wire mesh, fencing, and metal solutions.">
  <title>KESTREL METAL - Blog & News</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/navbar.css">
  <link rel="stylesheet" href="css/blog-news.css">
  <link rel="stylesheet" href="css/footer.css">
  <script src="js/analytics-loader.js" async></script>
  <script src="js/seo-enhance.js" async></script>
</head>
<body>

  <div class="scroll-progress"><div id="scroll-progress" class="scroll-progress-bar"></div></div>

  <div id="navbar-placeholder"></div>

  <main>

    <section class="blog-hero">
      <div class="blog-hero-bg"></div>
      <div class="blog-hero-overlay"></div>
      <div class="blog-hero-content">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="resources.html">Resources</a>
          <span class="breadcrumb-sep">/</span>
          <span class="current">Blog &amp; News</span>
        </nav>
        <h1 class="blog-hero-title">Blog <span class="highlight">&amp; News</span></h1>
        <p class="blog-hero-description">
          Insights, product information, installation tips, and industry news from the KESTREL METAL team.
        </p>
      </div>
    </section>

    <section class="blog-featured-section">
      <div class="container">
        <div class="blog-section-heading" data-reveal>
          <span class="blog-section-label">Editor's Picks</span>
          <h2 class="blog-section-title">Featured Posts</h2>
        </div>
        <div class="blog-featured-grid" id="featuredGrid">
          ${featuredHtml}
        </div>
      </div>
    </section>

    <section class="blog-listing-section">
      <div class="container">
        <div class="blog-section-heading" data-reveal>
          <span class="blog-section-label">Explore</span>
          <h2 class="blog-section-title">Latest Articles</h2>
        </div>
        <div id="blogCategories">
        ${categoriesHtml}
        </div>
      </div>
    </section>

    <section class="blog-cta">
      <div class="blog-cta-bg"></div>
      <div class="blog-cta-overlay"></div>
      <div class="blog-cta-content">
        <h2 class="blog-cta-title">Stay Updated</h2>
        <p class="blog-cta-desc">Looking for a specific topic or need expert advice? Contact our team for product guidance and technical support.</p>
        <div class="blog-cta-buttons">
          <a href="contact.html" class="btn-hero-primary">CONTACT US
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      </div>
    </section>

  </main>

  <div id="footer-placeholder"></div>

  <button class="back-to-top" id="backToTop" aria-label="Back to top">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
  </button>

  <script src="js/includes.js"></script>
  <script src="js/blog-news.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');
console.log('Generated blog-news.html');
console.log('Mapped posts: ' + mappedPosts.length + ' / ' + SEED_POSTS.length);
console.log('Unmapped: ' + (SEED_POSTS.length - mappedPosts.length));
console.log('Featured: ' + featured.length);
console.log('Category sections: ' + Object.keys(groups).length);
