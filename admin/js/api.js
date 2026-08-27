/**
 * Admin API Client - LocalStorage Implementation
 * 纯静态 Admin: 使用 localStorage 模拟后端数据存储
 */
const API = (function () {
  const TOKEN_KEY = 'km_admin_token';
  const USER_KEY = 'km_admin_user';
  const STORAGE_PREFIX = 'km_admin_';

  // ==================== Storage Helpers ====================
  function getStorage(key) {
    const fullKey = STORAGE_PREFIX + key;
    const raw = localStorage.getItem(fullKey);
    return raw ? JSON.parse(raw) : null;
  }

  function setStorage(key, value) {
    const fullKey = STORAGE_PREFIX + key;
    if (value === null || value === undefined) {
      localStorage.removeItem(fullKey);
    } else {
      localStorage.setItem(fullKey, JSON.stringify(value));
    }
  }

  function getCollection(key) {
    return getStorage(key) || [];
  }

  function setCollection(key, data) {
    setStorage(key, data);
  }

  function mergeCollection(key, seedItems, idField = 'id') {
    const existing = getCollection(key);
    const existingIds = new Set(existing.map(item => item[idField]));
    const newItems = seedItems.filter(item => !existingIds.has(item[idField]));
    let patched = existing;
    if (key === 'blog_posts' || key === 'case_studies' || key === 'products') {
      patched = existing.map(item => {
        const update = seedItems.find(s => s[idField] === item[idField]);
        if (!update) return item;
        const out = Object.assign({}, item);
        const seedCover = update.cover_image || update.coverImage || null;
        if (seedCover && item.cover_image !== seedCover) out.cover_image = seedCover;
        if (update.static_url && item.static_url !== update.static_url) out.static_url = update.static_url;
        return out;
      });
    }
    if (key === 'glossary') {
      patched = existing.map(item => {
        const update = seedItems.find(s => s[idField] === item[idField]);
        if (!update) return item;
        const out = Object.assign({}, item);
        if (update.term && item.term !== update.term) out.term = update.term;
        if (update.definition && item.definition !== update.definition) out.definition = update.definition;
        if (update.category && item.category !== update.category) out.category = update.category;
        return out;
      });
    }
    if (patched !== existing || newItems.length > 0) {
      setCollection(key, [...patched, ...newItems]);
    }
  }

  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Auth ====================
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  // ==================== Seed Data ====================
  function seedData() {
    if (getStorage('seeded') && getCollection('blog_posts').length >= 36 && getCollection('case_studies').length >= 8 && getCollection('glossary').length >= 67 && getCollection('content_drafts').length >= 1) return;

    // Seed categories
    setCollection('product_categories', [
      { id: 1, name: 'Chain Link Fence', slug: 'chain-link-fence', description: 'Chain link fencing products', parent_id: null, sort_order: 1, is_active: true, image: '/images/chain-link-galvanized.webp', created_at: new Date().toISOString() },
      { id: 2, name: 'Welded Wire Mesh', slug: 'welded-wire-mesh', description: 'Welded wire mesh products', parent_id: null, sort_order: 2, is_active: true, image: '/images/welded-mesh-711.webp', created_at: new Date().toISOString() },
      { id: 3, name: 'Hexagonal Wire', slug: 'hexagonal-wire', description: 'Hexagonal wire mesh', parent_id: null, sort_order: 3, is_active: true, image: '/images/hexagonal-wire.webp', created_at: new Date().toISOString() },
      { id: 4, name: 'Gabion & Mattress', slug: 'gabion-mattress', description: 'Gabion boxes and mattresses', parent_id: null, sort_order: 4, is_active: true, image: '/images/gabion-mattress.webp', created_at: new Date().toISOString() },
      { id: 5, name: 'Razor & Barbed Wire', slug: 'razor-barbed-wire', description: 'Razor wire and barbed wire', parent_id: null, sort_order: 5, is_active: true, image: '/images/btc-razor-wire.webp', created_at: new Date().toISOString() },
      { id: 6, name: 'Fence Accessories', slug: 'fence-accessories', description: 'Fence fittings and accessories', parent_id: null, sort_order: 6, is_active: true, image: '/images/chain-link-fittings-banner.webp', created_at: new Date().toISOString() },
    ]);

    // Seed products
    setCollection('products', [
      { id: 1, category_id: 1, name: 'Galvanized Chain Link Fence', slug: 'galvanized-chain-link', subtitle: 'High-quality galvanized chain link', description: 'Premium galvanized chain link fence with excellent corrosion resistance', specifications: 'Wire diameter: 2.0-4.0mm\nMesh size: 50x50mm\nLength: 25m/roll', price_range: '$50-$150', meta_title: 'Galvanized Chain Link Fence | Kestrel Metal', meta_description: 'High-quality galvanized chain link fence for residential and commercial applications', cover_image: '/images/chain-link-galvanized.webp', is_featured: true, is_active: true, sort_order: 1, created_at: new Date().toISOString() },
      { id: 2, category_id: 1, name: 'PVC Coated Chain Link Fence', slug: 'pvc-coated-chain-link', subtitle: 'Colorful PVC coated fence', description: 'PVC coated chain link fence available in various colors', specifications: 'Wire diameter: 2.5-3.5mm\nMesh size: 50x50mm\nColors: Black, Green, Blue', price_range: '$60-$180', meta_title: 'PVC Coated Chain Link Fence | Kestrel Metal', meta_description: 'Colorful PVC coated chain link fence with long-lasting performance', cover_image: '/images/chain-link-pvc.webp', is_featured: true, is_active: true, sort_order: 2, created_at: new Date().toISOString() },
      { id: 3, category_id: 2, name: 'Welded Wire Mesh Panel', slug: 'welded-wire-mesh-panel', subtitle: 'Structural welded mesh panels', description: 'High-strength welded wire mesh panels for various applications', specifications: 'Wire diameter: 4.0-12.0mm\nPanel size: 2.4x6m\nSpacing: 50x50mm', price_range: '$30-$200', meta_title: 'Welded Wire Mesh Panel | Kestrel Metal', meta_description: 'High-strength welded wire mesh panels for construction and industrial use', cover_image: '/images/welded-mesh-711.webp', is_featured: true, is_active: true, sort_order: 3, created_at: new Date().toISOString() },
      { id: 4, category_id: 3, name: 'Hexagonal Wire Netting', slug: 'hexagonal-wire-netting', subtitle: 'Flexible hexagonal mesh', description: 'Flexible hexagonal wire netting for chicken coop and fencing', specifications: 'Wire diameter: 0.5-2.0mm\nMesh size: 13-75mm\nLength: 30m/roll', price_range: '$10-$80', meta_title: 'Hexagonal Wire Netting | Kestrel Metal', meta_description: 'Flexible hexagonal wire netting for agricultural applications', cover_image: 'images/blog/galvanized-hexagonal-wire-netting.webp', is_featured: false, is_active: true, sort_order: 4, created_at: new Date().toISOString() },
      { id: 5, category_id: 4, name: 'Gabion Box', slug: 'gabion-box', subtitle: 'Stone-filled gabion baskets', description: 'Woven gabion boxes for erosion control and landscaping', specifications: 'Size: 1x1x1m to 2x1x1m\nMesh: 80x100mm\nWire: 2.7-4.0mm', price_range: '$15-$50', meta_title: 'Gabion Box | Kestrel Metal', meta_description: 'High-quality gabion boxes for erosion control and decorative landscaping', cover_image: '/images/gabion-mattress.webp', is_featured: true, is_active: true, sort_order: 5, created_at: new Date().toISOString() },
      { id: 6, category_id: 5, name: 'Concertina Razor Wire', slug: 'concertina-razor-wire', subtitle: 'High-security razor wire', description: 'Concertina razor wire for maximum perimeter security', specifications: 'Blade length: 22mm\nWire diameter: 2.5mm\nCoil diameter: 450mm', price_range: '$20-$100', meta_title: 'Concertina Razor Wire | Kestrel Metal', meta_description: 'High-security concertina razor wire for perimeter protection', cover_image: 'images/blog/btc-razor-wire.webp', is_featured: true, is_active: true, sort_order: 6, created_at: new Date().toISOString() },
    ]);

    mergeCollection('blog_posts', [
      { id: 1, title: 'The Evolution of Chain Link Fence Technology', slug: 'evolution-chain-link', description: 'Explore how chain link fencing has evolved over the decades', content_md: '# The Evolution of Chain Link Fence\n\nChain link fencing has come a long way since its invention in the late 19th century...\n\n## Early History\n\nThe first chain link fence was invented by...\n\n## Modern Innovations\n\nToday\'s chain link fences feature...', cover_image: 'images/blog/blog-chain-link-evolution-1.webp', category: 'Industry Insights', tags: JSON.stringify(['chain-link', 'fence', 'history']), section: 'featured', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
      { id: 2, title: 'How to Choose the Right Wire Mesh for Your Project', slug: 'choose-right-wire-mesh', description: 'A comprehensive guide to selecting the perfect wire mesh', content_md: '# How to Choose the Right Wire Mesh\n\nSelecting the right wire mesh is crucial for your project...\n\n## Consider Your Application\n\nDifferent applications require different types of wire mesh...\n\n## Material Matters\n\nGalvanized, stainless steel, or PVC coated...', cover_image: 'images/blog/welded-mesh-715.jpg', category: 'Product Guide', tags: JSON.stringify(['wire-mesh', 'guide', 'selection']), section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
      { id: 3, title: 'Gabion Installation: Step-by-Step Guide', slug: 'gabion-installation-guide', description: 'Complete guide to installing gabion boxes', content_md: '# Gabion Installation Guide\n\nFollow these steps for successful gabion installation...\n\n## Preparations\n\nBefore you begin...\n\n## Step-by-Step\n\n1. Mark the area\n2. Excavate the foundation\n3. Compress the base\n4. Lay geotextile...', cover_image: 'images/blog/blog-gabion-install-hero.webp', category: 'Installation', tags: JSON.stringify(['gabion', 'installation', 'guide']), section: 'tips', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', is_ai_generated: false, created_at: new Date(Date.now() - 86400000 * 21).toISOString() },
      { id: 101, title: 'Tips for Opening and Closing Barb Wire Gates', slug: 'blog-barb-wire-gates-tips', description: 'Practical safety tips and best practices for opening and closing barb wire gates without damaging the fence or risking injury.', cover_image: 'images/blog/blog-gates-hero.jpg', category: 'How-To', tags: JSON.stringify(['how-to', 'barbed-wire', 'gates', 'safety']), section: 'featured', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2026-01-12T00:00:00.000Z' },
      { id: 102, title: 'Razor Wire Is Most Visible Result of $210M Troop Deployment to US-Mexico Border', slug: 'blog-border-razor-wire-deployment', description: 'Analysis of razor wire deployment in border security operations and what it means for manufacturers and specifiers.', cover_image: 'images/blog/blog-border-razor-hero.avif', category: 'Border Security', tags: JSON.stringify(['border-security', 'razor-wire', 'deployment']), section: 'featured', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', is_ai_generated: false, created_at: '2026-02-05T00:00:00.000Z' },
      { id: 201, title: 'Architectural Wire Mesh: Blending Security with Modern Aesthetics', slug: 'blog-architectural-wire-mesh', description: 'How architectural wire mesh combines security with modern building aesthetics for facades, partitions, and cladding.', cover_image: 'images/blog/architectural-facades-application.jpg', category: 'Design', tags: JSON.stringify(['design', 'architectural', 'facade']), section: 'product-info', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', is_ai_generated: false, created_at: '2025-06-18T00:00:00.000Z' },
      { id: 202, title: 'Epoxy Coated vs Galvanised Woven Wire Mesh: A Complete Comparison', slug: 'blog-epoxy-vs-galvanised-woven-wire-mesh', description: 'A detailed head-to-head comparison of epoxy coated and galvanised woven wire mesh across performance, cost, and lifespan.', cover_image: 'images/blog/epoxy-coated-wire-mesh.jpg', category: 'Materials', tags: JSON.stringify(['materials', 'epoxy', 'galvanised', 'comparison']), section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: '2025-10-09T00:00:00.000Z' },
      { id: 203, title: 'Galvanized vs PVC Coated: Which Fencing Lasts Longer in Coastal Areas?', slug: 'blog-galvanized-vs-pvc', description: 'Comparative analysis of galvanized and PVC-coated fencing in saltwater environments, with real-world durability data.', cover_image: 'images/blog/pvc-coated-wire.jpg', category: 'Maintenance', tags: JSON.stringify(['maintenance', 'coastal', 'pvc', 'galvanized']), section: 'product-info', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2025-11-05T00:00:00.000Z' },
      { id: 204, title: 'Hexagonal Wire Mesh vs Gabion Mesh: Key Differences & How to Choose', slug: 'blog-hexagonal-vs-gabion-mesh', description: 'Understand the structural and application differences between hexagonal wire mesh and gabion mesh to pick the right product.', cover_image: 'images/blog/galvanized-hexagonal-wire-netting.png', category: 'Guide', tags: JSON.stringify(['guide', 'hexagonal', 'gabion', 'comparison']), section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: '2025-07-22T00:00:00.000Z' },
      { id: 205, title: 'Materials for Welded Wire Mesh', slug: 'blog-materials-welded-wire-mesh', description: 'Explore the base materials, wire grades, and coatings used to manufacture durable welded wire mesh.', cover_image: 'images/blog/blog-materials-welded-wire-mesh-hero.jpg', category: 'Materials', tags: JSON.stringify(['materials', 'welded', 'wire-mesh']), section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-05-14T00:00:00.000Z' },
      { id: 206, title: 'Plain vs Twill Weave Stainless Steel Wire Mesh: A Complete Comparison', slug: 'blog-plain-vs-twill-weave', description: 'Technical comparison of plain and twill weave stainless steel wire mesh for filtration and screening applications.', cover_image: 'images/blog/plain-vs-twill-weave-blog.jpg', category: 'Materials', tags: JSON.stringify(['materials', 'stainless-steel', 'weave', 'filtration']), section: 'product-info', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', is_ai_generated: false, created_at: '2025-08-30T00:00:00.000Z' },
      { id: 207, title: 'Comprehensive Guide to Stainless Steel Welded Wire Mesh Panels and Applications', slug: 'blog-ss-welded-wire-mesh-guide', description: 'An in-depth guide covering stainless steel welded wire mesh panels, their specifications, and where they are best used.', cover_image: 'images/blog/blog-ss-welded-mesh-hero.jpg', category: 'Guide', tags: JSON.stringify(['guide', 'stainless-steel', 'welded', 'panels']), section: 'product-info', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', is_ai_generated: false, created_at: '2025-03-08T00:00:00.000Z' },
      { id: 208, title: 'Sintered Wire Mesh Filters: Technology & Applications', slug: 'blog-sintered-filters', description: 'How sintered wire mesh multilayer filters work and their role in precision filtration for demanding industries.', cover_image: 'images/blog/stainless-steel-screen-mesh.webp', category: 'Technical', tags: JSON.stringify(['technical', 'sintered', 'filters', 'filtration']), section: 'product-info', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', is_ai_generated: false, created_at: '2025-04-03T00:00:00.000Z' },
      { id: 209, title: 'Versatile Wire Mesh Products For Your Market', slug: 'blog-versatile-wire-mesh-products', description: 'A broad look at the many sectors served by versatile wire mesh products, from construction to agriculture.', cover_image: 'images/blog/welded-wire-mesh-panel.jpg', category: 'Product', tags: JSON.stringify(['product', 'versatile', 'applications']), section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-02-20T00:00:00.000Z' },
      { id: 210, title: "Who's Really Protecting Your Perimeter? Why Weld Strength Matters More Than Wire Gauge", slug: 'blog-weld-strength-matters', description: 'Learn why weld strength is the true measure of fence panel quality and why wire gauge alone is not enough.', cover_image: 'images/blog/weld-test-hero.png', category: 'Security', tags: JSON.stringify(['security', 'weld-strength', 'quality']), section: 'product-info', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: '2025-09-12T00:00:00.000Z' },
      { id: 211, title: 'Steel Mesh & Expanded Metal Plastering for Masonry Wall Reinforcement', slug: 'blog-steel-mesh-plastering', description: 'How steel mesh and expanded metal are used in plastering and masonry wall reinforcement to prevent cracking.', cover_image: 'images/blog/blog-plaster-steel-mesh.jpg', category: 'Construction', tags: JSON.stringify(['construction', 'plastering', 'reinforcement']), section: 'product-info', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-10-02T00:00:00.000Z' },
      { id: 301, title: 'How to Calculate the Cost of Wire Mesh for Fence Installation', slug: 'blog-barbed-wire-cost-calculation', description: 'A step-by-step method for estimating the total cost of wire mesh for a fence installation, including wastage and freight.', cover_image: 'images/blog/blog-barbed-cost-hero.webp', category: 'Cost Guide', tags: JSON.stringify(['cost-guide', 'wire-mesh', 'installation', 'budget']), section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2026-01-28T00:00:00.000Z' },
      { id: 302, title: 'When to Replace Your Chain-Link Fence', slug: 'blog-chain-link-replace', description: 'Signs that your chain-link fence needs replacement and how to plan a cost-effective upgrade.', cover_image: 'images/blog/blog-chain-link-replace-hero.png', category: 'Maintenance', tags: JSON.stringify(['maintenance', 'chain-link', 'replacement']), section: 'tips', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2025-12-15T00:00:00.000Z' },
      { id: 303, title: 'Why You Should Install a Chain-Link Fence in Your Yard', slug: 'blog-chain-link-yard', description: 'Durability, low maintenance, budget-friendly pricing, and good visibility make chain-link a smart backyard choice.', cover_image: 'images/blog/blog-chain-link-yard-hero.jpg', category: 'Tips', tags: JSON.stringify(['tips', 'chain-link', 'residential', 'backyard']), section: 'tips', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', is_ai_generated: false, created_at: '2024-01-01T00:00:00.000Z' },
      { id: 304, title: 'Field Fence Installation Guide: End Posts, Line Posts & Wire Mesh', slug: 'blog-field-fence-installation', description: 'Complete field fence installation guide covering end posts, line posts, bracing, and proper wire mesh tensioning.', cover_image: 'images/blog/blog-field-fence-installation-hero.jpg', category: 'Installation', tags: JSON.stringify(['installation', 'field-fence', 'posts']), section: 'tips', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', is_ai_generated: false, created_at: '2025-03-22T00:00:00.000Z' },
      { id: 305, title: 'How to Install Welded Gabion Boxes: A Complete Step-by-Step Guide', slug: 'blog-how-to-install-welded-gabion-boxes', description: 'From foundation preparation to stone filling, a complete guide to installing welded gabion boxes for walls and structures.', cover_image: 'images/blog/blog-gabion-install-hero.jpg', category: 'Installation', tags: JSON.stringify(['installation', 'gabion', 'welded', 'step-by-step']), section: 'tips', author: 'Kestrel Metal', read_time: '10 min read', status: 'published', is_ai_generated: false, created_at: '2025-05-06T00:00:00.000Z' },
      { id: 306, title: '10 Common Mistakes When Installing Wire Mesh Fencing', slug: 'blog-installation-mistakes', description: 'Avoid these ten frequent errors when installing wire mesh fencing to ensure a long-lasting, secure result.', cover_image: 'images/blog/fabrication-welding-framing.png', category: 'Installation', tags: JSON.stringify(['installation', 'mistakes', 'tips']), section: 'tips', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', is_ai_generated: false, created_at: '2025-11-20T00:00:00.000Z' },
      { id: 307, title: 'NATO-22 Certified Razor Wire: Meeting Global Military Security Standards', slug: 'blog-nato22-razor-wire', description: 'Overview of BTC barbed tape concertina products meeting NATO-22 military specifications, with testing and deployment guidance.', cover_image: 'images/blog/btc-razor-wire.jpg', category: 'Razor Wire', tags: JSON.stringify(['razor-wire', 'nato', 'military', 'security']), section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-09-28T00:00:00.000Z' },
      { id: 308, title: "7 Things You Probably Didn't Know About Razor Coils", slug: 'blog-razor-coils-7-things', description: 'From installation regulations to types and materials, everything you need to know about razor coils.', cover_image: 'images/blog/blog-razor-coils-hero.avif', category: 'Security', tags: JSON.stringify(['security', 'razor-coils', 'facts']), section: 'tips', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2026-02-22T00:00:00.000Z' },
      { id: 309, title: 'How to Squirrel-Proof Your Home & Yard With Wire Mesh Screens', slug: 'blog-squirrel-proof-wire-mesh', description: 'Practical ways to use wire mesh screens to keep squirrels out of gardens, attics, and bird feeders.', cover_image: 'images/blog/blog-squirrel-proof-header.jpg', category: 'Tips', tags: JSON.stringify(['tips', 'squirrel', 'pest-control', 'home']), section: 'tips', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2025-04-18T00:00:00.000Z' },
      { id: 310, title: 'Wire Mesh Specification Sheet: How to Read and Interpret Technical Data', slug: 'blog-specification-sheet', description: 'Understand wire diameter, aperture size, tensile strength, and coating weight measurements on specification sheets.', cover_image: 'images/blog/wire-size-diameters.png', category: 'Technical Guide', tags: JSON.stringify(['technical-guide', 'specifications', 'wire-mesh']), section: 'tips', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', is_ai_generated: false, created_at: '2025-09-15T00:00:00.000Z' },
      { id: 401, title: 'The Evolution of Chain Link Fence: 2024 and Beyond', slug: 'blog-chain-link-evolution', description: 'How chain link fence technology and applications are evolving with new coatings and manufacturing methods.', cover_image: 'images/blog/blog-evolution-chain-link.png', category: 'Trends', tags: JSON.stringify(['trends', 'chain-link', 'evolution']), section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-06-02T00:00:00.000Z' },
      { id: 402, title: 'How to Select the Right Chain Link Fence', slug: 'blog-chain-link-selection', description: 'Key selection criteria for chain link fencing including gauge, coating, mesh size, and post spacing.', cover_image: 'images/blog/blog-chain-link-2.png', category: 'Selection', tags: JSON.stringify(['selection', 'chain-link', 'guide']), section: 'product-posts', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', is_ai_generated: false, created_at: '2025-07-15T00:00:00.000Z' },
      { id: 403, title: 'Dual Fence Security System: Why Two Perimeter Barriers Multiply Security Exponentially', slug: 'blog-dual-fence-security', description: 'Why a dual fence security system dramatically increases protection compared to a single perimeter barrier.', cover_image: 'images/blog/dual-fence-hero.jpg', category: 'Security', tags: JSON.stringify(['security', 'dual-fence', 'perimeter']), section: 'product-posts', author: 'Kestrel Metal', read_time: '9 min read', status: 'published', is_ai_generated: false, created_at: '2025-08-05T00:00:00.000Z' },
      { id: 404, title: 'Fence Liability: Escaped Animals', slug: 'blog-fence-liability-escaped-animals', description: 'Understanding your fence liability for escaped animals and how proper fencing reduces legal risk.', cover_image: 'images/blog/blog-fence-liability-hero.jpg', category: 'Liability', tags: JSON.stringify(['liability', 'escaped-animals', 'legal']), section: 'product-posts', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2025-05-28T00:00:00.000Z' },
      { id: 405, title: 'Gabion Boxes Market Research Report 2034', slug: 'blog-gabion-boxes-market-report-2034', description: 'Key findings from the 2034 gabion boxes market report, including growth drivers and regional trends.', cover_image: 'images/blog/blog-gabion-market-hero.webp', category: 'Market', tags: JSON.stringify(['market', 'gabion', 'report', '2034']), section: 'product-posts', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: '2026-01-30T00:00:00.000Z' },
      { id: 406, title: 'Hexagonal Wire Mesh: A Simple Solution with Global Impact', slug: 'blog-hexagonal-wire-mesh-global-impact', description: 'How a simple hexagonal wire mesh product delivers outsized impact in agriculture and construction globally.', cover_image: 'images/blog/blog-hex-mesh-hero.jpg', category: 'Global', tags: JSON.stringify(['global', 'hexagonal', 'agriculture', 'impact']), section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-03-15T00:00:00.000Z' },
      { id: 407, title: 'Kestrel Metal Expands Production Capacity', slug: 'blog-new-manufacturing-facility', description: 'Kestrel Metal announces expanded production capacity to better serve growing global demand for wire mesh.', cover_image: 'images/blog/blog-welded-mesh-roll-warehouse.jpg', category: 'Company News', tags: JSON.stringify(['company-news', 'production', 'capacity']), section: 'product-posts', author: 'Kestrel Metal', read_time: '4 min read', status: 'published', is_ai_generated: false, created_at: '2025-04-26T00:00:00.000Z' },
      { id: 408, title: 'The Future of Wire Mesh in Sustainable Infrastructure', slug: 'blog-sustainable-infrastructure', description: 'How wire mesh is shaping greener, more sustainable infrastructure projects across the globe.', cover_image: 'images/blog/blog-sustainable-infrastructure.jpg', category: 'Sustainability', tags: JSON.stringify(['sustainability', 'infrastructure', 'green']), section: 'product-posts', author: 'Kestrel Metal', read_time: '7 min read', status: 'published', is_ai_generated: false, created_at: '2025-10-25T00:00:00.000Z' },
      { id: 409, title: 'Understanding KESTREL WELDED MESH 711-714', slug: 'blog-welded-mesh-711-714', description: 'Technical breakdown of the KESTREL WELDED MESH 711-714 series and its recommended applications.', cover_image: 'images/blog/welded-mesh-711.jpg', category: 'Product', tags: JSON.stringify(['product', 'welded-mesh', '711-714', 'technical']), section: 'product-posts', author: 'Kestrel Metal', read_time: '6 min read', status: 'published', is_ai_generated: false, created_at: '2025-11-10T00:00:00.000Z' },
      { id: 410, title: 'Introducing KESTREL WELDED MESH 715', slug: 'blog-welded-mesh-715', description: 'Meet the latest addition to the KESTREL WELDED MESH family and the features that set it apart.', cover_image: 'images/blog/welded-mesh-715.jpg', category: 'Product', tags: JSON.stringify(['product', 'welded-mesh', '715']), section: 'product-posts', author: 'Kestrel Metal', read_time: '5 min read', status: 'published', is_ai_generated: false, created_at: '2025-12-05T00:00:00.000Z' },
      { id: 411, title: 'Welded Gabion vs. Twisted Gabion Baskets: Which Is Better for Your Project?', slug: 'blog-welded-vs-twisted-gabion', description: 'Understand the strengths of welded versus twisted gabion baskets to choose the right option for your build.', cover_image: 'images/blog/blog-gabion-welded-vs-twisted-hero.jpg', category: 'Guide', tags: JSON.stringify(['guide', 'gabion', 'welded', 'twisted']), section: 'product-posts', author: 'Kestrel Metal', read_time: '8 min read', status: 'published', is_ai_generated: false, created_at: '2025-07-08T00:00:00.000Z' },
    ], 'slug');

    // Seed cases
    mergeCollection('case_studies', [
      { id: 1, title: 'Solar Farm Perimeter Security', slug: 'solar-farm-security', client: 'GreenEnergy Corp', location: 'Australia', category: 'energy', description: 'High-security fencing for a 50MW solar farm', content_md: '# Solar Farm Security Project\n\n## Background\n\nGreenEnergy Corp needed to secure their new 50MW solar farm...\n\n## Solution\n\nWe installed high-security chain link fence with concertina razor wire...\n\n## Results\n\n- 100% perimeter coverage\n- Zero security breaches in 6 months\n- Easy maintenance access', cover_image: 'images/blog/industry-energy.jpg', status: 'published', static_url: 'case-study-solar-farm-perimeter-security.html', created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
      { id: 2, title: 'Cattle Ranch Fencing Solution', slug: 'cattle-ranch-fencing', client: 'Outback Farms', location: 'Queensland, Australia', category: 'agriculture', description: 'Heavy-duty fencing for a 10,000-head cattle ranch', content_md: '# Cattle Ranch Project\n\n## Project Scope\n\nOutback Farms needed to fence 500 acres for their cattle operation...\n\n## Implementation\n\nInstalled heavy-duty ringlock fencing with steel posts...', cover_image: 'images/blog/app-cattle-livestock.png', status: 'published', static_url: 'case-study-cattle-ranch-fencing.html', created_at: new Date(Date.now() - 86400000 * 45).toISOString() },
      { id: 3, title: 'Gabion System Enhances Wastewater Treatment', slug: 'wastewater-treatment', client: 'Municipal Water Authority', location: 'Australia', category: 'water', description: 'Four freestanding gabion walls acting as submerged baffles in a wastewater treatment lagoon upgrade, providing a durable and cost-effective solution for improved treatment efficiency.', content_md: '', cover_image: 'images/case-study-wastewater-treatment.webp', status: 'published', static_url: 'case-study-wastewater-treatment.html', created_at: '2026-01-15T00:00:00.000Z' },
      { id: 4, title: 'Gabion Embankment Strengthens Flood Defence in Roma', slug: 'flood-defence-roma', client: 'Roma Regional Council', location: 'Australia', category: 'flood', description: '162 gabion baskets and 334 rock mattresses supplied for a Stage 2 flood levee project, protecting 51 additional properties from above-floor flooding.', content_md: '', cover_image: 'images/case-flood-defence-roma-hero.webp', status: 'published', static_url: 'case-study-flood-defence-roma.html', created_at: '2026-01-10T00:00:00.000Z' },
      { id: 5, title: 'Mining Operation Vibrating Screen Replacement', slug: 'mining-vibrating-screen', client: 'Copper Range Mining', location: 'Australia', category: 'mining', description: 'Custom-manufactured wedge wire screens and heavy-duty welded mesh panels for a copper mining operation, improving screening efficiency by 35% and extending service life.', content_md: '', cover_image: 'images/blog/welded-wire-mesh-panel.jpg', status: 'published', static_url: 'case-study-mining-vibrating-screen-replacement.html', created_at: '2026-01-05T00:00:00.000Z' },
      { id: 6, title: 'Highway Safety Barrier Installation Project', slug: 'highway-safety-barrier', client: 'State Dept of Transport', location: 'Australia', category: 'infrastructure', description: 'Supply and installation of 3D wire panel fencing and razor wire topping for a 200km highway safety upgrade, meeting AASHTO crash test standards.', content_md: '', cover_image: 'images/blog/airport-fencing.jpg', status: 'published', static_url: 'case-study-highway-safety-barrier.html', created_at: '2025-12-20T00:00:00.000Z' },
      { id: 7, title: 'Petrochemical Plant Security Enclosure', slug: 'petrochemical-plant-security', client: 'Pacific Refineries', location: 'Australia', category: 'oilgas', description: 'High-security fencing for a petrochemical refinery, including welded mesh panels and blast-resistant perimeter barriers meeting ISA security standards.', content_md: '', cover_image: 'images/blog/industry-oilgas.jpg', status: 'published', static_url: 'case-study-petrochemical-plant-security.html', created_at: '2025-12-10T00:00:00.000Z' },
      { id: 8, title: 'Luxury Residential Community Fencing', slug: 'residential-community-fencing', client: 'Prestige Estates', location: 'Australia', category: 'residential', description: 'Decorative powder-coated welded mesh panels, automated gates, and landscape-integrated design for a premium 2,000+ home residential development.', content_md: '', cover_image: 'images/blog/app-residential.png', status: 'published', static_url: 'case-study-residential-community-fencing.html', created_at: '2025-11-28T00:00:00.000Z' },
    ], 'id');

    // Seed FAQ
    setCollection('faqs', [
      { id: 1, question: 'What is the lead time for custom orders?', answer: 'Standard products have a 2-3 week lead time. Custom orders typically require 4-6 weeks depending on specifications and quantity.', category: 'Orders', language: 'en', sort_order: 1, is_active: true },
      { id: 2, question: 'Do you offer free samples?', answer: 'Yes, we offer free samples for our standard products. Please contact our sales team with your requirements.', category: 'Products', language: 'en', sort_order: 2, is_active: true },
      { id: 3, question: 'What are your minimum order quantities?', answer: 'Minimum order quantities vary by product. Standard chain link fence starts from 1 roll, while custom fabricated products may have higher MOQs.', category: 'Orders', language: 'en', sort_order: 3, is_active: true },
      { id: 4, question: 'How do you ensure product quality?', answer: 'All products undergo strict quality testing according to ISO 9001 standards. We provide material test reports and third-party inspection on request.', category: 'Quality', language: 'en', sort_order: 4, is_active: true },
    ]);

    // Seed glossary
    mergeCollection('glossary', [
      { id: 1, term: '3D Wire Panel Fence', definition: 'A security fencing system using V-profile cold-formed welded mesh panels with horizontal ribs for enhanced rigidity. Commonly used for industrial, military, and infrastructure perimeter protection.', category: 'fence', language: 'English', enabled: true },
      { id: 2, term: 'Chain Link Fence', definition: 'Also known as diamond mesh fence or cyclone fence. A woven wire fence made from galvanized or PVC-coated steel wire in a diamond pattern, offering versatility and cost-effectiveness for residential, commercial, and industrial applications.', category: 'fence', language: 'English', enabled: true },
      { id: 3, term: 'Airport Fence (Y-Post Security Fence)', definition: 'A high-security fencing system using Y-profile steel posts and welded mesh panels, designed specifically for airport perimeters and other high-security zones.', category: 'fence', language: 'English', enabled: true },
      { id: 4, term: 'Hinge Joint Fence (Field Fence)', definition: 'A traditional agricultural fence using a "live knot" (hinge joint) connection that provides excellent elasticity and impact resistance. Ideal for boundary fencing and livestock grazing enclosures per ASTM A116.', category: 'fence', language: 'English', enabled: true },
      { id: 5, term: 'S-Knot Fence', definition: 'A specialized fencing product featuring an S-shaped knot that provides smooth, safe surfaces for horse and livestock enclosures.', category: 'fence', language: 'English', enabled: true },
      { id: 6, term: 'Fixed Knot Fence', definition: 'A high-strength agricultural fence with fixed knots that lock horizontal and vertical wires securely, suitable for deer fencing and large animal containment.', category: 'fence', language: 'English', enabled: true },
      { id: 7, term: 'Temporary Fence / Crowd Control Barrier', definition: 'Interlocking steel panels with weighted bases for rapid deployment at construction sites, events, and public gatherings.', category: 'fence', language: 'English', enabled: true },
      { id: 8, term: 'Palisade Fencing', definition: 'A high-security fencing system with vertical steel pales and pointed tops, commonly used for industrial facilities and government installations.', category: 'fence', language: 'English', enabled: true },
      { id: 9, term: 'Welded Mesh Fence', definition: 'A fencing system using pre-fabricated welded wire mesh panels mounted on steel posts, offering quick installation and reliable perimeter security.', category: 'fence', language: 'English', enabled: true },
      { id: 10, term: 'Crimps', definition: 'Special wire deformations that allow the fence to expand and contract due to changing weather conditions. When installing Field Fence, pull the wire so that about half of the curve is pulled out of the wire.', category: 'fence', language: 'English', enabled: true },
      { id: 11, term: 'Graduated Spacing', definition: 'A fence design where vertical wires are spaced closer together at the bottom and gradually increase in spacing toward the top, keeping small animals out without wasting material.', category: 'fence', language: 'English', enabled: true },
      { id: 12, term: 'Welded Wire Mesh', definition: 'A metal grid made by spot-welding intersecting steel wires at right angles. Available in galvanized, PVC-coated, and stainless steel variants for fencing, construction, and industrial screening applications.', category: 'mesh', language: 'English', enabled: true },
      { id: 13, term: 'Hexagonal Wire Netting (Chicken Wire)', definition: 'A lightweight, hexagonal-pattern woven wire mesh, commonly known as chicken wire. Used for poultry enclosures, garden protection, and stucco reinforcement.', category: 'mesh', language: 'English', enabled: true },
      { id: 14, term: 'Window Screen', definition: 'Fine mesh made from stainless steel, fiberglass, or aluminum, designed to allow airflow while preventing insects from entering buildings.', category: 'mesh', language: 'English', enabled: true },
      { id: 15, term: 'V-Profile Welded Mesh Panel', definition: 'A welded mesh panel with V-shaped ribs pressed into the horizontal wires, providing enhanced structural rigidity and anti-climb properties.', category: 'mesh', language: 'English', enabled: true },
      { id: 16, term: 'Wedge Wire Screen', definition: 'A precision-engineered screen with V-shaped wire profiles welded to support rods, used for water intake screening, dewatering, and particle classification.', category: 'mesh', language: 'English', enabled: true },
      { id: 17, term: 'Gabion Mesh', definition: 'Double-twisted hexagonal wire mesh used to create stone-filled baskets (gabions) for retaining walls, erosion control, and slope stabilization.', category: 'mesh', language: 'English', enabled: true },
      { id: 18, term: 'Barbed Wire', definition: 'A type of steel fencing wire with sharp barbs spaced at regular intervals. Available in single twist, double twist, and traditional twist configurations for agricultural and security fencing.', category: 'wire', language: 'English', enabled: true },
      { id: 19, term: 'Razor Wire', definition: 'Also known as barbed tape. A high-security product made of sharp steel blades formed into a helical coil around a core wire. Available in BTO, CBT, and concertina configurations.', category: 'wire', language: 'English', enabled: true },
      { id: 20, term: 'Concertina Razor Wire', definition: 'Razor wire formed into large-diameter coils that expand like a spring, creating an effective physical barrier for military, prison, and border security applications.', category: 'wire', language: 'English', enabled: true },
      { id: 21, term: 'BTC Barbed Tape Concertina (NATO-22)', definition: 'A military-grade razor wire product conforming to NATO-22 (MIL-AA-55522A) standard, featuring fish-hook blade profiles for maximum deterrence.', category: 'wire', language: 'English', enabled: true },
      { id: 22, term: 'Hot-Dip Galvanized (HDG)', definition: 'A corrosion protection process where steel is immersed in molten zinc, forming a metallurgically bonded zinc coating. Provides long-lasting protection per ASTM A123 and ISO 1461 standards.', category: 'material', language: 'English', enabled: true },
      { id: 23, term: 'Electro-Galvanized', definition: 'A zinc coating applied by electroplating, producing a thinner and smoother finish compared to hot-dip galvanizing.', category: 'material', language: 'English', enabled: true },
      { id: 24, term: 'PVC Coating', definition: 'A polyvinyl chloride plastic coating extruded over galvanized wire, providing additional corrosion resistance and color options for outdoor applications.', category: 'material', language: 'English', enabled: true },
      { id: 25, term: 'PE Coating', definition: 'A polyethylene coating applied over galvanized wire for enhanced UV resistance and durability in agricultural and marine environments.', category: 'material', language: 'English', enabled: true },
      { id: 26, term: 'Stainless Steel 304', definition: 'An austenitic stainless steel alloy containing 18% chromium and 8% nickel, offering good corrosion resistance for general-purpose applications.', category: 'material', language: 'English', enabled: true },
      { id: 27, term: 'Stainless Steel 316 / 316L', definition: 'A molybdenum-bearing stainless steel alloy with superior chloride corrosion resistance, ideal for marine, chemical, and pharmaceutical applications.', category: 'material', language: 'English', enabled: true },
      { id: 28, term: 'Powder Coating', definition: 'A dry finishing process where electrostatically charged powder is sprayed onto a surface and cured under heat, providing a durable and uniform protective layer.', category: 'material', language: 'English', enabled: true },
      { id: 29, term: 'Copper Alloy', definition: 'A metal alloy (typically copper-zinc or copper-nickel) with natural anti-fouling properties, used in premium aquaculture mesh applications.', category: 'material', language: 'English', enabled: true },
      { id: 30, term: 'Carbon Steel (Low Carbon Steel)', definition: 'A steel alloy with low carbon content (typically at most 0.22%), offering good weldability and formability for wire mesh and fencing products.', category: 'material', language: 'English', enabled: true },
      { id: 31, term: 'Low Carbon Wire', definition: 'A type of wire that is thicker and more cost-effective, bending and flexing easily. Low carbon wire is ideal for temporary fencing or less demanding applications where flexibility is preferred over strength.', category: 'material', language: 'English', enabled: true },
      { id: 32, term: 'High Tensile Wire', definition: 'A type of steel wire that is thin but strong and lightweight, with excellent tensile strength. Unlike low carbon wire, high tensile wire won\'t stretch out over time, making it ideal for permanent, long-lasting fence installations.', category: 'material', language: 'English', enabled: true },
      { id: 33, term: 'Galvanization', definition: 'A corrosion protection process that coats steel with zinc to defend against rust. This protective layer helps reduce exposure to humidity, salt air, and other corrosive chemicals, extending the life of the fence.', category: 'material', language: 'English', enabled: true },
      { id: 34, term: 'Wire Diameter', definition: 'The thickness of individual wires in a mesh or fence product, measured in millimeters (mm) or gauge (ga). A key parameter determining product strength and weight.', category: 'spec', language: 'English', enabled: true },
      { id: 35, term: 'Mesh Size / Aperture', definition: 'The distance between adjacent parallel wires in a mesh, measured from center to center. Determines the mesh\'s filtering, screening, or containment capability.', category: 'spec', language: 'English', enabled: true },
      { id: 36, term: 'Mesh Count', definition: 'The number of openings per linear inch or per square inch. Higher mesh counts indicate finer mesh with smaller openings.', category: 'spec', language: 'English', enabled: true },
      { id: 37, term: 'Tensile Strength', definition: 'The maximum stress a material can withstand while being stretched before breaking, measured in MPa or psi. Critical for fencing and structural applications.', category: 'spec', language: 'English', enabled: true },
      { id: 38, term: 'Zinc Coating Weight', definition: 'The mass of zinc coating per unit area (g/m²), indicating the thickness and quality of galvanized protection. Higher values provide longer corrosion life.', category: 'spec', language: 'English', enabled: true },
      { id: 39, term: 'Porosity', definition: 'The percentage of open area in a mesh or porous material, determining flow rate and screening capability.', category: 'spec', language: 'English', enabled: true },
      { id: 40, term: 'Filtration Rating', definition: 'The nominal or absolute particle size (in microns) that a filter element can reliably capture, indicating filtration precision.', category: 'spec', language: 'English', enabled: true },
      { id: 41, term: 'Burst Pressure', definition: 'The maximum pressure differential a filter element can withstand before structural failure, a critical safety parameter for pressurized systems.', category: 'spec', language: 'English', enabled: true },
      { id: 42, term: 'Gauge', definition: 'The thickness of the wire. The higher the number, the smaller/thinner the wire. Low gauge refers to thicker wire, while high gauge wire refers to lighter weight wire.', category: 'spec', language: 'English', enabled: true },
      { id: 43, term: 'Loop Cap', definition: 'A metal fitting used to connect the top rail to line posts in chain link fence systems, providing a secure and clean connection point.', category: 'fitting', language: 'English', enabled: true },
      { id: 44, term: 'Tension Band', definition: 'A galvanized steel band wrapped around terminal posts to distribute tension forces from the fence fabric evenly.', category: 'fitting', language: 'English', enabled: true },
      { id: 45, term: 'Tension Bar', definition: 'A vertical bar woven through the chain link mesh end and attached to tension bands, used to stretch and secure the fence fabric.', category: 'fitting', language: 'English', enabled: true },
      { id: 46, term: 'Barb Arm', definition: 'A metal bracket attached to fence posts for mounting barbed wire strands above the main fence line.', category: 'fitting', language: 'English', enabled: true },
      { id: 47, term: 'End Post / Terminal Post', definition: 'A heavy-duty post installed at fence ends, corners, and gates, designed to withstand the full tension load of the fence fabric.', category: 'fitting', language: 'English', enabled: true },
      { id: 48, term: 'Line Post', definition: 'An intermediate post installed between terminal posts to support the fence fabric at regular intervals.', category: 'fitting', language: 'English', enabled: true },
      { id: 49, term: 'Corner Post', definition: 'A post installed at fence corners, typically braced to resist directional tension forces from both adjacent fence runs.', category: 'fitting', language: 'English', enabled: true },
      { id: 50, term: 'Hog Rings', definition: 'Metal rings used to secure chain link fabric to the fence frame, providing a quick and reliable attachment method.', category: 'fitting', language: 'English', enabled: true },
      { id: 51, term: 'Turnbuckle', definition: 'A threaded tensioning device used to adjust and maintain wire tension in fence systems.', category: 'fitting', language: 'English', enabled: true },
      { id: 52, term: 'Post Cap / Dome Cap', definition: 'A decorative and protective cover fitted to the top of fence posts to prevent water ingress.', category: 'fitting', language: 'English', enabled: true },
      { id: 53, term: 'Pull Out', definition: 'The distance between the last vertical wire and the next post, typically ranging from 6 to 16 inches. This spacing allows the fence to be stretched tight and secured properly to the post.', category: 'fitting', language: 'English', enabled: true },
      { id: 54, term: 'MIG & TIG Welding', definition: 'Metal Inert Gas and Tungsten Inert Gas welding processes used to join metal components with high precision and structural integrity.', category: 'process', language: 'English', enabled: true },
      { id: 55, term: 'Wire Drawing', definition: 'A metalworking process that reduces wire diameter by pulling the wire through a series of progressively smaller dies.', category: 'process', language: 'English', enabled: true },
      { id: 56, term: 'Hot-Dip Galvanizing', definition: 'The process of dipping fabricated steel products into a bath of molten zinc (typically 450°C) to form a corrosion-resistant zinc-iron alloy coating.', category: 'process', language: 'English', enabled: true },
      { id: 57, term: 'PVC Extrusion Coating', definition: 'A process where molten PVC is extruded over galvanized wire through a die, forming a uniform plastic coating that bonds to the zinc surface.', category: 'process', language: 'English', enabled: true },
      { id: 58, term: 'Sintering', definition: 'A high-temperature process that bonds metal particles or wire mesh layers together through diffusion, creating porous materials with controlled permeability.', category: 'process', language: 'English', enabled: true },
      { id: 59, term: 'CNC Cutting', definition: 'Computer Numerical Controlled cutting using laser, plasma, or waterjet technology for precise metal component fabrication.', category: 'process', language: 'English', enabled: true },
      { id: 60, term: 'Passivation', definition: 'A chemical treatment for stainless steel that removes free iron from the surface and enhances the natural chromium oxide layer for improved corrosion resistance.', category: 'process', language: 'English', enabled: true },
      { id: 61, term: 'Powder Coating Process', definition: 'An electrostatic spray finishing process where dry powder is applied to a grounded metal surface and cured in an oven to form a hard, durable finish.', category: 'process', language: 'English', enabled: true },
      { id: 62, term: 'ASTM A123', definition: 'Standard specification for zinc (hot-dip galvanized) coatings on iron and steel products.', category: 'standard', language: 'English', enabled: true },
      { id: 63, term: 'ASTM A116', definition: 'Standard specification for steel wire, zinc-coated (galvanized), for agricultural field fence.', category: 'standard', language: 'English', enabled: true },
      { id: 64, term: 'BS EN 10244-2', definition: 'British/European standard for zinc or zinc alloy coatings on steel wire.', category: 'standard', language: 'English', enabled: true },
      { id: 65, term: 'ISO 9001', definition: 'International standard for quality management systems, certifying consistent manufacturing and quality control processes.', category: 'standard', language: 'English', enabled: true },
      { id: 66, term: 'ISO 1461', definition: 'International standard for hot dip galvanized coatings on fabricated iron and steel articles.', category: 'standard', language: 'English', enabled: true },
      { id: 67, term: 'NATO-22 (MIL-AA-55522A)', definition: 'North Atlantic Treaty Organization military specification for barbed tape concertina, defining blade dimensions and performance requirements.', category: 'standard', language: 'English', enabled: true },
    ], 'id');

    // Seed inquiries (only if empty - never overwrite frontend submissions)
    if (getCollection('inquiries').length === 0) {
      setCollection('inquiries', [
      { id: 1, name: 'John Smith', email: 'john@farm.com', phone: '+61 400 000 000', company: 'Farm Operations Pty Ltd', country: 'Australia', product_name: 'Galvanized Chain Link Fence', quantity: '50 rolls', status: 'pending', message: 'We need quotes for a large cattle ranch fencing project. Please contact me with pricing and availability.', source_page: '/contact.html', created_at: new Date(Date.now() - 86400000 * 2).toISOString(), replies: [] },
      { id: 2, name: 'Maria Garcia', email: 'maria@construction.com', phone: '+34 600 000 000', company: 'Construccion Hispana', country: 'Spain', product_name: 'Gabion Box 1x1x1m', quantity: '500 pcs', status: 'replied', message: 'Interested in gabion boxes for a river bank stabilization project.', source_page: '/contact.html', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), replies: [{ admin: { username: 'admin' }, content: 'Dear Maria, Thank you for your inquiry. We can supply 500 gabion boxes with 3-4 week lead time. Please find attached our quotation...', created_at: new Date(Date.now() - 86400000 * 4).toISOString() }], replied_at: new Date(Date.now() - 86400000 * 4).toISOString() },
      { id: 3, name: 'Chen Wei', email: 'chen@security.cn', phone: '+86 100 0000 0000', company: 'Beijing Security Co.', country: 'China', product_name: 'Concertina Razor Wire', quantity: '200 coils', status: 'pending', message: 'Looking for high-security razor wire for a prison perimeter project.', source_page: '/request-quote.html', created_at: new Date(Date.now() - 86400000 * 1).toISOString(), replies: [] },
    ]);
    }

    // Seed analytics
    setStorage('analytics_summary', {
      totals: { pageviews: 45000, visitors: 12500, conversions: 85 },
      today: { pageviews: 280, visitors: 95 },
      weekly: { pageviews: 3200, visitors: 890, avgDuration: 180, bounceRate: 45 },
      monthly: { pageviews: 14500, visitors: 4200 },
      topPages: [
        { url: '/index.html', count: 12500 },
        { url: '/products.html', count: 8200 },
        { url: '/blog.html', count: 6800 },
        { url: '/contact.html', count: 4500 },
        { url: '/chain-link.html', count: 3200 },
        { url: '/gabion-boxes.html', count: 2800 },
        { url: '/welded-mesh-711.html', count: 2100 },
        { url: '/faq.html', count: 1800 },
        { url: '/case-studies.html', count: 1500 },
        { url: '/downloads.html', count: 1200 },
      ],
      topCountries: [
        { country: 'US', count: 4200 },
        { country: 'AU', count: 3100 },
        { country: 'GB', count: 2400 },
        { country: 'DE', count: 1800 },
        { country: 'CN', count: 1500 },
        { country: 'CA', count: 1200 },
        { country: 'FR', count: 900 },
        { country: 'Brazil', count: 650 },
      ]
    });

    // Seed i18n translations
    setCollection('i18n', [
      { id: 1, module: 'header', key: 'nav.products', en: 'Products', zh: '产品', is_active: true },
      { id: 2, module: 'header', key: 'nav.about', en: 'About Us', zh: '关于我们', is_active: true },
      { id: 3, module: 'header', key: 'nav.contact', en: 'Contact', zh: '联系我们', is_active: true },
      { id: 4, module: 'common', key: 'btn.inquire', en: 'Request a Quote', zh: '询价', is_active: true },
      { id: 5, module: 'common', key: 'btn.download', en: 'Download', zh: '下载', is_active: true },
    ]);

    // Seed SEO data
    setCollection('seo', [
      { id: 1, page_url: '/index.html', title: 'Kestrel Metal - Premium Metal Mesh & Fencing Solutions', meta_title: 'Kestrel Metal | Professional Metal Mesh & Fencing Manufacturer', meta_description: 'Premium metal mesh, chain link fence, gabion boxes and wire mesh solutions for global B2B customers.', meta_keywords: 'metal mesh, chain link fence, gabion, wire mesh, fencing manufacturer', og_image: '/images/og-default.jpg', canonical_url: 'https://kestrelmetal.com/', noindex: false },
      { id: 2, page_url: '/products.html', title: 'Products | Kestrel Metal', meta_title: 'Metal Mesh Products | Kestrel Metal', meta_description: 'Explore our complete range of metal mesh and fencing products.', meta_keywords: 'metal mesh products, chain link, welded mesh, gabion', canonical_url: 'https://kestrelmetal.com/products.html', noindex: false },
      { id: 3, page_url: '/contact.html', title: 'Contact Us | Kestrel Metal', meta_title: 'Contact Kestrel Metal for Quotes & Support', meta_description: 'Get in touch with Kestrel Metal for product quotes, technical support, and partnership opportunities.', noindex: false },
    ]);

    // Seed GEO data
    setCollection('geo_questions', [
      { id: 1, question: 'What is the difference between welded and woven wire mesh?', answer: 'Welded wire mesh has wires welded at intersections, while woven wire mesh has wires intertwined. Welded mesh offers higher structural strength, making it ideal for construction applications, while woven mesh is more flexible and better suited for fencing.', category: 'Product Knowledge', language: 'en', priority: 1, is_active: true },
      { id: 2, question: 'How do I choose the right fence height?', answer: 'The appropriate fence height depends on your application. For residential privacy, 1.8-2.0m is typical. For agricultural livestock, heights range from 1.2-2.4m. High-security applications may require 2.4m or taller with razor wire additions.', category: 'Installation Guide', language: 'en', priority: 2, is_active: true },
    ]);

    setCollection('geo_templates', [
      { id: 1, type: 'Product', name: 'Standard Product Schema', jsonld_template: '{"@context":"https://schema.org","@type":"Product","name":"{product_name}","description":"{description}","image":"{image}","offers":{"@type":"Offer","priceCurrency":"USD","price":"{price}","availability":"https://schema.org/InStock"}}', is_active: true },
      { id: 2, type: 'FAQPage', name: 'FAQ Page Schema', jsonld_template: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"{question}","acceptedAnswer":{"@type":"Answer","text":"{answer}"}}]}', is_active: true },
      { id: 3, type: 'Article', name: 'Blog Article Schema', jsonld_template: '{"@context":"https://schema.org","@type":"Article","headline":"{title}","description":"{description}","image":"{image}","datePublished":"{date}","author":{"@type":"Organization","name":"Kestrel Metal"}}', is_active: true },
    ]);

    setCollection('geo_scores', [
      { page_url: '/chain-link.html', score: 85, schema_completeness: 95, citation_friendliness: 80, fact_density: 82 },
      { page_url: '/gabion-boxes.html', score: 78, schema_completeness: 88, citation_friendliness: 75, fact_density: 72 },
      { page_url: '/welded-mesh-711.html', score: 65, schema_completeness: 70, citation_friendliness: 60, fact_density: 68 },
    ]);

    // Seed media
    setCollection('media', [
      { id: 1, name: 'chain-link-galvanized.webp', url: '/images/chain-link-galvanized.webp', size: 245000 },
      { id: 2, name: 'welded-mesh-711.webp', url: '/images/welded-mesh-711.webp', size: 198000 },
      { id: 3, name: 'gabion-mattress.webp', url: '/images/gabion-mattress.webp', size: 312000 },
      { id: 4, name: 'btc-razor-wire.webp', url: '/images/btc-razor-wire.webp', size: 175000 },
      { id: 5, name: 'hexagonal-wire.webp', url: '/images/hexagonal-wire.webp', size: 156000 },
    ]);

    // Seed settings
    setStorage('site_settings', {
      site_name: 'Kestrel Metal',
      site_email: 'sales@kestrelmetal.com',
      site_phone: '+86 178 3238 3339',
      site_address: 'Sydney, Australia',
      site_description: 'Professional metal mesh and fencing manufacturer serving global B2B customers.',
      social_facebook: 'https://facebook.com/kestrelmetal',
      social_twitter: 'https://twitter.com/kestrelmetal',
      social_linkedin: 'https://linkedin.com/company/kestrelmetal',
      ga4_measurement_id: 'G-Q5WHY8L8BN',
      umami_website_id: 'a7ba74c4-ee31-414b-8a9c-2fa239ae7557',
      umami_domain: 'https://cloud.umami.is',
    });

    // Seed admin user
    setStorage('admin_users', [
      { id: 1, username: 'admin', email: 'admin@kestrelmetal.com', password: 'admin123', role: 'admin', created_at: new Date().toISOString(), last_login_at: null }
    ]);

    // Seed content drafts
    if (!getCollection('content_drafts').length) {
      setCollection('content_drafts', [
        { id: 1, title: 'How to Choose the Right Wire Mesh for Industrial Applications', keyword: 'industrial wire mesh', slug: 'how-to-choose-industrial-wire-mesh', status: 'queued', score: null, createdAt: new Date().toISOString(), html: '<h1>How to Choose the Right Wire Mesh for Industrial Applications</h1><p>Industrial wire mesh selection depends on material, aperture, wire diameter, and operating conditions.</p><h2>Key Selection Factors</h2><p>Consider corrosion resistance, tensile strength, opening size, and installation requirements before specifying a product.</p>' }
      ]);
    }

    // Seed operation logs
    setCollection('admin_logs', [ 
      { id: 1, admin_id: 1, action: 'login', resource_type: 'admin', resource_id: 1, ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, admin_id: 1, action: 'create', resource_type: 'product', resource_id: 1, ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 3, admin_id: 1, action: 'update', resource_type: 'blog', resource_id: 1, ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    ]);

    setStorage('seeded', true);
  }

  // Run seed
  seedData();

  // ==================== API Methods ====================

  // Auth
  async function login(username, password) {
    await delay();
    const users = getStorage('admin_users') || [];
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('用户名或密码错误');
    const token = 'mock_token_' + generateId();
    setToken(token);
    const userData = { id: user.id, username: user.username, email: user.email, role: user.role };
    setUser(userData);
    return { token, user: userData };
  }

  async function getMe() {
    await delay();
    const user = getUser();
    if (!user) throw new Error('未登录');
    return user;
  }

  async function changePassword(current_password, new_password) {
    await delay();
    API.toast('密码修改功能在纯静态模式下不可用，请升级到完整后端', 'info');
    return { message: '功能开发中' };
  }

  // Generic CRUD
  async function getAll(collection) {
    await delay();
    return getCollection(collection);
  }

  async function getById(collection, id) {
    await delay();
    const items = getCollection(collection);
    return items.find(item => item.id == id) || null;
  }

  async function create(collection, data) {
    await delay();
    const items = getCollection(collection);
    const newItem = { ...data, id: generateId(), created_at: new Date().toISOString() };
    items.push(newItem);
    setCollection(collection, items);
    return newItem;
  }

  async function update(collection, id, data) {
    await delay();
    const items = getCollection(collection);
    const index = items.findIndex(item => item.id == id);
    if (index === -1) throw new Error('数据不存在');
    items[index] = { ...items[index], ...data, id: items[index].id };
    setCollection(collection, items);
    return items[index];
  }

  async function remove(collection, id) {
    await delay();
    const items = getCollection(collection);
    const filtered = items.filter(item => item.id != id);
    setCollection(collection, filtered);
    return { message: '删除成功' };
  }

  // Pagination helper
  async function getPaginated(collection, page = 1, pageSize = 20, search = '', filters = {}) {
    await delay();
    let items = getCollection(collection);

    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item =>
        Object.values(item).some(val =>
          typeof val === 'string' && val.toLowerCase().includes(searchLower)
        )
      );
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        items = items.filter(item => item[key] == value || item[key]?.toString().toLowerCase() === value.toString().toLowerCase());
      }
    }

    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize);

    return { data, page, totalPages, total };
  }

  // Router
  async function handleRequest(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;
    const urlObj = new URL(url, window.location.origin);
    const path = urlObj.pathname;
    const params = new URLSearchParams(urlObj.search);
    const segments = path.split('/').filter(Boolean);

    // Dashboard
    if (segments[0] === 'api' && segments[1] === 'dashboard' && segments[2] === 'summary') {
      const tracked = getStorage('analytics_data') || {};
      const trackedLog = getStorage('visitor_log') || [];
      const inquiries = getCollection('inquiries');
      const products = getCollection('products');
      const posts = getCollection('blog_posts');
      const today = new Date();
      const todayStr = today.toDateString();
      const todayInquiries = inquiries.filter(i => new Date(i.created_at).toDateString() === todayStr).length;

      const realToday = tracked.today || {};
      const realDaily = (tracked.dailyHistory || {});
      let totalPageviews = tracked.pageviews || 0;
      let totalVisitors = 0;
      const seenVisitors = {};
      for (let i = 0; i < trackedLog.length; i++) {
        if (trackedLog[i] && trackedLog[i].id && !seenVisitors[trackedLog[i].id]) {
          seenVisitors[trackedLog[i].id] = true;
          totalVisitors++;
        }
      }

      return {
        today: {
          pageviews: (realToday.date === todayStr) ? (realToday.pageviews || 0) : 0,
          visitors: (realToday.date === todayStr) ? (realToday.visitors || 0) : 0,
          inquiries: todayInquiries
        },
        total: {
          pageviews: totalPageviews,
          visitors: totalVisitors,
          inquiries: inquiries.length,
          products: products.filter(p => p.is_active).length,
          blogPosts: posts.filter(p => p.status === 'published').length
        },
        weekly: {
          avgDuration: tracked.weekly ? (tracked.weekly.avgDuration || 0) : 0,
          bounceRate: tracked.weekly ? (tracked.weekly.bounceRate || 0) : 0
        },
        topPages: tracked.topPages || {},
        dailyHistory: realDaily
      };
    }

    // Products
    if (segments[0] === 'api' && segments[1] === 'products') {
      const id = segments[3];
      if (segments[2] === 'admin' && segments[3] === 'list') {
        const page = parseInt(params.get('page') || '1');
        const pageSize = parseInt(params.get('pageSize') || '20');
        const search = params.get('search') || '';
        const category_id = params.get('category_id') || '';
        return getPaginated('products', page, pageSize, search, category_id ? { category_id } : {});
      }
      if (id && method === 'PUT') return update('products', id, body);
      if (id && method === 'DELETE') return remove('products', id);
      if (id) return getById('products', id);
      if (method === 'POST') return create('products', body);
      return getCollection('products');
    }

    // Product Categories
    if (segments[0] === 'api' && segments[1] === 'product-categories') {
      const id = segments[3];
      if (segments[2] === 'all') return getCollection('product_categories');
      if (id && method === 'PUT') return update('product_categories', id, body);
      if (id && method === 'DELETE') return remove('product_categories', id);
      if (id) return getById('product_categories', id);
      if (method === 'POST') return create('product_categories', body);
      return getCollection('product_categories');
    }

    // Blog
    if (segments[0] === 'api' && segments[1] === 'blog') {
      const id = segments[2];
      if (segments[2] === 'ai-publish') {
        API.toast('AI 发布请求已提交（纯静态模式）', 'success');
        return { message: '已提交' };
      }
      if (id && method === 'PUT') return update('blog_posts', id, body);
      if (id && method === 'DELETE') return remove('blog_posts', id);
      if (id) return getById('blog_posts', id);
      const page = parseInt(params.get('page') || '1');
      const pageSize = parseInt(params.get('pageSize') || '20');
      const search = params.get('search') || '';
      const status = params.get('status') || '';
      return getPaginated('blog_posts', page, pageSize, search, status ? { status } : {});
    }

    // Cases
    if (segments[0] === 'api' && segments[1] === 'cases') {
      const id = segments[2];
      if (id && method === 'PUT') return update('case_studies', id, body);
      if (id && method === 'DELETE') return remove('case_studies', id);
      if (id) return getById('case_studies', id);
      if (method === 'POST') return create('case_studies', body);
      const page = parseInt(params.get('page') || '1');
      const pageSize = parseInt(params.get('pageSize') || '20');
      const search = params.get('search') || '';
      const status = params.get('status') || '';
      return getPaginated('case_studies', page, pageSize, search, status ? { status } : {});
    }

    // FAQ
    if (segments[0] === 'api' && segments[1] === 'faq') {
      const id = segments[2];
      if (segments[2] === 'all') return getCollection('faqs');
      if (id && method === 'PUT') return update('faqs', id, body);
      if (id && method === 'DELETE') return remove('faqs', id);
      if (id) return getById('faqs', id);
      if (method === 'POST') return create('faqs', body);
      return getCollection('faqs');
    }

    // Glossary
    if (segments[0] === 'api' && segments[1] === 'glossary') {
      const id = segments[2];
      if (segments[2] === 'all') return getCollection('glossary');
      if (id && method === 'PUT') return update('glossary', id, body);
      if (id && method === 'DELETE') return remove('glossary', id);
      if (id) return getById('glossary', id);
      if (method === 'POST') return create('glossary', body);
      return getCollection('glossary');
    }

    // Inquiries
    if (segments[0] === 'api' && segments[1] === 'inquiries') {
      if (segments[2] === 'stats' && segments[3] === 'count') {
        const inquiries = getCollection('inquiries');
        return { pending: inquiries.filter(i => i.status === 'pending').length };
      }
      if (segments[2] === 'export' && segments[3] === 'csv') {
        API.toast('CSV 导出在纯静态模式下生成模拟数据', 'info');
        const inquiries = getCollection('inquiries');
        let csv = 'ID,Name,Email,Company,Country,Product,Quantity,Status,Created At\n';
        inquiries.forEach(i => {
          csv += `${i.id},${i.name},${i.email},${i.company},${i.country},${i.product_name},${i.quantity},${i.status},${i.created_at}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inquiries.csv';
        a.click();
        URL.revokeObjectURL(url);
        return { message: '导出成功' };
      }
      const id = segments[2];
      if (id && segments[3] === 'replies' && method === 'POST') {
        const inquiries = getCollection('inquiries');
        const index = inquiries.findIndex(i => i.id == id);
        if (index === -1) throw new Error('询盘不存在');
        if (!inquiries[index].replies) inquiries[index].replies = [];
        inquiries[index].replies.push({
          admin: { username: 'admin' },
          content: body.content,
          created_at: new Date().toISOString()
        });
        inquiries[index].status = 'replied';
        inquiries[index].replied_at = new Date().toISOString();
        setCollection('inquiries', inquiries);
        return inquiries[index];
      }
      if (id && method === 'PUT') return update('inquiries', id, body);
      if (id && method === 'DELETE') return remove('inquiries', id);
      if (id) return getById('inquiries', id);
      const page = parseInt(params.get('page') || '1');
      const pageSize = parseInt(params.get('pageSize') || '20');
      const search = params.get('search') || '';
      const status = params.get('status') || '';
      return getPaginated('inquiries', page, pageSize, search, status ? { status } : {});
    }

    // Analytics
    if (segments[0] === 'api' && segments[1] === 'analytics') {
      if (segments[2] === 'summary') return getStorage('analytics_summary') || {};
      if (segments[2] === 'pageviews' || segments[2] === 'visitors') {
        const days = parseInt(params.get('days') || '30');
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(Date.now() - i * 86400000);
          data.push({
            date: date.toISOString().split('T')[0],
            count: Math.floor(Math.random() * 1000) + 200
          });
        }
        return data;
      }
      if (segments[2] === 'events') {
        return [
          { event_type: 'inquiry_submitted', page_url: '/contact.html', created_at: new Date(Date.now() - 3600000).toISOString() },
          { event_type: 'download', page_url: '/downloads.html', created_at: new Date(Date.now() - 7200000).toISOString() },
          { event_type: 'click', page_url: '/products.html', created_at: new Date(Date.now() - 10800000).toISOString() },
          { event_type: 'inquiry_submitted', page_url: '/request-quote.html', created_at: new Date(Date.now() - 14400000).toISOString() },
          { event_type: 'download', page_url: '/catalogs.html', created_at: new Date(Date.now() - 18000000).toISOString() },
        ];
      }
    }

    // i18n
    if (segments[0] === 'api' && segments[1] === 'i18n') {
      const id = segments[2];
      if (segments[2] === 'all') return getCollection('i18n');
      if (id && method === 'PUT') return update('i18n', id, body);
      if (id && method === 'DELETE') return remove('i18n', id);
      if (id) return getById('i18n', id);
      if (method === 'POST') return create('i18n', body);
      return getCollection('i18n');
    }

    // SEO
    if (segments[0] === 'api' && segments[1] === 'seo') {
      const id = segments[2];
      if (segments[2] === 'generate' && segments[3] === 'sitemap') {
        const pages = getCollection('seo');
        API.toast('Sitemap 生成完成（共 ' + pages.length + ' 个页面）', 'success');
        return { file_count: pages.length };
      }
      if (id && method === 'PUT') return update('seo', id, body);
      if (id && method === 'DELETE') return remove('seo', id);
      if (id) return getById('seo', id);
      if (method === 'POST') return create('seo', body);
      return getCollection('seo');
    }

    // GEO
    if (segments[0] === 'api' && segments[1] === 'geo') {
      if (segments[2] === 'questions') {
        const id = segments[3];
        if (id && method === 'PUT') return update('geo_questions', id, body);
        if (id && method === 'DELETE') return remove('geo_questions', id);
        if (id) return getById('geo_questions', id);
        if (method === 'POST') return create('geo_questions', body);
        return getCollection('geo_questions');
      }
      if (segments[2] === 'schema-templates') {
        const id = segments[3];
        if (id && method === 'PUT') return update('geo_templates', id, body);
        if (id && method === 'DELETE') return remove('geo_templates', id);
        if (id) return getById('geo_templates', id);
        if (method === 'POST') return create('geo_templates', body);
        return getCollection('geo_templates');
      }
      if (segments[2] === 'scores') {
        const url = segments[3];
        if (url && segments[4] === 'generate') {
          const scores = getCollection('geo_scores');
          const score = Math.floor(Math.random() * 30) + 65;
          return { score, message: '评分完成' };
        }
        return getCollection('geo_scores');
      }
    }

    // Media
    if (segments[0] === 'api' && segments[1] === 'media') {
      if (segments[2] === 'upload') {
        API.toast('上传成功（模拟）', 'success');
        return { id: generateId(), name: 'uploaded_file.png', url: '/images/uploaded.png', size: 125000 };
      }
      const id = segments[2];
      if (id && method === 'DELETE') return remove('media', id);
      if (id) return getById('media', id);
      return getCollection('media');
    }

    // Content (AI-generated drafts)
    if (segments[0] === 'api' && segments[1] === 'content') {
      if (segments[2] === 'drafts') {
        const slug = segments[3];
        if (slug) {
          const drafts = getCollection('content_drafts');
          return drafts.find(d => d.slug === slug) || null;
        }
        return { drafts: getCollection('content_drafts') };
      }
      if (segments[2] === 'published') {
        const drafts = getCollection('content_drafts').filter(d => d.status === 'published');
        return { published: drafts };
      }
      throw new Error('未知的内容 API 路径');
    }

    // Trigger generation
    if (segments[0] === 'api' && segments[1] === 'trigger' && segments[2] === 'generate') {
      const drafts = getCollection('content_drafts');
      const newDraft = {
        id: generateId(),
        title: 'AI Generated Article - ' + new Date().toLocaleDateString(),
        keyword: 'wire mesh fencing',
        slug: 'ai-draft-' + Date.now(),
        status: 'queued',
        score: null,
        createdAt: new Date().toISOString(),
        html: '<h1>Draft Pending Generation</h1><p>This article is queued for AI generation.</p>'
      };
      drafts.unshift(newDraft);
      setCollection('content_drafts', drafts);
      return { message: '生成任务已触发', draft: newDraft };
    }

    // Settings
    if (segments[0] === 'api' && segments[1] === 'settings') {
      if (segments[2] === 'admins') {
        const id = segments[3];
        if (id && method === 'PUT') {
          const users = getStorage('admin_users') || [];
          const index = users.findIndex(u => u.id == id);
          if (index === -1) throw new Error('管理员不存在');
          users[index] = { ...users[index], ...body, id: users[index].id };
          setStorage('admin_users', users);
          return users[index];
        }
        if (id && method === 'DELETE') {
          let users = getStorage('admin_users') || [];
          users = users.filter(u => u.id != id);
          setStorage('admin_users', users);
          return { message: '删除成功' };
        }
        if (id) {
          const users = getStorage('admin_users') || [];
          return users.find(u => u.id == id) || null;
        }
        if (method === 'POST') {
          const users = getStorage('admin_users') || [];
          const newUser = { ...body, id: generateId(), created_at: new Date().toISOString() };
          users.push(newUser);
          setStorage('admin_users', users);
          return newUser;
        }
        return getStorage('admin_users') || [];
      }
      if (segments[2] === 'logs') {
        return getCollection('admin_logs');
      }
      const settings = getStorage('site_settings') || {};
      if (method === 'PUT') {
        setStorage('site_settings', { ...settings, ...body });
        return { ...settings, ...body };
      }
      return settings;
    }

    throw new Error('未知的 API 路径: ' + path);
  }

  // Toast
  function toast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // Upload
  async function upload(url, formData) {
    await delay();
    toast('文件上传成功（模拟）', 'success');
    return { id: generateId(), name: 'uploaded_file', url: '/images/uploaded.png', size: 100000 };
  }

  return {
    // Auth
    login,
    getMe,
    changePassword,

    // Token & User
    getToken, setToken, getUser, setUser, isLoggedIn, logout,

    // Generic
    get: (url) => handleRequest(url),
    post: (url, body) => handleRequest(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => handleRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => handleRequest(url, { method: 'DELETE' }),
    patch: (url, body) => handleRequest(url, { method: 'PATCH', body: JSON.stringify(body) }),

    // Upload
    upload,

    // Toast
    toast
  };
})();
