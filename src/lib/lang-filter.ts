/**
 * 关键词语言过滤 — 剔除竞品多语言 sitemap 带来的非英文噪音
 *
 * 背景：竞品（如 shengsenwiremesh.com）的 sitemap 会包含西语/意语/法语/
 * 印尼语/他加禄语/德语等各语言版本的页面 slug。缺口分析把这些 slug 当成
 * 英文关键词抓回来，实测 132 个候选里 63 个（48%）是这类噪音，
 * 严重稀释选题池。
 *
 * 设计：两级判定，避免误杀真英文词
 *   1. 非拉丁字符（中文/西里尔/阿拉伯等）→ 非英文
 *   2. 命中「强信号」外语特有形态 ≥1 个 → 非英文
 *   3. 命中「弱信号」短虚词（≤3 字母）≥2 个 → 非英文
 *
 * 关键约束：词典中刻意排除 china / guide / canton / gabions 等
 * 英文 B2B 关键词同样会用到的词，否则会误杀
 * "top 10 wire mesh manufacturers china" 这类高价值词。
 */

/** 强信号：外语特有形态（≥4 字母），命中 1 个即判为非英文 */
const STRONG_NON_ENGLISH = new Set([
  // ── 西语 / 葡语 ──
  'como', 'para', 'desde', 'vallas', 'valla', 'cercas', 'malla', 'metalica', 'metalicas',
  'fabricante', 'fabricantes', 'importar', 'precios', 'mejores', 'principales', 'productos',
  'producto', 'equipo', 'equipa', 'feria', 'feira', 'descubra', 'novas', 'nuevas',
  'oportunidades', 'actualizacion', 'actualizado', 'telas', 'tela', 'guia', 'guias',
  'solucion', 'mejor', 'completa', 'completo', 'diferentes', 'partes', 'antiescalada',
  'malha', 'seguranca', 'alta', 'importacao', 'fabricacao', 'melhor', 'principais',
  'atualizacao', 'atualizado', 'nossos', 'preciso', 'cercas',

  // ── 意语 ──
  'produttori', 'reti', 'metalliche', 'metallica', 'metallici', 'scoprite', 'nuove',
  'prodotti', 'fiera', 'principali', 'recinzioni', 'aggiornamento', 'migliore', 'soluzione',
  'diverse', 'parti', 'della', 'delle', 'agli', 'sono', 'quali', 'cose', 'guida', 'completi',
  'saldata', 'esagonale', 'sicurezza', 'gabbioni', 'rete',

  // ── 法语 ──
  'premiers', 'fabricants', 'treillis', 'metallique', 'decouvrez', 'nouvelles', 'avec',
  'produits', 'foire', 'meilleure', 'differentes', 'mailles', 'chaine', 'panier', 'cloture',
  'toutes', 'tout', 'votre', 'notre',

  // ── 印尼语 / 马来语 ──
  'produsen', 'teratas', 'panduan', 'komprehensif', 'bagian', 'rantai', 'temukan', 'peluang',
  'terbaik', 'diperbarui', 'dimaksud', 'dengan', 'untuk', 'yang', 'silet', 'harga', 'murah',
  'terpercaya', 'keamanan', 'tinggi', 'lengkap', 'apa', 'saja', 'adalah', 'kawat', 'pagar',
  'baru', 'produk', 'cina', 'tsina', 'solusi',

  // ── 德语 ──
  'vollstaendiger', 'vollstandiger', 'leitfaden', 'hochsicherheits', 'gitterzaeune',
  'entdecken', 'moeglichkeiten', 'neue', 'produkten', 'werden', 'nicht', 'dieser', 'dieses',
  'unsere', 'ihre', 'wird', 'koennen', 'haben', 'oder', 'auch', 'sehr', 'mehr', 'ueber',
  'unter', 'hoch', 'sicherheit',

  // ── 他加禄语 ──
  'tinik', 'kawad', 'tagagawa', 'gabay', 'bahagi', 'lahat', 'nangungunang', 'komprehensibong',
  'pagsusuri', 'maraming', 'nagagawang', 'iyong', 'pinakamahusay', 'tuklasin', 'solusyon',
  'isang', 'koponan', 'oportunidad', 'bagong', 'produkto', 'konstruksyon', 'mga', 'ano',
  'ang', 'ng', 'sa', 'paano', 'mag', 'bakod', 'pakyawan', 'pagkakaiba', 'gamit', 'pangunahing',

  // ── 荷兰语 ──
  'van', 'voor', 'zijn', 'deze', 'worden', 'wordt', 'met', 'ook', 'naar', 'bij', 'een', 'het',
]);

/** 弱信号：≤3 字母的外语虚词，需命中 ≥2 个才判非英文（避免误伤英文缩写） */
const WEAK_NON_ENGLISH = new Set([
  'de', 'la', 'le', 'du', 'des', 'est', 'sur', 'une', 'les', 'aux', 'nous', 'vous', 'con',
  'per', 'che', 'da', 'do', 'em', 'los', 'las', 'una', 'del', 'ke', 'di', 'sa', 'ng', 'na',
  'ay', 'und', 'dem', 'von', 'der', 'die', 'das', 'ist', 'fur', 'mit', 'aus', 'bei', 'sie',
  'que', 'por', 'son', 'sus', 'tem', 'ela', 'ele', 'noi', 'voi', 'dan', 'unt', 'ada', 'ini',
  'itu', 'dari',
]);

/** 强信号命中阈值 */
const STRONG_THRESHOLD = 1;
/** 弱信号命中阈值 */
const WEAK_THRESHOLD = 2;

/**
 * 判断关键词是否为英文
 * @returns true = 英文（保留）；false = 非英文（应过滤）
 */
export function isEnglishKeyword(keyword: string): boolean {
  let text = String(keyword ?? '').toLowerCase().trim();
  if (!text) return false;

  // 百分号编码：竞品 URL slug 常保留原始编码，例如西里尔语的
  // "%d1%87%d1%82%d0%be" 看起来全是 ASCII，解码后其实是俄语 "что"。
  // 必须先解码再判定，否则这类词会绕过下面的非拉丁字符检测。
  // 英文关键词不会出现百分号，凡含 % 一律视为编码字符串处理
  if (text.includes('%')) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      return false; // 非法编码序列（如 %zz）
    }
    if (/[^\x00-\x7F]/.test(decoded)) return false;
    if (decoded.includes('%')) return false; // 解码后仍有 % ，说明是畸形串
    text = decoded;
  }

  // 非拉丁字符（中文、西里尔、阿拉伯、日文等）直接判非英文
  if (/[^\x00-\x7F]/.test(text)) return false;

  const words = text.split(/[\s\-_]+/).filter(Boolean);
  if (words.length === 0) return false;

  let strongHits = 0;
  let weakHits = 0;
  for (const word of words) {
    if (STRONG_NON_ENGLISH.has(word)) strongHits++;
    else if (WEAK_NON_ENGLISH.has(word)) weakHits++;
  }

  return strongHits < STRONG_THRESHOLD && weakHits < WEAK_THRESHOLD;
}

/** 批量过滤，只保留英文关键词 */
export function filterEnglishKeywords<T>(items: T[], getKeyword: (item: T) => string): T[] {
  return items.filter((item) => isEnglishKeyword(getKeyword(item)));
}
