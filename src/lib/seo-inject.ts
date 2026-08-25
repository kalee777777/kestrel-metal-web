const DOMAIN = 'https://www.kestrelmetal.com';
const DEFAULT_IMAGE = `${DOMAIN}/images/og-default.jpg`;

const PAGE_KEYWORDS: Record<string, string> = {
  '/galvanized-chain-link.html': 'galvanized chain link fence, chain link fence wholesale, ASTM A392 fence, hot-dip galvanized fence, wire mesh fencing supplier',
  '/chain-link-fittings.html': 'chain link fence fittings, fence accessories, tension bars, fence bands, hog rings, post caps, chain link hardware supplier',
  '/gabion-boxes.html': 'gabion boxes manufacturer, welded gabion box, erosion control gabion, flood defense gabion, retaining wall gabion, gabion supplier China',
  '/razor-wire-long-blade.html': 'CBT-65 razor wire, long blade concertina wire, military razor wire, prison security wire, high security razor wire supplier',
  '/razor-wire-cross.html': 'CBT-60 concertina razor wire, cross blade razor wire, perimeter security wire, razor wire coil supplier',
  '/razor-wire-single-coil.html': 'single coil razor wire, razor wire barrier, temporary security fence, razor wire roll supplier',
  '/razor-wire-welded-mesh.html': 'razor wire welded mesh, razor wire fence panel, security mesh fence, anti-climb razor mesh supplier',
  '/razor-wire-straight.html': 'straight razor wire, flat barb wire, security topping wire, razor wire straight line supplier',
  '/razor-wire-flat-wrap.html': 'flat wrap razor wire, wall top security wire, fence topping razor wire, flat coil razor wire supplier',
  '/razor-wire-fish-hook.html': 'fish hook razor wire, anti-climb security wire, wall spike alternative, fish hook barbed wire supplier',
  '/razor-wire-btc.html': 'BTC-65 razor wire, blade tape concertina, military grade razor wire, border security wire supplier',
  '/welded-wire-mesh.html': 'welded wire mesh supplier, wire mesh panel, wire mesh roll, construction mesh, fencing mesh supplier China',
  '/welded-wire-mesh-panel.html': 'welded wire mesh panel, galvanized mesh panel, PVC coated mesh panel, construction reinforcement mesh, security fence panel',
  '/welded-wire-mesh-roll.html': 'welded wire mesh roll, galvanized wire mesh roll, fencing roll, agricultural mesh roll, welded mesh supplier',
  '/chain-link.html': 'chain link fence, wire mesh fence, chain link fencing supplier, galvanized fence, security fence manufacturer China',
  '/chain-link-security-fence.html': 'chain link security fence, anti-climb fence, perimeter security fence, high security chain link, prison fence supplier',
  '/pvc-coated-chain-link.html': 'PVC coated chain link fence, vinyl coated fence, green chain link fence, decorative fence, color coated wire mesh supplier',
  '/358-security-fence.html': '358 security fence, anti-climb mesh fence, prison fence, high security welded mesh, small mesh fence supplier',
  '/fence-3d.html': '3D welded wire fence, v-mesh fence, security fence panel, anti-climb fence, decorative security fence supplier',
  '/fence-security.html': 'security fence, perimeter fence, anti-intrusion fence, industrial security fence, commercial fence supplier',
  '/fence-farm.html': 'farm fence, agricultural fence, livestock fence, cattle fence, field fence supplier China',
  '/epoxy-coated-wire-mesh.html': 'epoxy coated wire mesh, powder coated mesh, decorative wire mesh, black wire mesh, architectural mesh supplier',
  '/barbed-wire-galvanized.html': 'galvanized barbed wire, hot-dip barbed wire, security barbed wire, razor barbed wire, barbed wire supplier China',
  '/barbed-wire-traditional.html': 'traditional barbed wire, single strand barbed wire, farm barbed wire, boundary wire, barbed wire roll supplier',
  '/barbed-wire-concertina.html': 'concertina barbed wire, coiled barbed wire, perimeter security wire, concertina wire supplier',
  '/barbed-wire-double-twist.html': 'double twist barbed wire, woven barbed wire, security fence wire, double strand barbed wire supplier',
  '/barbed-wire-single-twist.html': 'single twist barbed wire, barb wire fence, agricultural barbed wire, single strand wire supplier',
  '/barbed-wire-pvc.html': 'PVC coated barbed wire, green barbed wire, vinyl coated barbed wire, decorative barbed wire supplier',
  '/stainless-screen-mesh.html': 'stainless steel screen mesh, insect screen, window mesh, stainless wire mesh, mosquito net mesh supplier',
  '/plain-weave-screen-mesh.html': 'plain weave screen mesh, wire cloth, industrial screen mesh, filtration mesh, plain weave wire mesh supplier',
  '/twill-weave-screen-mesh.html': 'twill weave screen mesh, dutch weave mesh, filter mesh, industrial wire cloth, twill weave wire mesh supplier',
  '/dutch-weave-screen-mesh.html': 'dutch weave screen mesh, filter cloth, industrial filtration mesh, wire mesh filter, dutch weave wire mesh supplier',
  '/hexagonal-wire.html': 'hexagonal wire mesh, chicken wire, poultry netting, hex netting, garden wire mesh supplier China',
  '/hexagonal-wire-galvanized.html': 'galvanized hexagonal wire mesh, chicken wire mesh, poultry fence, hexagonal netting, galvanized hex mesh supplier',
  '/hexagonal-wire-pvc.html': 'PVC coated hexagonal wire mesh, green chicken wire, vinyl coated hex netting, garden fence mesh supplier',
  '/hexagonal-wire-stainless.html': 'stainless steel hexagonal wire mesh, corrosion resistant hex mesh, industrial hex netting, stainless chicken wire supplier',
  '/woven-wire-mesh.html': 'woven wire mesh, wire cloth, woven mesh panel, industrial woven mesh, woven wire fence supplier',
  '/welded-mesh-panel-galvanized.html': 'galvanized welded mesh panel, steel mesh panel, construction mesh, reinforced mesh panel, galvanized fence panel supplier',
  '/welded-mesh-panel-pvc.html': 'PVC coated welded mesh panel, green mesh panel, vinyl fence panel, decorative mesh panel, PVC coated fence supplier',
  '/welded-mesh-panel-stainless.html': 'stainless steel welded mesh panel, corrosion resistant mesh, industrial mesh panel, stainless fence panel supplier',
  '/welded-mesh-security-fence.html': 'welded mesh security fence, anti-climb fence panel, high security mesh, perimeter fence, welded security fence supplier',
  '/welded-gabion-box.html': 'welded gabion box, gabion basket, erosion control gabion, retaining wall gabion, welded gabion supplier',
  '/welded-gabion-galvanized.html': 'galvanized welded gabion, hot-dip gabion box, erosion control basket, galvanized gabion supplier',
  '/welded-gabion-pvc.html': 'PVC coated gabion box, green gabion basket, vinyl gabion, decorative gabion, PVC coated gabion supplier',
  '/welded-gabion-stainless.html': 'stainless steel gabion, corrosion resistant gabion, premium gabion box, stainless gabion supplier',
  '/gabion-mattresses.html': 'gabion mattresses, river mattress, channel lining, gabion mat, erosion control mattress supplier',
  '/double-twisted-gabion.html': 'double twisted gabion, woven gabion box, hexagonal gabion, traditional gabion basket, double twist gabion supplier',
  '/reno-mattress.html': 'reno mattress, channel lining mattress, river protection mattress, erosion control mat, reno mattress supplier',
  '/gabion-retaining-structures.html': 'gabion retaining wall, gabion wall, gravity retaining wall, gabion structure, retaining wall gabion supplier',
  '/s-knot.html': 'S-knot wire mesh, knotted wire mesh, woven wire fence, livestock fence, S-knot mesh supplier',
  '/hinge-joint-knot.html': 'hinge joint knot mesh, field fence, cattle fence, livestock fence, hinge joint wire mesh supplier',
  '/fixed-knot-fence.html': 'fixed knot fence, high tensile fence, livestock fence, deer fence, fixed knot wire fence supplier',
  '/y-post-security-fence.html': 'Y-post security fence, steel post fence, fence post system, security post, Y-post fence supplier',
  '/square-post.html': 'square fence post, steel square post, galvanized post, fence support post, square metal post supplier',
  '/rectangular-post.html': 'rectangular fence post, steel rectangular post, heavy duty post, fence post, rectangular metal post supplier',
  '/round-post.html': 'round fence post, circular steel post, galvanized round post, fence pole, round metal post supplier',
  '/non-climb-horse-fence.html': 'non-climb horse fence, horse pasture fence, equine fence, livestock fence, non-climb wire fence supplier',
  '/deer-fence.html': 'deer fence, wildlife exclusion fence, garden protection fence, anti-deer mesh, deer fence supplier',
  '/sheep-goat-fence.html': 'sheep fence, goat fence, livestock fence, farm animal fence, sheep and goat mesh supplier',
  '/v-mesh-security-fence.html': 'V-mesh security fence, 3D fence panel, welded wire fence, anti-climb V-mesh, security fence panel supplier',
  '/wire-razor.html': 'wire razor, razor wire, security wire, concertina wire, razor wire coil supplier',
  '/wire-barbed.html': 'wire barbed, barbed wire, security barbed wire, farm barbed wire, barbed wire supplier',
  '/window-screen.html': 'window screen, insect screen, mosquito screen, window mesh, aluminum window screen supplier',
  '/nickel-mesh.html': 'nickel mesh, nickel wire mesh, industrial mesh, corrosion resistant mesh, nickel mesh filter supplier',
  '/acc-c-rings.html': 'C-rings, fence fastener, chain link connector, wire tie, C-ring fastener supplier',
  '/acc-helicals-spiral.html': 'helical tie wire, spiral fastener, fence wire tie, helical connector, spiral wire fastener supplier',
  '/acc-hook-connection.html': 'hook connection, fence hook, chain link hook, wire connector, hook fastener supplier',
  '/acc-lacing-wire.html': 'lacing wire, tie wire, fence binding wire, wire lacer, lacing wire for fence supplier',
  '/acc-u-clips.html': 'U-clips, fence clip, wire mesh clip, panel connector, U-clip fastener supplier',
  '/hot-dip-galvanized.html': 'hot-dip galvanization, galvanized steel, zinc coating, corrosion protection, hot-dip galvanized wire supplier',
  '/pvc-coated.html': 'PVC coated wire, vinyl coated steel, color coated wire, weather resistant wire, PVC coated mesh supplier',
  '/powder-coated.html': 'powder coated wire, electrostatic coating, decorative wire mesh, durable wire finish, powder coated fence supplier',
  '/about.html': 'Kestrel Metal, wire mesh manufacturer, fence supplier China, Anping wire mesh factory, metal products exporter',
  '/contact.html': 'contact Kestrel Metal, wire mesh inquiry, fence quote, bulk order metal products, export inquiry',
  '/products.html': 'metal products catalog, wire mesh products, fence products, gabion products, security fence manufacturer China',
  '/faq.html': 'wire mesh FAQ, fence buying guide, metal products questions, fence installation FAQ, gabion box questions',
  '/services.html': 'metal fabrication services, wire mesh customization, fence design service, custom metal products, OEM wire mesh',
  '/esg.html': 'ESG commitment, sustainable manufacturing, green production, environmental responsibility, metal industry sustainability',
  '/fence-products.html': 'security fence products, wire mesh fence catalog, metal fence manufacturer, commercial fence solutions, industrial fence supplier China',
  '/fence-accessories.html': 'fence accessories, fence hardware, fence components, gate fittings, fencing supplies wholesale',
  '/fence-posts.html': 'fence posts, metal fence posts, steel posts, Y post, square post, round post, fence post manufacturer',
  '/wire-products.html': 'wire products, metal wire mesh, wire rolls, wire supplier, wire mesh exporter China',
  '/yard-garden-fence.html': 'yard fence, garden fence, decorative fence, residential garden fencing, vinyl fence manufacturer',
  '/industry-agriculture.html': 'agricultural fence, farm fence, livestock fencing, crop protection mesh, agricultural wire mesh supplier',
  '/industry-aquaculture.html': 'aquaculture netting, fish farm mesh, shrimp pond netting, aquaculture wire mesh, ocean farm fence supplier',
  '/industry-construction.html': 'construction wire mesh, concrete reinforcement mesh, building steel mesh, formwork mesh, construction mesh supplier China',
  '/industry-energy.html': 'energy industry fence, power plant security fence, solar farm fence, wind farm perimeter, energy mesh supplier',
  '/industry-infrastructure.html': 'infrastructure fence, highway barrier, bridge protection mesh, railway security fence, infrastructure metal supplier',
  '/industry-mining.html': 'mining wire mesh, mining screen, vibrating screen mesh, mine safety fence, mining mesh supplier China',
  '/industry-oilgas.html': 'oil and gas security fence, petrochemical perimeter fence, refinery security fence, oil field wire mesh supplier',
  '/industry-residential.html': 'residential fence, community fencing, villa fence, apartment security fence, home garden fence supplier',
  '/privacy-chain-link.html': 'privacy chain link fence, chain link privacy screen, slat fence, privacy mesh fence, windscreen fence supplier',
  '/service-custom-solutions.html': 'custom metal solutions, bespoke wire mesh, custom fence design, OEM metal fabrication, customized wire products',
  '/service-designer-services.html': 'fence design service, wire mesh CAD design, fence layout plan, 3D fence drawing, metal product design service',
  '/service-fabrication.html': 'metal fabrication, CNC wire cutting, custom wire forming, welded fabrication, sheet metal service China',
  '/service-metal-finishing.html': 'metal finishing service, hot-dip galvanizing, powder coating, PVC coating, plating surface treatment',
  '/service-packaging-logistics.html': 'metal product packaging, export logistics, sea freight preparation, container loading, bulk packaging service',
  '/service-takeoffs-drawings.html': 'fence material takeoff, wire mesh quantity survey, bill of materials, fence CAD drawings, specification sheet service',
  '/welded-mesh-711.html': 'welded wire mesh 711, mesh 1x1 inch, galvanized welded panel, construction reinforcement mesh, welded mesh manufacturer',
  '/welded-mesh-712.html': 'welded wire mesh 712, mesh 2x2 inch, galvanized welded panel, wire mesh fence, welded mesh supplier',
  '/welded-mesh-713.html': 'welded wire mesh 713, mesh 2x4 inch, welded mesh roll, fencing mesh, welded mesh wholesale',
  '/welded-mesh-714.html': 'welded wire mesh 714, mesh 3x3 inch, heavy duty welded panel, cage mesh, welded mesh supplier',
  '/welded-mesh-715.html': 'welded wire mesh 715, mesh 4x4 inch, galvanized mesh roll, garden fence, welded mesh manufacturer',
  '/welded-mesh-716.html': 'welded wire mesh 716, mesh 1x2 inch, welded panel, plaster reinforcement mesh, welded mesh exporter',
  '/welded-mesh-717.html': 'welded wire mesh 717, mesh 1/2x1/2 inch, fine welded mesh, insect screen mesh, welded mesh supplier China',
  '/welded-mesh-718.html': 'welded wire mesh 718, mesh 3/4x3/4 inch, welded wire panel, small gauge mesh, welded mesh distributor',
  '/welded-mesh-719.html': 'welded wire mesh 719, mesh 1/4x1/4 inch, micro welded mesh, filter mesh, welded mesh manufacturer',
  '/welded-mesh-720.html': 'welded wire mesh 720, mesh 3x6 inch, welded fence panel, large mesh roll, security mesh supplier',
  '/welded-mesh-721.html': 'welded wire mesh 721, mesh 5x5 inch, heavy welded mesh, construction site fence, welded mesh bulk price',
  '/welded-mesh-722.html': 'welded wire mesh 722, mesh 6x6 inch, concrete welded mesh, reinforcing mesh panel, welded rebar mesh supplier',
  '/woven-gabion-box.html': 'woven gabion box, hexagonal gabion basket, double twisted gabion, traditional gabion cage, woven gabion supplier',
};

interface SeoMeta {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
}

function extractSeoMeta(html: string, pathname: string): SeoMeta | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i)
    || html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);

  if (!titleMatch) return null;

  const title = titleMatch[1].trim().replace(/\s+/g, ' ');
  const description = descMatch ? descMatch[1].trim() : title;
  const keywords = PAGE_KEYWORDS[pathname] || '';

  return {
    title,
    description,
    keywords,
    canonical: `${DOMAIN}${pathname}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_IMAGE,
    ogType: pathname.includes('blog-') ? 'article' : 'website',
  };
}

function buildSeoHead(meta: SeoMeta): string {
  const lines: string[] = [];

  if (meta.keywords) {
    lines.push(`    <meta name="keywords" content="${meta.keywords}">`);
  }
  lines.push(`    <link rel="canonical" href="${meta.canonical}">`);
  lines.push(`    <meta property="og:title" content="${meta.ogTitle}">`);
  lines.push(`    <meta property="og:description" content="${meta.ogDescription}">`);
  lines.push(`    <meta property="og:url" content="${meta.canonical}">`);
  lines.push(`    <meta property="og:type" content="${meta.ogType}">`);
  lines.push(`    <meta property="og:image" content="${meta.ogImage}">`);
  lines.push(`    <meta property="og:site_name" content="Kestrel Metal">`);
  lines.push(`    <meta property="og:locale" content="en_US">`);
  lines.push(`    <meta name="twitter:card" content="summary_large_image">`);
  lines.push(`    <meta name="twitter:title" content="${meta.ogTitle}">`);
  lines.push(`    <meta name="twitter:description" content="${meta.ogDescription}">`);
  lines.push(`    <meta name="twitter:image" content="${meta.ogImage}">`);
  lines.push(`    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`);

  return lines.join('\n');
}

export function injectSeoTags(html: string, pathname: string): string {
  if (!pathname.endsWith('.html') && pathname !== '/') return html;
  if (pathname.startsWith('/admin/')) return html;
  if (pathname.startsWith('/blog.html')) return html;

  const meta = extractSeoMeta(html, pathname);
  if (!meta) return html;

  if (html.includes('rel="canonical"') || html.includes("rel='canonical'")) return html;

  const seoHead = buildSeoHead(meta);
  const headCloseIndex = html.indexOf('</head>');
  if (headCloseIndex === -1) return html;

  return html.slice(0, headCloseIndex) + seoHead + '\n' + html.slice(headCloseIndex);
}
