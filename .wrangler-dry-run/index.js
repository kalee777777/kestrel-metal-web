var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/kv.ts
var kv_exports = {};
__export(kv_exports, {
  appendToList: () => appendToList,
  getContentQueue: () => getContentQueue,
  getDraft: () => getDraft,
  getJSON: () => getJSON,
  getKeywordTrend: () => getKeywordTrend,
  getRankings: () => getRankings,
  getScoreHistory: () => getScoreHistory,
  listKeys: () => listKeys,
  markPublished: () => markPublished,
  now: () => now,
  saveDraft: () => saveDraft,
  saveRankings: () => saveRankings,
  saveScore: () => saveScore,
  setContentQueue: () => setContentQueue,
  setJSON: () => setJSON,
  today: () => today
});
async function getJSON(ns, key) {
  const raw = await ns.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function setJSON(ns, key, value, ttl) {
  const text = JSON.stringify(value);
  if (ttl) {
    await ns.put(key, text, { expirationTtl: ttl });
  } else {
    await ns.put(key, text);
  }
}
async function appendToList(ns, key, item, maxItems = 100) {
  const list = await getJSON(ns, key) ?? [];
  list.unshift(item);
  if (list.length > maxItems) list.length = maxItems;
  await setJSON(ns, key, list);
  return list;
}
async function listKeys(ns, prefix, limit = 100) {
  const result = await ns.list({ prefix, limit });
  return result.keys;
}
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function saveRankings(ns, date, rankings) {
  await setJSON(ns, `rankings:${date}`, rankings);
  await ns.put("gsc:last_sync", (/* @__PURE__ */ new Date()).toISOString());
}
async function getRankings(ns, date) {
  return getJSON(ns, `rankings:${date}`);
}
async function getKeywordTrend(ns, keyword, days = 30) {
  const trend = [];
  const todayDate = /* @__PURE__ */ new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const rankings = await getRankings(ns, dateStr);
    if (rankings) {
      const found = rankings.find((r) => r.keyword === keyword);
      if (found) trend.unshift(found);
    }
  }
  return trend;
}
async function getContentQueue(ns) {
  return await getJSON(ns, "queue:pending") ?? [];
}
async function setContentQueue(ns, queue) {
  await setJSON(ns, "queue:pending", queue);
}
async function saveDraft(ns, draft) {
  await setJSON(ns, `draft:${draft.slug}`, draft);
}
async function getDraft(ns, slug) {
  return getJSON(ns, `draft:${slug}`);
}
async function markPublished(ns, draft) {
  draft.status = "published";
  draft.publishedAt = now();
  await setJSON(ns, `published:${draft.slug}`, {
    slug: draft.slug,
    title: draft.title,
    keyword: draft.keyword,
    publishedAt: draft.publishedAt,
    score: draft.score
  });
  await appendToList(ns, "published:all", {
    slug: draft.slug,
    title: draft.title,
    publishedAt: draft.publishedAt
  }, 500);
}
async function saveScore(ns, record) {
  await setJSON(ns, `score:${record.slug}:round_${record.round}`, record);
  await appendToList(ns, `fix_log:${record.slug}`, record, 10);
}
async function getScoreHistory(ns, slug) {
  return await getJSON(ns, `fix_log:${slug}`) ?? [];
}
var init_kv = __esm({
  "src/lib/kv.ts"() {
    "use strict";
    __name(getJSON, "getJSON");
    __name(setJSON, "setJSON");
    __name(appendToList, "appendToList");
    __name(listKeys, "listKeys");
    __name(today, "today");
    __name(now, "now");
    __name(saveRankings, "saveRankings");
    __name(getRankings, "getRankings");
    __name(getKeywordTrend, "getKeywordTrend");
    __name(getContentQueue, "getContentQueue");
    __name(setContentQueue, "setContentQueue");
    __name(saveDraft, "saveDraft");
    __name(getDraft, "getDraft");
    __name(markPublished, "markPublished");
    __name(saveScore, "saveScore");
    __name(getScoreHistory, "getScoreHistory");
  }
});

// src/cron/opportunity.ts
var opportunity_exports = {};
__export(opportunity_exports, {
  default: () => opportunityCron,
  opportunities: () => opportunities
});
async function opportunities(rankings) {
  const items = [];
  for (const row of rankings) {
    const { keyword, impressions, clicks, ctr, position } = row;
    if (impressions < 100) continue;
    if (position <= 10 && ctr < 0.02 && impressions > 500) {
      items.push({
        keyword,
        type: "low_ctr",
        impressions,
        clicks,
        position,
        suggestedAction: `\u4F18\u5316 title \u548C meta description\uFF0C\u5F53\u524D CTR ${(ctr * 100).toFixed(1)}% \u4F4E\u4E8E\u884C\u4E1A\u5E73\u5747`,
        estimatedDifficulty: "easy"
      });
    }
    if (position >= 11 && position <= 20) {
      items.push({
        keyword,
        type: "page_two",
        impressions,
        clicks,
        position,
        suggestedAction: `\u521B\u5EFA\u9488\u5BF9 "${keyword}" \u7684\u6DF1\u5EA6\u535A\u5BA2\u6587\u7AE0\uFF082000+ \u5B57\uFF09\uFF0C\u52A9\u63A8\u5230\u9996\u9875`,
        estimatedDifficulty: "medium"
      });
    }
    if (position > 20 && impressions > 200) {
      items.push({
        keyword,
        type: "new_opportunity",
        impressions,
        clicks,
        position,
        suggestedAction: `\u521B\u5EFA\u4E13\u95E8\u7684\u4EA7\u54C1\u9875\u9762\u6216\u535A\u5BA2\u6587\u7AE0\uFF0C\u76EE\u6807\u5173\u952E\u8BCD "${keyword}"`,
        estimatedDifficulty: "hard"
      });
    }
  }
  items.sort((a, b) => {
    const scoreA = a.impressions * (1 / Math.max(a.position, 1));
    const scoreB = b.impressions * (1 / Math.max(b.position, 1));
    return scoreB - scoreA;
  });
  return items.slice(0, 50);
}
async function opportunityCron(env) {
  console.log("[opportunity] Running opportunity analysis...");
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const rankings = await getRankings2(env.SEO_DATA, today2);
  if (!rankings || rankings.length === 0) {
    console.log("[opportunity] No ranking data available");
    return;
  }
  const items = await opportunities(rankings);
  await env.SEO_DATA.put("opportunities:weekly", JSON.stringify(items));
  console.log(`[opportunity] Identified ${items.length} content opportunities`);
}
var init_opportunity = __esm({
  "src/cron/opportunity.ts"() {
    "use strict";
    __name(opportunities, "opportunities");
    __name(opportunityCron, "opportunityCron");
  }
});

// src/lib/r2.ts
var r2_exports = {};
__export(r2_exports, {
  deleteImage: () => deleteImage,
  getImage: () => getImage,
  getImageMeta: () => getImageMeta,
  imageUrl: () => imageUrl,
  listImages: () => listImages,
  putImage: () => putImage,
  serveImage: () => serveImage
});
async function putImage(bucket, key, data, contentType, metadata) {
  await bucket.put(key, data, {
    httpMetadata: { contentType },
    customMetadata: metadata
  });
}
async function getImage(bucket, key) {
  return bucket.get(key);
}
async function getImageMeta(bucket, key) {
  return bucket.head(key);
}
async function deleteImage(bucket, key) {
  await bucket.delete(key);
}
async function listImages(bucket, prefix, limit = 100) {
  const result = await bucket.list({ prefix, limit });
  return result.objects;
}
function imageUrl(key) {
  return `/api/images/${key}`;
}
async function serveImage(bucket, key) {
  const obj = await bucket.get(key);
  if (!obj) {
    return new Response("Image not found", { status: 404 });
  }
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType ?? "image/webp");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", obj.httpEtag);
  return new Response(obj.body, { headers });
}
var init_r2 = __esm({
  "src/lib/r2.ts"() {
    "use strict";
    __name(putImage, "putImage");
    __name(getImage, "getImage");
    __name(getImageMeta, "getImageMeta");
    __name(deleteImage, "deleteImage");
    __name(listImages, "listImages");
    __name(imageUrl, "imageUrl");
    __name(serveImage, "serveImage");
  }
});

// src/lib/gsc.ts
var gsc_exports = {};
__export(gsc_exports, {
  GSC_SCOPE: () => GSC_SCOPE,
  buildGscAuthUrl: () => buildGscAuthUrl,
  exchangeGscCode: () => exchangeGscCode,
  queryAllKeywords: () => queryAllKeywords,
  querySearchAnalytics: () => querySearchAnalytics,
  verifyConnection: () => verifyConnection
});
async function getRefreshToken(env) {
  const kvToken = await env.SEO_DATA.get(REFRESH_TOKEN_KV_KEY);
  if (kvToken) return kvToken;
  return env.GSC_REFRESH_TOKEN;
}
function buildGscAuthUrl(clientId, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GSC_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true"
  });
  return `${AUTH_URL}?${params.toString()}`;
}
async function exchangeGscCode(env, code, redirectUri) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!resp.ok) {
    const errText = await resp.text();
    return { ok: false, error: `code exchange failed (${resp.status}): ${errText}` };
  }
  const data = await resp.json();
  if (!data.refresh_token) {
    return { ok: false, error: "Google did not return a refresh_token (missing access_type=offline)" };
  }
  await env.SEO_DATA.put(REFRESH_TOKEN_KV_KEY, data.refresh_token);
  await env.SEO_DATA.put(
    TOKEN_CACHE_KEY,
    JSON.stringify({ access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1e3 }),
    { expirationTtl: Math.floor(data.expires_in / 2) }
  );
  await env.SEO_DATA.put("gsc:reauthorized_at", (/* @__PURE__ */ new Date()).toISOString());
  return { ok: true };
}
async function getAccessToken(env) {
  const cached = await env.SEO_DATA.get(TOKEN_CACHE_KEY);
  if (cached) {
    try {
      const token = JSON.parse(cached);
      if (Date.now() < token.expires_at - 6e4) {
        return token.access_token;
      }
    } catch {
    }
  }
  const refreshToken = await getRefreshToken(env);
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GSC token refresh failed (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  const expiresAt = Date.now() + data.expires_in * 1e3;
  await env.SEO_DATA.put(
    TOKEN_CACHE_KEY,
    JSON.stringify({ access_token: data.access_token, expires_at: expiresAt }),
    { expirationTtl: Math.floor(data.expires_in / 2) }
  );
  return data.access_token;
}
async function querySearchAnalytics(env, startDate, endDate, dimensions = ["query"], rowLimit = 1e3) {
  const accessToken = await getAccessToken(env);
  const siteUrl = encodeURIComponent(env.GSC_SITE_URL);
  const url = `${GSC_API_BASE}/sites/${siteUrl}/searchAnalytics/query`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions,
      rowLimit,
      startRow: 0,
      dimensionFilterGroups: [],
      searchType: "web"
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GSC query failed (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  return data.rows ?? [];
}
async function queryAllKeywords(env, startDate, endDate) {
  const allRows = [];
  let startRow = 0;
  const pageSize = 25e3;
  while (true) {
    const accessToken = await getAccessToken(env);
    const siteUrl = encodeURIComponent(env.GSC_SITE_URL);
    const resp = await fetch(
      `${GSC_API_BASE}/sites/${siteUrl}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query"],
          rowLimit: pageSize,
          startRow,
          searchType: "web"
        })
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`GSC paginated query failed at row ${startRow}: ${errText}`);
    }
    const data = await resp.json();
    const rows = data.rows ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    startRow += pageSize;
  }
  return allRows;
}
async function verifyConnection(env) {
  try {
    const endDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 3 * 864e5).toISOString().split("T")[0];
    const rows = await querySearchAnalytics(env, startDate, endDate, ["query"], 5);
    return { ok: true, siteUrl: env.GSC_SITE_URL, rowCount: rows.length };
  } catch (err) {
    return {
      ok: false,
      siteUrl: env.GSC_SITE_URL,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
var GSC_API_BASE, TOKEN_URL, AUTH_URL, TOKEN_CACHE_KEY, REFRESH_TOKEN_KV_KEY, GSC_SCOPE;
var init_gsc = __esm({
  "src/lib/gsc.ts"() {
    "use strict";
    GSC_API_BASE = "https://www.googleapis.com/webmasters/v3";
    TOKEN_URL = "https://oauth2.googleapis.com/token";
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    TOKEN_CACHE_KEY = "gsc:access_token";
    REFRESH_TOKEN_KV_KEY = "gsc:refresh_token";
    GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
    __name(getRefreshToken, "getRefreshToken");
    __name(buildGscAuthUrl, "buildGscAuthUrl");
    __name(exchangeGscCode, "exchangeGscCode");
    __name(getAccessToken, "getAccessToken");
    __name(querySearchAnalytics, "querySearchAnalytics");
    __name(queryAllKeywords, "queryAllKeywords");
    __name(verifyConnection, "verifyConnection");
  }
});

// src/lib/seo-meta.ts
var seo_meta_exports = {};
__export(seo_meta_exports, {
  createSeoMeta: () => createSeoMeta,
  deleteSeoMeta: () => deleteSeoMeta,
  findSeoMeta: () => findSeoMeta,
  listSeoMetas: () => listSeoMetas,
  nextSeoMetaId: () => nextSeoMetaId,
  normalizePageUrl: () => normalizePageUrl,
  saveSeoMetas: () => saveSeoMetas,
  updateSeoMeta: () => updateSeoMeta
});
function normalizePageUrl(url) {
  if (!url) return "";
  let u = url.trim();
  u = u.replace(/^https?:\/\/[^/]+/i, "");
  if (u && !u.startsWith("/")) u = `/${u}`;
  return u;
}
function findSeoMeta(metas, pathname) {
  const target = normalizePageUrl(pathname).replace(/\.html$/, "");
  if (!target) return null;
  for (const m of metas) {
    const p = normalizePageUrl(m.page_url).replace(/\.html$/, "");
    if (p === target) return m;
  }
  return null;
}
async function listSeoMetas(env) {
  return await getJSON(env.SEO_DATA, STORAGE_KEY) ?? [];
}
async function saveSeoMetas(env, metas) {
  await setJSON(env.SEO_DATA, STORAGE_KEY, metas);
}
function nextSeoMetaId(metas) {
  return metas.reduce((max, m) => Math.max(max, m.id ?? 0), 0) + 1;
}
async function createSeoMeta(env, data) {
  if (!data.page_url) return null;
  const metas = await listSeoMetas(env);
  if (findSeoMeta(metas, data.page_url)) return null;
  const record = {
    ...data,
    id: nextSeoMetaId(metas),
    page_url: normalizePageUrl(data.page_url),
    noindex: !!data.noindex,
    updated_at: now()
  };
  metas.push(record);
  await saveSeoMetas(env, metas);
  return record;
}
async function updateSeoMeta(env, id, data) {
  const metas = await listSeoMetas(env);
  const index = metas.findIndex((m) => m.id === id);
  if (index === -1) return null;
  metas[index] = {
    ...metas[index],
    ...data,
    id: metas[index].id,
    page_url: normalizePageUrl(data.page_url ?? metas[index].page_url),
    noindex: data.noindex ?? metas[index].noindex,
    updated_at: now()
  };
  await saveSeoMetas(env, metas);
  return metas[index];
}
async function deleteSeoMeta(env, id) {
  const metas = await listSeoMetas(env);
  const filtered = metas.filter((m) => m.id !== id);
  if (filtered.length === metas.length) return false;
  await saveSeoMetas(env, filtered);
  return true;
}
var STORAGE_KEY;
var init_seo_meta = __esm({
  "src/lib/seo-meta.ts"() {
    "use strict";
    init_kv();
    STORAGE_KEY = "seo:metas";
    __name(normalizePageUrl, "normalizePageUrl");
    __name(findSeoMeta, "findSeoMeta");
    __name(listSeoMetas, "listSeoMetas");
    __name(saveSeoMetas, "saveSeoMetas");
    __name(nextSeoMetaId, "nextSeoMetaId");
    __name(createSeoMeta, "createSeoMeta");
    __name(updateSeoMeta, "updateSeoMeta");
    __name(deleteSeoMeta, "deleteSeoMeta");
  }
});

// src/lib/sitemap.ts
var sitemap_exports = {};
__export(sitemap_exports, {
  buildSitemap: () => buildSitemap
});
function normalizePath(loc) {
  return loc.replace(/^https?:\/\/[^/]+/i, "").replace(/\.html$/, "");
}
async function buildSitemap(env) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
  const staticResp = await env.ASSETS.fetch("https://www.kestrelmetal.com/sitemap.xml");
  if (staticResp.ok) {
    xml = await staticResp.text();
  }
  const staticLocs = new Set(
    Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => normalizePath(m[1].trim()))
  );
  const published = await getJSON(env.CONTENT_QUEUE, "published:all") ?? [];
  const additions = [];
  for (const entry of published) {
    if (!entry.slug) continue;
    const path = `/${entry.slug}`;
    if (staticLocs.has(path)) continue;
    const lastmod = (entry.publishedAt ?? (/* @__PURE__ */ new Date()).toISOString()).split("T")[0];
    additions.push(
      [
        "  <url>",
        `    <loc>${DOMAIN}/${entry.slug}.html</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>"
      ].join("\n")
    );
  }
  if (additions.length === 0) {
    return { xml, urlCount: staticLocs.size, dynamicCount: 0 };
  }
  const merged = xml.replace("</urlset>", `${additions.join("\n")}
</urlset>`);
  const urlCount = Array.from(merged.matchAll(/<loc>/g)).length;
  return { xml: merged, urlCount, dynamicCount: additions.length };
}
var DOMAIN;
var init_sitemap = __esm({
  "src/lib/sitemap.ts"() {
    "use strict";
    init_kv();
    DOMAIN = "https://www.kestrelmetal.com";
    __name(normalizePath, "normalizePath");
    __name(buildSitemap, "buildSitemap");
  }
});

// src/lib/faq.ts
var faq_exports = {};
__export(faq_exports, {
  activeEnglishFaqs: () => activeEnglishFaqs,
  createFaq: () => createFaq,
  deleteFaq: () => deleteFaq,
  getFaq: () => getFaq,
  hasSimilarQuestion: () => hasSimilarQuestion,
  importFaqs: () => importFaqs,
  injectFaqIntoHtml: () => injectFaqIntoHtml,
  listFaqs: () => listFaqs,
  saveFaqs: () => saveFaqs,
  updateFaq: () => updateFaq
});
async function listFaqs(env) {
  const items = await getJSON(env.SEO_DATA, KV_KEY) ?? [];
  return items.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}
async function saveFaqs(env, items) {
  await setJSON(env.SEO_DATA, KV_KEY, items);
}
async function getFaq(env, id) {
  const items = await listFaqs(env);
  return items.find((f) => String(f.id) === id);
}
function nextId(items) {
  return items.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;
}
async function createFaq(env, data) {
  if (!data.question || !data.answer) throw new Error("question and answer are required");
  const items = await listFaqs(env);
  const item = {
    id: nextId(items),
    question: String(data.question),
    answer: String(data.answer),
    category: data.category || "General",
    language: data.language || "en",
    sort_order: data.sort_order ?? nextId(items),
    is_active: data.is_active ?? true,
    source: data.source || "admin",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  items.push(item);
  await saveFaqs(env, items);
  return item;
}
async function updateFaq(env, id, data) {
  const items = await listFaqs(env);
  const idx = items.findIndex((f) => String(f.id) === id);
  if (idx < 0) return void 0;
  const { id: _ignored, ...rest } = data;
  items[idx] = { ...items[idx], ...rest };
  await saveFaqs(env, items);
  return items[idx];
}
async function deleteFaq(env, id) {
  const items = await listFaqs(env);
  const next = items.filter((f) => String(f.id) !== id);
  if (next.length === items.length) return false;
  await saveFaqs(env, next);
  return true;
}
async function importFaqs(env, incoming) {
  const items = await listFaqs(env);
  let imported = 0;
  let skipped = 0;
  for (const row of incoming) {
    if (!row?.question || !row?.answer) {
      skipped++;
      continue;
    }
    if (items.some((f) => f.question === row.question)) {
      skipped++;
      continue;
    }
    items.push({
      id: nextId(items),
      question: String(row.question),
      answer: String(row.answer),
      category: row.category || "General",
      language: row.language || "en",
      sort_order: row.sort_order ?? nextId(items),
      is_active: row.is_active ?? true,
      source: row.source || "admin",
      created_at: row.created_at || (/* @__PURE__ */ new Date()).toISOString()
    });
    imported++;
  }
  await saveFaqs(env, items);
  return { imported, skipped };
}
function activeEnglishFaqs(items) {
  return items.filter((f) => f.is_active !== false && (f.language ?? "en") === "en");
}
function hasSimilarQuestion(items, question) {
  const norm = /* @__PURE__ */ __name((q) => q.trim().toLowerCase().replace(/[?.!]+$/, ""), "norm");
  const target = norm(question);
  return items.some((f) => norm(f.question) === target);
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function normQuestion(q) {
  return q.trim().toLowerCase().replace(/[?.!]+$/, "").replace(/\s+/g, " ");
}
async function injectFaqIntoHtml(html, env) {
  const faqs = activeEnglishFaqs(await listFaqs(env));
  if (faqs.length === 0) return html;
  const existingQuestions = new Set(
    [...html.matchAll(/<span class="faq-question-text">\s*([\s\S]*?)\s*<\/span>/gi)].map(
      (m) => normQuestion(m[1].replace(/<[^>]+>/g, ""))
    )
  );
  const fresh = faqs.filter((f) => !existingQuestions.has(normQuestion(f.question)));
  if (fresh.length === 0) return html;
  const itemsHtml = fresh.map((f) => FAQ_ITEM_TMPL(f.question, f.answer)).join("\n");
  const groupHtml = `
          <!-- KV geo:faqs runtime-injected -->
          <div class="faq-group" data-group="general" data-reveal>
            <div class="faq-group-header">
              <span class="faq-group-tag">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Buying &amp; Technical FAQ
              </span>
              <div class="faq-group-line"></div>
            </div>
${itemsHtml}
          </div>
`;
  const containerOpen = '<div id="faqContainer">';
  const idx = html.indexOf(containerOpen);
  if (idx < 0) return html;
  let out = html.slice(0, idx + containerOpen.length) + groupHtml + html.slice(idx + containerOpen.length);
  const schemaEntries = fresh.map((f) => ({
    "@type": "Question",
    text: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer }
  }));
  const faqPageRe = /(<script type="application\/ld\+json">[\s\S]*?"@type"\s*:\s*"FAQPage"[\s\S]*?"mainEntity"\s*:\s*\[)([\s\S]*?)(\][\s\S]*?<\/script>)/;
  if (faqPageRe.test(out)) {
    out = out.replace(faqPageRe, (match, pre, entityBody, post) => {
      try {
        const arr = JSON.parse(`[${entityBody.trim().replace(/,$/, "")}]`);
        for (const entry of schemaEntries) {
          const already = arr.some(
            (q) => q && normQuestion(String(q.text ?? q.name ?? "")) === normQuestion(entry.text)
          );
          if (!already) arr.push(entry);
        }
        return `${pre}
    ${arr.map((q) => JSON.stringify(q)).join(",\n    ")}
  ${post}`;
      } catch {
        return match;
      }
    });
  } else if (/<\/head>/i.test(out)) {
    const block = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ${JSON.stringify(schemaEntries, null, 2).replace(/</g, "\\u003c")}
  }
  <\/script>
`;
    out = out.replace(/<\/head>/i, `${block}</head>`);
  }
  console.log(`[faq] Injected ${fresh.length} KV FAQs into faq.html`);
  return out;
}
var KV_KEY, FAQ_ITEM_TMPL;
var init_faq = __esm({
  "src/lib/faq.ts"() {
    "use strict";
    init_kv();
    KV_KEY = "geo:faqs";
    __name(listFaqs, "listFaqs");
    __name(saveFaqs, "saveFaqs");
    __name(getFaq, "getFaq");
    __name(nextId, "nextId");
    __name(createFaq, "createFaq");
    __name(updateFaq, "updateFaq");
    __name(deleteFaq, "deleteFaq");
    __name(importFaqs, "importFaqs");
    __name(activeEnglishFaqs, "activeEnglishFaqs");
    __name(hasSimilarQuestion, "hasSimilarQuestion");
    __name(escapeHtml, "escapeHtml");
    __name(normQuestion, "normQuestion");
    FAQ_ITEM_TMPL = /* @__PURE__ */ __name((question, answer) => `
            <div class="faq-item">
              <div class="faq-question">
                <span class="faq-question-text">${escapeHtml(question)}</span>
                <span class="faq-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </span>
              </div>
              <div class="faq-answer-wrapper">
                <div class="faq-answer">${escapeHtml(answer)}</div>
              </div>
            </div>`, "FAQ_ITEM_TMPL");
    __name(injectFaqIntoHtml, "injectFaqIntoHtml");
  }
});

// src/lib/lang-filter.ts
function isEnglishKeyword(keyword) {
  let text = String(keyword ?? "").toLowerCase().trim();
  if (!text) return false;
  if (text.includes("%")) {
    let decoded;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      return false;
    }
    if (/[^\x00-\x7F]/.test(decoded)) return false;
    if (decoded.includes("%")) return false;
    text = decoded;
  }
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
var STRONG_NON_ENGLISH, WEAK_NON_ENGLISH, STRONG_THRESHOLD, WEAK_THRESHOLD;
var init_lang_filter = __esm({
  "src/lib/lang-filter.ts"() {
    "use strict";
    STRONG_NON_ENGLISH = /* @__PURE__ */ new Set([
      // ── 西语 / 葡语 ──
      "como",
      "para",
      "desde",
      "vallas",
      "valla",
      "cercas",
      "malla",
      "metalica",
      "metalicas",
      "fabricante",
      "fabricantes",
      "importar",
      "precios",
      "mejores",
      "principales",
      "productos",
      "producto",
      "equipo",
      "equipa",
      "feria",
      "feira",
      "descubra",
      "novas",
      "nuevas",
      "oportunidades",
      "actualizacion",
      "actualizado",
      "telas",
      "tela",
      "guia",
      "guias",
      "solucion",
      "mejor",
      "completa",
      "completo",
      "diferentes",
      "partes",
      "antiescalada",
      "malha",
      "seguranca",
      "alta",
      "importacao",
      "fabricacao",
      "melhor",
      "principais",
      "atualizacao",
      "atualizado",
      "nossos",
      "preciso",
      "cercas",
      // ── 意语 ──
      "produttori",
      "reti",
      "metalliche",
      "metallica",
      "metallici",
      "scoprite",
      "nuove",
      "prodotti",
      "fiera",
      "principali",
      "recinzioni",
      "aggiornamento",
      "migliore",
      "soluzione",
      "diverse",
      "parti",
      "della",
      "delle",
      "agli",
      "sono",
      "quali",
      "cose",
      "guida",
      "completi",
      "saldata",
      "esagonale",
      "sicurezza",
      "gabbioni",
      "rete",
      // ── 法语 ──
      "premiers",
      "fabricants",
      "treillis",
      "metallique",
      "decouvrez",
      "nouvelles",
      "avec",
      "produits",
      "foire",
      "meilleure",
      "differentes",
      "mailles",
      "chaine",
      "panier",
      "cloture",
      "toutes",
      "tout",
      "votre",
      "notre",
      // ── 印尼语 / 马来语 ──
      "produsen",
      "teratas",
      "panduan",
      "komprehensif",
      "bagian",
      "rantai",
      "temukan",
      "peluang",
      "terbaik",
      "diperbarui",
      "dimaksud",
      "dengan",
      "untuk",
      "yang",
      "silet",
      "harga",
      "murah",
      "terpercaya",
      "keamanan",
      "tinggi",
      "lengkap",
      "apa",
      "saja",
      "adalah",
      "kawat",
      "pagar",
      "baru",
      "produk",
      "cina",
      "tsina",
      "solusi",
      // ── 德语 ──
      "vollstaendiger",
      "vollstandiger",
      "leitfaden",
      "hochsicherheits",
      "gitterzaeune",
      "entdecken",
      "moeglichkeiten",
      "neue",
      "produkten",
      "werden",
      "nicht",
      "dieser",
      "dieses",
      "unsere",
      "ihre",
      "wird",
      "koennen",
      "haben",
      "oder",
      "auch",
      "sehr",
      "mehr",
      "ueber",
      "unter",
      "hoch",
      "sicherheit",
      // ── 他加禄语 ──
      "tinik",
      "kawad",
      "tagagawa",
      "gabay",
      "bahagi",
      "lahat",
      "nangungunang",
      "komprehensibong",
      "pagsusuri",
      "maraming",
      "nagagawang",
      "iyong",
      "pinakamahusay",
      "tuklasin",
      "solusyon",
      "isang",
      "koponan",
      "oportunidad",
      "bagong",
      "produkto",
      "konstruksyon",
      "mga",
      "ano",
      "ang",
      "ng",
      "sa",
      "paano",
      "mag",
      "bakod",
      "pakyawan",
      "pagkakaiba",
      "gamit",
      "pangunahing",
      // ── 荷兰语 ──
      "van",
      "voor",
      "zijn",
      "deze",
      "worden",
      "wordt",
      "met",
      "ook",
      "naar",
      "bij",
      "een",
      "het"
    ]);
    WEAK_NON_ENGLISH = /* @__PURE__ */ new Set([
      "de",
      "la",
      "le",
      "du",
      "des",
      "est",
      "sur",
      "une",
      "les",
      "aux",
      "nous",
      "vous",
      "con",
      "per",
      "che",
      "da",
      "do",
      "em",
      "los",
      "las",
      "una",
      "del",
      "ke",
      "di",
      "sa",
      "ng",
      "na",
      "ay",
      "und",
      "dem",
      "von",
      "der",
      "die",
      "das",
      "ist",
      "fur",
      "mit",
      "aus",
      "bei",
      "sie",
      "que",
      "por",
      "son",
      "sus",
      "tem",
      "ela",
      "ele",
      "noi",
      "voi",
      "dan",
      "unt",
      "ada",
      "ini",
      "itu",
      "dari"
    ]);
    STRONG_THRESHOLD = 1;
    WEAK_THRESHOLD = 2;
    __name(isEnglishKeyword, "isEnglishKeyword");
  }
});

// src/lib/competitor.ts
var competitor_exports = {};
__export(competitor_exports, {
  addCompetitor: () => addCompetitor,
  analyzeCompetitor: () => analyzeCompetitor,
  computeGap: () => computeGap,
  deleteCompetitor: () => deleteCompetitor,
  extractKeywordsFromUrls: () => extractKeywordsFromUrls,
  fetchCompetitorSitemap: () => fetchCompetitorSitemap,
  getCompetitors: () => getCompetitors
});
async function fetchWithTimeout(url, _timeoutMs = 1e4) {
  try {
    const resp = await fetch(url, { redirect: "follow" });
    if (!resp.ok) {
      console.log(`[competitor] Fetch failed for ${url}: HTTP ${resp.status}`);
      return null;
    }
    const text = await resp.text();
    if (!text || text.trim().length === 0) {
      console.log(`[competitor] Empty response for ${url}`);
      return null;
    }
    return text;
  } catch (err) {
    console.log(`[competitor] Fetch error for ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
async function fetchCompetitorSitemap(domain) {
  const candidates = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap.xml`,
    `https://${domain}/sitemap.xml.gz`
  ];
  let xml = null;
  for (const url of candidates) {
    xml = await fetchWithTimeout(url);
    if (xml && xml.trim().length > 0 && xml.includes("<")) {
      console.log(`[competitor] Sitemap found at ${url}, length: ${xml.length}`);
      break;
    }
  }
  if (!xml) {
    console.log(`[competitor] No sitemap found for ${domain}`);
    return [];
  }
  if (xml.includes("<sitemapindex")) {
    console.log(`[competitor] Detected sitemap index for ${domain}`);
    const locs2 = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    const childUrls = locs2.map((m) => m.replace(/<\/?loc>/g, "").trim()).filter((u) => u.startsWith("http"));
    console.log(`[competitor] Found ${childUrls.length} child sitemaps`);
    const ranked = childUrls.map((url) => {
      const lower = url.toLowerCase();
      const hits = PRODUCT_SITEMAP_HINTS.reduce((sum, h) => lower.includes(h) ? sum + 1 : sum, 0);
      return { url, hits };
    }).sort((a, b) => b.hits - a.hits).map((x) => x.url);
    const allUrls = [];
    for (const childUrl of ranked.slice(0, MAX_CHILD_SITEMAPS)) {
      const childXml = await fetchWithTimeout(childUrl);
      if (childXml) {
        const childLocs = childXml.match(/<loc>([^<]+)<\/loc>/g) || [];
        const childPageUrls = childLocs.map((m) => m.replace(/<\/?loc>/g, "").trim()).filter((u) => u.startsWith("http"));
        console.log(`[competitor] Child sitemap ${childUrl}: ${childPageUrls.length} URLs`);
        allUrls.push(...childPageUrls);
      }
    }
    console.log(`[competitor] Total URLs from sitemap index: ${allUrls.length}`);
    return allUrls;
  }
  const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = locs.map((m) => m.replace(/<\/?loc>/g, "").trim()).filter((u) => u.startsWith("http"));
  console.log(`[competitor] Total URLs from sitemap: ${urls.length}`);
  return urls;
}
function extractKeywordFromUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    let rawPath = url.pathname;
    try {
      rawPath = decodeURIComponent(rawPath);
    } catch {
    }
    const path = rawPath.replace(/^\//, "").replace(/\/$/, "").replace(/\.html?$/i, "");
    if (!path) return null;
    const slug = path.split("/").pop() || "";
    if (!slug || slug.length < 3) return null;
    const words = slug.replace(/[-_]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));
    if (words.length === 0) return null;
    const keyword = words.join(" ").toLowerCase();
    return keyword;
  } catch {
    return null;
  }
}
function extractKeywordFromTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) return null;
  const title = titleMatch[1].replace(/\s*\|.*$/, "").replace(/\s*-.*$/, "").trim();
  if (title.length < 5 || title.length > 100) return null;
  const words = title.toLowerCase().split(/\s+/).filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  if (words.length < 2) return null;
  return words.join(" ");
}
function isIndustryRelevant(keyword) {
  const lower = keyword.toLowerCase();
  return INDUSTRY_SEEDS.some((seed) => lower.includes(seed));
}
async function extractKeywordsFromUrls(urls) {
  const keywords = [];
  const seen = /* @__PURE__ */ new Set();
  let extractedCount = 0;
  let filteredCount = 0;
  let sampleKeywords = [];
  for (const url of urls) {
    const kw = extractKeywordFromUrl(url);
    if (kw) {
      extractedCount++;
      if (sampleKeywords.length < 5) sampleKeywords.push(kw);
      if (!seen.has(kw) && isEnglishKeyword(kw) && isIndustryRelevant(kw)) {
        seen.add(kw);
        keywords.push({ keyword: kw, url, source: "sitemap" });
      } else {
        filteredCount++;
      }
    }
  }
  console.log(`[competitor] URL extraction: ${extractedCount} raw keywords, ${filteredCount} filtered, ${keywords.length} kept`);
  console.log(`[competitor] Sample keywords: ${sampleKeywords.join(", ")}`);
  const titleUrls = urls.filter((u) => {
    const path = new URL(u).pathname;
    return path.includes("/product") || path.includes("/category") || path.includes("/blog");
  }).slice(0, 10);
  const batchSize = 5;
  for (let i = 0; i < titleUrls.length; i += batchSize) {
    const batch = titleUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (url) => {
        const html = await fetchWithTimeout(url, 8e3);
        if (!html) return null;
        const kw = extractKeywordFromTitle(html);
        if (kw && !seen.has(kw) && isEnglishKeyword(kw) && isIndustryRelevant(kw)) {
          seen.add(kw);
          return { keyword: kw, url, source: "title" };
        }
        return null;
      })
    );
    keywords.push(...results.filter(Boolean));
  }
  return { keywords, extractedCount, filteredCount, sampleKeywords };
}
async function getCompetitors(env) {
  return await getJSON(env.SEO_DATA, "competitors:list") ?? [];
}
async function addCompetitor(env, domain, name) {
  const list = await getCompetitors(env);
  if (list.some((c) => c.domain === domain)) return null;
  const entry = {
    domain,
    name: name || domain,
    addedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastAnalyzed: null
  };
  list.push(entry);
  await setJSON(env.SEO_DATA, "competitors:list", list);
  return entry;
}
async function deleteCompetitor(env, domain) {
  const list = await getCompetitors(env);
  const filtered = list.filter((c) => c.domain !== domain);
  if (filtered.length === list.length) return false;
  await setJSON(env.SEO_DATA, "competitors:list", filtered);
  await env.SEO_DATA.delete(`competitor:${domain}:keywords`);
  return true;
}
async function analyzeCompetitor(env, domain) {
  const urls = await fetchCompetitorSitemap(domain);
  console.log(`[competitor] Sitemap fetch for ${domain}: ${urls.length} URLs`);
  if (urls.length === 0) {
    return { keywordCount: 0, error: "\u65E0\u6CD5\u83B7\u53D6 sitemap\uFF0C\u8BF7\u786E\u8BA4\u57DF\u540D\u6B63\u786E\u4E14 sitemap \u516C\u5F00\u53EF\u8BBF\u95EE" };
  }
  const { keywords, extractedCount, filteredCount, sampleKeywords } = await extractKeywordsFromUrls(urls);
  console.log(`[competitor] Keyword extraction for ${domain}: ${keywords.length} keywords (${extractedCount} raw, ${filteredCount} filtered)`);
  await setJSON(env.SEO_DATA, `competitor:${domain}:keywords`, keywords);
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const list = await getCompetitors(env);
  const index = list.findIndex((c) => c.domain === domain);
  if (index >= 0) {
    list[index].lastAnalyzed = nowIso;
  } else {
    console.log(`[competitor] ${domain} missing from list (KV eventual consistency), upserting`);
    list.push({ domain, name: domain, addedAt: nowIso, lastAnalyzed: nowIso });
  }
  await setJSON(env.SEO_DATA, "competitors:list", list);
  return {
    keywordCount: keywords.length,
    debug: { urlCount: urls.length, extracted: extractedCount, filtered: filteredCount, samples: sampleKeywords }
  };
}
async function getOurKeywords(env) {
  const ourSet = /* @__PURE__ */ new Set();
  for (let i = 1; i <= 7; i++) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const rankings = await getRankings(env.SEO_DATA, dateStr);
    if (rankings && rankings.length > 0) {
      for (const r of rankings) {
        ourSet.add(r.keyword.toLowerCase().trim());
      }
      break;
    }
  }
  return ourSet;
}
async function computeGap(env) {
  const ourKeywords = await getOurKeywords(env);
  const competitors = await getCompetitors(env);
  const keywordMap = /* @__PURE__ */ new Map();
  for (const comp of competitors) {
    const keywords = await getJSON(
      env.SEO_DATA,
      `competitor:${comp.domain}:keywords`
    );
    if (!keywords) continue;
    for (const kw of keywords) {
      const normalized = kw.keyword.toLowerCase().trim();
      if (!normalized || !isEnglishKeyword(normalized)) continue;
      if (!keywordMap.has(normalized)) {
        keywordMap.set(normalized, []);
      }
      keywordMap.get(normalized).push({ domain: comp.domain, url: kw.url });
    }
  }
  const gaps = [];
  for (const [keyword, competitors2] of keywordMap) {
    if (!ourKeywords.has(keyword)) {
      gaps.push({
        keyword,
        competitorCount: competitors2.length,
        competitors: competitors2,
        ourStatus: "missing"
      });
    }
  }
  gaps.sort((a, b) => b.competitorCount - a.competitorCount);
  return gaps;
}
var PRODUCT_SITEMAP_HINTS, MAX_CHILD_SITEMAPS, STOP_WORDS, INDUSTRY_SEEDS;
var init_competitor = __esm({
  "src/lib/competitor.ts"() {
    "use strict";
    init_kv();
    init_lang_filter();
    PRODUCT_SITEMAP_HINTS = ["product", "wire", "mesh", "category", "catalog", "collection", "shop"];
    MAX_CHILD_SITEMAPS = 6;
    STOP_WORDS = /* @__PURE__ */ new Set([
      "the",
      "a",
      "an",
      "for",
      "of",
      "to",
      "in",
      "and",
      "with",
      "or",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "shall",
      "can",
      "need",
      "dare",
      "ought",
      "used",
      "at",
      "by",
      "from",
      "on",
      "over",
      "under",
      "between",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "into",
      "out",
      "about",
      "against",
      "within",
      "without",
      "along",
      "across",
      "behind",
      "beyond",
      "plus",
      "except",
      "but",
      "up",
      "down",
      "off",
      "than",
      "then",
      "that",
      "this",
      "these",
      "those",
      "it",
      "its",
      "he",
      "she",
      "they",
      "we",
      "you",
      "i",
      "me",
      "him",
      "her",
      "them",
      "us",
      "my",
      "your",
      "his",
      "our",
      "their",
      "what",
      "which",
      "who",
      "whom",
      "where",
      "when",
      "why",
      "how",
      "all",
      "each",
      "every",
      "both",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "too",
      "very",
      "just",
      "because",
      "as",
      "until",
      "while",
      "page",
      "html",
      "htm",
      "php",
      "asp",
      "aspx",
      "jsp"
    ]);
    INDUSTRY_SEEDS = [
      "gabion",
      "mesh",
      "wire",
      "fence",
      "fencing",
      "metal",
      "steel",
      "barbed",
      "razor",
      "chain link",
      "welded",
      "screen",
      "netting",
      "post",
      "panel",
      "barrier",
      "security",
      "iron",
      "aluminum",
      "galvanized",
      "pvc",
      "coated",
      "stainless",
      "carbon",
      "hexagonal",
      "square",
      "rectangular",
      "diamond",
      "cattle",
      "horse",
      "farm",
      "agricultural",
      "industrial",
      "construction",
      "building",
      "garden",
      "decorative",
      "reinforcement",
      "concrete",
      "plastering",
      "stucco",
      "rockfall",
      "slope",
      "erosion",
      "retaining",
      "hedge",
      "privacy",
      "temporary",
      "portable",
      "mobile",
      "crowd",
      "control",
      "traffic",
      "road",
      "highway",
      "airport",
      "military",
      "prison",
      "perimeter",
      "basket",
      "box",
      "mattress",
      "sack",
      "bag",
      "roll",
      "sheet",
      "coil",
      "strip",
      "rod",
      "cable",
      "nail",
      "staple",
      "tie",
      "clip",
      "clamp",
      "connector",
      "supplier",
      "manufacturer",
      "factory",
      "wholesale",
      "export",
      "price",
      "cost",
      "buy",
      "custom",
      "specification",
      "standard",
      "size",
      "gauge",
      "diameter",
      "width",
      "height",
      "length",
      "weight",
      "strength",
      "durability",
      "corrosion",
      "rust"
    ];
    __name(fetchWithTimeout, "fetchWithTimeout");
    __name(fetchCompetitorSitemap, "fetchCompetitorSitemap");
    __name(extractKeywordFromUrl, "extractKeywordFromUrl");
    __name(extractKeywordFromTitle, "extractKeywordFromTitle");
    __name(isIndustryRelevant, "isIndustryRelevant");
    __name(extractKeywordsFromUrls, "extractKeywordsFromUrls");
    __name(getCompetitors, "getCompetitors");
    __name(addCompetitor, "addCompetitor");
    __name(deleteCompetitor, "deleteCompetitor");
    __name(analyzeCompetitor, "analyzeCompetitor");
    __name(getOurKeywords, "getOurKeywords");
    __name(computeGap, "computeGap");
  }
});

// src/lib/keyword-cluster.ts
var keyword_cluster_exports = {};
__export(keyword_cluster_exports, {
  MAX_VARIANTS_PER_ARTICLE: () => MAX_VARIANTS_PER_ARTICLE,
  buildKeywordGroups: () => buildKeywordGroups,
  cacheCluster: () => cacheCluster,
  collectCandidates: () => collectCandidates,
  getPublishedKeywords: () => getPublishedKeywords,
  isProductKeyword: () => isProductKeyword,
  isValidGroupId: () => isValidGroupId,
  keywordWeight: () => keywordWeight,
  listGroupDefs: () => listGroupDefs,
  loadCachedCluster: () => loadCachedCluster,
  loadOverrides: () => loadOverrides,
  matchGroupId: () => matchGroupId,
  normalizeKeyword: () => normalizeKeyword,
  pickArticleKeywords: () => pickArticleKeywords,
  runClustering: () => runClustering,
  saveOverrides: () => saveOverrides,
  selectGroups: () => selectGroups
});
function isProductKeyword(keyword) {
  const kw = normalizeKeyword(keyword);
  if (!kw) return false;
  if (NOISE_EXACT.has(kw)) return false;
  return !NOISE_PATTERNS.some((p) => kw.includes(p));
}
function normalizeKeyword(keyword) {
  return String(keyword ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}
function matchGroupId(keyword) {
  const kw = normalizeKeyword(keyword);
  if (!kw) return null;
  for (const group of PRODUCT_GROUPS) {
    if (group.patterns.some((p) => kw.includes(p))) {
      return group.id;
    }
  }
  return null;
}
function keywordWeight(item) {
  const impressions = Number(item.impressions ?? 0);
  const competitorCount = Number(item.competitorCount ?? 0);
  const position = Number(item.position ?? 100);
  const opportunityBonus = item.source === "gsc_opportunity" ? 60 : 0;
  const gapBonus = item.source === "competitor_gap" ? 40 : 0;
  const rankUrgency = Math.max(0, 100 - Math.min(position, 100)) * 1.5;
  return impressions * 0.3 + competitorCount * 80 + opportunityBonus + gapBonus + rankUrgency;
}
function buildKeywordGroups(items, overrides = { assign: {}, exclude: [] }, publishedKeywords = []) {
  const excluded = new Set(overrides.exclude.map(normalizeKeyword));
  const buckets = /* @__PURE__ */ new Map();
  const ungrouped = [];
  for (const raw of items) {
    const keyword = normalizeKeyword(raw.keyword);
    if (!keyword || excluded.has(keyword)) continue;
    const item = { ...raw, keyword };
    const forced = overrides.assign[keyword];
    const groupId = forced && isValidGroupId(forced) ? forced : matchGroupId(keyword) ?? UNGROUPED_ID;
    if (groupId === UNGROUPED_ID) {
      ungrouped.push(item);
      continue;
    }
    if (!buckets.has(groupId)) buckets.set(groupId, []);
    buckets.get(groupId).push(item);
  }
  const publishedByGroup = /* @__PURE__ */ new Map();
  for (const entry of publishedKeywords) {
    const keyword = normalizeKeyword(entry.keyword);
    if (!keyword) continue;
    const groupId = matchGroupId(keyword) ?? UNGROUPED_ID;
    if (!publishedByGroup.has(groupId)) publishedByGroup.set(groupId, []);
    publishedByGroup.get(groupId).push({ keyword, slug: entry.slug });
  }
  const groups = [];
  for (const def of PRODUCT_GROUPS) {
    const keywords = buckets.get(def.id) ?? [];
    if (keywords.length === 0) continue;
    keywords.sort((a, b) => b.weight - a.weight);
    const coveredList = publishedByGroup.get(def.id) ?? [];
    const coveredKeywords = coveredList.map((c) => c.keyword);
    groups.push({
      id: def.id,
      name: def.name,
      productLine: def.productLine,
      primaryKeyword: keywords[0].keyword,
      keywords,
      totalWeight: Math.round(keywords.reduce((sum, k) => sum + k.weight, 0)),
      totalImpressions: keywords.reduce((sum, k) => sum + k.impressions, 0),
      gapCount: keywords.filter((k) => k.source === "competitor_gap").length,
      opportunityCount: keywords.filter((k) => k.source === "gsc_opportunity").length,
      covered: coveredList.length > 0,
      coveredBy: coveredList.length > 0 ? coveredList[0].slug : null,
      coveredKeywords
    });
  }
  groups.sort((a, b) => b.totalWeight - a.totalWeight);
  return {
    groups,
    ungrouped,
    totalKeywords: items.length,
    coveredGroupCount: groups.filter((g) => g.covered).length,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function isValidGroupId(id) {
  return id === UNGROUPED_ID || PRODUCT_GROUPS.some((g) => g.id === id);
}
function listGroupDefs() {
  return PRODUCT_GROUPS.map(({ id, name, productLine }) => ({ id, name, productLine }));
}
async function loadOverrides(env) {
  return await getJSON(env.SEO_DATA, OVERRIDES_KEY) ?? { assign: {}, exclude: [] };
}
async function saveOverrides(env, overrides) {
  await setJSON(env.SEO_DATA, OVERRIDES_KEY, overrides);
}
async function loadCachedCluster(env) {
  return getJSON(env.SEO_DATA, CLUSTER_CACHE_KEY);
}
async function cacheCluster(env, result) {
  await setJSON(env.SEO_DATA, CLUSTER_CACHE_KEY, result);
}
async function getPublishedKeywords(env) {
  const all = await getJSON(
    env.CONTENT_QUEUE,
    "published:all"
  );
  if (!Array.isArray(all)) return [];
  const covered = [];
  for (const p of all) {
    if (!p || !p.slug) continue;
    const pool = [p.keyword ?? "", ...p.variants ?? []];
    for (const raw of pool) {
      const keyword = normalizeKeyword(raw);
      if (keyword) covered.push({ keyword, slug: p.slug });
    }
  }
  return covered;
}
async function collectCandidates(env) {
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  let filteredNonEnglish = 0;
  let filteredNoise = 0;
  const usable = /* @__PURE__ */ __name((keyword) => {
    if (!isEnglishKeyword(keyword)) {
      filteredNonEnglish++;
      return false;
    }
    if (!isProductKeyword(keyword)) {
      filteredNoise++;
      return false;
    }
    return true;
  }, "usable");
  const gapData = await env.SEO_DATA.get("competitors:gap");
  let gapCount = 0;
  if (gapData) {
    try {
      const parsed = JSON.parse(gapData);
      for (const gap of parsed.gaps ?? []) {
        const keyword = normalizeKeyword(gap.keyword);
        if (!keyword) continue;
        if (!usable(keyword)) continue;
        if (seen.has(keyword)) continue;
        seen.add(keyword);
        const competitorCount = Number(gap.competitorCount ?? 0);
        items.push({
          keyword,
          source: "competitor_gap",
          impressions: 0,
          clicks: 0,
          position: 100,
          competitorCount,
          weight: keywordWeight({ competitorCount, source: "competitor_gap" })
        });
        gapCount++;
      }
    } catch {
    }
  }
  const opportunities2 = await getJSON(
    env.SEO_DATA,
    "opportunities:weekly"
  );
  let opportunityCount = 0;
  for (const op of opportunities2 ?? []) {
    const keyword = normalizeKeyword(op.keyword);
    if (!keyword) continue;
    if (!usable(keyword)) continue;
    if (seen.has(keyword)) continue;
    seen.add(keyword);
    const impressions = Number(op.impressions ?? 0);
    items.push({
      keyword,
      source: "gsc_opportunity",
      impressions,
      clicks: Number(op.clicks ?? 0),
      position: Number(op.position ?? 100),
      competitorCount: 0,
      weight: keywordWeight({ impressions, position: op.position, source: "gsc_opportunity" })
    });
    opportunityCount++;
  }
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const rankings = await getRankings(env.SEO_DATA, today2) ?? [];
  for (const row of rankings) {
    const keyword = normalizeKeyword(row.keyword);
    if (!keyword) continue;
    if (!usable(keyword)) continue;
    if (seen.has(keyword)) continue;
    seen.add(keyword);
    items.push({
      keyword,
      source: "gsc_ranking",
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      position: Number(row.position ?? 100),
      competitorCount: 0,
      weight: keywordWeight({ impressions: row.impressions, position: row.position, source: "gsc_ranking" })
    });
  }
  if (filteredNonEnglish > 0) {
    console.log(`[cluster] Filtered out ${filteredNonEnglish} non-English keywords`);
  }
  if (filteredNoise > 0) {
    console.log(`[cluster] Filtered out ${filteredNoise} non-product noise keywords`);
  }
  return { items, gapCount, opportunityCount, filteredNonEnglish, filteredNoise };
}
async function runClustering(env) {
  const { items, filteredNonEnglish, filteredNoise } = await collectCandidates(env);
  const overrides = await loadOverrides(env);
  const publishedKeywords = await getPublishedKeywords(env);
  const result = buildKeywordGroups(items, overrides, publishedKeywords);
  result.filteredNonEnglish = filteredNonEnglish;
  result.filteredNoise = filteredNoise;
  await cacheCluster(env, result);
  return result;
}
function selectGroups(result, maxGroups) {
  const pending = result.groups.filter((g) => !g.covered);
  if (pending.length >= maxGroups) {
    return pending.slice(0, maxGroups);
  }
  const partiallyCovered = result.groups.filter((g) => g.covered).map((g) => {
    const coveredSet = new Set(g.coveredKeywords);
    const fresh = g.keywords.filter((k) => !coveredSet.has(k.keyword));
    return { group: g, freshCount: fresh.length, freshWeight: fresh.reduce((s, k) => s + k.weight, 0) };
  }).filter((x) => x.freshCount > 0).sort((a, b) => b.freshWeight - a.freshWeight);
  return [
    ...pending,
    ...partiallyCovered.slice(0, maxGroups - pending.length).map((x) => x.group)
  ];
}
function pickArticleKeywords(group) {
  const coveredSet = new Set(group.coveredKeywords);
  const fresh = group.keywords.filter((k) => !coveredSet.has(k.keyword));
  const pool = fresh.length > 0 ? fresh : group.keywords;
  const primary = pool[0]?.keyword ?? group.primaryKeyword;
  const variants = pool.slice(1, MAX_VARIANTS_PER_ARTICLE).map((k) => k.keyword);
  return { primary, variants };
}
var PRODUCT_GROUPS, UNGROUPED_ID, NOISE_PATTERNS, NOISE_EXACT, MAX_VARIANTS_PER_ARTICLE, OVERRIDES_KEY, CLUSTER_CACHE_KEY;
var init_keyword_cluster = __esm({
  "src/lib/keyword-cluster.ts"() {
    "use strict";
    init_kv();
    init_lang_filter();
    PRODUCT_GROUPS = [
      {
        id: "gabion",
        name: "Gabion / \u77F3\u7B3C\u7F51",
        productLine: "gabion",
        patterns: ["gabion", "galfan", "rock cage", "rockfall", "retaining wall basket", "mattress"]
      },
      {
        id: "razor-wire",
        name: "Razor Wire / \u5200\u7247\u523A\u7EF3",
        productLine: "razor-wire",
        patterns: ["razor wire", "razor tape", "concertina", "barbed tape"]
      },
      {
        id: "barbed-wire",
        name: "Barbed Wire / \u523A\u94C1\u4E1D",
        productLine: "barbed-wire",
        patterns: ["barbed wire", "barb wire", "barbed"]
      },
      {
        id: "chain-link",
        name: "Chain Link Fence / \u52FE\u82B1\u7F51",
        productLine: "chain-link",
        patterns: ["chain link", "chain-link", "cyclone fence", "cyclone wire", "diamond mesh fence"]
      },
      {
        id: "welded-mesh",
        name: "Welded Wire Mesh / \u710A\u63A5\u7F51",
        productLine: "welded-mesh",
        patterns: [
          "welded wire mesh",
          "welded mesh",
          "weldmesh",
          "welded panel",
          "welded fence",
          "welded wire",
          "masonry"
        ]
      },
      {
        id: "hexagonal-mesh",
        name: "Hexagonal Wire Mesh / \u516D\u89D2\u7F51",
        productLine: "hexagonal-mesh",
        patterns: ["hexagonal", "hex mesh", "chicken wire", "poultry netting", "hex netting"]
      },
      {
        id: "woven-mesh",
        name: "Woven Wire Mesh / \u7F16\u7EC7\u7F51",
        productLine: "woven-mesh",
        patterns: ["woven wire", "woven mesh", "crimped mesh", "dutch weave", "square mesh"]
      },
      {
        id: "security-fence",
        name: "Security Fence / \u5B89\u5168\u9632\u62A4\u56F4\u680F",
        productLine: "security-fence",
        patterns: [
          "security fence",
          "perimeter fence",
          "perimeter fencing",
          "prison fence",
          "anti climb",
          "anti-climb",
          "crowd control",
          "temporary fence",
          "358 fence",
          "358 mesh",
          "palisade",
          "high security",
          "airport fence",
          "airport perimeter",
          "military",
          "warehouse fencing",
          "warehouse fence"
        ]
      },
      {
        id: "fence-panel",
        name: "Fence Panels / \u56F4\u680F\u7F51\u7247\uFF083D / BRC / \u53CC\u4E1D\uFF09",
        productLine: "fence-panel",
        patterns: [
          "3d fence",
          "3d panel",
          "panel fence",
          "fence panel",
          "brc fence",
          "brc roll",
          "brc wire",
          "double wire",
          "clear view",
          "wire partition",
          "partition panel",
          "curved fence",
          "v mesh"
        ]
      },
      {
        id: "farm-fence",
        name: "Farm & Field Fence / \u519C\u7267\u56F4\u680F",
        productLine: "farm-fence",
        patterns: ["farm fence", "field fence", "cattle", "livestock", "horse fence", "deer fence", "agricultural"]
      },
      {
        id: "fence-accessories",
        name: "Posts & Accessories / \u56F4\u680F\u914D\u4EF6",
        productLine: "fence-accessories",
        patterns: ["fence post", "t post", "y post", "gate", "tension wire", "fence clamp", "tie wire"]
      },
      // 丝材先判：避免 "stainless steel wire"（丝）被不锈钢网组抢走
      {
        id: "wire-products",
        name: "Wire Products / \u4E1D\u6750",
        productLine: "wire",
        patterns: [
          "wire rod",
          "steel wire",
          "galvanized wire",
          "binding wire",
          "annealed wire",
          "stainless wire",
          "stainless steel wire",
          "oval wire",
          "flat wire"
        ]
      },
      // ── 工业过滤网 / 特种合金网系列 ──
      // 必须排在通用 wire-mesh 之前：
      // "stainless steel mesh" 同时命中 "steel mesh"，顺序反了会被通用组吞掉。
      {
        id: "stainless-mesh",
        name: "Stainless Steel Mesh / \u4E0D\u9508\u94A2\u7F51",
        productLine: "stainless-mesh",
        patterns: ["stainless steel", "stainless", "steel screen"]
      },
      {
        id: "nickel-mesh",
        name: "Nickel Mesh / \u954D\u7F51",
        productLine: "nickel-mesh",
        patterns: ["nickel"]
      },
      {
        id: "copper-brass-mesh",
        name: "Copper & Brass Mesh / \u94DC\u7F51\u9EC4\u94DC\u7F51",
        productLine: "copper-brass-mesh",
        patterns: ["copper", "brass", "bronze"]
      },
      {
        id: "filter-mesh",
        name: "Filter & Screen Mesh / \u8FC7\u6EE4\u7F51\u7B5B\u7F51",
        productLine: "filter-mesh",
        patterns: [
          "filter mesh",
          "filter screen",
          "filtration",
          "filter disc",
          "filter",
          "sieve",
          "screening",
          "screen mesh",
          "epoxy coated",
          "epoxy",
          "fine mesh",
          "dutch twill"
        ]
      },
      {
        id: "wire-mesh",
        name: "Wire Mesh / \u91D1\u5C5E\u7F51\uFF08\u901A\u7528\uFF09",
        productLine: "wire-mesh",
        patterns: [
          "wire mesh",
          "steel mesh",
          "metal mesh",
          "mesh sheet",
          "mesh roll",
          "expanded metal",
          "mesh fence",
          "wire fence",
          "steel fence",
          "mesh fencing"
        ]
      }
    ];
    UNGROUPED_ID = "ungrouped";
    NOISE_PATTERNS = [
      "privacy policy",
      "terms of service",
      "terms and conditions",
      "cookie policy",
      "about us",
      "contact us",
      "factory tour",
      "company profile",
      "our history",
      "introduction video",
      "product video",
      "wholesale introduction",
      "canton fair",
      "trade show",
      "exhibition",
      "shengsen",
      "new opportunities",
      "weed mat",
      "careers",
      "job vacancy",
      "download catalog",
      // 竞品站内页：质量巡检、深加工介绍等，不是可选题的产品词
      "quality inspection",
      "further processing",
      "yingkaimo"
    ];
    NOISE_EXACT = /* @__PURE__ */ new Set([
      "products",
      "product",
      "home",
      "about",
      "contact",
      "service",
      "services",
      "news",
      "blog",
      "faq",
      "gallery",
      "video",
      "download",
      "index"
    ]);
    __name(isProductKeyword, "isProductKeyword");
    MAX_VARIANTS_PER_ARTICLE = 8;
    __name(normalizeKeyword, "normalizeKeyword");
    __name(matchGroupId, "matchGroupId");
    __name(keywordWeight, "keywordWeight");
    __name(buildKeywordGroups, "buildKeywordGroups");
    __name(isValidGroupId, "isValidGroupId");
    __name(listGroupDefs, "listGroupDefs");
    OVERRIDES_KEY = "keyword-groups:overrides";
    CLUSTER_CACHE_KEY = "keyword-groups:latest";
    __name(loadOverrides, "loadOverrides");
    __name(saveOverrides, "saveOverrides");
    __name(loadCachedCluster, "loadCachedCluster");
    __name(cacheCluster, "cacheCluster");
    __name(getPublishedKeywords, "getPublishedKeywords");
    __name(collectCandidates, "collectCandidates");
    __name(runClustering, "runClustering");
    __name(selectGroups, "selectGroups");
    __name(pickArticleKeywords, "pickArticleKeywords");
  }
});

// src/lib/banner-gen.ts
var banner_gen_exports = {};
__export(banner_gen_exports, {
  applyBannerToHtml: () => applyBannerToHtml,
  buildBannerPrompt: () => buildBannerPrompt,
  generateBannerImage: () => generateBannerImage,
  imageFormatToContentType: () => imageFormatToContentType
});
function buildBannerPrompt(keyword) {
  const kw = keyword.toLowerCase();
  if (kw.includes("gabion")) {
    return `gabion wire mesh cages filled with natural stones, retaining wall construction site, sunny blue sky, ${BRIGHT_BASE}`;
  }
  if (kw.includes("chain link") || kw.includes("chain-link")) {
    return `galvanized chain link fence installation, metallic steel mesh, industrial security perimeter, ${BRIGHT_BASE}`;
  }
  if (kw.includes("razor wire") || kw.includes("razor-wire")) {
    return `razor wire concertina coil on security fence, industrial perimeter protection, ${BRIGHT_BASE}`;
  }
  if (kw.includes("barbed wire") || kw.includes("barbed-wire")) {
    return `barbed wire fence line, rural agricultural boundary, bright green field, morning sunlight, ${BRIGHT_BASE}`;
  }
  if (kw.includes("welded wire") || kw.includes("welded-wire")) {
    return `welded wire mesh panels, modern industrial fencing, clean geometric patterns, bright warehouse, ${BRIGHT_BASE}`;
  }
  if (kw.includes("hexagonal") || kw.includes("hexagonal wire")) {
    return `hexagonal wire mesh chicken netting, agricultural fencing, bright green countryside, sunny daylight, ${BRIGHT_BASE}`;
  }
  if (kw.includes("security fence") || kw.includes("high security")) {
    return `high security fence system with anti-climb mesh, industrial facility perimeter, ${BRIGHT_BASE}`;
  }
  if (kw.includes("fence post") || kw.includes("post")) {
    return `metal fence posts installation, steel Y-post and T-post, construction site, ${BRIGHT_BASE}`;
  }
  if (kw.includes("wire mesh")) {
    return `wire mesh manufacturing, steel wire grid panels, bright modern factory interior, ${BRIGHT_BASE}`;
  }
  if (kw.includes("galvanized")) {
    return `galvanized steel wire products, shiny metallic surface, well-lit industrial setting, ${BRIGHT_BASE}`;
  }
  if (kw.includes("358") || kw.includes("anti-climb")) {
    return `358 high security anti-climb fence, prison grade security fencing, industrial facility, ${BRIGHT_BASE}`;
  }
  if (kw.includes("stainless") || kw.includes("nickel") || kw.includes("copper") || kw.includes("filter")) {
    return `stainless steel wire mesh and filter screens, fine metallic weave close-up, clean bright workshop, ${BRIGHT_BASE}`;
  }
  if (kw.includes("manufacturer") || kw.includes("supplier") || kw.includes("factory")) {
    return `metal fencing manufacturing facility, large-scale industrial production, bright well-lit factory interior, ${BRIGHT_BASE}`;
  }
  if (kw.includes("guide") || kw.includes("buying") || kw.includes("b2b")) {
    return `industrial metal fencing products showcase, professional B2B catalog style, clean bright studio background, well-lit, ${BRIGHT_BASE}`;
  }
  return `industrial metal fencing and wire mesh products, professional B2B photography, clean bright composition, ${BRIGHT_BASE}`;
}
async function submitBannerTask(apiKey, prompt) {
  const resp = await fetch(DASHSCOPE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-DashScope-Async": "enable"
    },
    body: JSON.stringify({
      model: "wanx-v1",
      input: { prompt },
      parameters: {
        style: "<photography>",
        size: "1280*720",
        n: 1
      }
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Banner generation submit error (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("No task_id in banner generation response");
  return taskId;
}
async function pollBannerResult(apiKey, taskId) {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const resp = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Banner poll error (${resp.status}): ${errText}`);
    }
    const data = await resp.json();
    const status = data.output.task_status;
    console.log(`[banner-gen] Task ${taskId}: ${status} (attempt ${i + 1})`);
    if (status === "SUCCEEDED") {
      const urls = data.output.results?.map((r) => r.url) ?? [];
      if (urls.length === 0) throw new Error("Banner task succeeded but no image URL returned");
      return urls[0];
    }
    if (status === "FAILED") {
      throw new Error(`Banner task failed: ${data.output.message ?? "unknown error"}`);
    }
  }
  throw new Error(`Banner task ${taskId} timed out after ${MAX_POLL_ATTEMPTS} polls`);
}
function applyBannerToHtml(html, bannerUrl) {
  let out = html.replace(
    /background-image:url\('[^']*'\);/,
    `background-image:url('${bannerUrl}');`
  );
  out = out.replace(
    /"image":\s*"https:\/\/[^"]*"/,
    `"image": "https://www.kestrelmetal.com${bannerUrl}"`
  );
  return out;
}
async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function detectImageFormat(b) {
  if (b.length < 12) return null;
  if (b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80) {
    return "webp";
  }
  if (b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) return "png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "jpeg";
  return null;
}
function imageFormatToContentType(fmt) {
  return fmt === "png" ? "image/png" : fmt === "jpeg" ? "image/jpeg" : "image/webp";
}
function validateBannerImage(bytes) {
  const b = new Uint8Array(bytes);
  if (b.length < 3e4) {
    throw new Error(`banner too small (${b.length} bytes), likely truncated`);
  }
  const format = detectImageFormat(b);
  if (!format) {
    throw new Error(`banner is not a recognised image (magic: ${b[0]?.toString(16)} ${b[1]?.toString(16)} ${b[2]?.toString(16)} ${b[3]?.toString(16)})`);
  }
  let width = 0;
  let height = 0;
  if (format === "png") {
    width = b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19];
    height = b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23];
  } else if (format === "jpeg") {
    let offset = 2;
    while (offset + 9 < b.length) {
      if (b[offset] !== 255) {
        offset++;
        continue;
      }
      const marker = b[offset + 1];
      if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        height = b[offset + 5] << 8 | b[offset + 6];
        width = b[offset + 7] << 8 | b[offset + 8];
        break;
      }
      offset += 2 + (b[offset + 2] << 8 | b[offset + 3]);
    }
  } else {
    const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (fourcc === "VP8X") {
      width = 1 + (b[24] | b[25] << 8 | b[26] << 16);
      height = 1 + (b[27] | b[28] << 8 | b[29] << 16);
    } else if (fourcc === "VP8L") {
      width = 1 + ((b[21] | b[22] << 8) & 16383);
      height = 1 + ((b[22] >> 6 | b[23] << 2 | b[24] << 10) & 16383);
    } else if (fourcc === "VP8 ") {
      if (b[23] === 157 && b[24] === 1 && b[25] === 42) {
        width = (b[26] | b[27] << 8) & 16383;
        height = (b[28] | b[29] << 8) & 16383;
      }
    }
  }
  if (width < 1e3 || height < 500) {
    throw new Error(`banner dimensions too small (${width}x${height}), expected 1280x720`);
  }
  console.log(`[banner-gen] Validated banner: ${format} ${width}x${height}, ${b.length} bytes`);
  return { format };
}
async function generateBannerImage(env, keyword, slug) {
  if (!env.QWEN_API_KEY) {
    console.log("[banner-gen] No QWEN_API_KEY configured, skipping banner generation");
    return null;
  }
  if (!env.IMAGES) {
    console.log("[banner-gen] No IMAGES bucket configured, skipping banner generation");
    return null;
  }
  const prompt = buildBannerPrompt(keyword);
  console.log(`[banner-gen] Generating banner for: ${slug} (keyword: ${keyword})`);
  try {
    const taskId = await submitBannerTask(env.QWEN_API_KEY, prompt);
    console.log(`[banner-gen] Submitted task ${taskId} for ${slug}`);
    const imageUrl2 = await pollBannerResult(env.QWEN_API_KEY, taskId);
    const imgResp = await fetch(imageUrl2);
    if (!imgResp.ok) throw new Error("Failed to download generated banner image");
    const imageBytes = await imgResp.arrayBuffer();
    const { format } = validateBannerImage(imageBytes);
    const hash = (await sha256Hex(imageBytes)).slice(0, 10);
    const imageKey = `banner/${slug}-hero-${hash}.${format}`;
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: imageFormatToContentType(format),
        cacheControl: "public, max-age=31536000, immutable"
      }
    });
    const bannerUrl = `/images/${imageKey}`;
    console.log(`[banner-gen] Banner saved: ${bannerUrl}`);
    return bannerUrl;
  } catch (err) {
    console.error(`[banner-gen] Failed for ${slug}:`, err instanceof Error ? err.message : err);
    return null;
  }
}
var DASHSCOPE_API_URL, DASHSCOPE_TASK_URL, POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS, BRIGHT_BASE;
var init_banner_gen = __esm({
  "src/lib/banner-gen.ts"() {
    "use strict";
    DASHSCOPE_API_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    DASHSCOPE_TASK_URL = "https://dashscope.aliyuncs.com/api/v1/tasks";
    POLL_INTERVAL_MS = 5e3;
    MAX_POLL_ATTEMPTS = 30;
    BRIGHT_BASE = "bright natural daylight, well-lit, clean composition, professional commercial photography, wide angle, 8k resolution, photorealistic";
    __name(buildBannerPrompt, "buildBannerPrompt");
    __name(submitBannerTask, "submitBannerTask");
    __name(pollBannerResult, "pollBannerResult");
    __name(applyBannerToHtml, "applyBannerToHtml");
    __name(sha256Hex, "sha256Hex");
    __name(detectImageFormat, "detectImageFormat");
    __name(imageFormatToContentType, "imageFormatToContentType");
    __name(validateBannerImage, "validateBannerImage");
    __name(generateBannerImage, "generateBannerImage");
  }
});

// src/cron/gsc-sync.ts
var gsc_sync_exports = {};
__export(gsc_sync_exports, {
  default: () => gscSync
});
function getDateDaysAgo(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString().split("T")[0];
}
async function gscSync(env) {
  const required = [
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GSC_REFRESH_TOKEN,
    env.GSC_SITE_URL
  ];
  if (required.some((value) => !value)) {
    throw new Error("GSC OAuth secrets are not fully configured");
  }
  const date = today();
  let rows = await queryAllKeywords(
    env,
    getDateDaysAgo(3),
    getDateDaysAgo(2)
  );
  if (rows.length === 0) {
    console.log("[gsc-sync] No data for 3-2 days ago, trying wider range...");
    rows = await queryAllKeywords(
      env,
      getDateDaysAgo(28),
      getDateDaysAgo(1)
    );
  }
  if (rows.length === 0) {
    console.log("[gsc-sync] No data found in GSC. Website may need more time to be indexed.");
  }
  const rankings = rows.map((row) => ({
    keyword: row.keys[0] ?? "",
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr,
    position: row.position,
    date
  })).filter((record) => record.keyword.length > 0);
  await saveRankings(env.SEO_DATA, date, rankings);
  await env.SEO_DATA.put("gsc:last_sync:details", JSON.stringify({
    timestamp: now(),
    date,
    siteUrl: env.GSC_SITE_URL,
    rows: rankings.length
  }));
  console.log(`[gsc-sync] Saved ${rankings.length} keyword rows for ${date}`);
  if (rankings.length > 0) {
    try {
      const items = await opportunities(rankings);
      await env.SEO_DATA.put("opportunities:weekly", JSON.stringify(items));
      console.log(`[gsc-sync] Identified ${items.length} content opportunities`);
    } catch (err) {
      console.error("[gsc-sync] Opportunity analysis failed:", err);
    }
  }
}
var DAY_MS;
var init_gsc_sync = __esm({
  "src/cron/gsc-sync.ts"() {
    "use strict";
    init_gsc();
    init_kv();
    init_opportunity();
    DAY_MS = 864e5;
    __name(getDateDaysAgo, "getDateDaysAgo");
    __name(gscSync, "gscSync");
  }
});

// src/lib/deepseek.ts
async function callDeepSeek(env, systemPrompt, userPrompt) {
  const resp = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4e3
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`DeepSeek API error (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  return data.choices[0]?.message?.content ?? "";
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function sanitizeArticleHtml(html) {
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<script\b[^>]*>/gi, "");
  out = out.replace(/<a\b[^>]*(display\s*:\s*none|visibility\s*:\s*hidden)[^>]*>([\s\S]*?)<\/a>/gi, "");
  out = out.replace(/<a\b[^>]*(display\s*:\s*none|visibility\s*:\s*hidden)[^>]*\/?>/gi, "");
  out = out.replace(/<\/?(?:html|head|body|article|main|aside)\b[^>]*>/gi, "");
  const tags = ["details", "table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "div", "p", "blockquote", "figure", "strong", "em", "h2", "h3", "h4"];
  const warnings = [];
  for (const tag of tags) {
    const opens = (out.match(new RegExp(`<${tag}(?:\\s|>)`, "gi")) || []).length;
    const closes = (out.match(new RegExp(`</${tag}\\s*>`, "gi")) || []).length;
    if (opens > closes) {
      const missing = opens - closes;
      warnings.push(`<${tag}> x${missing} unclosed`);
      out += `</${tag}>`.repeat(missing);
    }
  }
  if (warnings.length > 0) {
    console.warn(`[deepseek] sanitize: auto-closed ${warnings.join(", ")}`);
  }
  return out.trim();
}
function escAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function getSidebarData(keyword) {
  const kw = keyword.toLowerCase();
  for (const entry of KEYWORD_SIDEBARS) {
    if (entry.match.some((m) => kw.includes(m))) return entry.data;
  }
  return DEFAULT_SIDEBAR;
}
function buildSidebarHtml(keyword) {
  const data = getSidebarData(keyword);
  const tagHtml = data.categories.map((c) => `<a href="blog-news.html" class="blog-sidebar-tag">${c}</a>`).join("\n                  ");
  const postHtml = data.posts.map((p) => `<li><a href="${p.href}">${p.title}</a></li>`).join("\n                ");
  const productHtml = data.products.map(
    (p) => `<a href="${p.href}" class="blog-sidebar-product-card">
                  <div class="blog-sidebar-product-card-img">
                    <img src="${p.img}" alt="${escAttr(p.name)}" loading="lazy" decoding="async">
                  </div>
                  <div class="blog-sidebar-product-card-info">
                    <h4>${p.name}</h4>
                    <p>${p.desc}</p>
                  </div>
                </a>`
  ).join("\n                ");
  return `<aside class="article-sidebar">
            <div class="article-sidebar-card">
              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Category</div>
                <div class="blog-sidebar-tags">
                  ${tagHtml}
                </div>
              </div>

              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Related Posts</div>
                <ul class="blog-sidebar-links">
                  ${postHtml}
                </ul>
              </div>

              <div class="blog-sidebar-section">
                <div class="blog-sidebar-label">Related Products</div>
                <div class="blog-sidebar-products">
                  ${productHtml}
                </div>
              </div>
            </div>
          </aside>`;
}
async function generateOutline(env, request) {
  const systemPrompt = `You are an expert B2B SEO content writer specializing in metal fencing, gabion boxes, razor wire, and industrial security products. You write for an international audience (English). Always respond in valid JSON format.`;
  const variantList = (request.variants ?? []).filter(Boolean);
  const variantBlock = variantList.length > 0 ? `
Secondary keywords (same product family, must be woven into this single article):
${variantList.map((v) => `- ${v}`).join("\n")}

When structuring sections, allocate at least one H2 or H3 to each secondary keyword so the article ranks for the whole keyword group instead of a single phrase.` : "";
  const repairHints = (request.repairHints ?? []).filter(Boolean);
  const repairBlock = repairHints.length > 0 ? `
10. This is a REGENERATION. The previous draft scored poorly; fix these specific weaknesses:
${repairHints.map((h) => `   - ${h}`).join("\n")}` : "";
  const userPrompt = `Create a detailed SEO blog article outline for the target keyword: "${request.keyword}"${variantBlock}

Requirements:
1. Title should be compelling, include the keyword, and be under 60 characters
2. Meta description should be 150-160 characters, include the keyword, and have a clear CTA
3. Structure should have 4-6 H2 sections, each with 2-3 H3 subsections
4. Include 3-5 FAQ questions with answers
5. Target word count: 2000-3000 words
6. Content should be professional, informative, and suitable for B2B buyers
7. Include practical tips, specifications, and industry insights
8. Write in English, professional tone
9. GEO requirements (content must be quotable by AI search engines):
   - definitionSentence: a self-contained definition ("${request.keyword.replace(/"/g, "")} is a \u2026") that makes sense when quoted out of context; include the product category and primary use case
   - Every FAQ answer must stand alone and contain at least one concrete number with a unit (e.g. "15-25 days", "zinc 40-270 g/m\xB2", "mesh 50-75mm")${repairBlock}
Respond in this exact JSON format:
{
  "title": "Article title with keyword",
  "metaDescription": "150-160 char meta description",
  "h1": "Main heading",
  "definitionSentence": "Self-contained definition sentence",
  "sections": [
    {
      "h2": "Section heading",
      "h3s": ["Subsection 1", "Subsection 2"],
      "content": "Brief content outline for this section"
    }
  ],
  "faq": [
    {
      "question": "FAQ question?",
      "answer": "Concise answer with a concrete number+unit fact"
    }
  ],
  "internalLinks": ["suggested anchor text for internal links"],
  "targetWordCount": 2500
}`;
  const response = await callDeepSeek(env, systemPrompt, userPrompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Failed to parse outline JSON from DeepSeek response");
  }
}
async function generateArticle(env, outline, keyword, variants = [], repairHints = []) {
  const systemPrompt = `You are an expert B2B SEO content writer for Kestrel Metal (kestrelmetal.com), a leading manufacturer of metal fencing, gabion boxes, razor wire, and industrial security products. Write comprehensive, SEO-optimized content in English. Always respond with valid HTML content only (no markdown, no code blocks).`;
  const userPrompt = `Write a complete SEO-optimized blog article based on this outline:

Title: ${outline.title}
Target Keyword: ${keyword}
Target Word Count: ${outline.targetWordCount}

Sections:
${outline.sections.map((s, i) => `
## ${i + 1}. ${s.h2}
${s.h3s.map((h3) => `### ${h3}`).join("\n")}
${s.content}
`).join("\n")}

FAQ Section:
${outline.faq.map((f) => `Q: ${f.question}
A: ${f.answer}`).join("\n\n")}

${variants.length > 0 ? `
Secondary keywords to cover in this same article (each at least 1-2 times, ideally as its own subsection heading):
${variants.map((v) => `- ${v}`).join("\n")}
` : ""}
Requirements:
1. Write in professional B2B English
2. Include the target keyword "${keyword}" naturally 8-12 times
3. Use semantic variations of the keyword${variants.length > 0 ? " and cover every secondary keyword listed above" : ""}
4. Include specific product specifications where relevant
5. Add practical tips and industry insights
6. Each section should be 300-500 words
7. Use short paragraphs (2-3 sentences)
8. Include bullet points and numbered lists where appropriate
9. Reference Kestrel Metal products naturally
10. End with a compelling conclusion and CTA
11. GEO requirements (AI search engines must be able to quote this article):
    - The VERY FIRST sentence of the article body must be this self-contained definition, verbatim: ${outline.definitionSentence ? `"${outline.definitionSentence}"` : `a self-contained definition of "${keyword}" ("${keyword} is a \u2026") that makes sense when quoted alone`}
    - Every H2 section must contain at least one fact written as a concrete number with a unit (mm, m, g/m\xB2, MPA, tons/month, days, %, gauge, etc.)
    - Render comparisons as HTML <table> when two or more options are contrasted${variants.length > 0 ? " (including a main keyword vs secondary keyword comparison table)" : ""}
${repairHints.length > 0 ? `12. This is a REGENERATION. The previous draft was rejected by automated scoring; fix these specific weaknesses:
${repairHints.map((h) => `    - ${h}`).join("\n")}
` : ""}
Output ONLY the HTML content for the article body (no <html>, <head>, <body> tags). Use proper semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <table>, <tr>, <td>.`;
  const htmlContent = await callDeepSeek(env, systemPrompt, userPrompt);
  const sanitizedHtml = sanitizeArticleHtml(htmlContent);
  const wordCount = sanitizedHtml.split(/\s+/).length;
  const slug = slugify(outline.title);
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const aiHeroImage = `images/blog/${slug}-hero.webp`;
  const keywordToHero = {
    "epoxy": "images/blog/epoxy-coated-wire-mesh.webp",
    "filter": "images/blog/epoxy-coated-wire-mesh.webp",
    "stainless": "images/blog/epoxy-coated-wire-mesh.webp",
    "nickel": "images/blog/epoxy-coated-wire-mesh.webp",
    "copper": "images/blog/epoxy-coated-wire-mesh.webp",
    "brass": "images/blog/epoxy-coated-wire-mesh.webp",
    "gabion": "images/blog/blog-gabion-market-hero.webp",
    "chain-link": "images/blog/blog-chain-link-yard-hero.webp",
    "chain link": "images/blog/blog-chain-link-yard-hero.webp",
    "razor-wire": "images/blog/blog-razor-coils-hero.avif",
    "barbed-wire": "images/blog/blog-barbed-cost-hero.webp",
    "welded-wire": "images/blog/welded-mesh-711.webp",
    "welded mesh": "images/blog/welded-mesh-711.webp",
    "hexagonal": "images/blog/blog-hex-mesh-hero.webp",
    "security-fence": "images/blog/dual-fence-hero.webp",
    "anti-climb": "images/blog/dual-fence-hero.webp",
    "358": "images/blog/dual-fence-hero.webp",
    "wire-mesh": "images/blog/epoxy-coated-wire-mesh.webp",
    "wire mesh": "images/blog/epoxy-coated-wire-mesh.webp",
    "fence": "images/blog/blog-gabion-market-hero.webp"
  };
  let heroFallback = "images/blog/blog-gabion-market-hero.webp";
  for (const [kw, img] of Object.entries(keywordToHero)) {
    if (keyword.toLowerCase().includes(kw)) {
      heroFallback = img;
      break;
    }
  }
  const heroImage = aiHeroImage;
  const heroImageFallback = heroFallback;
  const faqHtml = outline.faq.map((f) => `
      <details class="faq-item faq-detail">
        <summary>${f.question}</summary>
        <p>${f.answer}</p>
      </details>`).join("\n");
  const faqSchema = outline.faq.length > 0 ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ${JSON.stringify(outline.faq.map((f) => ({
    "@type": "Question",
    text: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer }
  })), null, 2).replace(/</g, "\\u003c")}
  }
  <\/script>` : "";
  const articleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${outline.title} | KESTREL METAL</title>
  <meta name="description" content="${outline.metaDescription}">
  <meta name="keywords" content="${[keyword, ...variants].join(", ")}, kestrel metal, metal fencing, industrial security">
  <link rel="canonical" href="https://www.kestrelmetal.com/${slug}.html">
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/navbar.css">
  <link rel="stylesheet" href="css/article.css">
  <link rel="stylesheet" href="css/footer.css">
  <script src="js/analytics-loader.js" async><\/script>
  <script src="js/seo-enhance.js" async><\/script>
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="shortcut icon" href="favicon.ico">
  <meta name="msapplication-TileColor" content="#FF6B35">
  <meta name="theme-color" content="#FF6B35">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.kestrelmetal.com/"},
      {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://www.kestrelmetal.com/resources.html"},
      {"@type": "ListItem", "position": 3, "name": "Blog & News", "item": "https://www.kestrelmetal.com/blog-news.html"},
      {"@type": "ListItem", "position": 4, "name": "${outline.title}", "item": "https://www.kestrelmetal.com/${slug}.html"}
    ]
  }
  <\/script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${outline.title}",
    "description": "${outline.metaDescription}",
    "author": {"@type": "Organization", "name": "Kestrel Metal", "url": "https://www.kestrelmetal.com"},
    "publisher": {"@type": "Organization", "name": "Kestrel Metal", "url": "https://www.kestrelmetal.com"},
    "datePublished": "${today2}",
    "dateModified": "${today2}",
    "mainEntityOfPage": {"@type": "WebPage", "@id": "https://www.kestrelmetal.com/${slug}.html"},
    "keywords": "${[keyword, ...variants].join(", ")}",
    "wordCount": ${wordCount},
    "image": "https://www.kestrelmetal.com/${heroImageFallback}"
  }
  <\/script>${faqSchema}
</head>
<body>
  <div id="navbar-placeholder"></div>
  <main>
    <section class="article-hero">
      <div class="article-hero-bg" style="background-image:url('${heroImageFallback}');"></div>
      <div class="article-hero-overlay"></div>
      <div class="article-hero-content" data-reveal>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Home</a>
          <span class="breadcrumb-sep">/</span>
          <a href="resources.html">Resources</a>
          <span class="breadcrumb-sep">/</span>
          <a href="blog-news.html">Blog &amp; News</a>
          <span class="breadcrumb-sep">/</span>
          <span class="current">${outline.h1}</span>
        </nav>
        <span class="article-hero-kicker">Industry Guide</span>
        <h1 class="article-hero-title">${outline.h1}</h1>
        <div class="article-hero-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${today2}</span>
          <span class="article-hero-unread"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${Math.ceil(wordCount / 250)} min read</span>
        </div>
      </div>
    </section>
    <section class="article-body">
      <div class="article-container">
        <div class="article-grid">
          <div class="article-main">
            <a href="blog-news.html" class="article-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              Back to Blog &amp; News
            </a>
            <article class="article-content">
              ${sanitizedHtml}
            </article>
            <section class="article-faq">
              <h2>Frequently Asked Questions</h2>
              ${faqHtml}
            </section>
            <div class="article-inquiry-cta">
              <p>Looking for reliable ${keyword} solutions? At Kestrel Metal, we manufacture premium metal products with worldwide shipping and 24-hour quote response. <a class="inquiry-cta-link" href="contact.html">Request a Quote</a> today for customized specifications and competitive pricing.</p>
            </div>
            <div class="share-section" data-page-url="https://www.kestrelmetal.com/${slug}.html" data-page-title="${escAttr(outline.title)} | KESTREL METAL">
              <span class="share-label">Share</span>
              <a href="#" class="share-btn" data-share="linkedin" title="Share on LinkedIn" target="_blank" rel="noopener"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
              <a href="#" class="share-btn" data-share="twitter" title="Share on Twitter" target="_blank" rel="noopener"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg></a>
              <a href="#" class="share-btn" data-share="email" title="Share via Email"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
            </div>
            <div class="article-post-nav">
              <a href="blog-news.html" class="prev">
                <div class="nav-label">&larr; Previous</div>
                <div class="nav-title">Back to Blog &amp; News</div>
              </a>
              <a href="blog-news.html" class="next">
                <div class="nav-label">Next &rarr;</div>
                <div class="nav-title">More Blog &amp; News</div>
              </a>
            </div>
          </div>

          ${buildSidebarHtml(keyword)}
        </div>
      </div>
    </section>
  </main>
  <div id="footer-placeholder"></div>
  <script src="js/includes.js"><\/script>
  <script src="js/blog-detail.js"><\/script>
</body>
</html>`;
  return {
    slug,
    title: outline.title,
    metaDescription: outline.metaDescription,
    html: articleHtml,
    keyword,
    variants,
    wordCount,
    heroImage
  };
}
async function generateFullArticle(env, request) {
  console.log(`[deepseek] Generating outline for keyword: ${request.keyword}`);
  const outline = await generateOutline(env, request);
  console.log(`[deepseek] Generating article: ${outline.title}`);
  const article = await generateArticle(env, outline, request.keyword, request.variants ?? [], request.repairHints ?? []);
  article.variants = request.variants ?? [];
  console.log(`[deepseek] Article generated: ${article.wordCount} words`);
  return article;
}
var DEEPSEEK_API_URL, KEYWORD_SIDEBARS, DEFAULT_SIDEBAR;
var init_deepseek = __esm({
  "src/lib/deepseek.ts"() {
    "use strict";
    DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
    __name(callDeepSeek, "callDeepSeek");
    __name(slugify, "slugify");
    __name(sanitizeArticleHtml, "sanitizeArticleHtml");
    __name(escAttr, "escAttr");
    KEYWORD_SIDEBARS = [
      {
        match: ["razor"],
        data: {
          categories: ["Security", "Razor Wire"],
          posts: [
            { href: "blog-razor-coils-7-things.html", title: "7 Things You Probably Didn't Know About Razor Coils" },
            { href: "blog-nato22-razor-wire.html", title: "NATO-22 Certified Razor Wire: Meeting Global Military Security Standards" },
            { href: "blog-border-razor-wire-deployment.html", title: "Razor Wire Is Most Visible Result of $210M Troop Deployment to US-Mexico Border" }
          ],
          products: [
            { href: "razor-wire-btc.html", img: "images/blog/btc-razor-wire.webp", name: "BTC Barbed Tape Concertina", desc: "Military-grade NATO-22 standard" },
            { href: "razor-wire-cross.html", img: "images/wire-razor-hero.webp", name: "Cross Concertina Razor Wire", desc: "Interlocking crossed coils" },
            { href: "razor-wire-welded-mesh.html", img: "images/fence-security-hero.webp", name: "Welded Razor Mesh", desc: "Rigid mesh panels" }
          ]
        }
      },
      {
        match: ["gabion"],
        data: {
          categories: ["Gabion", "Sourcing Guide"],
          posts: [
            { href: "blog-gabion-box-selection-guide.html", title: "How to Select the Right Gabion Box" },
            { href: "blog-how-to-install-welded-gabion-boxes.html", title: "How to Install Welded Gabion Boxes: A Complete Step-by-Step Guide" },
            { href: "blog-welded-vs-twisted-gabion.html", title: "Welded vs Twisted Gabion: Which to Choose" }
          ],
          products: [
            { href: "gabion-boxes.html", img: "images/gabion-box-1.webp", name: "Gabion Boxes", desc: "Welded mesh stone cages" },
            { href: "gabion-mattresses.html", img: "images/gabion-mattress.webp", name: "Gabion Mattresses", desc: "Erosion control revetments" },
            { href: "double-twisted-gabion.html", img: "images/gabion-landscaping.webp", name: "Double Twisted Gabion", desc: "Hexagonal woven baskets" }
          ]
        }
      },
      {
        match: ["chain link", "chain-link"],
        data: {
          categories: ["Fencing", "Chain Link"],
          posts: [
            { href: "blog-chain-link-selection.html", title: "How to Select the Right Chain Link Fence" },
            { href: "blog-chain-link-evolution.html", title: "The Evolution of Chain Link Fence: 2024 and Beyond" },
            { href: "blog-galvanized-vs-pvc.html", title: "Galvanized vs PVC Coated Chain Link" }
          ],
          products: [
            { href: "galvanized-chain-link.html", img: "images/chain-link-overview.webp", name: "Galvanized Chain Link", desc: "Hot-dip zinc coating" },
            { href: "chain-link-security-fence.html", img: "images/chain-link-pvc.webp", name: "Chain Link Security Fence", desc: "PVC coated options" },
            { href: "chain-link.html", img: "images/chain-link-privacy.webp", name: "Chain Link Fencing", desc: "All gauge options" }
          ]
        }
      },
      {
        match: ["barbed"],
        data: {
          categories: ["Fencing", "Barbed Wire"],
          posts: [
            { href: "blog-barb-wire-gates-tips.html", title: "Tips for Opening and Closing Barb Wire Gates" },
            { href: "blog-nato22-razor-wire.html", title: "NATO-22 Certified Razor Wire" },
            { href: "blog-border-razor-wire-deployment.html", title: "Razor Wire at the US-Mexico Border" }
          ],
          products: [
            { href: "barbed-wire-concertina.html", img: "images/wire-barbed-hero.webp", name: "Barbed Wire Concertina", desc: "Coiled barrier wire" },
            { href: "barbed-wire-galvanized.html", img: "images/wire-razor-hero.webp", name: "Galvanized Barbed Wire", desc: "Standard IOWA type" },
            { href: "hot-dip-galvanized.html", img: "images/fence-security-hero.webp", name: "Hot Dip Galvanized Wire", desc: "Zinc coated fencing wire" }
          ]
        }
      },
      {
        match: ["cattle", "livestock", "farm", "field fence", "deer", "horse"],
        data: {
          categories: ["Agriculture", "Field Fence"],
          posts: [
            { href: "blog-field-fence-installation.html", title: "Field Fence Installation Guide" },
            { href: "blog-fence-liability-escaped-animals.html", title: "Fence Liability: Escaped Animals" },
            { href: "blog-installation-mistakes.html", title: "10 Common Mistakes When Installing Wire Mesh Fencing" }
          ],
          products: [
            { href: "fence-farm.html", img: "images/app-horse-paddocks.webp", name: "Farm Fence", desc: "Livestock fencing rolls" },
            { href: "hinge-joint-knot.html", img: "images/app-garden-fence.webp", name: "Hinge Joint Knot Fence", desc: "Flexible livestock mesh" },
            { href: "fixed-knot-fence.html", img: "images/app-tree-guard.webp", name: "Fixed Knot Fence", desc: "High-tension game fence" }
          ]
        }
      },
      {
        match: ["3d panel", "3d-panel", "358", "anti-climb", "high security", "security fence", "prison"],
        data: {
          categories: ["Security", "High Security Fence"],
          posts: [
            { href: "blog-dual-fence-security.html", title: "Dual Fence Security System: Why Two Perimeter Barriers Multiply Security" },
            { href: "blog-razor-coils-7-things.html", title: "7 Things You Probably Didn't Know About Razor Coils" },
            { href: "blog-installation-mistakes.html", title: "10 Common Mistakes When Installing Wire Mesh Fencing" }
          ],
          products: [
            { href: "fence-3d.html", img: "images/fence-security-hero.webp", name: "3D Panel Fence", desc: "V-profile welded panels" },
            { href: "358-security-fence.html", img: "images/blog/dual-fence-hero.webp", name: "358 Security Fence", desc: "Anti-climb small mesh" },
            { href: "fence-security.html", img: "images/welded-mesh-711.webp", name: "Security Fencing", desc: "Perimeter solutions" }
          ]
        }
      },
      {
        match: ["hexagonal", "chicken"],
        data: {
          categories: ["Agriculture", "Hexagonal Mesh"],
          posts: [
            { href: "blog-squirrel-proof-wire-mesh.html", title: "Squirrel Proof Wire Mesh" },
            { href: "blog-materials-welded-wire-mesh.html", title: "Materials Used in Welded Wire Mesh" },
            { href: "blog-specification-sheet.html", title: "Wire Mesh Specification Sheet: How to Read Technical Data" }
          ],
          products: [
            { href: "hexagonal-wire.html", img: "images/hexagonal-wire.webp", name: "Hexagonal Wire Mesh", desc: "Chicken netting rolls" },
            { href: "hexagonal-wire-galvanized.html", img: "images/hexagonal-wire.webp", name: "Galvanized Hexagonal Wire", desc: "Zinc coated netting" },
            { href: "hexagonal-wire-pvc.html", img: "images/app-rabbit-cage.webp", name: "PVC Coated Hexagonal", desc: "Green coated mesh" }
          ]
        }
      }
    ];
    DEFAULT_SIDEBAR = {
      categories: ["Buying Guide", "Wire Mesh"],
      posts: [
        { href: "blog-specification-sheet.html", title: "Wire Mesh Specification Sheet: How to Read and Interpret Technical Data" },
        { href: "blog-materials-welded-wire-mesh.html", title: "Materials Used in Welded Wire Mesh" },
        { href: "blog-installation-mistakes.html", title: "10 Common Mistakes When Installing Wire Mesh Fencing" }
      ],
      products: [
        { href: "fence-products.html", img: "images/welded-mesh-711.webp", name: "Welded Wire Mesh", desc: "Panels and rolls" },
        { href: "galvanized-chain-link.html", img: "images/chain-link-overview.webp", name: "Galvanized Chain Link", desc: "Hot-dip zinc coating" },
        { href: "gabion-boxes.html", img: "images/gabion-box-1.webp", name: "Gabion Boxes", desc: "Welded mesh stone cages" }
      ]
    };
    __name(getSidebarData, "getSidebarData");
    __name(buildSidebarHtml, "buildSidebarHtml");
    __name(generateOutline, "generateOutline");
    __name(generateArticle, "generateArticle");
    __name(generateFullArticle, "generateFullArticle");
  }
});

// src/lib/image-gen.ts
async function submitImageTask(apiKey, prompt, size) {
  const resp = await fetch(DASHSCOPE_API_URL2, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-DashScope-Async": "enable"
    },
    body: JSON.stringify({
      model: "wanx-v1",
      input: { prompt },
      parameters: {
        style: "<photography>",
        size,
        n: 1
      }
    })
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`DashScope submit error (${resp.status}): ${errText}`);
  }
  const data = await resp.json();
  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("No task_id in response");
  return taskId;
}
async function pollTaskResult(apiKey, taskId) {
  for (let i = 0; i < MAX_POLL_ATTEMPTS2; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS2));
    const resp = await fetch(`${DASHSCOPE_TASK_URL2}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`DashScope poll error (${resp.status}): ${errText}`);
    }
    const data = await resp.json();
    const status = data.output.task_status;
    console.log(`[image-gen] Task ${taskId}: ${status} (attempt ${i + 1})`);
    if (status === "SUCCEEDED") {
      const urls = data.output.results?.map((r) => r.url) ?? [];
      if (urls.length === 0) throw new Error("Task succeeded but no image URLs returned");
      return urls;
    }
    if (status === "FAILED") {
      throw new Error(`Task failed: ${data.output.message ?? "unknown error"}`);
    }
  }
  throw new Error(`Task ${taskId} timed out after ${MAX_POLL_ATTEMPTS2} polls`);
}
async function generateSingleImage(env, request) {
  if (!env.QWEN_API_KEY) {
    console.log(`[image-gen] No API key configured, using placeholder`);
    return {
      key: `placeholders/${request.keyword.replace(/\s+/g, "-")}-${Date.now()}.jpg`,
      url: "/images/placeholder.jpg",
      width: request.width ?? 1024,
      height: request.height ?? 1024,
      type: "hero"
    };
  }
  const prompt = buildPrompt(request);
  const size = "1024*1024";
  console.log(`[image-gen] Submitting task for: ${request.keyword}`);
  const taskId = await submitImageTask(env.QWEN_API_KEY, prompt, size);
  console.log(`[image-gen] Polling task ${taskId}...`);
  const imageUrls = await pollTaskResult(env.QWEN_API_KEY, taskId);
  const imgResp = await fetch(imageUrls[0]);
  if (!imgResp.ok) throw new Error("Failed to download generated image");
  const imageBytes = await imgResp.arrayBuffer();
  const imageKey = request.keyOverride || `blog/${request.keyword.replace(/\s+/g, "-")}-${Date.now()}.jpg`;
  if (env.IMAGES) {
    await env.IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000"
      }
    });
  }
  return {
    key: imageKey,
    url: `/images/${imageKey}`,
    width: request.width ?? 1024,
    height: request.height ?? 1024,
    type: "hero"
  };
}
function buildPrompt(request) {
  const productPrompts = {
    "chain-link": "galvanized chain link fence installation, metallic silver steel mesh, industrial security fencing on a construction site",
    gabion: "gabion box wire mesh cage filled with natural stone, landscape retaining wall, erosion control in outdoor setting",
    razor: "razor wire concertina coil on top of security fence, industrial perimeter protection, bright daylight",
    welded: "welded wire mesh panel fence, double wire construction, modern industrial fencing, clean professional look",
    "high-security": "high-security fence with barbed wire topping, anti-climb mesh, perimeter protection system at industrial facility"
  };
  const productDesc = productPrompts[request.productLine ?? ""] ?? "metal fencing products, industrial security solutions, wire mesh manufacturing";
  const styleModifiers = {
    industrial: "factory background, warehouse setting, large-scale installation, bright even lighting",
    product: "product showcase, clean white background, detailed close-up, studio lighting",
    scene: "real-world installation, outdoor setting, natural environment, bright daylight",
    detail: "extreme close-up, texture detail, material quality focus, macro photography"
  };
  const styleDesc = styleModifiers[request.style ?? "industrial"] ?? styleModifiers.industrial;
  return `${productDesc}, ${styleDesc}, professional industrial photography, high-end commercial product photography, studio lighting, warm industrial tones, 8k resolution, photorealistic, sharp focus, depth of field`;
}
async function generateArticleImages(env, keyword, slug, productLine) {
  const images = [];
  const heroKey = slug ? `blog/${slug}-hero.webp` : void 0;
  try {
    const heroImage = await generateSingleImage(env, {
      keyword,
      productLine,
      style: "industrial",
      width: 1280,
      height: 720,
      keyOverride: heroKey
    });
    heroImage.type = "hero";
    images.push(heroImage);
  } catch (err) {
    console.error(`[image-gen] Hero image failed for ${keyword}:`, err);
  }
  const contentStyles = [
    { style: "product", width: 800, height: 600 },
    { style: "scene", width: 800, height: 600 }
  ];
  for (const contentStyle of contentStyles) {
    try {
      const contentImage = await generateSingleImage(env, {
        keyword,
        productLine,
        style: contentStyle.style,
        width: contentStyle.width,
        height: contentStyle.height
      });
      contentImage.type = "content";
      images.push(contentImage);
    } catch (err) {
      console.error(`[image-gen] Content image failed for ${keyword}:`, err);
    }
  }
  return images;
}
var DASHSCOPE_API_URL2, DASHSCOPE_TASK_URL2, POLL_INTERVAL_MS2, MAX_POLL_ATTEMPTS2;
var init_image_gen = __esm({
  "src/lib/image-gen.ts"() {
    "use strict";
    DASHSCOPE_API_URL2 = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
    DASHSCOPE_TASK_URL2 = "https://dashscope.aliyuncs.com/api/v1/tasks";
    POLL_INTERVAL_MS2 = 5e3;
    MAX_POLL_ATTEMPTS2 = 30;
    __name(submitImageTask, "submitImageTask");
    __name(pollTaskResult, "pollTaskResult");
    __name(generateSingleImage, "generateSingleImage");
    __name(buildPrompt, "buildPrompt");
    __name(generateArticleImages, "generateArticleImages");
  }
});

// src/cron/generate.ts
var generate_exports = {};
__export(generate_exports, {
  default: () => generate
});
async function generate(env) {
  const result = {
    selectedKeywords: [],
    generated: 0,
    errors: [],
    gapCount: 0,
    opportunityCount: 0,
    groups: [],
    cluster: { totalGroups: 0, coveredGroups: 0, totalKeywords: 0, ungroupedCount: 0 }
  };
  if (!env.DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key not configured");
  }
  console.log("[generate] Starting weekly content generation...");
  const clusterResult = await runClustering(env);
  result.cluster = {
    totalGroups: clusterResult.groups.length,
    coveredGroups: clusterResult.coveredGroupCount,
    totalKeywords: clusterResult.totalKeywords,
    ungroupedCount: clusterResult.ungrouped.length
  };
  result.gapCount = clusterResult.groups.reduce((sum, g) => sum + g.gapCount, 0);
  result.opportunityCount = clusterResult.groups.reduce((sum, g) => sum + g.opportunityCount, 0);
  console.log(
    `[generate] Clustered ${clusterResult.totalKeywords} keywords into ${clusterResult.groups.length} groups (${clusterResult.coveredGroupCount} already covered)`
  );
  let selectedGroups = selectGroups(clusterResult, MAX_GROUPS_PER_RUN);
  if (selectedGroups.length === 0) {
    console.log("[generate] No cluster candidates, falling back to default keyword groups");
    selectedGroups = buildFallbackGroups();
  }
  result.selectedKeywords = selectedGroups.map((g) => g.primaryKeyword);
  console.log(`[generate] Selected ${selectedGroups.length} keyword groups`);
  console.log(`[generate] Groups: ${selectedGroups.map((g) => `${g.id}(${g.keywords.length} kw)`).join(", ")}`);
  for (const group of selectedGroups) {
    try {
      const { primary, variants } = pickArticleKeywords(group);
      console.log(`[generate] Processing group "${group.id}"`);
      console.log(`[generate] Primary: "${primary}" | Variants: ${variants.join(", ") || "(none)"}`);
      const article = await generateFullArticle(
        {
          DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
          DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || "deepseek-chat"
        },
        {
          keyword: primary,
          variants,
          productLine: group.productLine,
          targetAudience: "B2B buyers, contractors, security professionals"
        }
      );
      await saveDraft(env.CONTENT_QUEUE, {
        slug: article.slug,
        title: article.title,
        metaDescription: article.metaDescription,
        html: article.html,
        keyword: article.keyword,
        groupId: group.id,
        variants: article.variants ?? variants,
        status: "queued",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        score: void 0,
        scoreRound: void 0,
        images: []
      });
      result.generated++;
      result.groups.push({
        groupId: group.id,
        groupName: group.name,
        primaryKeyword: primary,
        variants,
        slug: article.slug
      });
      console.log(`[generate] Article saved: ${article.slug} (${article.wordCount} words, covers ${variants.length + 1} keywords)`);
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`group "${group.id}": ${errMsg}`);
      console.error(`[generate] Failed to generate article for group "${group.id}":`, errMsg);
    }
  }
  console.log(`[generate] Completed. Generated ${result.generated} articles. Errors: ${result.errors.length}`);
  await generateImagesForDrafts(env);
  return result;
}
function buildFallbackGroups() {
  const mk = /* @__PURE__ */ __name((id, name, productLine, primary, variants) => {
    const keywords = [primary, ...variants].map((keyword, index) => ({
      keyword,
      source: "gsc_ranking",
      impressions: 0,
      clicks: 0,
      position: 100,
      competitorCount: 0,
      weight: 100 - index * 5
    }));
    return {
      id,
      name,
      productLine,
      primaryKeyword: primary,
      keywords,
      totalWeight: keywords.reduce((s, k) => s + k.weight, 0),
      totalImpressions: 0,
      gapCount: 0,
      opportunityCount: 0,
      covered: false,
      coveredBy: null,
      coveredKeywords: []
    };
  }, "mk");
  return [
    mk(
      "chain-link",
      "Chain Link Fence / \u52FE\u82B1\u7F51",
      "chain-link",
      "galvanized chain link fence",
      ["chain link fence supplier", "chain link fence price", "chain link mesh roll"]
    ),
    mk(
      "gabion",
      "Gabion / \u77F3\u7B3C\u7F51",
      "gabion",
      "gabion boxes supplier",
      ["gabion basket manufacturer", "welded gabion box", "gabion retaining wall"]
    )
  ];
}
async function generateImagesForDrafts(env) {
  console.log("[generate] Starting image generation for drafts...");
  const keys = await listKeys(env.CONTENT_QUEUE, "draft:");
  if (keys.length === 0) {
    console.log("[generate] No drafts found for image generation");
    return;
  }
  let processed = 0;
  for (const key of keys) {
    const draft = await getJSON(env.CONTENT_QUEUE, key.name);
    if (!draft || draft.status !== "queued" || draft.images && draft.images.length > 0) {
      continue;
    }
    try {
      console.log(`[generate] Generating images for: ${draft.slug}`);
      const images = await generateArticleImages(
        {
          QWEN_API_KEY: env.QWEN_API_KEY,
          QWEN_MODEL: env.QWEN_MODEL,
          IMAGES: env.IMAGES
        },
        draft.keyword,
        draft.slug
      );
      await setJSON(env.CONTENT_QUEUE, key.name, {
        ...draft,
        status: "image_gen",
        images: images.map((img) => img.url),
        imageKeys: images.map((img) => img.key)
      });
      processed++;
      console.log(`[generate] Generated ${images.length} images for ${draft.slug}`);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    } catch (err) {
      console.error(`[generate] Failed to generate images for ${draft.slug}:`, err);
    }
  }
  console.log(`[generate] Image generation completed. Processed ${processed} drafts.`);
}
var MAX_GROUPS_PER_RUN;
var init_generate = __esm({
  "src/cron/generate.ts"() {
    "use strict";
    init_deepseek();
    init_image_gen();
    init_kv();
    init_keyword_cluster();
    MAX_GROUPS_PER_RUN = 1;
    __name(generate, "generate");
    __name(buildFallbackGroups, "buildFallbackGroups");
    __name(generateImagesForDrafts, "generateImagesForDrafts");
  }
});

// src/lib/seo-score.ts
function scoreSEO(html, keyword) {
  const checks = [];
  const suggestions = [];
  checks.push(checkTitle(html, keyword, suggestions));
  checks.push(checkMetaDescription(html, keyword, suggestions));
  checks.push(checkH1(html, keyword, suggestions));
  checks.push(checkH2Structure(html, suggestions));
  checks.push(checkKeywordDensity(html, keyword, suggestions));
  checks.push(checkInternalLinks(html, suggestions));
  checks.push(checkImageAltText(html, keyword, suggestions));
  checks.push(checkWordCount(html, suggestions));
  checks.push(checkParagraphLength(html, suggestions));
  checks.push(checkFAQ(html, suggestions));
  checks.push(checkSchema(html, suggestions));
  checks.push(checkCanonicalUrl(html, suggestions));
  checks.push(checkOpenGraph(html, suggestions));
  const totalScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.reduce((sum, c) => sum + c.maxScore, 0) * 100
  );
  return {
    totalScore,
    passed: totalScore >= MINIMUM_SCORE,
    checks,
    suggestions
  };
}
function checkTitle(html, keyword, suggestions) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1] ?? "";
  const hasKeyword = title.toLowerCase().includes(keyword.toLowerCase());
  const length = title.length;
  let score2 = 0;
  let message = "";
  if (title && hasKeyword && length >= 30 && length <= 60) {
    score2 = 10;
    message = "Title is optimal";
  } else if (title && hasKeyword) {
    score2 = 7;
    message = `Title length (${length} chars) should be 30-60`;
    suggestions.push("Optimize title length to 30-60 characters");
  } else if (title) {
    score2 = 4;
    message = "Title missing target keyword";
    suggestions.push("Include target keyword in title");
  } else {
    message = "Title tag not found";
    suggestions.push("Add a title tag with target keyword");
  }
  return { name: "Title Tag", passed: score2 >= 7, score: score2, maxScore: 10, message };
}
function checkMetaDescription(html, keyword, suggestions) {
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const desc = metaMatch?.[1] ?? "";
  const hasKeyword = desc.toLowerCase().includes(keyword.toLowerCase());
  const length = desc.length;
  let score2 = 0;
  let message = "";
  if (desc && hasKeyword && length >= 120 && length <= 160) {
    score2 = 10;
    message = "Meta description is optimal";
  } else if (desc && hasKeyword) {
    score2 = 7;
    message = `Description length (${length}) should be 120-160`;
    suggestions.push("Optimize meta description length");
  } else if (desc) {
    score2 = 4;
    message = "Meta description missing keyword";
    suggestions.push("Include keyword in meta description");
  } else {
    message = "Meta description not found";
    suggestions.push("Add meta description with target keyword");
  }
  return { name: "Meta Description", passed: score2 >= 7, score: score2, maxScore: 10, message };
}
function checkH1(html, keyword, suggestions) {
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) ?? [];
  const hasKeyword = h1Matches.some((h) => h.toLowerCase().includes(keyword.toLowerCase()));
  let score2 = 0;
  let message = "";
  if (h1Matches.length === 1 && hasKeyword) {
    score2 = 10;
    message = "H1 is optimal (single tag with keyword)";
  } else if (h1Matches.length === 1) {
    score2 = 6;
    message = "H1 exists but missing keyword";
    suggestions.push("Include keyword in H1 tag");
  } else if (h1Matches.length > 1) {
    score2 = 3;
    message = `Multiple H1 tags found (${h1Matches.length})`;
    suggestions.push("Use only one H1 tag per page");
  } else {
    message = "No H1 tag found";
    suggestions.push("Add an H1 tag with target keyword");
  }
  return { name: "H1 Tag", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkH2Structure(html, suggestions) {
  const h2Matches = html.match(/<h2[^>]*>/gi) ?? [];
  const h3Matches = html.match(/<h3[^>]*>/gi) ?? [];
  let score2 = 0;
  let message = "";
  if (h2Matches.length >= 3 && h3Matches.length >= 2) {
    score2 = 10;
    message = `Good structure: ${h2Matches.length} H2s, ${h3Matches.length} H3s`;
  } else if (h2Matches.length >= 2) {
    score2 = 7;
    message = `Decent structure: ${h2Matches.length} H2s, ${h3Matches.length} H3s`;
    suggestions.push("Add more H2/H3 subheadings for better structure");
  } else if (h2Matches.length >= 1) {
    score2 = 4;
    message = "Needs more subheadings";
    suggestions.push("Add at least 3 H2 sections");
  } else {
    message = "No H2 tags found";
    suggestions.push("Structure content with H2 and H3 tags");
  }
  return { name: "Heading Structure", passed: score2 >= 7, score: score2, maxScore: 10, message };
}
function checkKeywordDensity(html, keyword, suggestions) {
  const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const keywordLower = keyword.toLowerCase();
  const keywordWords = keywordLower.split(/\s+/);
  let count = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const slice = words.slice(i, i + keywordWords.length).join(" ");
    if (slice === keywordLower) count++;
  }
  const density = words.length > 0 ? count / words.length * 100 : 0;
  let score2 = 0;
  let message = "";
  if (density >= 1 && density <= 2.5) {
    score2 = 10;
    message = `Keyword density optimal: ${density.toFixed(2)}% (${count} times)`;
  } else if (density >= 0.5 && density < 1) {
    score2 = 7;
    message = `Keyword density low: ${density.toFixed(2)}%`;
    suggestions.push("Increase keyword usage slightly");
  } else if (density > 2.5 && density <= 4) {
    score2 = 6;
    message = `Keyword density high: ${density.toFixed(2)}%`;
    suggestions.push("Reduce keyword stuffing");
  } else if (density > 4) {
    score2 = 3;
    message = `Keyword stuffing detected: ${density.toFixed(2)}%`;
    suggestions.push("Reduce keyword density to 1-2.5%");
  } else {
    score2 = 2;
    message = `Keyword not found in content`;
    suggestions.push("Include target keyword naturally in content");
  }
  return { name: "Keyword Density", passed: score2 >= 7, score: score2, maxScore: 10, message };
}
function checkInternalLinks(html, suggestions) {
  const linkMatches = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) ?? [];
  const internalLinks = linkMatches.filter((l) => !l.includes("http"));
  let score2 = 0;
  let message = "";
  if (internalLinks.length >= 3) {
    score2 = 10;
    message = `Good: ${internalLinks.length} internal links`;
  } else if (internalLinks.length >= 1) {
    score2 = 6;
    message = `Only ${internalLinks.length} internal links`;
    suggestions.push("Add more internal links to related products");
  } else {
    score2 = 2;
    message = "No internal links found";
    suggestions.push("Add internal links to related product pages");
  }
  return { name: "Internal Links", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkImageAltText(html, keyword, suggestions) {
  const imgMatches = html.match(/<img[^>]*>/gi) ?? [];
  const withAlt = imgMatches.filter((i) => /alt=["'][^"']+["']/i.test(i));
  const withKeyword = withAlt.filter((i) => i.toLowerCase().includes(keyword.toLowerCase()));
  let score2 = 0;
  let message = "";
  if (imgMatches.length === 0) {
    score2 = 5;
    message = "No images found (add images with alt text)";
    suggestions.push("Add images with descriptive alt text");
  } else if (withAlt.length === imgMatches.length && withKeyword.length > 0) {
    score2 = 10;
    message = `All ${imgMatches.length} images have alt text (${withKeyword.length} with keyword)`;
  } else if (withAlt.length === imgMatches.length) {
    score2 = 7;
    message = `All images have alt text (none contain keyword)`;
    suggestions.push("Add keyword to some image alt texts");
  } else {
    score2 = 4;
    message = `${withAlt.length}/${imgMatches.length} images have alt text`;
    suggestions.push("Add alt text to all images");
  }
  return { name: "Image Alt Text", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkWordCount(html, suggestions) {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  let score2 = 0;
  let message = "";
  if (words >= 2e3) {
    score2 = 10;
    message = `Excellent: ${words} words`;
  } else if (words >= 1500) {
    score2 = 8;
    message = `Good: ${words} words (target 2000+)`;
    suggestions.push("Consider adding more content");
  } else if (words >= 1e3) {
    score2 = 5;
    message = `Fair: ${words} words (target 2000+)`;
    suggestions.push("Add more depth to reach 2000+ words");
  } else {
    score2 = 2;
    message = `Too short: ${words} words`;
    suggestions.push("Content needs to be at least 1500 words");
  }
  return { name: "Word Count", passed: score2 >= 8, score: score2, maxScore: 10, message };
}
function checkParagraphLength(html, suggestions) {
  const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi) ?? [];
  const longParagraphs = pMatches.filter((p) => {
    const text = p.replace(/<[^>]+>/g, "");
    return text.split(/\s+/).length > 100;
  });
  let score2 = 10;
  let message = `All paragraphs are concise`;
  if (longParagraphs.length > 0) {
    score2 = 6;
    message = `${longParagraphs.length} paragraphs exceed 100 words`;
    suggestions.push("Break long paragraphs into shorter ones");
  }
  return { name: "Paragraph Length", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkFAQ(html, suggestions) {
  const hasFAQ = /FAQ|Frequently Asked Questions/i.test(html);
  const hasSchema = /FAQPage/i.test(html);
  let score2 = 0;
  let message = "";
  if (hasFAQ && hasSchema) {
    score2 = 10;
    message = "FAQ section with FAQPage schema found";
  } else if (hasFAQ) {
    score2 = 6;
    message = "FAQ section found (missing FAQPage schema)";
    suggestions.push("Add FAQPage schema markup");
  } else {
    score2 = 2;
    message = "No FAQ section found";
    suggestions.push("Add FAQ section with 3-5 questions");
  }
  return { name: "FAQ Section", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkSchema(html, suggestions) {
  const hasArticleSchema = /"@type"\s*:\s*"Article"/i.test(html);
  const hasOrgSchema = /"@type"\s*:\s*"Organization"/i.test(html);
  let score2 = 0;
  let message = "";
  if (hasArticleSchema && hasOrgSchema) {
    score2 = 10;
    message = "Article + Organization schemas found";
  } else if (hasArticleSchema) {
    score2 = 6;
    message = "Article schema found (add Organization)";
    suggestions.push("Add Organization schema");
  } else {
    score2 = 2;
    message = "No structured data found";
    suggestions.push("Add Article and Organization schemas");
  }
  return { name: "Schema Markup", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkCanonicalUrl(html, suggestions) {
  const hasCanonical = /rel=["']canonical["']/i.test(html);
  let score2 = 0;
  let message = "";
  if (hasCanonical) {
    score2 = 10;
    message = "Canonical URL found";
  } else {
    score2 = 3;
    message = "No canonical URL";
    suggestions.push("Add canonical URL");
  }
  return { name: "Canonical URL", passed: score2 >= 6, score: score2, maxScore: 10, message };
}
function checkOpenGraph(html, suggestions) {
  const hasOG = /og:title/i.test(html);
  const hasOGDesc = /og:description/i.test(html);
  const hasOGImage = /og:image/i.test(html);
  let score2 = 0;
  let message = "";
  if (hasOG && hasOGDesc && hasOGImage) {
    score2 = 10;
    message = "Full Open Graph tags found";
  } else if (hasOG || hasOGDesc) {
    score2 = 5;
    message = "Partial Open Graph tags";
    suggestions.push("Add complete Open Graph tags");
  } else {
    score2 = 1;
    message = "No Open Graph tags";
    suggestions.push("Add og:title, og:description, og:image");
  }
  return { name: "Open Graph", passed: score2 >= 5, score: score2, maxScore: 10, message };
}
var MINIMUM_SCORE;
var init_seo_score = __esm({
  "src/lib/seo-score.ts"() {
    "use strict";
    MINIMUM_SCORE = 60;
    __name(scoreSEO, "scoreSEO");
    __name(checkTitle, "checkTitle");
    __name(checkMetaDescription, "checkMetaDescription");
    __name(checkH1, "checkH1");
    __name(checkH2Structure, "checkH2Structure");
    __name(checkKeywordDensity, "checkKeywordDensity");
    __name(checkInternalLinks, "checkInternalLinks");
    __name(checkImageAltText, "checkImageAltText");
    __name(checkWordCount, "checkWordCount");
    __name(checkParagraphLength, "checkParagraphLength");
    __name(checkFAQ, "checkFAQ");
    __name(checkSchema, "checkSchema");
    __name(checkCanonicalUrl, "checkCanonicalUrl");
    __name(checkOpenGraph, "checkOpenGraph");
  }
});

// src/lib/geo-score.ts
function computeGeoScore(html) {
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = noScript.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");
  const blocks = [...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1]
  );
  const types = /* @__PURE__ */ new Set();
  let parseFail = 0;
  for (const src of blocks) {
    try {
      const data = JSON.parse(src);
      for (const d of Array.isArray(data) ? data : [data]) {
        if (d && d["@type"]) types.add(String(d["@type"]));
      }
    } catch {
      parseFail++;
    }
  }
  const relevant = RELEVANT_SCHEMA_TYPES.filter((t) => types.has(t)).length;
  let schema = blocks.length > 0 ? Math.min(100, 40 + relevant * 15) : 0;
  if (parseFail > 0) schema = Math.min(schema, 60);
  let citation = 0;
  if (/<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)) citation += 15;
  if (/\b(?:is|are)\s+(?:a|an|the)\s+[a-z]/i.test(text)) citation += 30;
  if ((html.match(/<h[23][\s>]/gi) || []).length >= 2) citation += 20;
  if (/class=["'][^"']*faq/i.test(html) || /<details[\s>]/i.test(html)) citation += 15;
  if (/<link[^>]+rel=["']canonical["']/i.test(html)) citation += 10;
  if (/<(?:ul|ol)[\s>]/i.test(html)) citation += 10;
  const facts = (text.match(FACT_WITH_UNIT_RE) || []).length;
  const kb = Math.max(1, text.length / 1024);
  const density = Math.min(100, Math.round(facts / kb * 25));
  const score2 = Math.round(schema * 0.4 + citation * 0.3 + density * 0.3);
  return {
    score: score2,
    schema_completeness: Math.round(schema),
    citation_friendliness: Math.round(citation),
    fact_density: density
  };
}
function geoRepairHints(result, html) {
  const hints = [];
  if (result.citation_friendliness < 70) {
    if (!/\b(?:is|are)\s+(?:a|an|the)\s+[a-z]/i.test(html.replace(/<[^>]+>/g, " "))) {
      hints.push(
        'The article body lacks a self-contained definition sentence: the very first sentence must read "<keyword> is a <category> used for <primary use case>" so AI engines can quote it out of context'
      );
    }
    if ((html.match(/<h[23][\s>]/gi) || []).length < 2) {
      hints.push("Add at least 2 H2/H3 headings to structure the content for scannability");
    }
    if (!/<(?:ul|ol)[\s>]/i.test(html)) {
      hints.push("Convert at least one prose block into a <ul> or <ol> list (specifications, steps, or criteria)");
    }
  }
  if (result.fact_density < 40) {
    hints.push(
      "Fact density is too low: add concrete numbers with units in every major section (dimensions in mm/m, coating in g/m\xB2, capacity in tons/month, lead time in days, percentages)"
    );
  }
  if (result.schema_completeness < 70) {
    if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
      hints.push("The FAQ section is missing or empty: include 3-5 FAQ entries with numeric answers");
    }
  }
  return hints;
}
var RELEVANT_SCHEMA_TYPES, FACT_WITH_UNIT_RE;
var init_geo_score = __esm({
  "src/lib/geo-score.ts"() {
    "use strict";
    RELEVANT_SCHEMA_TYPES = [
      "Organization",
      "WebSite",
      "Product",
      "Article",
      "TechArticle",
      "FAQPage",
      "BreadcrumbList",
      "Service",
      "LocalBusiness"
    ];
    FACT_WITH_UNIT_RE = /\d+(?:\.\d+)?\s?(?:%|mm|cm|km|kg|mpa|psi|mesh|gauge|awg|µm|micron|kw|mw|kn|g\/m²?|m[23²]|inch(?:es)?|ft|years?)\b/gi;
    __name(computeGeoScore, "computeGeoScore");
    __name(geoRepairHints, "geoRepairHints");
  }
});

// src/lib/llms.ts
var llms_exports = {};
__export(llms_exports, {
  appendLlmsEntry: () => appendLlmsEntry,
  listLlmsEntries: () => listLlmsEntries,
  mergeLlmsTxt: () => mergeLlmsTxt,
  removeLlmsEntry: () => removeLlmsEntry,
  renderLlmsTxt: () => renderLlmsTxt
});
async function listLlmsEntries(env) {
  return await getJSON(env.SEO_DATA, KV_KEY2) ?? [];
}
async function appendLlmsEntry(env, entry) {
  const entries = await listLlmsEntries(env);
  const next = [
    { ...entry, addedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ...entries.filter((e) => e.slug !== entry.slug)
  ].slice(0, MAX_ENTRIES);
  await setJSON(env.SEO_DATA, KV_KEY2, next);
  console.log(`[llms] Entry upserted: ${entry.slug} (${next.length} total)`);
}
async function removeLlmsEntry(env, slug) {
  const entries = (await listLlmsEntries(env)).filter((e) => e.slug !== slug);
  await setJSON(env.SEO_DATA, KV_KEY2, entries);
}
function escapeLine(text) {
  return text.replace(/\s+/g, " ").trim();
}
function mergeLlmsTxt(baseText, entries) {
  if (entries.length === 0) return baseText;
  const lines = entries.map((e) => {
    const summary = escapeLine(e.summary);
    return `- [${escapeLine(e.title)}](${e.url})${summary ? ` \u2014 ${summary}` : ""}`;
  });
  const section = `## Latest Guides (Auto-Updated)

${lines.join("\n")}`;
  const trimmed = baseText.replace(/\s+$/, "");
  const faqIndex = trimmed.indexOf("\n## FAQ");
  if (faqIndex >= 0) {
    return `${trimmed.slice(0, faqIndex).replace(/\s+$/, "")}

${section}
${trimmed.slice(faqIndex)}
`;
  }
  return `${trimmed}

${section}
`;
}
async function renderLlmsTxt(env) {
  const assetResp = await env.ASSETS.fetch("https://www.kestrelmetal.com/llms.txt");
  const base = assetResp.ok ? await assetResp.text() : "";
  if (!base) {
    console.error("[llms] Static base llms.txt missing from ASSETS");
    return "# KESTREL METAL\n";
  }
  const entries = await listLlmsEntries(env);
  return mergeLlmsTxt(base, entries);
}
var KV_KEY2, MAX_ENTRIES;
var init_llms = __esm({
  "src/lib/llms.ts"() {
    "use strict";
    init_kv();
    KV_KEY2 = "geo:llms:entries";
    MAX_ENTRIES = 50;
    __name(listLlmsEntries, "listLlmsEntries");
    __name(appendLlmsEntry, "appendLlmsEntry");
    __name(removeLlmsEntry, "removeLlmsEntry");
    __name(escapeLine, "escapeLine");
    __name(mergeLlmsTxt, "mergeLlmsTxt");
    __name(renderLlmsTxt, "renderLlmsTxt");
  }
});

// src/lib/indexnow.ts
var indexnow_exports = {};
__export(indexnow_exports, {
  getIndexNowKey: () => getIndexNowKey,
  resolveHost: () => resolveHost,
  submitToIndexNow: () => submitToIndexNow
});
async function getIndexNowKey(env) {
  if (env.INDEXNOW_KEY) return env.INDEXNOW_KEY;
  const stored = await env.SEO_DATA.get("indexnow:key");
  if (stored) return stored;
  const key = crypto.randomUUID().replace(/-/g, "");
  await env.SEO_DATA.put("indexnow:key", key);
  return key;
}
function resolveHost(env) {
  const raw = env.SITE_URL || "https://www.kestrelmetal.com";
  try {
    return new URL(raw).host;
  } catch {
    return "www.kestrelmetal.com";
  }
}
function toAbsoluteUrl(env, path) {
  const host = resolveHost(env);
  if (path.startsWith("http")) return path;
  return `https://${host}${path.startsWith("/") ? "" : "/"}${path}`;
}
async function submitToIndexNow(env, paths) {
  if (paths.length === 0) {
    return { ok: true, submitted: 0, status: null };
  }
  const key = await getIndexNowKey(env);
  const host = resolveHost(env);
  const keyLocation = `https://${host}/${key}.txt`;
  const urlList = paths.map((p) => toAbsoluteUrl(env, p));
  let result;
  try {
    const resp = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation, urlList })
    });
    result = {
      ok: resp.status >= 200 && resp.status < 300 || resp.status === 202,
      submitted: urlList.length,
      status: resp.status
    };
  } catch (err) {
    result = {
      ok: false,
      submitted: 0,
      status: null,
      error: err instanceof Error ? err.message : String(err)
    };
  }
  await setJSON(env.SEO_DATA, "indexnow:last_submit", {
    ...result,
    timestamp: now(),
    urls: urlList
  });
  return result;
}
var INDEXNOW_ENDPOINT;
var init_indexnow = __esm({
  "src/lib/indexnow.ts"() {
    "use strict";
    init_kv();
    INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
    __name(getIndexNowKey, "getIndexNowKey");
    __name(resolveHost, "resolveHost");
    __name(toAbsoluteUrl, "toAbsoluteUrl");
    __name(submitToIndexNow, "submitToIndexNow");
  }
});

// src/cron/score.ts
var score_exports = {};
__export(score_exports, {
  default: () => score
});
async function score(env) {
  console.log("[score] Starting SEO scoring and deployment...");
  const keys = await listKeys(env.CONTENT_QUEUE, "draft:");
  if (keys.length === 0) {
    console.log("[score] No drafts found");
    return;
  }
  let deployed = 0;
  const publishedPaths = [];
  const publishedSlugs = [];
  for (const key of keys) {
    const draft = await getJSON(env.CONTENT_QUEUE, key.name);
    if (!draft || draft.status !== "queued" && draft.status !== "image_gen" && draft.status !== "skipped") {
      continue;
    }
    try {
      console.log(`[score] Scoring: ${draft.slug}`);
      let currentHtml = draft.html;
      let currentScore = 0;
      let currentGeo = { score: 0, schema_completeness: 0, citation_friendliness: 0, fact_density: 0 };
      let round = 0;
      while (round < 3) {
        round++;
        const result = scoreSEO(currentHtml, draft.keyword);
        currentGeo = computeGeoScore(currentHtml);
        currentScore = result.totalScore;
        console.log(
          `[score] Round ${round}: SEO ${currentScore}/100, GEO ${currentGeo.score}/100 (schema ${currentGeo.schema_completeness} / citation ${currentGeo.citation_friendliness} / facts ${currentGeo.fact_density})`
        );
        if (result.passed && currentGeo.score >= GEO_MINIMUM_SCORE) {
          break;
        }
        console.log(`[score] Below threshold (SEO 60 / GEO ${GEO_MINIMUM_SCORE}), attempting fix round ${round}...`);
        if (env.DEEPSEEK_API_KEY) {
          try {
            const hints = geoRepairHints(currentGeo, currentHtml);
            if (!result.passed) {
              hints.unshift(`Previous draft failed SEO checks (score ${currentScore}/100); tighten title/meta/keyword density/word count (2000+)`);
            }
            const fixedArticle = await generateFullArticle(
              {
                DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY,
                DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || "deepseek-chat"
              },
              {
                keyword: draft.keyword,
                title: draft.title,
                variants: draft.variants ?? [],
                repairHints: hints
              }
            );
            currentHtml = fixedArticle.html;
            console.log(`[score] Regenerated article for round ${round} (${hints.length} repair hints)`);
          } catch (err) {
            console.error(`[score] Regeneration failed:`, err);
            break;
          }
        } else {
          break;
        }
      }
      await setJSON(env.CONTENT_QUEUE, key.name, {
        ...draft,
        html: currentHtml,
        score: currentScore,
        geoScore: currentGeo.score,
        scoreRound: round,
        status: "scoring"
      });
      if (currentScore >= 60 && currentGeo.score >= GEO_MINIMUM_SCORE) {
        let finalHtml = currentHtml;
        try {
          const { generateBannerImage: generateBannerImage2, applyBannerToHtml: applyBannerToHtml2 } = await Promise.resolve().then(() => (init_banner_gen(), banner_gen_exports));
          const bannerUrl = await generateBannerImage2(
            { QWEN_API_KEY: env.QWEN_API_KEY, QWEN_MODEL: env.QWEN_MODEL, IMAGES: env.IMAGES },
            draft.keyword,
            draft.slug
          );
          if (bannerUrl) {
            finalHtml = applyBannerToHtml2(finalHtml, bannerUrl);
            console.log(`[score] Banner generated for ${draft.slug}: ${bannerUrl}`);
          }
        } catch (err) {
          console.error(`[score] Banner generation failed for ${draft.slug}:`, err);
        }
        const publishedEntry = {
          slug: draft.slug,
          title: draft.title,
          metaDescription: draft.metaDescription,
          keyword: draft.keyword,
          groupId: draft.groupId ?? null,
          variants: draft.variants ?? [],
          score: currentScore,
          geoScore: currentGeo.score,
          status: "published",
          publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
          detail_url: `https://www.kestrelmetal.com/${draft.slug}.html`,
          html: finalHtml
        };
        await setJSON(env.CONTENT_QUEUE, `published:${draft.slug}`, publishedEntry);
        const allPublished = await getJSON(env.CONTENT_QUEUE, "published:all") || [];
        const { html: _html, ...entryWithoutHtml } = publishedEntry;
        const existingIndex = allPublished.findIndex((p) => p.slug === draft.slug);
        if (existingIndex >= 0) {
          allPublished[existingIndex] = entryWithoutHtml;
        } else {
          allPublished.push(entryWithoutHtml);
        }
        await setJSON(env.CONTENT_QUEUE, "published:all", allPublished);
        console.log(`[score] Published: ${draft.slug} (SEO: ${currentScore}, GEO: ${currentGeo.score})`);
        deployed++;
        publishedPaths.push(`/${draft.slug}.html`);
        publishedSlugs.push(draft.slug);
        try {
          const { appendLlmsEntry: appendLlmsEntry2 } = await Promise.resolve().then(() => (init_llms(), llms_exports));
          await appendLlmsEntry2(env, {
            slug: draft.slug,
            title: draft.title,
            url: `https://www.kestrelmetal.com/${draft.slug}.html`,
            summary: draft.metaDescription,
            keyword: draft.keyword
          });
        } catch (err) {
          console.error(`[score] llms.txt append failed for ${draft.slug}:`, err);
        }
      } else {
        console.log(`[score] Skipped: ${draft.slug} (SEO: ${currentScore}/60, GEO: ${currentGeo.score}/${GEO_MINIMUM_SCORE})`);
        await setJSON(env.CONTENT_QUEUE, key.name, {
          ...draft,
          html: currentHtml,
          score: currentScore,
          scoreRound: round,
          status: "skipped"
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    } catch (err) {
      console.error(`[score] Failed for ${draft.slug}:`, err);
    }
  }
  console.log(`[score] Completed. Deployed ${deployed} articles.`);
  if (publishedPaths.length > 0) {
    try {
      const { submitToIndexNow: submitToIndexNow2 } = await Promise.resolve().then(() => (init_indexnow(), indexnow_exports));
      const result = await submitToIndexNow2(env, publishedPaths);
      if (result.ok) {
        console.log(`[score] IndexNow submitted ${result.submitted} URLs (status ${result.status})`);
      } else {
        console.error(`[score] IndexNow submission failed: ${result.error ?? `status ${result.status}`}`);
      }
    } catch (err) {
      console.error("[score] IndexNow submission failed:", err);
    }
    try {
      await recordPendingGscUrls(env, publishedPaths, publishedSlugs);
    } catch (err) {
      console.error("[score] Failed to record pending GSC urls:", err);
    }
  }
}
async function recordPendingGscUrls(env, paths, slugs) {
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const existing = await getJSON2(env.SEO_DATA, "gsc:pending") ?? { urls: [] };
  const bySlug = new Map(existing.urls.map((row) => [row.slug, row]));
  const now2 = (/* @__PURE__ */ new Date()).toISOString();
  paths.forEach((path, index) => {
    const slug = slugs[index] ?? path.replace(/^\//, "").replace(/\.html$/, "");
    if (!slug) return;
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { url: `https://www.kestrelmetal.com${path.startsWith("/") ? "" : "/"}${path}`, slug, publishedAt: now2 });
    }
  });
  const urls = Array.from(bySlug.values()).slice(-200);
  await setJSON2(env.SEO_DATA, "gsc:pending", { urls, updatedAt: now2 });
  console.log(`[score] GSC pending list now holds ${urls.length} URLs`);
}
var GEO_MINIMUM_SCORE;
var init_score = __esm({
  "src/cron/score.ts"() {
    "use strict";
    init_seo_score();
    init_geo_score();
    init_deepseek();
    init_kv();
    GEO_MINIMUM_SCORE = 70;
    __name(score, "score");
    __name(recordPendingGscUrls, "recordPendingGscUrls");
  }
});

// src/lib/tracking.ts
async function trackArticlePerformance(env) {
  console.log("[tracking] Starting article performance tracking...");
  const keys = await listKeys(env.CONTENT_QUEUE, "published:");
  if (keys.length === 0) {
    console.log("[tracking] No published articles found");
    return;
  }
  const endDate = /* @__PURE__ */ new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);
  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];
  for (const key of keys) {
    const article = await getJSON(env.CONTENT_QUEUE, key.name);
    if (!article) continue;
    try {
      console.log(`[tracking] Tracking: ${article.slug}`);
      const gscData = await querySearchAnalytics(
        {
          GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
          GSC_REFRESH_TOKEN: env.GSC_REFRESH_TOKEN,
          GSC_SITE_URL: env.GSC_SITE_URL,
          SEO_DATA: env.SEO_DATA
        },
        start,
        end,
        ["query", "page"]
      );
      const pageData = gscData.filter(
        (row) => row.keys[1]?.includes(article.slug)
      );
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalPosition = 0;
      let positionCount = 0;
      for (const row of pageData) {
        totalImpressions += row.impressions;
        totalClicks += row.clicks;
        totalPosition += row.position;
        positionCount++;
      }
      const trackingData = {
        slug: article.slug,
        keyword: article.keyword,
        url: `https://www.kestrelmetal.com/${article.slug}.html`,
        impressions: totalImpressions,
        clicks: totalClicks,
        avgPosition: positionCount > 0 ? totalPosition / positionCount : 0,
        trackedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await setJSON(env.CONTENT_QUEUE, `tracking:${article.slug}`, trackingData);
      console.log(`[tracking] ${article.slug}: ${totalImpressions} impressions, ${totalClicks} clicks`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`[tracking] Failed for ${article.slug}:`, err);
    }
  }
  console.log("[tracking] Completed.");
}
async function generateMonthlyReport(env) {
  console.log("[report] Generating monthly report...");
  const keys = await listKeys(env.CONTENT_QUEUE, "published:");
  const trackingKeys = await listKeys(env.CONTENT_QUEUE, "tracking:");
  const now2 = /* @__PURE__ */ new Date();
  const month = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalPosition = 0;
  let positionCount = 0;
  const keywordStats = {};
  for (const key of trackingKeys) {
    const tracking = await getJSON(env.CONTENT_QUEUE, key.name);
    if (!tracking) continue;
    totalImpressions += tracking.impressions;
    totalClicks += tracking.clicks;
    if (tracking.avgPosition > 0) {
      totalPosition += tracking.avgPosition;
      positionCount++;
    }
    if (!keywordStats[tracking.keyword]) {
      keywordStats[tracking.keyword] = { clicks: 0, position: 0 };
    }
    keywordStats[tracking.keyword].clicks += tracking.clicks;
    keywordStats[tracking.keyword].position = tracking.avgPosition;
  }
  const topKeywords = Object.entries(keywordStats).map(([keyword, stats]) => ({
    keyword,
    clicks: stats.clicks,
    position: stats.position
  })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const report = {
    month,
    totalArticles: keys.length,
    totalImpressions,
    totalClicks,
    avgPosition: positionCount > 0 ? totalPosition / positionCount : 0,
    topKeywords,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await setJSON(env.SEO_DATA, `report:${month}`, report);
  console.log(`[report] Monthly report generated: ${report.totalArticles} articles, ${totalImpressions} impressions`);
  return report;
}
var init_tracking = __esm({
  "src/lib/tracking.ts"() {
    "use strict";
    init_kv();
    init_gsc();
    __name(trackArticlePerformance, "trackArticlePerformance");
    __name(generateMonthlyReport, "generateMonthlyReport");
  }
});

// src/cron/track.ts
var track_exports = {};
__export(track_exports, {
  default: () => track
});
async function track(env) {
  console.log("[track] Starting weekly performance tracking...");
  try {
    await trackArticlePerformance(env);
    console.log("[track] Completed successfully.");
  } catch (err) {
    console.error("[track] Failed:", err);
  }
}
var init_track = __esm({
  "src/cron/track.ts"() {
    "use strict";
    init_tracking();
    __name(track, "track");
  }
});

// src/cron/monthly-report.ts
var monthly_report_exports = {};
__export(monthly_report_exports, {
  default: () => monthlyReport
});
async function buildGeoSection(env, monthPrefix) {
  const scores = await getJSON(env.SEO_DATA, "geo:scores") ?? [];
  const llms = await getJSON(env.SEO_DATA, "geo:llms:entries") ?? [];
  const faqs = await getJSON(env.SEO_DATA, "geo:faqs") ?? [];
  const patches = await getJSON(env.SEO_DATA, "geo:patches") ?? [];
  const average = scores.length ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length) : null;
  return {
    average_score: average,
    scored_pages: scores.length,
    distribution: {
      high: scores.filter((r) => r.score >= 80).length,
      mid: scores.filter((r) => r.score >= 60 && r.score < 80).length,
      low: scores.filter((r) => r.score < 60).length
    },
    bottom_pages: scores.slice().sort((a, b) => a.score - b.score).slice(0, 5).map((r) => ({ page: r.page_url.replace(/^https?:\/\/[^/]+\//, "/"), score: r.score })),
    llms_entries_total: llms.length,
    llms_entries_added_this_month: llms.filter((e) => e.addedAt?.startsWith(monthPrefix)).length,
    faq_total: faqs.filter((f) => f.is_active !== false && (f.language ?? "en") === "en").length,
    faq_auto_total: faqs.filter((f) => f.source === "auto").length,
    faq_pending_review: faqs.filter((f) => f.source === "auto" && f.is_active === false).length,
    patches_pending: patches.filter((p) => p.status === "pending" || p.status === "approved").length,
    patches_applied: patches.filter((p) => p.status === "applied").length
  };
}
async function monthlyReport(env) {
  console.log("[monthly-report] Generating monthly report...");
  try {
    const report = await generateMonthlyReport(env);
    console.log(`[monthly-report] Completed: ${report.totalArticles} articles, ${report.totalImpressions} impressions`);
    try {
      const month = report.month;
      const stored = await getJSON(env.SEO_DATA, `report:${month}`);
      if (stored) {
        const geo = await buildGeoSection(env, month);
        stored.geo = geo;
        await setJSON(env.SEO_DATA, `report:${month}`, stored);
        console.log(`[monthly-report] GEO section attached (avg ${geo.average_score}, ${geo.scored_pages} pages)`);
      }
    } catch (err) {
      console.error("[monthly-report] GEO section failed:", err);
    }
  } catch (err) {
    console.error("[monthly-report] Failed:", err);
  }
}
var init_monthly_report = __esm({
  "src/cron/monthly-report.ts"() {
    "use strict";
    init_tracking();
    init_kv();
    __name(buildGeoSection, "buildGeoSection");
    __name(monthlyReport, "monthlyReport");
  }
});

// src/cron/geo-faq.ts
var geo_faq_exports = {};
__export(geo_faq_exports, {
  default: () => geoFaq
});
async function collectTopicKeywords(env) {
  const gap = (await getJSON(env.SEO_DATA, "competitors:gap"))?.gaps ?? [];
  const opp = (await getJSON(env.SEO_DATA, "opportunities:weekly"))?.opportunities ?? [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const row of [...gap, ...opp]) {
    const kw = String(row.keyword ?? "").trim().toLowerCase();
    if (!kw || seen.has(kw)) continue;
    if (/(^|\s)(best|top|cheapest)\b/i.test(kw) && kw.length < 12) continue;
    seen.add(kw);
    out.push(kw);
  }
  return out;
}
async function generateFaq(env, keyword) {
  const systemPrompt = "You are a B2B export sales engineer at Kestrel Metal (kestrelmetal.com), a wire mesh fence manufacturer in Anping, China (ISO 9001, 12+ years, 3000+ tons/month capacity, FOB Tianjin/Shanghai, lead time 15-25 days). Respond ONLY with valid JSON.";
  const userPrompt = `A procurement buyer would ask an AI search engine: "${keyword}"

Write ONE FAQ entry answering this as Kestrel Metal would. Requirements:
- question: natural buyer phrasing (may differ slightly from the keyword)
- answer: 2-3 sentences, self-contained and quotable by AI engines, MUST include at least one concrete number with a unit drawn from real B2B facts (dimensions mm/m, coating g/m\xB2, capacity tons/month, lead time days, MOQ, standards ASTM/EN/ISO)
- category: one of Orders, Products, Quality, Compliance, Shipping, Product Knowledge, Installation Guide
- Do not invent certifications the company does not hold (we hold ISO 9001:2015, CE, UKCA, REACH)

JSON format: {"question": "...", "answer": "...", "category": "..."}`;
  const resp = await callDeepSeek(
    { DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY, DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || "deepseek-chat" },
    systemPrompt,
    userPrompt
  );
  const match = resp.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in DeepSeek response");
  const parsed = JSON.parse(match[0]);
  if (!parsed.question || !parsed.answer) throw new Error("Incomplete FAQ JSON");
  return parsed;
}
async function geoFaq(env) {
  if (!env.DEEPSEEK_API_KEY) {
    console.log("[geo-faq] DEEPSEEK_API_KEY not set, skipping");
    return;
  }
  const existing = await listFaqs(env);
  const keywords = await collectTopicKeywords(env);
  const unanswered = keywords.filter((kw) => {
    const kwWords = kw.split(/\s+/).filter((w) => w.length > 3);
    if (kwWords.length === 0) return false;
    return !existing.some((f) => {
      const q = f.question.toLowerCase();
      return kwWords.every((w) => q.includes(w));
    });
  });
  console.log(`[geo-faq] ${keywords.length} topics, ${unanswered.length} uncovered, generating ${FAQS_PER_RUN}`);
  let created = 0;
  for (const keyword of unanswered.slice(0, FAQS_PER_RUN)) {
    try {
      const faq = await generateFaq(env, keyword);
      if (hasSimilarQuestion(existing, faq.question)) {
        console.log(`[geo-faq] Similar question exists, skipped: ${faq.question}`);
        continue;
      }
      await createFaq(env, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "Product Knowledge",
        language: "en",
        sort_order: 100,
        is_active: false,
        // 待审核，Admin 启用后才进 faq.html
        source: "auto"
      });
      existing.push({ question: faq.question });
      created++;
      console.log(`[geo-faq] Created pending FAQ: ${faq.question}`);
    } catch (err) {
      console.error(`[geo-faq] Failed for "${keyword}":`, err);
    }
  }
  console.log(`[geo-faq] Done. ${created} pending FAQs awaiting review.`);
}
var FAQS_PER_RUN;
var init_geo_faq = __esm({
  "src/cron/geo-faq.ts"() {
    "use strict";
    init_deepseek();
    init_faq();
    init_kv();
    FAQS_PER_RUN = 3;
    __name(collectTopicKeywords, "collectTopicKeywords");
    __name(generateFaq, "generateFaq");
    __name(geoFaq, "geoFaq");
  }
});

// src/cron/geo-audit.ts
var geo_audit_exports = {};
__export(geo_audit_exports, {
  default: () => geoAudit
});
async function collectUrls(env) {
  const { buildSitemap: buildSitemap2 } = await Promise.resolve().then(() => (init_sitemap(), sitemap_exports));
  const sitemap = await buildSitemap2(env);
  return [...sitemap.xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
}
async function fetchPageHtml(env, url) {
  const path = new URL(url).pathname;
  const assetPath = path === "/" ? "/index.html" : path;
  let html = null;
  try {
    const resp = await env.ASSETS.fetch(`https://www.kestrelmetal.com${assetPath}`);
    if (resp.ok) html = await resp.text();
  } catch {
  }
  if (!html) {
    const slug = path.replace(/^\//, "").replace(/\.html$/, "");
    if (slug && !slug.includes("/") && !slug.includes(".")) {
      try {
        const published = await env.CONTENT_QUEUE.get(`published:${slug}`, "json");
        if (published?.html) html = published.html;
      } catch {
      }
    }
  }
  return html || null;
}
async function fetchAndScore(env, url) {
  try {
    const html = await fetchPageHtml(env, url);
    if (!html) return null;
    const geo = computeGeoScore(html);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return {
      page_url: url,
      title: titleMatch ? titleMatch[1].replace(/\s*\|.*$/, "").trim() : url,
      ...geo,
      scored_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return null;
  }
}
async function scoreAllPages(env, urls) {
  const rows = [];
  for (let i = 0; i < urls.length; i += SCORE_CONCURRENCY) {
    const batch = urls.slice(i, i + SCORE_CONCURRENCY);
    const results = await Promise.all(batch.map((u) => fetchAndScore(env, u)));
    for (const r of results) if (r) rows.push(r);
  }
  return rows;
}
async function generatePatchBatch(env, rows) {
  const systemPrompt = "You are a GEO (Generative Engine Optimization) specialist for Kestrel Metal (kestrelmetal.com), a wire mesh fence manufacturer in Anping, China. Respond ONLY with valid JSON.";
  const pageList = rows.map(
    (r) => `- slug: ${r.page_url.replace(/^https?:\/\/[^/]+\//, "").replace(/\.html$/, "")}
  title: ${r.title}
  current GEO score: ${r.score} (citation ${r.citation_friendliness}, facts ${r.fact_density})`
  );
  const userPrompt = `For each page below, write a reinforcement patch that makes it more quotable by AI search engines.

Rules:
- definition_sentence: ONE self-contained sentence ("<Product> is a <category> used for <primary use>, <key differentiator>"). It must make sense quoted out of context and must match what the page actually sells.
- fact_points: 3-5 SHORT factual data points, each written as a number with a unit plus 5-10 words of context (e.g. {value: "40-270 g/m\xB2", context: "zinc coating weight options"}). Use realistic B2B specs for this product type (dimensions, coating, capacity, lead time, standards). Never invent certifications the company does not hold (we hold ISO 9001:2015, CE, UKCA, REACH).
- slug: echo the input slug exactly.

Pages:
${pageList.join("\n")}

JSON format: {"patches": [{"slug": "...", "definition_sentence": "...", "fact_points": [{"value": "...", "context": "..."}]}]}`;
  const resp = await callDeepSeek(
    { DEEPSEEK_API_KEY: env.DEEPSEEK_API_KEY, DEEPSEEK_MODEL: env.DEEPSEEK_MODEL || "deepseek-chat" },
    systemPrompt,
    userPrompt
  );
  const match = resp.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in patch response");
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.patches)) throw new Error("Malformed patches JSON");
  const bySlug = new Map(rows.map((r) => [r.page_url.replace(/^https?:\/\/[^/]+\//, "").replace(/\.html$/, ""), r]));
  return parsed.patches.filter((p) => p.slug && p.definition_sentence && Array.isArray(p.fact_points) && p.fact_points.length > 0).map((p) => {
    const row = bySlug.get(p.slug);
    return {
      slug: p.slug,
      page_url: row?.page_url ?? `https://www.kestrelmetal.com/${p.slug}.html`,
      title: row?.title ?? p.slug,
      definition_sentence: p.definition_sentence,
      fact_points: p.fact_points.slice(0, 5),
      current_score: row?.score ?? 0,
      status: "pending",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  });
}
function beijingMonth() {
  const d = new Date(Date.now() + 8 * 36e5);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
function beijingDayOfMonth() {
  return new Date(Date.now() + 8 * 36e5).getUTCDate();
}
async function geoAudit(env, opts = {}) {
  let progress = await getJSON(env.SEO_DATA, PROGRESS_KEY);
  if (!progress) {
    if (!opts.force && beijingDayOfMonth() !== 1) {
      return { summary: `\u8DF3\u8FC7:\u4ECA\u5929\u4E0D\u662F 1 \u53F7(\u5317\u4EAC ${beijingMonth()}-${beijingDayOfMonth()}),\u4E5F\u65E0\u672A\u5B8C\u6210\u5468\u671F`, done: true, scored: 0, total: 0 };
    }
    const urls = await collectUrls(env);
    if (urls.length === 0) {
      return { summary: "sitemap \u4E3A\u7A7A\u6216\u6293\u53D6\u5931\u8D25,\u672A\u5F00\u59CB", done: true, scored: 0, total: 0 };
    }
    progress = { cycle: beijingMonth(), remaining: urls, total: urls.length, scored: 0, startedAt: (/* @__PURE__ */ new Date()).toISOString() };
    console.log(`[geo-audit] New cycle ${progress.cycle}: ${urls.length} pages, chunked by ${CHUNK_SIZE}`);
  }
  const chunk = progress.remaining.splice(0, CHUNK_SIZE);
  const rows = await scoreAllPages(env, chunk);
  progress.scored += rows.length;
  if (rows.length > 0) {
    const existingRows = await getJSON(env.SEO_DATA, "geo:scores") ?? [];
    const byUrl = new Map(existingRows.map((r) => [r.page_url, r]));
    for (const r of rows) byUrl.set(r.page_url, r);
    await setJSON(env.SEO_DATA, "geo:scores", Array.from(byUrl.values()));
  }
  const allRows = await getJSON(env.SEO_DATA, "geo:scores") ?? [];
  const avg = allRows.length ? Math.round(allRows.reduce((s, r) => s + r.score, 0) / allRows.length) : 0;
  console.log(`[geo-audit] Chunk done: +${rows.length} scored, cycle ${progress.scored}/${progress.total}, site avg ${avg}`);
  if (progress.remaining.length > 0) {
    await setJSON(env.SEO_DATA, PROGRESS_KEY, progress);
    return {
      summary: `\u5206\u7247\u5B8C\u6210:\u672C\u8F6E +${rows.length},\u5468\u671F\u7D2F\u8BA1 ${progress.scored}/${progress.total},\u6B21\u65E5 cron \u81EA\u52A8\u7EED\u8DD1(\u6216\u518D\u6B21\u624B\u52A8\u89E6\u53D1)`,
      done: false,
      scored: progress.scored,
      total: progress.total
    };
  }
  let patchSummary = "\u672A\u751F\u6210\u8865\u4E01";
  const dynamicSlugs = new Set(
    (await getJSON(env.CONTENT_QUEUE, "published:all") ?? []).map((p) => p.slug)
  );
  const lowest = allRows.filter((r) => {
    const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, "").replace(/\.html$/, "");
    return slug !== "" && !dynamicSlugs.has(slug);
  }).sort((a, b) => a.score - b.score).slice(0, PATCH_TARGET_COUNT);
  const existingPatches = await getJSON(env.SEO_DATA, "geo:patches") ?? [];
  const dismissedOrApplied = new Set(
    existingPatches.filter((p) => p.status === "applied" || p.status === "dismissed").map((p) => p.slug)
  );
  const pendingTargets = lowest.filter((r) => {
    const slug = r.page_url.replace(/^https?:\/\/[^/]+\//, "").replace(/\.html$/, "");
    return !dismissedOrApplied.has(slug);
  });
  if (env.DEEPSEEK_API_KEY && pendingTargets.length > 0) {
    const keptApproved = existingPatches.filter((p) => p.status === "approved");
    const fresh = [];
    for (let i = 0; i < pendingTargets.length; i += PATCH_BATCH) {
      const batch = pendingTargets.slice(i, i + PATCH_BATCH);
      try {
        fresh.push(...await generatePatchBatch(env, batch));
        console.log(`[geo-audit] Patch batch ${Math.floor(i / PATCH_BATCH) + 1}: +${batch.length} targets`);
      } catch (err) {
        console.error("[geo-audit] Patch batch failed:", err);
      }
    }
    await setJSON(env.SEO_DATA, "geo:patches", [...keptApproved, ...fresh]);
    patchSummary = `${fresh.length} \u4E2A\u4F4E\u5206\u9875\u8865\u4E01\u5F85\u5BA1\u6838`;
    console.log(`[geo-audit] ${fresh.length} patches pending review`);
  }
  await setJSON(env.SEO_DATA, PROGRESS_KEY + ":last_cycle", { ...progress, finishedAt: (/* @__PURE__ */ new Date()).toISOString() });
  await env.SEO_DATA.delete(PROGRESS_KEY);
  return {
    summary: `\u5468\u671F\u5B8C\u6210:${allRows.length} \u9875,\u5168\u7AD9\u5E73\u5747 ${avg};${patchSummary}`,
    done: true,
    scored: progress.scored,
    total: progress.total
  };
}
var SCORE_CONCURRENCY, PATCH_TARGET_COUNT, PATCH_BATCH, CHUNK_SIZE, PROGRESS_KEY;
var init_geo_audit = __esm({
  "src/cron/geo-audit.ts"() {
    "use strict";
    init_geo_score();
    init_deepseek();
    init_kv();
    SCORE_CONCURRENCY = 8;
    PATCH_TARGET_COUNT = 20;
    PATCH_BATCH = 10;
    __name(collectUrls, "collectUrls");
    __name(fetchPageHtml, "fetchPageHtml");
    __name(fetchAndScore, "fetchAndScore");
    __name(scoreAllPages, "scoreAllPages");
    __name(generatePatchBatch, "generatePatchBatch");
    CHUNK_SIZE = 40;
    PROGRESS_KEY = "geo:audit:progress";
    __name(beijingMonth, "beijingMonth");
    __name(beijingDayOfMonth, "beijingDayOfMonth");
    __name(geoAudit, "geoAudit");
  }
});

// src/lib/github.ts
var github_exports = {};
__export(github_exports, {
  openPatchPullRequest: () => openPatchPullRequest,
  patchToHtml: () => patchToHtml
});
function authHeaders(env) {
  return {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
async function gh(env, path, init) {
  const resp = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...authHeaders(env), ...init?.headers }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return await resp.json();
}
async function getFile(env, path, ref) {
  const data = await gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`);
  const b64 = data.content.replace(/\n/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { sha: data.sha, text: new TextDecoder().decode(bytes) };
}
function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function escapeHtml2(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function patchToHtml(patch) {
  const facts = patch.fact_points.map((f) => `        <li><strong>${escapeHtml2(f.value)}</strong> \u2014 ${escapeHtml2(f.context)}</li>`).join("\n");
  return `
  <!-- GEO reinforcement patch (auto-generated, reviewed in admin) -->
  <section class="geo-facts" style="max-width:1200px;margin:2rem auto;padding:1.5rem;border:1px solid #e5e7eb;border-radius:12px;">
    <h2 style="margin:0 0 0.75rem;font-size:1.25rem;">Key Facts</h2>
    <p style="margin:0 0 0.75rem;">${escapeHtml2(patch.definition_sentence)}</p>
    <ul style="margin:0;padding-left:1.25rem;display:grid;gap:0.4rem;">
${facts}
    </ul>
  </section>
`;
}
function applyPatchToHtml(html, patch) {
  const block = patchToHtml(patch);
  if (html.includes("GEO reinforcement patch")) return html;
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${block}  </main>`);
  return html.replace(/<\/body>/i, `${block}</body>`);
}
async function openPatchPullRequest(env, patches) {
  if (!env.GH_TOKEN) throw new Error("GH_TOKEN not configured (wrangler secret put GH_TOKEN)");
  if (patches.length === 0) throw new Error("No approved patches to apply");
  const dateTag = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const branch = `geo/patches-${dateTag}`;
  const mainRef = await gh(env, `/repos/${REPO}/git/ref/heads%2Fmain`);
  const baseSha = mainRef.object.sha;
  try {
    await gh(env, `/repos/${REPO}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
    });
  } catch (err) {
    if (!String(err).includes("422")) throw err;
  }
  const applied = [];
  for (const patch of patches) {
    const path = `${patch.slug}.html`;
    let file;
    try {
      file = await getFile(env, path, branch);
    } catch {
      console.warn(`[github] ${path} not found in repo, skipping`);
      continue;
    }
    const next = applyPatchToHtml(file.text, patch);
    if (next === file.text) {
      console.warn(`[github] ${path} already patched or no insertion point, skipping`);
      continue;
    }
    await gh(env, `/repos/${REPO}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `geo: reinforce ${path} (definition + key facts)`,
        content: toBase64(next),
        sha: file.sha,
        branch
      })
    });
    applied.push(patch.slug);
  }
  if (applied.length === 0) throw new Error("No files were modified (missing or already patched)");
  const bodyLines = patches.filter((p) => applied.includes(p.slug)).map((p) => `- **${p.title}** (\`${p.slug}.html\`, GEO ${p.current_score}/100)
  - ${p.definition_sentence}`);
  const pr = await gh(env, `/repos/${REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `geo: reinforce ${applied.length} low-scoring pages (${dateTag})`,
      head: branch,
      base: "main",
      body: [
        "Automated GEO reinforcement patch (generated by geo-audit cron, approved in admin).",
        "",
        ...bodyLines,
        "",
        'Each page gets a "Key Facts" block (self-contained definition + numeric facts) inserted before `</main>`.',
        "Merge to deploy via Cloudflare git integration."
      ].join("\n")
    })
  });
  console.log(`[github] PR opened: ${pr.html_url} (${applied.length} files)`);
  return { prUrl: pr.html_url, branch, appliedSlugs: applied };
}
var REPO, API;
var init_github = __esm({
  "src/lib/github.ts"() {
    "use strict";
    REPO = "kalee777777/kestrel-metal-web";
    API = "https://api.github.com";
    __name(authHeaders, "authHeaders");
    __name(gh, "gh");
    __name(getFile, "getFile");
    __name(toBase64, "toBase64");
    __name(escapeHtml2, "escapeHtml");
    __name(patchToHtml, "patchToHtml");
    __name(applyPatchToHtml, "applyPatchToHtml");
    __name(openPatchPullRequest, "openPatchPullRequest");
  }
});

// src/router.ts
var routes = [];
function route(method, path, handler) {
  const paramNames = [];
  const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  const pattern = new RegExp(`^${regexPath}$`);
  routes.push({ method, pattern, paramNames, handler });
}
__name(route, "route");
async function handleRoute(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;
  for (const entry of routes) {
    if (entry.method !== method) continue;
    const match = entry.pattern.exec(pathname);
    if (!match) continue;
    const params = {};
    entry.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });
    return entry.handler({ request, env, params, url });
  }
  return null;
}
__name(handleRoute, "handleRoute");
route("GET", "/api/health", async ({ env }) => {
  return jsonResponse({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    kv_bound: !!env.SEO_DATA,
    r2_bound: !!env.IMAGES,
    last_gsc_sync: await env.SEO_DATA.get("gsc:last_sync")
  });
});
route("GET", "/api/cron/status", async ({ env }) => {
  const { listKeys: listKeys2, getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const keys = await listKeys2(env.SEO_DATA, "cron:last_run:");
  const tasks = await Promise.all(
    keys.map(async (k) => {
      const name = k.name.replace("cron:last_run:", "");
      const record = await getJSON2(env.SEO_DATA, k.name);
      return {
        name,
        lastRun: record?.timestamp ?? null,
        ageHours: record?.timestamp ? Math.round((Date.now() - new Date(record.timestamp).getTime()) / 36e5 * 10) / 10 : null,
        durationMs: record?.duration ?? null,
        success: record?.success ?? null,
        skipped: record?.skipped ?? false,
        skipReason: record?.skipReason ?? null,
        error: record?.error ?? null
      };
    })
  );
  tasks.sort((a, b) => a.lastRun && b.lastRun ? a.lastRun < b.lastRun ? 1 : -1 : 0);
  return jsonResponse({
    now: (/* @__PURE__ */ new Date()).toISOString(),
    note: "\u51FA\u73B0\u8BB0\u5F55\u5373\u4EE3\u8868\u8BE5\u4EFB\u52A1\u88AB\u5B9A\u65F6\u8C03\u5EA6\u5524\u8D77\u8FC7\uFF1B\u624B\u52A8 /api/trigger \u4E0D\u5199\u6B64\u8BB0\u5F55\u3002",
    tasks
  });
});
route("GET", "/api/keywords/rankings", async ({ env, url }) => {
  const date = url.searchParams.get("date");
  const todayStr = date ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const rankings = await getRankings2(env.SEO_DATA, todayStr);
  return jsonResponse({ date: todayStr, rankings: rankings ?? [] });
});
route("GET", "/api/keywords/trend", async ({ env, url }) => {
  const keyword = url.searchParams.get("keyword");
  if (!keyword) {
    return jsonResponse({ error: "Missing keyword parameter" }, 400);
  }
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const { getKeywordTrend: getKeywordTrend2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const trend = await getKeywordTrend2(env.SEO_DATA, keyword, days);
  return jsonResponse({ keyword, trend });
});
route("GET", "/api/opportunities", async ({ env }) => {
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const rankings = await getRankings2(env.SEO_DATA, today2);
  if (!rankings || rankings.length === 0) {
    return jsonResponse({ opportunities: [], message: "No ranking data available yet" });
  }
  const { opportunities: opportunities2 } = await Promise.resolve().then(() => (init_opportunity(), opportunity_exports));
  const items = await opportunities2(rankings);
  return jsonResponse({ date: today2, count: items.length, opportunities: items });
});
route("GET", "/api/opportunities/stats", async ({ env }) => {
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const rankings = await getRankings2(env.SEO_DATA, today2);
  if (!rankings || rankings.length === 0) {
    return jsonResponse({ stats: null, message: "No ranking data available yet" });
  }
  const { opportunities: opportunities2 } = await Promise.resolve().then(() => (init_opportunity(), opportunity_exports));
  const items = await opportunities2(rankings);
  const stats = {
    total: items.length,
    byType: {
      low_ctr: items.filter((i) => i.type === "low_ctr").length,
      page_two: items.filter((i) => i.type === "page_two").length,
      new_opportunity: items.filter((i) => i.type === "new_opportunity").length,
      competitor_gap: items.filter((i) => i.type === "competitor_gap").length
    },
    byDifficulty: {
      easy: items.filter((i) => i.estimatedDifficulty === "easy").length,
      medium: items.filter((i) => i.estimatedDifficulty === "medium").length,
      hard: items.filter((i) => i.estimatedDifficulty === "hard").length
    },
    topKeywords: items.slice(0, 10).map((i) => ({
      keyword: i.keyword,
      type: i.type,
      action: i.suggestedAction
    }))
  };
  return jsonResponse({ date: today2, stats });
});
route("GET", "/api/content/drafts", async ({ env }) => {
  const { listKeys: listKeys2, getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const keys = await listKeys2(env.CONTENT_QUEUE, "draft:");
  const drafts = await Promise.all(
    keys.map((k) => getJSON2(env.CONTENT_QUEUE, k.name))
  );
  return jsonResponse({ drafts: drafts.filter(Boolean) });
});
route("GET", "/api/content/published", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const published = await getJSON2(env.CONTENT_QUEUE, "published:all");
  return jsonResponse({ published: published ?? [] });
});
route("GET", "/api/keywords/rankings/range", async ({ env, url }) => {
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");
  const end = endDate ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const start = startDate ?? new Date(Date.now() - 6 * 864e5).toISOString().split("T")[0];
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const allRankings = [];
  const current = new Date(start);
  const endDt = new Date(end);
  while (current <= endDt) {
    const dateStr = current.toISOString().split("T")[0];
    const rankings = await getRankings2(env.SEO_DATA, dateStr);
    if (rankings && rankings.length > 0) {
      allRankings.push({ date: dateStr, rankings });
    }
    current.setDate(current.getDate() + 1);
  }
  return jsonResponse({ start, end, data: allRankings });
});
route("GET", "/api/keywords/analysis", async ({ env }) => {
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  const { getRankings: getRankings2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const todayRankings = await getRankings2(env.SEO_DATA, today2);
  const yesterdayRankings = await getRankings2(env.SEO_DATA, yesterday);
  const todayMap = new Map((todayRankings ?? []).map((r) => [r.keyword, r]));
  const yesterdayMap = new Map((yesterdayRankings ?? []).map((r) => [r.keyword, r]));
  const allKeywords = /* @__PURE__ */ new Set([...todayMap.keys(), ...yesterdayMap.keys()]);
  const keywords = Array.from(allKeywords).map((keyword) => {
    const todayData = todayMap.get(keyword);
    const yesterdayData = yesterdayMap.get(keyword);
    return {
      keyword,
      today: todayData ?? null,
      yesterday: yesterdayData ?? null,
      trend: todayData && yesterdayData ? todayData.position < yesterdayData.position ? "up" : todayData.position > yesterdayData.position ? "down" : "stable" : "new",
      change: todayData && yesterdayData ? yesterdayData.position - todayData.position : 0
    };
  });
  keywords.sort((a, b) => {
    const aPos = a.today?.position ?? 999;
    const bPos = b.today?.position ?? 999;
    return aPos - bPos;
  });
  const stats = {
    total: keywords.length,
    top10: keywords.filter((k) => (k.today?.position ?? 999) <= 10).length,
    top20: keywords.filter((k) => (k.today?.position ?? 999) <= 20).length,
    rising: keywords.filter((k) => k.trend === "up").length,
    falling: keywords.filter((k) => k.trend === "down").length
  };
  return jsonResponse({ today: today2, yesterday, stats, keywords });
});
route("GET", "/api/images/:key", async ({ env, params }) => {
  const { serveImage: serveImage2 } = await Promise.resolve().then(() => (init_r2(), r2_exports));
  return serveImage2(env.IMAGES, params.key);
});
route("GET", "/api/gsc/status", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const details = await getJSON2(env.SEO_DATA, "gsc:last_sync:details");
  const lastSync = await env.SEO_DATA.get("gsc:last_sync");
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GSC_REFRESH_TOKEN || !env.GSC_SITE_URL) {
    return jsonResponse({ ok: false, siteUrl: env.GSC_SITE_URL ?? "", error: "GSC OAuth secrets not configured", lastSync: lastSync ?? null });
  }
  try {
    const { verifyConnection: verifyConnection2 } = await Promise.resolve().then(() => (init_gsc(), gsc_exports));
    const result = await verifyConnection2(env);
    return jsonResponse({
      ok: result.ok,
      siteUrl: result.siteUrl,
      rowCount: result.rowCount,
      error: result.error,
      lastSync: lastSync ?? null,
      details
    });
  } catch (err) {
    return jsonResponse({ ok: false, siteUrl: env.GSC_SITE_URL, error: err instanceof Error ? err.message : String(err), lastSync: lastSync ?? null });
  }
});
function isAdminAuthorized(request, env) {
  return request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}
__name(isAdminAuthorized, "isAdminAuthorized");
route("GET", "/api/seo", async ({ env }) => {
  const { listSeoMetas: listSeoMetas2 } = await Promise.resolve().then(() => (init_seo_meta(), seo_meta_exports));
  const metas = await listSeoMetas2(env);
  return jsonResponse(metas);
});
route("POST", "/api/seo", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.page_url) {
    return jsonResponse({ error: "page_url is required" }, 400);
  }
  const { createSeoMeta: createSeoMeta2 } = await Promise.resolve().then(() => (init_seo_meta(), seo_meta_exports));
  const record = await createSeoMeta2(env, body);
  if (!record) {
    return jsonResponse({ error: "Record already exists for this page" }, 409);
  }
  return jsonResponse(record, 201);
});
route("PUT", "/api/seo/:id", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { updateSeoMeta: updateSeoMeta2 } = await Promise.resolve().then(() => (init_seo_meta(), seo_meta_exports));
  const record = await updateSeoMeta2(env, Number(params.id), body);
  if (!record) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return jsonResponse(record);
});
route("DELETE", "/api/seo/:id", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { deleteSeoMeta: deleteSeoMeta2 } = await Promise.resolve().then(() => (init_seo_meta(), seo_meta_exports));
  const ok = await deleteSeoMeta2(env, Number(params.id));
  if (!ok) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return jsonResponse({ message: "Deleted" });
});
route("GET", "/api/seo/generate/sitemap", async ({ env }) => {
  const { buildSitemap: buildSitemap2 } = await Promise.resolve().then(() => (init_sitemap(), sitemap_exports));
  const sitemap = await buildSitemap2(env);
  return jsonResponse({
    file_count: sitemap.urlCount,
    static_count: sitemap.urlCount - sitemap.dynamicCount,
    dynamic_count: sitemap.dynamicCount,
    note: "sitemap.xml is served dynamically, always up to date"
  });
});
route("GET", "/api/seo/indexnow", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const lastSubmit = await getJSON2(env.SEO_DATA, "indexnow:last_submit");
  return jsonResponse({ last_submit: lastSubmit ?? null });
});
route("GET", "/api/faq/all", async ({ env }) => {
  const { listFaqs: listFaqs2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
  const faqs = await listFaqs2(env);
  return jsonResponse(faqs);
});
route("POST", "/api/faq", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.question || !body.answer) {
    return jsonResponse({ error: "question and answer are required" }, 400);
  }
  const { createFaq: createFaq2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
  const item = await createFaq2(env, body);
  return jsonResponse(item, 201);
});
route("PUT", "/api/faq/:id", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { updateFaq: updateFaq2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
  const item = await updateFaq2(env, params.id, body);
  if (!item) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return jsonResponse(item);
});
route("DELETE", "/api/faq/:id", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { deleteFaq: deleteFaq2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
  const ok = await deleteFaq2(env, params.id);
  if (!ok) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return jsonResponse({ message: "Deleted" });
});
route("POST", "/api/faq/import", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return jsonResponse({ error: "Array body is required" }, 400);
  }
  const { importFaqs: importFaqs2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
  const result = await importFaqs2(env, body);
  return jsonResponse(result);
});
route("GET", "/api/gsc/auth", async ({ env, request, url }) => {
  if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!env.GOOGLE_CLIENT_ID) {
    return jsonResponse({ error: "GOOGLE_CLIENT_ID not configured" }, 500);
  }
  const redirectUri = `${url.origin}/api/gsc/callback`;
  const { buildGscAuthUrl: buildGscAuthUrl2 } = await Promise.resolve().then(() => (init_gsc(), gsc_exports));
  return jsonResponse({
    authorization_url: buildGscAuthUrl2(env.GOOGLE_CLIENT_ID, redirectUri),
    redirect_uri: redirectUri,
    note: "Add redirect_uri to Google Cloud Console \u2192 Credentials \u2192 Authorized redirect URIs if not yet registered"
  });
});
route("GET", "/api/gsc/callback", async ({ env, url }) => {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const redirectUri = `${url.origin}/api/gsc/callback`;
  const render = /* @__PURE__ */ __name((ok, message) => new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GSC Authorization</title></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0a0a;color:#f0f0f0"><div style="text-align:center;max-width:520px;padding:32px"><h2 style="color:${ok ? "#4ade80" : "#f87171"}">${ok ? "\u2705 \u6388\u6743\u6210\u529F" : "\u274C \u6388\u6743\u5931\u8D25"}</h2><p style="color:#999;line-height:1.6">${message}</p><p style="color:#666;font-size:13px">\u53EF\u5173\u95ED\u6B64\u9875\u9762\uFF0C\u56DE\u5230 Admin \u540E\u53F0\u70B9\u51FB\u300C\u5237\u65B0\u6570\u636E\u300D\u3002</p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  ), "render");
  if (error) {
    return render(false, `Google \u8FD4\u56DE\u9519\u8BEF\uFF1A${error}`);
  }
  if (!code) {
    return render(false, "\u7F3A\u5C11\u6388\u6743\u7801\u53C2\u6570\uFF08code\uFF09");
  }
  const { exchangeGscCode: exchangeGscCode2 } = await Promise.resolve().then(() => (init_gsc(), gsc_exports));
  const result = await exchangeGscCode2(env, code, redirectUri);
  if (!result.ok) {
    return render(false, result.error ?? "Unknown error");
  }
  return render(true, "refresh_token \u5DF2\u4FDD\u5B58\uFF0CGSC \u6570\u636E\u540C\u6B65\u5DF2\u6062\u590D\u3002\u6BCF\u65E5 03:00 \u5C06\u81EA\u52A8\u540C\u6B65\u5173\u952E\u8BCD\u6570\u636E\u3002");
});
route("GET", "/api/competitors", async ({ env }) => {
  const { getCompetitors: getCompetitors2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const competitors = await getCompetitors2(env);
  return jsonResponse({ competitors });
});
route("GET", "/api/competitors/debug", async ({ url }) => {
  const domain = url.searchParams.get("domain");
  if (!domain) return jsonResponse({ error: "domain required" }, 400);
  const { fetchCompetitorSitemap: fetchCompetitorSitemap2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const urls = await fetchCompetitorSitemap2(domain);
  return jsonResponse({ domain, urlCount: urls.length, sample: urls.slice(0, 5) });
});
route("POST", "/api/competitors", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.domain) {
    return jsonResponse({ error: "domain is required" }, 400);
  }
  const { addCompetitor: addCompetitor2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const entry = await addCompetitor2(env, body.domain, body.name);
  if (!entry) {
    return jsonResponse({ error: "Competitor already exists" }, 409);
  }
  return jsonResponse(entry, 201);
});
route("DELETE", "/api/competitors/:domain", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { deleteCompetitor: deleteCompetitor2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const ok = await deleteCompetitor2(env, params.domain);
  if (!ok) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  return jsonResponse({ message: "Deleted" });
});
route("POST", "/api/blog/backfill-groups", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const { matchGroupId: matchGroupId2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  const all = await getJSON2(env.CONTENT_QUEUE, "published:all") ?? [];
  const result = {
    total: all.length,
    alreadyTagged: 0,
    updated: 0,
    unresolved: 0,
    details: []
  };
  for (const row of all) {
    if (row.groupId) {
      result.alreadyTagged++;
      continue;
    }
    const slug = String(row.slug ?? "");
    const groupId = matchGroupId2(row.keyword ?? "") || matchGroupId2(slug) || matchGroupId2(slug.replace(/[-_]/g, " "));
    if (!groupId) {
      result.unresolved++;
      result.details.push({ slug, groupId: null });
      continue;
    }
    row.groupId = groupId;
    const record = await getJSON2(env.CONTENT_QUEUE, `published:${slug}`);
    if (record) {
      record.groupId = groupId;
      await setJSON2(env.CONTENT_QUEUE, `published:${slug}`, record);
    }
    result.updated++;
    result.details.push({ slug, groupId });
  }
  await setJSON2(env.CONTENT_QUEUE, "published:all", all);
  return jsonResponse({ message: "Backfill completed", ...result });
});
route("GET", "/api/banner/diagnose", async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const apiKey = env.QWEN_API_KEY;
  if (!apiKey) {
    return jsonResponse({ ok: false, stage: "config", error: "QWEN_API_KEY \u672A\u914D\u7F6E" });
  }
  if (!env.IMAGES) {
    return jsonResponse({ ok: false, stage: "config", error: "IMAGES (R2) \u672A\u7ED1\u5B9A" });
  }
  const started = Date.now();
  const keyword = url.searchParams.get("keyword");
  let prompt = "bright industrial steel wire mesh fence, natural daylight";
  if (keyword) {
    const { buildBannerPrompt: buildBannerPrompt2 } = await Promise.resolve().then(() => (init_banner_gen(), banner_gen_exports));
    prompt = buildBannerPrompt2(keyword);
  }
  try {
    const resp = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-DashScope-Async": "enable"
        },
        body: JSON.stringify({
          model: "wanx-v1",
          input: { prompt },
          parameters: { style: "<photography>", size: "1280*720", n: 1 }
        })
      }
    );
    const bodyText = await resp.text();
    let taskId = null;
    try {
      taskId = JSON.parse(bodyText).output?.task_id ?? null;
    } catch {
    }
    const polls = [];
    let imageUrl2 = null;
    if (taskId && resp.ok) {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 5e3));
        const pr = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        const pj = await pr.json();
        const status = pj.output?.task_status ?? "UNKNOWN";
        polls.push({ attempt: i + 1, status, message: pj.output?.message });
        if (status === "SUCCEEDED") {
          imageUrl2 = pj.output?.results?.[0]?.url ?? null;
          break;
        }
        if (status === "FAILED") break;
      }
    }
    return jsonResponse({
      ok: resp.ok,
      stage: "submit+poll",
      status: resp.status,
      elapsedMs: Date.now() - started,
      taskId,
      polls,
      finalStatus: polls.length ? polls[polls.length - 1].status : null,
      finalMessage: polls.length ? polls[polls.length - 1].message ?? null : null,
      imageUrl: imageUrl2 ? "(ok)" : null,
      qwenModelVar: env.QWEN_MODEL || null,
      promptUsed: prompt,
      body: bodyText.slice(0, 400)
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      stage: "network",
      elapsedMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err)
    });
  }
});
route("GET", "/api/gsc/pending", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const data = await getJSON2(
    env.SEO_DATA,
    "gsc:pending"
  );
  const urls = data?.urls ?? [];
  return jsonResponse({
    count: urls.length,
    updatedAt: data?.updatedAt ?? null,
    urls,
    plain: urls.map((u) => u.url).join("\n")
  });
});
route("POST", "/api/gsc/pending/seed", async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const days = Number(url.searchParams.get("days") ?? 0);
  const cutoff = days > 0 ? Date.now() - days * 864e5 : 0;
  const published = await getJSON2(env.CONTENT_QUEUE, "published:all") ?? [];
  const existing = await getJSON2(env.SEO_DATA, "gsc:pending") ?? { urls: [] };
  const bySlug = new Map(existing.urls.map((row) => [row.slug, row]));
  let added = 0;
  for (const row of published) {
    if (!row.slug) continue;
    if (bySlug.has(row.slug)) continue;
    const publishedAt = row.publishedAt ?? (/* @__PURE__ */ new Date()).toISOString();
    if (cutoff && new Date(publishedAt).getTime() < cutoff) continue;
    bySlug.set(row.slug, {
      url: `https://www.kestrelmetal.com/${row.slug}.html`,
      slug: row.slug,
      publishedAt
    });
    added++;
  }
  const urls = Array.from(bySlug.values()).sort((a, b) => a.publishedAt < b.publishedAt ? 1 : -1);
  await setJSON2(env.SEO_DATA, "gsc:pending", { urls, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  return jsonResponse({ message: "Seeded", added, count: urls.length });
});
route("DELETE", "/api/gsc/pending", async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const slug = url.searchParams.get("slug");
  if (!slug) {
    await setJSON2(env.SEO_DATA, "gsc:pending", { urls: [], updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    return jsonResponse({ message: "Cleared", count: 0 });
  }
  const data = await getJSON2(
    env.SEO_DATA,
    "gsc:pending"
  );
  const urls = (data?.urls ?? []).filter((row) => row.slug !== slug);
  await setJSON2(env.SEO_DATA, "gsc:pending", { urls, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  return jsonResponse({ message: "Removed", slug, count: urls.length });
});
route("POST", "/api/competitors/analyze", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.domain) {
    return jsonResponse({ error: "domain is required" }, 400);
  }
  const { analyzeCompetitor: analyzeCompetitor2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const result = await analyzeCompetitor2(env, body.domain);
  if (result.error) {
    return jsonResponse({ domain: body.domain, keywordCount: result.keywordCount, error: result.error });
  }
  return jsonResponse({ domain: body.domain, keywordCount: result.keywordCount });
});
route("GET", "/api/competitors/gap", async ({ env }) => {
  const { computeGap: computeGap2 } = await Promise.resolve().then(() => (init_competitor(), competitor_exports));
  const gaps = await computeGap2(env);
  await env.SEO_DATA.put("competitors:gap", JSON.stringify({ gaps, generatedAt: (/* @__PURE__ */ new Date()).toISOString() }));
  return jsonResponse({ gaps, generatedAt: (/* @__PURE__ */ new Date()).toISOString() });
});
route("GET", "/api/keyword-groups/defs", async () => {
  const { listGroupDefs: listGroupDefs2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  return jsonResponse({ groups: listGroupDefs2() });
});
route("GET", "/api/keyword-groups", async ({ env, url }) => {
  const { runClustering: runClustering2, loadCachedCluster: loadCachedCluster2, selectGroups: selectGroups2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const result = forceRefresh ? await runClustering2(env) : await loadCachedCluster2(env) ?? await runClustering2(env);
  const upcoming = selectGroups2(result, 1).map((g) => ({
    id: g.id,
    name: g.name,
    primaryKeyword: g.primaryKeyword,
    keywordCount: g.keywords.length
  }));
  return jsonResponse({ ...result, upcoming });
});
route("POST", "/api/keyword-groups/rebuild", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { runClustering: runClustering2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  const result = await runClustering2(env);
  return jsonResponse({ message: "Clustering rebuilt", totalGroups: result.groups.length, ...result });
});
route("POST", "/api/keyword-groups/assign", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body?.keyword || !body?.groupId) {
    return jsonResponse({ error: "keyword and groupId are required" }, 400);
  }
  const { loadOverrides: loadOverrides2, saveOverrides: saveOverrides2, normalizeKeyword: normalizeKeyword2, isValidGroupId: isValidGroupId2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  if (!isValidGroupId2(body.groupId)) {
    return jsonResponse({ error: `Unknown groupId: ${body.groupId}` }, 400);
  }
  const overrides = await loadOverrides2(env);
  overrides.assign = overrides.assign ?? {};
  const keyword = normalizeKeyword2(body.keyword);
  overrides.assign[keyword] = body.groupId;
  overrides.exclude = (overrides.exclude ?? []).filter((k) => normalizeKeyword2(k) !== keyword);
  await saveOverrides2(env, overrides);
  const { runClustering: runClustering2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  await runClustering2(env);
  return jsonResponse({ message: "Assigned", keyword, groupId: body.groupId });
});
route("POST", "/api/keyword-groups/exclude", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body?.keyword) {
    return jsonResponse({ error: "keyword is required" }, 400);
  }
  const { loadOverrides: loadOverrides2, saveOverrides: saveOverrides2, normalizeKeyword: normalizeKeyword2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  const overrides = await loadOverrides2(env);
  const keyword = normalizeKeyword2(body.keyword);
  overrides.exclude = Array.from(/* @__PURE__ */ new Set([...overrides.exclude ?? [], keyword]));
  if (overrides.assign) delete overrides.assign[keyword];
  await saveOverrides2(env, overrides);
  const { runClustering: runClustering2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  await runClustering2(env);
  return jsonResponse({ message: "Excluded", keyword });
});
route("DELETE", "/api/keyword-groups/override", async ({ env, request, url }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const keyword = url.searchParams.get("keyword");
  if (!keyword) {
    return jsonResponse({ error: "keyword is required" }, 400);
  }
  const { loadOverrides: loadOverrides2, saveOverrides: saveOverrides2, normalizeKeyword: normalizeKeyword2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  const overrides = await loadOverrides2(env);
  const normalized = normalizeKeyword2(keyword);
  overrides.exclude = (overrides.exclude ?? []).filter((k) => normalizeKeyword2(k) !== normalized);
  if (overrides.assign) delete overrides.assign[normalized];
  await saveOverrides2(env, overrides);
  const { runClustering: runClustering2 } = await Promise.resolve().then(() => (init_keyword_cluster(), keyword_cluster_exports));
  await runClustering2(env);
  return jsonResponse({ message: "Override cleared", keyword: normalized });
});
route("POST", "/api/banner/regenerate", async ({ env, request }) => {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json();
  if (!body.slug) return jsonResponse({ error: "slug is required" }, 400);
  const published = await env.CONTENT_QUEUE.get(`published:${body.slug}`, "json");
  if (!published || !published.html) return jsonResponse({ error: "Article not found" }, 404);
  try {
    const { generateBannerImage: generateBannerImage2, applyBannerToHtml: applyBannerToHtml2 } = await Promise.resolve().then(() => (init_banner_gen(), banner_gen_exports));
    const bannerUrl = await generateBannerImage2(
      { QWEN_API_KEY: env.QWEN_API_KEY, QWEN_MODEL: env.QWEN_MODEL, IMAGES: env.IMAGES },
      published.keyword || "",
      body.slug
    );
    if (bannerUrl) {
      const hasSlot = /background-image:url\('[^']*'\);/.test(published.html);
      if (hasSlot) {
        const updatedHtml = applyBannerToHtml2(published.html, bannerUrl);
        await env.CONTENT_QUEUE.put(`published:${body.slug}`, JSON.stringify({ ...published, html: updatedHtml }));
        return jsonResponse({ ok: true, slug: body.slug, bannerUrl, inserted: true });
      }
      return jsonResponse({
        ok: true,
        slug: body.slug,
        bannerUrl,
        inserted: false,
        reason: "no background-image slot in stored html; hero section missing"
      });
    }
    return jsonResponse({ ok: false, error: "Banner generation returned no URL" });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
route("POST", "/api/trigger/:cron", async ({ env, params, request }) => {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const cronName = params.cron;
  if (cronName === "gsc-sync") {
    const { default: gscSync2 } = await Promise.resolve().then(() => (init_gsc_sync(), gsc_sync_exports));
    await gscSync2(env);
    return jsonResponse({ message: "GSC sync completed (opportunity analysis included)", siteUrl: env.GSC_SITE_URL });
  }
  if (cronName === "opportunity") {
    const { default: opportunityCron2 } = await Promise.resolve().then(() => (init_opportunity(), opportunity_exports));
    await opportunityCron2(env);
    return jsonResponse({ message: "Opportunity analysis completed" });
  }
  if (cronName === "generate") {
    const { default: generate2 } = await Promise.resolve().then(() => (init_generate(), generate_exports));
    const result = await generate2(env);
    return jsonResponse({ message: "Content generation completed", ...result });
  }
  if (cronName === "score") {
    const { default: score2 } = await Promise.resolve().then(() => (init_score(), score_exports));
    await score2(env);
    return jsonResponse({ message: "Score and deploy completed" });
  }
  if (cronName === "track") {
    const { default: track2 } = await Promise.resolve().then(() => (init_track(), track_exports));
    await track2(env);
    return jsonResponse({ message: "Performance tracking completed" });
  }
  if (cronName === "monthly-report") {
    const { default: monthlyReport2 } = await Promise.resolve().then(() => (init_monthly_report(), monthly_report_exports));
    await monthlyReport2(env);
    return jsonResponse({ message: "Monthly report generated" });
  }
  if (cronName === "geo-faq") {
    const { default: geoFaq2 } = await Promise.resolve().then(() => (init_geo_faq(), geo_faq_exports));
    await geoFaq2(env);
    return jsonResponse({ message: "GEO FAQ generation completed (pending review in admin)" });
  }
  if (cronName === "geo-audit") {
    const { default: geoAudit2 } = await Promise.resolve().then(() => (init_geo_audit(), geo_audit_exports));
    const result = await geoAudit2(env, { force: true });
    return jsonResponse({ message: "GEO audit chunk completed", ...result });
  }
  return jsonResponse({
    message: `Cron ${cronName} triggered`,
    note: "This cron handler is not yet implemented"
  });
});
route("GET", "/api/settings/content-pipeline", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const state = await getJSON2(
    env.SEO_DATA,
    "automation:pause-content-pipeline"
  );
  return jsonResponse({ paused: !!state, ...state });
});
route("POST", "/api/settings/content-pipeline", async ({ env, request }) => {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body.paused !== "boolean") {
    return jsonResponse({ error: 'Field "paused" (boolean) is required' }, 400);
  }
  if (body.paused) {
    await setJSON2(env.SEO_DATA, "automation:pause-content-pipeline", {
      pausedAt: (/* @__PURE__ */ new Date()).toISOString(),
      reason: body.reason || "paused via admin API"
    });
  } else {
    await env.SEO_DATA.delete("automation:pause-content-pipeline");
  }
  return jsonResponse({ paused: body.paused });
});
route("GET", "/api/geo/scores", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const rows = await getJSON2(env.SEO_DATA, "geo:scores") ?? [];
  const sorted = rows.slice().sort((a, b) => a.score - b.score);
  const lastScoredAt = rows.reduce((max, r) => r.scored_at > max ? r.scored_at : max, "");
  return jsonResponse({
    scored_at: lastScoredAt || null,
    count: rows.length,
    average: rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : null,
    scores: sorted
  });
});
route("GET", "/api/geo/patches", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const patches = await getJSON2(env.SEO_DATA, "geo:patches") ?? [];
  return jsonResponse(patches);
});
route("GET", "/api/geo/patches/approved", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const patches = await getJSON2(env.SEO_DATA, "geo:patches") ?? [];
  return jsonResponse(patches.filter((p) => p.status === "approved"));
});
route("POST", "/api/geo/patches/mark-applied", async ({ env, request }) => {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.slugs) || body.slugs.length === 0) {
    return jsonResponse({ error: "slugs[] is required" }, 400);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const patches = await getJSON2(env.SEO_DATA, "geo:patches") ?? [];
  const wanted = new Set(body.slugs.map(String));
  let marked = 0;
  for (const p of patches) {
    if (wanted.has(p.slug) && p.status === "approved") {
      p.status = "applied";
      p.pr_url = body.pr_url;
      marked++;
    }
  }
  if (marked > 0) await setJSON2(env.SEO_DATA, "geo:patches", patches);
  return jsonResponse({ marked, pr_url: body.pr_url ?? null });
});
route("GET", "/api/geo/patches/workflow-report", async ({ env }) => {
  const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const last = await getJSON2(env.SEO_DATA, "geo:workflow:last_report");
  return jsonResponse(last ?? { status: "never_run", reported_at: null });
});
route("POST", "/api/geo/patches/workflow-report", async ({ env, request }) => {
  const body = await request.json().catch(() => null);
  const allowed = ["success", "failure", "pending_pr"];
  if (!body || !allowed.includes(String(body.status))) {
    return jsonResponse({ error: "status must be success|failure|pending_pr" }, 400);
  }
  const report = {
    status: body.status,
    run_id: body.run_id,
    event: body.event,
    applied: typeof body.applied === "number" ? body.applied : void 0,
    pr_url: body.pr_url,
    branch: body.branch,
    compare_url: body.compare_url,
    error: typeof body.error === "string" ? body.error.slice(-6e3) : void 0,
    reported_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  await setJSON2(env.SEO_DATA, "geo:workflow:last_report", report);
  const history = await getJSON2(env.SEO_DATA, "geo:workflow:history") ?? [];
  history.push(report);
  await setJSON2(env.SEO_DATA, "geo:workflow:history", history.slice(-20));
  return jsonResponse({ ok: true });
});
route("PUT", "/api/geo/patches/:slug", async ({ env, params, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const body = await request.json().catch(() => null);
  if (!body) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const patches = await getJSON2(env.SEO_DATA, "geo:patches") ?? [];
  const idx = patches.findIndex((p) => p.slug === params.slug);
  if (idx < 0) {
    return jsonResponse({ error: "Not found" }, 404);
  }
  const allowed = [
    "definition_sentence",
    "fact_points",
    "status",
    "title"
  ];
  for (const key of allowed) {
    if (body[key] !== void 0) {
      patches[idx][key] = body[key];
    }
  }
  await setJSON2(env.SEO_DATA, "geo:patches", patches);
  return jsonResponse(patches[idx]);
});
route("POST", "/api/geo/patches/pr", async ({ env, request }) => {
  if (!isAdminAuthorized(request, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const { getJSON: getJSON2, setJSON: setJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
  const patches = await getJSON2(env.SEO_DATA, "geo:patches") ?? [];
  const approved = patches.filter((p) => p.status === "approved");
  if (approved.length === 0) {
    return jsonResponse({ error: 'No approved patches. Approve patches first (PUT /api/geo/patches/:slug {status:"approved"})' }, 400);
  }
  const { openPatchPullRequest: openPatchPullRequest2 } = await Promise.resolve().then(() => (init_github(), github_exports));
  const result = await openPatchPullRequest2(env, approved);
  const appliedSet = new Set(result.appliedSlugs);
  for (const p of patches) {
    if (appliedSet.has(p.slug)) {
      p.status = "applied";
      p.pr_url = result.prUrl;
    }
  }
  await setJSON2(env.SEO_DATA, "geo:patches", patches);
  return jsonResponse({ message: "Pull request opened. Merge it on GitHub to deploy.", ...result });
});
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
__name(jsonResponse, "jsonResponse");

// src/lib/seo-inject.ts
init_seo_meta();
var DOMAIN2 = "https://www.kestrelmetal.com";
var DEFAULT_IMAGE = `${DOMAIN2}/images/og-default.jpg`;
var PAGE_KEYWORDS = {
  "/galvanized-chain-link.html": "galvanized chain link fence, chain link fence wholesale, ASTM A392 fence, hot-dip galvanized fence, wire mesh fencing supplier",
  "/chain-link-fittings.html": "chain link fence fittings, fence accessories, tension bars, fence bands, hog rings, post caps, chain link hardware supplier",
  "/gabion-boxes.html": "gabion boxes manufacturer, welded gabion box, erosion control gabion, flood defense gabion, retaining wall gabion, gabion supplier China",
  "/razor-wire-long-blade.html": "CBT-65 razor wire, long blade concertina wire, military razor wire, prison security wire, high security razor wire supplier",
  "/razor-wire-cross.html": "CBT-60 concertina razor wire, cross blade razor wire, perimeter security wire, razor wire coil supplier",
  "/razor-wire-single-coil.html": "single coil razor wire, razor wire barrier, temporary security fence, razor wire roll supplier",
  "/razor-wire-welded-mesh.html": "razor wire welded mesh, razor wire fence panel, security mesh fence, anti-climb razor mesh supplier",
  "/razor-wire-straight.html": "straight razor wire, flat barb wire, security topping wire, razor wire straight line supplier",
  "/razor-wire-flat-wrap.html": "flat wrap razor wire, wall top security wire, fence topping razor wire, flat coil razor wire supplier",
  "/razor-wire-fish-hook.html": "fish hook razor wire, anti-climb security wire, wall spike alternative, fish hook barbed wire supplier",
  "/razor-wire-btc.html": "BTC-65 razor wire, blade tape concertina, military grade razor wire, border security wire supplier",
  "/welded-wire-mesh.html": "welded wire mesh supplier, wire mesh panel, wire mesh roll, construction mesh, fencing mesh supplier China",
  "/welded-wire-mesh-panel.html": "welded wire mesh panel, galvanized mesh panel, PVC coated mesh panel, construction reinforcement mesh, security fence panel",
  "/welded-wire-mesh-roll.html": "welded wire mesh roll, galvanized wire mesh roll, fencing roll, agricultural mesh roll, welded mesh supplier",
  "/chain-link.html": "chain link fence, wire mesh fence, chain link fencing supplier, galvanized fence, security fence manufacturer China",
  "/chain-link-security-fence.html": "chain link security fence, anti-climb fence, perimeter security fence, high security chain link, prison fence supplier",
  "/pvc-coated-chain-link.html": "PVC coated chain link fence, vinyl coated fence, green chain link fence, decorative fence, color coated wire mesh supplier",
  "/358-security-fence.html": "358 security fence, anti-climb mesh fence, prison fence, high security welded mesh, small mesh fence supplier",
  "/fence-3d.html": "3D welded wire fence, v-mesh fence, security fence panel, anti-climb fence, decorative security fence supplier",
  "/fence-security.html": "security fence, perimeter fence, anti-intrusion fence, industrial security fence, commercial fence supplier",
  "/fence-farm.html": "farm fence, agricultural fence, livestock fence, cattle fence, field fence supplier China",
  "/epoxy-coated-wire-mesh.html": "epoxy coated wire mesh, powder coated mesh, decorative wire mesh, black wire mesh, architectural mesh supplier",
  "/barbed-wire-galvanized.html": "galvanized barbed wire, hot-dip barbed wire, security barbed wire, razor barbed wire, barbed wire supplier China",
  "/barbed-wire-traditional.html": "traditional barbed wire, single strand barbed wire, farm barbed wire, boundary wire, barbed wire roll supplier",
  "/barbed-wire-concertina.html": "concertina barbed wire, coiled barbed wire, perimeter security wire, concertina wire supplier",
  "/barbed-wire-double-twist.html": "double twist barbed wire, woven barbed wire, security fence wire, double strand barbed wire supplier",
  "/barbed-wire-single-twist.html": "single twist barbed wire, barb wire fence, agricultural barbed wire, single strand wire supplier",
  "/barbed-wire-pvc.html": "PVC coated barbed wire, green barbed wire, vinyl coated barbed wire, decorative barbed wire supplier",
  "/stainless-screen-mesh.html": "stainless steel screen mesh, insect screen, window mesh, stainless wire mesh, mosquito net mesh supplier",
  "/plain-weave-screen-mesh.html": "plain weave screen mesh, wire cloth, industrial screen mesh, filtration mesh, plain weave wire mesh supplier",
  "/twill-weave-screen-mesh.html": "twill weave screen mesh, dutch weave mesh, filter mesh, industrial wire cloth, twill weave wire mesh supplier",
  "/dutch-weave-screen-mesh.html": "dutch weave screen mesh, filter cloth, industrial filtration mesh, wire mesh filter, dutch weave wire mesh supplier",
  "/hexagonal-wire.html": "hexagonal wire mesh, chicken wire, poultry netting, hex netting, garden wire mesh supplier China",
  "/hexagonal-wire-galvanized.html": "galvanized hexagonal wire mesh, chicken wire mesh, poultry fence, hexagonal netting, galvanized hex mesh supplier",
  "/hexagonal-wire-pvc.html": "PVC coated hexagonal wire mesh, green chicken wire, vinyl coated hex netting, garden fence mesh supplier",
  "/hexagonal-wire-stainless.html": "stainless steel hexagonal wire mesh, corrosion resistant hex mesh, industrial hex netting, stainless chicken wire supplier",
  "/woven-wire-mesh.html": "woven wire mesh, wire cloth, woven mesh panel, industrial woven mesh, woven wire fence supplier",
  "/welded-mesh-panel-galvanized.html": "galvanized welded mesh panel, steel mesh panel, construction mesh, reinforced mesh panel, galvanized fence panel supplier",
  "/welded-mesh-panel-pvc.html": "PVC coated welded mesh panel, green mesh panel, vinyl fence panel, decorative mesh panel, PVC coated fence supplier",
  "/welded-mesh-panel-stainless.html": "stainless steel welded mesh panel, corrosion resistant mesh, industrial mesh panel, stainless fence panel supplier",
  "/welded-mesh-security-fence.html": "welded mesh security fence, anti-climb fence panel, high security mesh, perimeter fence, welded security fence supplier",
  "/welded-gabion-box.html": "welded gabion box, gabion basket, erosion control gabion, retaining wall gabion, welded gabion supplier",
  "/welded-gabion-galvanized.html": "galvanized welded gabion, hot-dip gabion box, erosion control basket, galvanized gabion supplier",
  "/welded-gabion-pvc.html": "PVC coated gabion box, green gabion basket, vinyl gabion, decorative gabion, PVC coated gabion supplier",
  "/welded-gabion-stainless.html": "stainless steel gabion, corrosion resistant gabion, premium gabion box, stainless gabion supplier",
  "/gabion-mattresses.html": "gabion mattresses, river mattress, channel lining, gabion mat, erosion control mattress supplier",
  "/double-twisted-gabion.html": "double twisted gabion, woven gabion box, hexagonal gabion, traditional gabion basket, double twist gabion supplier",
  "/reno-mattress.html": "reno mattress, channel lining mattress, river protection mattress, erosion control mat, reno mattress supplier",
  "/gabion-retaining-structures.html": "gabion retaining wall, gabion wall, gravity retaining wall, gabion structure, retaining wall gabion supplier",
  "/s-knot.html": "S-knot wire mesh, knotted wire mesh, woven wire fence, livestock fence, S-knot mesh supplier",
  "/hinge-joint-knot.html": "hinge joint knot mesh, field fence, cattle fence, livestock fence, hinge joint wire mesh supplier",
  "/fixed-knot-fence.html": "fixed knot fence, high tensile fence, livestock fence, deer fence, fixed knot wire fence supplier",
  "/y-post-security-fence.html": "Y-post security fence, steel post fence, fence post system, security post, Y-post fence supplier",
  "/square-post.html": "square fence post, steel square post, galvanized post, fence support post, square metal post supplier",
  "/rectangular-post.html": "rectangular fence post, steel rectangular post, heavy duty post, fence post, rectangular metal post supplier",
  "/round-post.html": "round fence post, circular steel post, galvanized round post, fence pole, round metal post supplier",
  "/non-climb-horse-fence.html": "non-climb horse fence, horse pasture fence, equine fence, livestock fence, non-climb wire fence supplier",
  "/deer-fence.html": "deer fence, wildlife exclusion fence, garden protection fence, anti-deer mesh, deer fence supplier",
  "/sheep-goat-fence.html": "sheep fence, goat fence, livestock fence, farm animal fence, sheep and goat mesh supplier",
  "/v-mesh-security-fence.html": "V-mesh security fence, 3D fence panel, welded wire fence, anti-climb V-mesh, security fence panel supplier",
  "/wire-razor.html": "wire razor, razor wire, security wire, concertina wire, razor wire coil supplier",
  "/wire-barbed.html": "wire barbed, barbed wire, security barbed wire, farm barbed wire, barbed wire supplier",
  "/window-screen.html": "window screen, insect screen, mosquito screen, window mesh, aluminum window screen supplier",
  "/nickel-mesh.html": "nickel mesh, nickel wire mesh, industrial mesh, corrosion resistant mesh, nickel mesh filter supplier",
  "/acc-c-rings.html": "C-rings, fence fastener, chain link connector, wire tie, C-ring fastener supplier",
  "/acc-helicals-spiral.html": "helical tie wire, spiral fastener, fence wire tie, helical connector, spiral wire fastener supplier",
  "/acc-hook-connection.html": "hook connection, fence hook, chain link hook, wire connector, hook fastener supplier",
  "/acc-lacing-wire.html": "lacing wire, tie wire, fence binding wire, wire lacer, lacing wire for fence supplier",
  "/acc-u-clips.html": "U-clips, fence clip, wire mesh clip, panel connector, U-clip fastener supplier",
  "/hot-dip-galvanized.html": "hot-dip galvanization, galvanized steel, zinc coating, corrosion protection, hot-dip galvanized wire supplier",
  "/pvc-coated.html": "PVC coated wire, vinyl coated steel, color coated wire, weather resistant wire, PVC coated mesh supplier",
  "/powder-coated.html": "powder coated wire, electrostatic coating, decorative wire mesh, durable wire finish, powder coated fence supplier",
  "/about.html": "Kestrel Metal, wire mesh manufacturer, fence supplier China, Anping wire mesh factory, metal products exporter",
  "/contact.html": "contact Kestrel Metal, wire mesh inquiry, fence quote, bulk order metal products, export inquiry",
  "/products.html": "metal products catalog, wire mesh products, fence products, gabion products, security fence manufacturer China",
  "/faq.html": "wire mesh FAQ, fence buying guide, metal products questions, fence installation FAQ, gabion box questions",
  "/services.html": "metal fabrication services, wire mesh customization, fence design service, custom metal products, OEM wire mesh",
  "/esg.html": "ESG commitment, sustainable manufacturing, green production, environmental responsibility, metal industry sustainability",
  "/fence-products.html": "security fence products, wire mesh fence catalog, metal fence manufacturer, commercial fence solutions, industrial fence supplier China",
  "/fence-accessories.html": "fence accessories, fence hardware, fence components, gate fittings, fencing supplies wholesale",
  "/fence-posts.html": "fence posts, metal fence posts, steel posts, Y post, square post, round post, fence post manufacturer",
  "/wire-products.html": "wire products, metal wire mesh, wire rolls, wire supplier, wire mesh exporter China",
  "/yard-garden-fence.html": "yard fence, garden fence, decorative fence, residential garden fencing, vinyl fence manufacturer",
  "/industry-agriculture.html": "agricultural fence, farm fence, livestock fencing, crop protection mesh, agricultural wire mesh supplier",
  "/industry-aquaculture.html": "aquaculture netting, fish farm mesh, shrimp pond netting, aquaculture wire mesh, ocean farm fence supplier",
  "/industry-construction.html": "construction wire mesh, concrete reinforcement mesh, building steel mesh, formwork mesh, construction mesh supplier China",
  "/industry-energy.html": "energy industry fence, power plant security fence, solar farm fence, wind farm perimeter, energy mesh supplier",
  "/industry-infrastructure.html": "infrastructure fence, highway barrier, bridge protection mesh, railway security fence, infrastructure metal supplier",
  "/industry-mining.html": "mining wire mesh, mining screen, vibrating screen mesh, mine safety fence, mining mesh supplier China",
  "/industry-oilgas.html": "oil and gas security fence, petrochemical perimeter fence, refinery security fence, oil field wire mesh supplier",
  "/industry-residential.html": "residential fence, community fencing, villa fence, apartment security fence, home garden fence supplier",
  "/privacy-chain-link.html": "privacy chain link fence, chain link privacy screen, slat fence, privacy mesh fence, windscreen fence supplier",
  "/service-custom-solutions.html": "custom metal solutions, bespoke wire mesh, custom fence design, OEM metal fabrication, customized wire products",
  "/service-designer-services.html": "fence design service, wire mesh CAD design, fence layout plan, 3D fence drawing, metal product design service",
  "/service-fabrication.html": "metal fabrication, CNC wire cutting, custom wire forming, welded fabrication, sheet metal service China",
  "/service-metal-finishing.html": "metal finishing service, hot-dip galvanizing, powder coating, PVC coating, plating surface treatment",
  "/service-packaging-logistics.html": "metal product packaging, export logistics, sea freight preparation, container loading, bulk packaging service",
  "/service-takeoffs-drawings.html": "fence material takeoff, wire mesh quantity survey, bill of materials, fence CAD drawings, specification sheet service",
  "/welded-mesh-711.html": "welded wire mesh 711, mesh 1x1 inch, galvanized welded panel, construction reinforcement mesh, welded mesh manufacturer",
  "/welded-mesh-712.html": "welded wire mesh 712, mesh 2x2 inch, galvanized welded panel, wire mesh fence, welded mesh supplier",
  "/welded-mesh-713.html": "welded wire mesh 713, mesh 2x4 inch, welded mesh roll, fencing mesh, welded mesh wholesale",
  "/welded-mesh-714.html": "welded wire mesh 714, mesh 3x3 inch, heavy duty welded panel, cage mesh, welded mesh supplier",
  "/welded-mesh-715.html": "welded wire mesh 715, mesh 4x4 inch, galvanized mesh roll, garden fence, welded mesh manufacturer",
  "/welded-mesh-716.html": "welded wire mesh 716, mesh 1x2 inch, welded panel, plaster reinforcement mesh, welded mesh exporter",
  "/welded-mesh-717.html": "welded wire mesh 717, mesh 1/2x1/2 inch, fine welded mesh, insect screen mesh, welded mesh supplier China",
  "/welded-mesh-718.html": "welded wire mesh 718, mesh 3/4x3/4 inch, welded wire panel, small gauge mesh, welded mesh distributor",
  "/welded-mesh-719.html": "welded wire mesh 719, mesh 1/4x1/4 inch, micro welded mesh, filter mesh, welded mesh manufacturer",
  "/welded-mesh-720.html": "welded wire mesh 720, mesh 3x6 inch, welded fence panel, large mesh roll, security mesh supplier",
  "/welded-mesh-721.html": "welded wire mesh 721, mesh 5x5 inch, heavy welded mesh, construction site fence, welded mesh bulk price",
  "/welded-mesh-722.html": "welded wire mesh 722, mesh 6x6 inch, concrete welded mesh, reinforcing mesh panel, welded rebar mesh supplier",
  "/woven-gabion-box.html": "woven gabion box, hexagonal gabion basket, double twisted gabion, traditional gabion cage, woven gabion supplier",
  "/blog-alloy-coating-salt-spray.html": "alloy coating salt spray, corrosion resistance test, wire mesh coating test, galvanized vs alloy coating, salt spray test standard ASTM B117, zinc aluminum wire mesh",
  "/blog-architectural-wire-mesh.html": "architectural wire mesh, decorative wire mesh, building facade mesh, interior design mesh, architectural metal mesh supplier",
  "/blog-automated-production-line.html": "automated wire mesh production, CNC wire mesh machine, automated fence manufacturing, smart production line, industrial 4.0 wire mesh",
  "/blog-barb-wire-gates-tips.html": "barbed wire gate installation, barb wire farm gate, single strand barb wire tips, livestock gate barbed wire, gate security barbed wire",
  "/blog-barbed-wire-cost-calculation.html": "barbed wire price per ton, barb wire cost calculator, bulk barbed wire pricing, 14 gauge barbed wire cost, barbed wire export price China",
  "/blog-border-razor-wire-deployment.html": "border security razor wire, military razor deployment, concertina razor wire border, razor wire installation guide border, high security perimeter fence",
  "/blog-ce-ukca-reach-wire-mesh-compliance.html": "CE marking wire mesh, UKCA compliance wire fence, REACH regulation metal products, EU wire mesh standard, export compliance wire mesh",
  "/blog-chain-link-evolution.html": "history of chain link fence, chain link fence evolution, diamond mesh fence origin, chain link manufacturing timeline, modern chain link technology",
  "/blog-chain-link-fence-buying-guide.html": "chain link fence buying guide, how to choose chain link fence, chain link specifications, galvanized vs PVC chain link, commercial chain link supplier",
  "/blog-chain-link-replace.html": "chain link fence repair, how to replace chain link mesh, chain link parts replacement, fence repair service, chain link maintenance",
  "/blog-chain-link-selection.html": "how to select chain link fence, chain link gauge guide, mesh size selection chain link, fence post spacing guide, commercial fence spec",
  "/blog-chain-link-yard.html": "yard chain link fence, residential chain link fence, backyard chain link, dog run chain link, vinyl chain link yard fence",
  "/blog-dual-fence-security.html": "dual fence security system, K rated perimeter fence, high security dual barrier, anti-climb dual fence, prison security fence dual layer",
  "/blog-epoxy-vs-galvanised-woven-wire-mesh.html": "epoxy coated vs galvanized wire mesh, woven mesh coating comparison, outdoor wire mesh durability, epoxy mesh corrosion test",
  "/blog-fence-comparison-3d-chain-link-palisade.html": "3d fence vs chain link vs palisade, security fence comparison, commercial fence types, which fence is better for factory",
  "/blog-fence-liability-escaped-animals.html": "fence liability escaped animals, farm fence legal responsibility, livestock escape law, ranch fence liability, agricultural fence compliance",
  "/blog-field-fence-installation.html": "field fence installation, agricultural fence post spacing, woven wire field fence, farm fence tool, field fence stretch guide",
  "/blog-gabion-box-selection-guide.html": "gabion box selection guide, how to choose gabion basket, welded vs woven gabion, gabion size guide, river protection gabion supplier",
  "/blog-gabion-boxes-market-report-2034.html": "gabion market report 2034, global gabion box industry trend, wire mesh gabion market size, infrastructure gabion demand forecast",
  "/blog-galvanized-chain-link-fence-maintenance.html": "galvanized chain link maintenance, how to clean chain link fence, chain link rust prevention, zinc coating repair, outdoor fence care tips",
  "/blog-galvanized-vs-pvc.html": "galvanized vs pvc chain link, which fence lasts longer, PVC coated fence vs hot dip, weather resistance fence coating",
  "/blog-hexagonal-vs-gabion-mesh.html": "hexagonal wire mesh vs gabion, gabion basket vs chicken wire mesh, gabion box mesh difference, stone cage wire specification",
  "/blog-hexagonal-wire-mesh-global-impact.html": "hexagonal wire mesh uses, chicken wire global market, gabion mesh construction impact, hexagonal mesh aquaculture application",
  "/blog-history-of-gabion.html": "history of gabion box, ancient gabion origin, military gabion evolution, Leonardo da Vinci gabion invention, modern gabion history",
  "/blog-how-to-install-welded-gabion-boxes.html": "welded gabion installation, welded gabion assembly steps, square hole gabion basket install, retaining wall gabion construction guide",
  "/blog-hs-codes-wire-mesh-fencing-export.html": "HS code wire mesh export, harmonized code fence products, export tariff code metal mesh, 7314 wire mesh HS, customs declaration wire fence",
  "/blog-installation-mistakes.html": "fence installation mistakes, common wire mesh install errors, wrong fence post spacing, avoiding fence installation pitfalls, pro fence install tips",
  "/blog-materials-welded-wire-mesh.html": "welded wire mesh material types, galvanized welded mesh vs stainless steel, Q195 welded wire, welded mesh low carbon steel, wire mesh raw material",
  "/blog-nato22-razor-wire.html": "NATO 22 razor wire, military concertina razor, CBT-65 razor wire specification, NATO standard razor coil, razor wire diameter 2.5mm",
  "/blog-nato22-vs-astm-razor-wire.html": "NATO 22 vs ASTM razor wire, concertina razor standard comparison, military vs commercial razor wire, CBT-60 vs CBT-65 razor",
  "/blog-new-manufacturing-facility.html": "new wire mesh factory, expanded manufacturing capacity, Anping wire mesh new plant, automated factory opening, Kestrel Metal factory expansion",
  "/blog-news.html": "Kestrel Metal news, company announcement wire mesh, metal industry update, wire mesh press release, fence manufacturer news",
  "/blog-plain-vs-twill-weave.html": "plain weave vs twill weave wire mesh, filter mesh weave type comparison, Dutch weave vs plain, screen mesh weave types, industrial wire cloth specification",
  "/blog-razor-coils-7-things.html": "razor wire buying tips, 7 things to know concertina razor, razor coil specification guide, concertina razor deployment tips",
  "/blog-razor-wire-vs-barbed-wire.html": "razor wire vs barbed wire, which is better security, concertina razor vs barb wire, anti climb fence comparison, prison fence spec",
  "/blog-sintered-filters.html": "sintered wire mesh filter, porous metal filter disc, sintered stainless filter, industrial filtration element, sintered mesh supplier",
  "/blog-solar-farm-fence-specification-guide.html": "solar farm perimeter fence specification, photovoltaic security fence, solar plant anti climb fence, utility scale solar fence standard",
  "/blog-specification-sheet.html": "wire mesh specification sheet, fence product data sheet, technical spec metal mesh, product datasheet download, metal product specification",
  "/blog-squirrel-proof-wire-mesh.html": "squirrel proof wire mesh, pest control mesh, garden squirrel fence, 1x1 inch anti-squirrel mesh, small animal control wire mesh",
  "/blog-ss-welded-wire-mesh-guide.html": "stainless welded wire mesh guide, 304 vs 316 welded mesh, food grade welded wire, hygienic wire mesh, SS welded panel specification",
  "/blog-steel-mesh-plastering.html": "steel mesh for plastering, expanded metal lath, rendering wire mesh, stucco reinforcement, plaster reinforcement welded mesh",
  "/blog-sustainable-infrastructure.html": "sustainable infrastructure, green building wire mesh, eco friendly gabion, low carbon steel mesh production, sustainable construction metal",
  "/blog-sustainable-manufacturing-award.html": "sustainable manufacturing award, green factory certificate wire mesh, ESG award metal industry, low carbon production prize",
  "/blog-versatile-wire-mesh-products.html": "versatile wire mesh uses, multi purpose metal mesh, industrial wire mesh applications, fence and filter mesh versatility",
  "/blog-weld-strength-matters.html": "welded wire mesh weld strength, resistance welding quality, weld shear test welded mesh, mesh joint strength specification",
  "/blog-welded-mesh-711-714.html": "welded mesh 711 to 714 specification, 1 inch welded mesh, welded fence panel 712, construction welded mesh size chart",
  "/blog-welded-mesh-715.html": "welded mesh 715 spec, 4x4 inch welded mesh, galvanized welded roll 715, garden mesh welded 715 price",
  "/blog-welded-vs-twisted-gabion.html": "welded vs twisted gabion basket, welded gabion retaining wall, gabion box type comparison, hexagonal vs square gabion mesh",
  "/blog-welded-wire-mesh-technical.html": "welded wire mesh technical specification, welded mesh tolerance standard, EN 10223 welded fence, ASTM welded wire mesh standard",
  "/blog-wire-mesh-for-concrete-reinforcement.html": "concrete reinforcement wire mesh, welded wire fabric rebar, BRC mesh reinforcement, slab reinforcement welded mesh, steel wire mesh for construction",
  "/download-3d-panel-installation-manual.html": "3d fence panel installation manual, v mesh fence install guide, security fence assembly PDF, welded 3d panel installation instructions",
  "/download-ce-marking-declaration.html": "CE marking declaration wire mesh, EU conformity certificate, CE declaration of performance fence, EN 13223 CE certificate, wire mesh CE doc download",
  "/download-chain-link-installation-guide.html": "chain link fence installation guide, DIY chain link setup manual, commercial chain link assembly PDF, diamond mesh installation instructions",
  "/download-coating-specifications-guide.html": "coating specification wire mesh, galvanized coating thickness guide, PVC coating standard, powder coating datasheet, hot dip zinc specification download",
  "/download-fence-panel-cad-library.html": "fence panel CAD library, AutoCAD fence drawing DWG, 3D fence panel CAD model, chain link CAD block, metal fence CAD download",
  "/download-fence-panel-load-capacity.html": "fence panel load capacity report, wind load calculation fence, load test welded panel, structural fence capacity datasheet, fence panel strength document",
  "/download-gabion-assembly-instructions.html": "gabion box assembly instructions, gabion basket installation guide, stone cage manual PDF, gabion retaining wall build guide",
  "/download-gate-hardware-cad-models.html": "gate hardware CAD models, hinge latch CAD drawing, metal gate accessories DWG, fence gate parts CAD library",
  "/download-iso-9001-certificate.html": "ISO 9001 certificate wire mesh, quality management certificate fence factory, ISO 9001:2015 metal product certificate download",
  "/download-material-test-reports.html": "material test report wire mesh, tensile test steel wire, zinc coating test report, welded mesh shear test, MTR metal product download",
  "/download-post-foundation-details.html": "fence post foundation details, concrete anchor specification, fence post base drawing, post embedment depth guide, footing detail download",
  "/download-stainless-screen-mesh-specification.html": "stainless steel screen mesh specification, 304 316 screen mesh datasheet, woven wire mesh micron chart, stainless filter mesh spec download",
  "/download-wire-mesh-technical-datasheet.html": "wire mesh technical datasheet, fence product technical sheet, metal mesh specification table, wire gauge chart PDF download",
  "/case-studies.html": "wire mesh case studies, metal fence project examples, industrial fence case study, gabion box project showcase, Kestrel Metal case studies",
  "/case-study-cattle-ranch-fencing.html": "cattle ranch fencing case study, livestock fence project, farm field fence solution, cattle perimeter wire mesh success story",
  "/case-study-flood-defence-roma.html": "flood defence gabion Roma, river bank gabion protection, flood barrier gabion box case study, Italy flood control wire mesh",
  "/case-study-highway-safety-barrier.html": "highway safety barrier case study, anti climb highway fence, road side security wire mesh, highway welded mesh fence project",
  "/case-study-mining-vibrating-screen-replacement.html": "mining vibrating screen replacement, mine screen mesh solution, vibrating screen wire mesh case study, quarry screen replacement project",
  "/case-study-petrochemical-plant-security.html": "petrochemical plant security fence, oil refinery perimeter case study, high security 358 mesh fence, anti climb razor wire oil plant",
  "/case-study-residential-community-fencing.html": "residential community fencing case study, villa garden fence project, neighborhood metal fence solution, community perimeter security",
  "/case-study-solar-farm-perimeter-security.html": "solar farm perimeter security, photovoltaic power plant fence case study, solar panel anti-theft fence, utility scale solar fence project",
  "/case-study-wastewater-treatment.html": "wastewater treatment wire mesh, water filter screen mesh, sewage treatment filter case study, stainless steel screen mesh plant",
  "/resources.html": "wire mesh resources, fence technical resources, metal product downloads, industry guides wire fence, Kestrel Metal resource center",
  "/catalogs.html": "wire mesh catalog, metal fence catalog, product catalog download Kestrel Metal, wire mesh PDF catalogue, fence product catalogue China",
  "/downloads.html": "wire mesh download center, metal product datasheets, fence specification downloads, certification document download, Kestrel Metal downloads",
  "/glossary.html": "wire mesh glossary, metal fence terms, fence terminology, industry jargon wire products, metal products dictionary",
  "/terms-conditions.html": "terms and conditions Kestrel Metal, sale terms wire mesh, fence purchase conditions, business terms metal product exporter",
  "/privacy-policy.html": "privacy policy Kestrel Metal, personal data protection wire mesh company, data privacy policy fence supplier China",
  "/support.html": "Kestrel Metal support, wire mesh customer service, fence after sales support, metal product technical support, contact support team",
  "/insight.html": "industry insight wire mesh, metal fence market insight, wire products trend analysis, construction metal industry news",
  "/factory-audit.html": "factory audit wire mesh, factory acceptance metal fence, Kestrel Metal factory audit, wire mesh plant inspection report, audit certificate fence factory",
  "/custom.html": "custom wire mesh products, OEM metal fence service, custom size wire mesh, customized fence design, bespoke metal products",
  "/blog.html": "wire mesh blog, metal fence articles, industry blog Kestrel Metal, fence manufacturer blog, blog metal products",
  "/industries.html": "wire mesh industry solutions, fence industry applications, metal products by industry, agricultural fencing, construction wire mesh, mining screen mesh, solar farm fence, oil and gas security fence, infrastructure wire mesh"
};
function resolvePathname(pathname) {
  if (pathname === "/") return "/";
  if (pathname.endsWith(".html")) return pathname;
  return pathname + ".html";
}
__name(resolvePathname, "resolvePathname");
function canonicalPath(pathname) {
  if (pathname === "/") return "/";
  if (pathname.endsWith(".html")) return pathname.slice(0, -5);
  return pathname;
}
__name(canonicalPath, "canonicalPath");
function extractSeoMeta(html, pathname) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i) || html.match(/<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["']/i);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim().replace(/\s+/g, " ");
  const description = descMatch ? descMatch[1].trim() : title;
  const keywords = PAGE_KEYWORDS[pathname] || "";
  return {
    title,
    description,
    keywords,
    canonical: `${DOMAIN2}${canonicalPath(pathname)}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: DEFAULT_IMAGE,
    ogType: pathname.includes("blog-") ? "article" : "website"
  };
}
__name(extractSeoMeta, "extractSeoMeta");
function buildSeoHead(meta) {
  const lines = [];
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
  return lines.join("\n");
}
__name(buildSeoHead, "buildSeoHead");
function escapeAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeAttr, "escapeAttr");
function replaceMetaTag(html, name, content) {
  const pattern = new RegExp(
    `<meta\\s+(?:name=["']${name}["']\\s+content=["'][^"']*["']|content=["'][^"']*["']\\s+name=["']${name}["'])\\s*/?>`,
    "i"
  );
  const tag = `<meta name="${name}" content="${escapeAttr(content)}">`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return html;
  return html.slice(0, headClose) + `    ${tag}
` + html.slice(headClose);
}
__name(replaceMetaTag, "replaceMetaTag");
function replacePropertyTag(html, prop, content) {
  const pattern = new RegExp(
    `<meta\\s+(?:property=["']${prop}["']\\s+content=["'][^"']*["']|content=["'][^"']*["']\\s+property=["']${prop}["'])\\s*/?>`,
    "i"
  );
  const tag = `<meta property="${prop}" content="${escapeAttr(content)}">`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return html;
  return html.slice(0, headClose) + `    ${tag}
` + html.slice(headClose);
}
__name(replacePropertyTag, "replacePropertyTag");
function replaceCanonical(html, href) {
  const pattern = /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i;
  const tag = `<link rel="canonical" href="${escapeAttr(href)}">`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return html;
  return html.slice(0, headClose) + `    ${tag}
` + html.slice(headClose);
}
__name(replaceCanonical, "replaceCanonical");
function replaceTitle(html, title) {
  const pattern = /<title[^>]*>[\s\S]*?<\/title>/i;
  const tag = `<title>${title.replace(/</g, "&lt;")}</title>`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  const headClose = html.indexOf("</head>");
  if (headClose === -1) return html;
  return html.slice(0, headClose) + `    ${tag}
` + html.slice(headClose);
}
__name(replaceTitle, "replaceTitle");
function applyOverride(html, override) {
  let result = html;
  if (override.meta_title) {
    result = replaceTitle(result, override.meta_title);
    result = replacePropertyTag(result, "og:title", override.meta_title);
  }
  if (override.meta_description) {
    result = replaceMetaTag(result, "description", override.meta_description);
    result = replacePropertyTag(result, "og:description", override.meta_description);
  }
  if (override.meta_keywords) {
    result = replaceMetaTag(result, "keywords", override.meta_keywords);
  }
  if (override.canonical_url) {
    result = replaceCanonical(result, override.canonical_url);
  }
  if (override.og_image) {
    result = replacePropertyTag(result, "og:image", override.og_image);
  }
  if (override.noindex) {
    result = replaceMetaTag(result, "robots", "noindex, follow");
  }
  return result;
}
__name(applyOverride, "applyOverride");
async function injectSeoTags(html, pathname, env) {
  const resolvedPath = resolvePathname(pathname);
  if (!resolvedPath.endsWith(".html") && resolvedPath !== "/") return html;
  if (resolvedPath.startsWith("/admin/")) return html;
  if (resolvedPath.startsWith("/blog.html")) return html;
  if (env) {
    try {
      const metas = await listSeoMetas(env);
      const override = findSeoMeta(metas, resolvedPath);
      if (override) {
        return applyOverride(html, override);
      }
    } catch {
    }
  }
  const meta = extractSeoMeta(html, resolvedPath);
  if (!meta) return html;
  if (html.includes('rel="canonical"') || html.includes("rel='canonical'")) return html;
  const seoHead = buildSeoHead(meta);
  const headCloseIndex = html.indexOf("</head>");
  if (headCloseIndex === -1) return html;
  return html.slice(0, headCloseIndex) + seoHead + "\n" + html.slice(headCloseIndex);
}
__name(injectSeoTags, "injectSeoTags");

// src/api-blog.ts
init_kv();
var DEFAULT_PAGE_SIZE = 50;
var MAX_PAGE_SIZE = 200;
function parseTags(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}
__name(parseTags, "parseTags");
function normalizePost(item) {
  const tags = parseTags(item.tags);
  const staticUrl = item.static_url || item.detail_url || item.url || "";
  return {
    id: item.id || item.slug,
    title: item.title || "",
    slug: item.slug || "",
    description: item.description || item.metaDescription || "",
    cover_image: item.cover_image || item.image || "",
    category: item.category || "",
    tags,
    section: item.section || "",
    author: item.author || "Kestrel Metal",
    read_time: item.read_time || "5 min read",
    status: item.status || "published",
    published_at: item.publishedAt || item.created_at || item.createdAt || "",
    created_at: item.created_at || item.createdAt || item.publishedAt || "",
    static_url: staticUrl,
    detail_url: staticUrl,
    score: item.score ?? null
  };
}
__name(normalizePost, "normalizePost");
function filterBySearch(items, search) {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) => {
    return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.section.toLowerCase().includes(q);
  });
}
__name(filterBySearch, "filterBySearch");
function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    page: safePage,
    pageSize,
    totalPages,
    total
  };
}
__name(paginate, "paginate");
async function loadBlogPosts(env, params) {
  const status = (params.status || "published").trim().toLowerCase();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE));
  const draftKeys = await listKeys(env.CONTENT_QUEUE, "draft:");
  const draftEntries = await Promise.all(
    draftKeys.map(async (key) => getJSON(env.CONTENT_QUEUE, key.name))
  );
  const publishedAll = await getJSON(env.CONTENT_QUEUE, "published:all");
  const publishedEntries = Array.isArray(publishedAll) ? publishedAll : [];
  const merged = /* @__PURE__ */ new Map();
  for (const item of publishedEntries) {
    if (item && item.slug) {
      merged.set(item.slug, item);
    }
  }
  for (const item of draftEntries) {
    if (item && item.slug && !merged.has(item.slug)) {
      merged.set(item.slug, item);
    }
  }
  let items = Array.from(merged.values()).map((item) => normalizePost({ ...item, status: item.status || "published" }));
  if (status === "published") {
    items = items.filter((item) => item.status === "published" && item.detail_url);
  } else {
    items = items.filter((item) => item.status === status);
  }
  const filtered = filterBySearch(items, params.search);
  return paginate(filtered, page, pageSize);
}
__name(loadBlogPosts, "loadBlogPosts");
function parseSearchParams(url) {
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || url.searchParams.get("limit") || "50", 10);
  return {
    search: url.searchParams.get("search") || void 0,
    status: url.searchParams.get("status") || "published",
    page,
    pageSize
  };
}
__name(parseSearchParams, "parseSearchParams");
function register() {
  route("GET", "/api/blog", async (ctx) => {
    const params = parseSearchParams(ctx.url);
    const result = await loadBlogPosts(ctx.env, params);
    return jsonResponse(result);
  });
  route("DELETE", "/api/blog/:slug", async (ctx) => {
    const auth = ctx.request.headers.get("Authorization");
    if (!ctx.env.ADMIN_TOKEN || auth !== `Bearer ${ctx.env.ADMIN_TOKEN}`) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const slug = (ctx.params.slug || "").trim().replace(/\.html$/i, "");
    if (!slug || !/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
      return jsonResponse({ error: "Invalid slug" }, 400);
    }
    const result = {
      slug,
      removed_published_key: false,
      removed_draft_key: false,
      removed_from_list: false
    };
    const publishedKey = `published:${slug}`;
    if (await ctx.env.CONTENT_QUEUE.get(publishedKey) !== null) {
      await ctx.env.CONTENT_QUEUE.delete(publishedKey);
      result.removed_published_key = true;
    }
    const draftKey = `draft:${slug}`;
    if (await ctx.env.CONTENT_QUEUE.get(draftKey) !== null) {
      await ctx.env.CONTENT_QUEUE.delete(draftKey);
      result.removed_draft_key = true;
    }
    const allPublished = await getJSON(ctx.env.CONTENT_QUEUE, "published:all");
    if (Array.isArray(allPublished)) {
      const filtered = allPublished.filter((p) => p && p.slug !== slug);
      if (filtered.length !== allPublished.length) {
        await setJSON(ctx.env.CONTENT_QUEUE, "published:all", filtered);
        result.removed_from_list = true;
      }
    }
    if (!result.removed_published_key && !result.removed_draft_key && !result.removed_from_list) {
      return jsonResponse({ error: "Not found", ...result }, 404);
    }
    return jsonResponse({ success: true, ...result });
  });
}
__name(register, "register");
register();

// src/lib/inquiries.ts
var ITEM_PREFIX = "inquiries:item:";
var DETAIL_FETCH_BUDGET = 40;
var META_FIELD_MAX = 120;
function itemKey(id) {
  return `${ITEM_PREFIX}${id}`;
}
__name(itemKey, "itemKey");
function metaField(value) {
  const s = (value ?? "").toString();
  return s.length > META_FIELD_MAX ? s.slice(0, META_FIELD_MAX) : s;
}
__name(metaField, "metaField");
function buildIndexMeta(inq) {
  return {
    id: inq.id,
    status: inq.status,
    created_at: inq.created_at,
    name: metaField(inq.name),
    email: metaField(inq.email),
    phone: metaField(inq.phone),
    company: metaField(inq.company),
    country: metaField(inq.country),
    product_name: metaField(inq.product_name),
    quantity: metaField(inq.quantity),
    source_page: metaField(inq.source_page)
  };
}
__name(buildIndexMeta, "buildIndexMeta");
function rowFromMeta(meta) {
  return { ...meta, message: "", replies: [] };
}
__name(rowFromMeta, "rowFromMeta");
async function listIndexKeys(kv) {
  const out = [];
  let cursor;
  do {
    const page = await kv.list({ prefix: ITEM_PREFIX, cursor });
    for (const k of page.keys) {
      const id = parseInt(k.name.slice(ITEM_PREFIX.length), 10);
      if (!isNaN(id)) out.push({ id, meta: k.metadata ?? null });
    }
    cursor = page.list_complete ? void 0 : page.cursor;
  } while (cursor !== void 0);
  return out;
}
__name(listIndexKeys, "listIndexKeys");
async function hydrateRows(kv, rows) {
  if (!rows.length) return rows;
  const details = await Promise.all(rows.map((r) => kv.get(itemKey(r.id), "json")));
  return rows.map((r, i) => details[i] ?? r);
}
__name(hydrateRows, "hydrateRows");
async function buildIndex(kv) {
  const keys = await listIndexKeys(kv);
  const legacy = keys.filter((k) => k.meta === null);
  const healed = /* @__PURE__ */ new Map();
  if (legacy.length > 0) {
    const toHeal = legacy.slice(0, DETAIL_FETCH_BUDGET);
    const details = await Promise.all(toHeal.map((k) => kv.get(itemKey(k.id), "json")));
    await Promise.all(toHeal.map((k, i) => {
      const d = details[i];
      if (!d) return null;
      healed.set(k.id, d);
      return kv.put(itemKey(k.id), JSON.stringify(d), { metadata: buildIndexMeta(d) });
    }));
  }
  return keys.map((k) => {
    if (k.meta) return rowFromMeta(k.meta);
    if (healed.has(k.id)) return healed.get(k.id);
    return { id: k.id, status: "pending", created_at: "", name: "", email: "", message: "", replies: [] };
  });
}
__name(buildIndex, "buildIndex");
async function getInquiries(kv, page = 1, pageSize = 20, search, status) {
  let rows = await buildIndex(kv);
  let rowsHydrated = false;
  if (search) {
    if (rows.length <= DETAIL_FETCH_BUDGET) {
      rows = await hydrateRows(kv, rows);
      rowsHydrated = true;
    } else {
      console.warn(`[inquiries] ${rows.length} rows exceed detail budget ${DETAIL_FETCH_BUDGET}, search degrades to metadata fields`);
    }
    const q = search.toLowerCase();
    rows = rows.filter(
      (inq) => inq.name?.toLowerCase().includes(q) || inq.email?.toLowerCase().includes(q) || inq.company?.toLowerCase().includes(q) || inq.product_name?.toLowerCase().includes(q) || inq.message?.toLowerCase().includes(q)
    );
  }
  if (status) {
    rows = rows.filter((inq) => inq.status === status);
  }
  rows.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id
  );
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginated = rows.slice(startIndex, startIndex + pageSize);
  const data = rowsHydrated || pageSize > DETAIL_FETCH_BUDGET ? paginated : await hydrateRows(kv, paginated);
  return {
    data,
    page,
    pageSize,
    total,
    totalPages
  };
}
__name(getInquiries, "getInquiries");
async function getInquiryById(kv, id) {
  const data = await kv.get(itemKey(id), "json");
  return data ? data : null;
}
__name(getInquiryById, "getInquiryById");
async function createInquiry(kv, inquiryData) {
  const id = Date.now() + Math.floor(Math.random() * 1e6);
  const inquiry = {
    ...inquiryData,
    id,
    status: "pending",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    replies: []
  };
  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });
  return inquiry;
}
__name(createInquiry, "createInquiry");
async function updateInquiry(kv, id, updates) {
  const data = await kv.get(itemKey(id), "json");
  if (!data) return null;
  const inquiry = { ...data, ...updates };
  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });
  return inquiry;
}
__name(updateInquiry, "updateInquiry");
async function deleteInquiry(kv, id) {
  await kv.delete(itemKey(id));
  return true;
}
__name(deleteInquiry, "deleteInquiry");
async function addReply(kv, id, reply) {
  const data = await kv.get(itemKey(id), "json");
  if (!data) return null;
  const inquiry = data;
  if (!inquiry.replies) inquiry.replies = [];
  inquiry.replies.push({
    admin: reply.admin || { username: "admin" },
    content: reply.content,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  inquiry.status = "replied";
  inquiry.replied_at = (/* @__PURE__ */ new Date()).toISOString();
  await kv.put(itemKey(id), JSON.stringify(inquiry), { metadata: buildIndexMeta(inquiry) });
  return inquiry;
}
__name(addReply, "addReply");
async function getInquiryStats(kv) {
  const rows = await buildIndex(kv);
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return {
    total: rows.length,
    pending: rows.filter((i) => i.status === "pending").length,
    replied: rows.filter((i) => i.status === "replied").length,
    closed: rows.filter((i) => i.status === "closed").length,
    today: rows.filter((i) => i.created_at?.split("T")[0] === todayStr).length
  };
}
__name(getInquiryStats, "getInquiryStats");

// src/api-inquiries.ts
function verifyApiKey(ctx, env) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === env.INQUIRY_API_KEY;
}
__name(verifyApiKey, "verifyApiKey");
route("POST", "/api/inquiries", async (ctx) => {
  const { env, request } = ctx;
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid API key" }, 401);
  }
  try {
    const body = await request.json();
    const { name, email, phone, company, country, product_name, quantity, message, source_page } = body;
    if (!name || !email || !message) {
      return jsonResponse({ error: "Bad request", message: "Missing required fields: name, email, message" }, 400);
    }
    const inquiry = await createInquiry(env.INQUIRIES, {
      name,
      email,
      phone: phone || "",
      company: company || "",
      country: country || "",
      product_name: product_name || "",
      quantity: quantity || "",
      message,
      source_page: source_page || ""
    });
    return jsonResponse(inquiry, 201);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/external/inquiries", async (ctx) => {
  const { env, url } = ctx;
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid API key" }, 401);
  }
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  try {
    const result = await getInquiries(env.INQUIRIES, page, pageSize, search, status);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/external/inquiries/stats", async (ctx) => {
  const { env } = ctx;
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid API key" }, 401);
  }
  try {
    const stats = await getInquiryStats(env.INQUIRIES);
    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/external/inquiries/:id", async (ctx) => {
  const { env, params } = ctx;
  if (!verifyApiKey(ctx, env)) {
    return jsonResponse({ error: "Unauthorized", message: "Invalid API key" }, 401);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: "Bad request", message: "Invalid inquiry ID" }, 400);
  }
  try {
    const inquiry = await getInquiryById(env.INQUIRIES, id);
    if (!inquiry) {
      return jsonResponse({ error: "Not found", message: "Inquiry not found" }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
function verifyAdminToken(ctx, env) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === env.ADMIN_TOKEN;
}
__name(verifyAdminToken, "verifyAdminToken");
route("GET", "/api/inquiries", async (ctx) => {
  const { env, url } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  try {
    const result = await getInquiries(env.INQUIRIES, page, pageSize, search, status);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/inquiries/stats/count", async (ctx) => {
  const { env } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const stats = await getInquiryStats(env.INQUIRIES);
    return jsonResponse(stats);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/inquiries/export/csv", async (ctx) => {
  const { env } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const result = await getInquiries(env.INQUIRIES, 1, 1e4, "", "");
    let csv = "ID,Name,Email,Company,Country,Product,Quantity,Status,Created At\n";
    result.data.forEach((i) => {
      csv += `${i.id},"${i.name}","${i.email}","${i.company || ""}","${i.country || ""}","${i.product_name || ""}","${i.quantity || ""}",${i.status},${i.created_at}
`;
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="inquiries.csv"'
      }
    });
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("GET", "/api/inquiries/:id", async (ctx) => {
  const { env, params } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: "Bad request", message: "Invalid inquiry ID" }, 400);
  }
  try {
    const inquiry = await getInquiryById(env.INQUIRIES, id);
    if (!inquiry) {
      return jsonResponse({ error: "Not found", message: "Inquiry not found" }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
var updateInquiryStatusHandler = /* @__PURE__ */ __name(async (ctx) => {
  const { env, params, request } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: "Bad request", message: "Invalid inquiry ID" }, 400);
  }
  try {
    const body = await request.json();
    const allowed = ["pending", "replied", "closed"];
    if (!body?.status || !allowed.includes(body.status)) {
      return jsonResponse({ error: "Bad request", message: "status must be one of: pending, replied, closed" }, 400);
    }
    const updates = {
      status: body.status
    };
    if (body.status === "replied") {
      updates.replied_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    const inquiry = await updateInquiry(env.INQUIRIES, id, updates);
    if (!inquiry) {
      return jsonResponse({ error: "Not found", message: "Inquiry not found" }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
}, "updateInquiryStatusHandler");
route("PUT", "/api/inquiries/:id", updateInquiryStatusHandler);
route("PATCH", "/api/inquiries/:id", updateInquiryStatusHandler);
route("DELETE", "/api/inquiries/:id", async (ctx) => {
  const { env, params } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: "Bad request", message: "Invalid inquiry ID" }, 400);
  }
  try {
    const ok = await deleteInquiry(env.INQUIRIES, id);
    if (!ok) {
      return jsonResponse({ error: "Not found", message: "Inquiry not found" }, 404);
    }
    return jsonResponse({ message: "Deleted" });
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});
route("POST", "/api/inquiries/:id/replies", async (ctx) => {
  const { env, params, request } = ctx;
  if (!verifyAdminToken(ctx, env)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return jsonResponse({ error: "Bad request", message: "Invalid inquiry ID" }, 400);
  }
  try {
    const body = await request.json();
    if (!body?.content) {
      return jsonResponse({ error: "Bad request", message: "Reply content is required" }, 400);
    }
    const inquiry = await addReply(env.INQUIRIES, id, { content: body.content });
    if (!inquiry) {
      return jsonResponse({ error: "Not found", message: "Inquiry not found" }, 404);
    }
    return jsonResponse(inquiry);
  } catch (error) {
    return jsonResponse({ error: "Internal server error", message: String(error) }, 500);
  }
});

// src/index.ts
function redirectToCanonical(url) {
  const target = new URL(`${url.pathname}.html`, url.origin);
  target.search = url.search;
  return Response.redirect(target.toString(), 301);
}
__name(redirectToCanonical, "redirectToCanonical");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith(".workers.dev") && !url.pathname.startsWith("/api/")) {
      const redirectUrl = new URL(request.url);
      redirectUrl.hostname = "www.kestrelmetal.com";
      redirectUrl.protocol = "https:";
      return Response.redirect(redirectUrl.toString(), 301);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      const adminUrl = new URL(request.url);
      adminUrl.pathname = "/admin/index.html";
      const response2 = await env.ASSETS.fetch(new Request(adminUrl, request));
      const headers2 = new Headers(response2.headers);
      headers2.set("Cache-Control", "no-store");
      return new Response(response2.body, { headers: headers2, status: response2.status, statusText: response2.statusText });
    }
    if (url.pathname === "/components/navbar" || url.pathname === "/components/footer") {
      const componentUrl = new URL(request.url);
      componentUrl.pathname += ".html";
      const response2 = await env.ASSETS.fetch(new Request(componentUrl, request));
      const headers2 = new Headers(response2.headers);
      headers2.set("Cache-Control", "no-cache");
      return new Response(response2.body, { headers: headers2, status: response2.status, statusText: response2.statusText });
    }
    if (url.pathname.startsWith("/api/")) {
      const response2 = await handleRoute(request, env);
      if (response2) {
        const headers2 = new Headers(response2.headers);
        headers2.set("Cache-Control", "no-store");
        return new Response(response2.body, { headers: headers2, status: response2.status, statusText: response2.statusText });
      }
      return jsonResponse({ error: "Not found" }, 404);
    }
    if (url.pathname === "/sitemap.xml") {
      const { buildSitemap: buildSitemap2 } = await Promise.resolve().then(() => (init_sitemap(), sitemap_exports));
      const sitemap = await buildSitemap2(env);
      return new Response(sitemap.xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate"
        },
        status: 200
      });
    }
    if (url.pathname === "/llms.txt") {
      const { renderLlmsTxt: renderLlmsTxt2 } = await Promise.resolve().then(() => (init_llms(), llms_exports));
      const text = await renderLlmsTxt2(env);
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=3600, must-revalidate"
        },
        status: 200
      });
    }
    if (url.pathname.endsWith(".txt")) {
      const { getIndexNowKey: getIndexNowKey2 } = await Promise.resolve().then(() => (init_indexnow(), indexnow_exports));
      const key = await getIndexNowKey2(env);
      if (url.pathname === `/${key}.txt`) {
        return new Response(key, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400"
          },
          status: 200
        });
      }
    }
    let assetRequest = request;
    if (url.pathname === "/") {
      const rootUrl = new URL(request.url);
      rootUrl.pathname = "/index.html";
      assetRequest = new Request(rootUrl, request);
    }
    const response = await env.ASSETS.fetch(assetRequest);
    if (response.status === 404 && url.pathname.startsWith("/images/")) {
      const r2Key = url.pathname.replace("/images/", "");
      const object = await env.IMAGES.get(r2Key);
      if (object) {
        const respHeaders = new Headers({
          "Content-Type": object.httpMetadata?.contentType || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable"
        });
        return new Response(object.body, { headers: respHeaders, status: 200 });
      }
    }
    if (response.status === 404) {
      const slug = url.pathname.replace(/^\//, "").replace(/\.html$/, "");
      const needsCanonical = !url.pathname.endsWith(".html");
      if (slug && !slug.includes("/") && !slug.includes(".")) {
        const published = await env.CONTENT_QUEUE.get(`published:${slug}`, "json");
        if (published && published.html) {
          if (needsCanonical) return redirectToCanonical(url);
          return new Response(published.html, {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=3600, must-revalidate"
            },
            status: 200
          });
        }
      }
      if (needsCanonical && !url.pathname.includes(".")) {
        const htmlUrl = new URL(request.url);
        htmlUrl.pathname = url.pathname + ".html";
        const htmlResponse = await env.ASSETS.fetch(new Request(htmlUrl, request));
        if (htmlResponse.status !== 404) {
          return redirectToCanonical(url);
        }
      }
    }
    const contentType = response.headers.get("content-type") || "";
    const headers = new Headers(response.headers);
    if (url.pathname.startsWith("/api/")) {
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (response.ok && /\.(?:avif|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|glb|gltf)$/.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (/\.(?:js|css)$/.test(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=604800, must-revalidate");
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    if (!contentType.includes("text/html")) return response;
    if (url.pathname.startsWith("/admin/") || url.pathname.startsWith("/components/")) {
      headers.set("Cache-Control", "no-cache");
      return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
    }
    const html = await response.text();
    let enhanced = await injectSeoTags(html, url.pathname, env);
    if (url.pathname === "/faq.html" || url.pathname === "/faq") {
      try {
        const { injectFaqIntoHtml: injectFaqIntoHtml2 } = await Promise.resolve().then(() => (init_faq(), faq_exports));
        enhanced = await injectFaqIntoHtml2(enhanced, env);
      } catch (err) {
        console.error("[faq] Runtime injection failed:", err);
      }
    }
    headers.set("Cache-Control", "public, max-age=300, must-revalidate");
    return new Response(enhanced, {
      headers,
      status: response.status,
      statusText: response.statusText
    });
  },
  // ─── scheduled() — Cron Triggers 处理 ───
  async scheduled(event, env) {
    const cron = event.cron;
    console.log(`[Cron] Triggered: ${cron} at ${(/* @__PURE__ */ new Date()).toISOString()}`);
    try {
      switch (cron) {
        // 每日 03:00 UTC+8 — GSC 数据同步
        case "0 19 * * *":
          await runCronTask("gsc-sync", env, async () => {
            const { default: gscSync2 } = await Promise.resolve().then(() => (init_gsc_sync(), gsc_sync_exports));
            await gscSync2(env);
          });
          break;
        // 每日 04:00 UTC+8 — AI 内容生成（每天 1 个产品组 = 1 篇文章）
        case "0 20 * * *":
          await runCronTask("generate", env, async () => {
            const paused = await checkContentPipelinePaused(env);
            if (paused) return paused;
            const { default: generate2 } = await Promise.resolve().then(() => (init_generate(), generate_exports));
            await generate2(env);
          });
          break;
        // 每日 05:00 UTC+8 — SEO 评分 + 发布（有草稿才处理，空转开销极低）
        case "0 21 * * *":
          await runCronTask("score", env, async () => {
            const paused = await checkContentPipelinePaused(env);
            if (paused) return paused;
            const { default: score2 } = await Promise.resolve().then(() => (init_score(), score_exports));
            await score2(env);
          });
          break;
        // 每日 08:00 UTC+8，仅每月 1 号真正执行 — 月度报告
        case "0 0 * * *":
          await runCronTask("monthly-report", env, async () => {
            if (beijingDate() !== 1) return `\u8DF3\u8FC7\uFF1A\u4ECA\u5929\u4E0D\u662F 1 \u53F7\uFF08\u5317\u4EAC\u65E5\u671F ${beijingDate()}\uFF09`;
            const { default: monthlyReport2 } = await Promise.resolve().then(() => (init_monthly_report(), monthly_report_exports));
            await monthlyReport2(env);
          });
          await runCronTask("geo-audit", env, async () => {
            const { default: geoAudit2 } = await Promise.resolve().then(() => (init_geo_audit(), geo_audit_exports));
            return (await geoAudit2(env)).summary;
          });
          break;
        // 每日 06:00 UTC+8，仅周日真正执行 — 效果追踪
        case "0 22 * * *":
          await runCronTask("track", env, async () => {
            if (!isBeijingWeekday(0)) return `\u8DF3\u8FC7\uFF1A\u4ECA\u5929\u4E0D\u662F\u5468\u65E5\uFF08\u5317\u4EAC\u5468 ${beijingDay()}\uFF09`;
            const { default: track2 } = await Promise.resolve().then(() => (init_track(), track_exports));
            await track2(env);
          });
          await runCronTask("geo-faq", env, async () => {
            if (!isBeijingWeekday(0)) return `\u8DF3\u8FC7\uFF1A\u4ECA\u5929\u4E0D\u662F\u5468\u65E5\uFF08\u5317\u4EAC\u5468 ${beijingDay()}\uFF09`;
            const { getJSON: getJSON2 } = await Promise.resolve().then(() => (init_kv(), kv_exports));
            const last = await getJSON2(env.SEO_DATA, "cron:last_run:geo-faq");
            if (last && Date.now() - new Date(last.timestamp).getTime() < 20 * 36e5) {
              return `\u8DF3\u8FC7\uFF1A20 \u5C0F\u65F6\u5185\u5DF2\u751F\u6210\u8FC7(\u4E0A\u6B21 ${last.timestamp})`;
            }
            const { default: geoFaq2 } = await Promise.resolve().then(() => (init_geo_faq(), geo_faq_exports));
            await geoFaq2(env);
          });
          break;
        // 备用直达 slot(若未来 trigger 被正确调度则由此触发;当前 Git 集成部署不调度新表达式)
        case "0 23 * * *":
          await runCronTask("geo-faq", env, async () => {
            if (!isBeijingWeekday(0)) return `\u8DF3\u8FC7\uFF1A\u4ECA\u5929\u4E0D\u662F\u5468\u65E5\uFF08\u5317\u4EAC\u5468 ${beijingDay()}\uFF09`;
            const { default: geoFaq2 } = await Promise.resolve().then(() => (init_geo_faq(), geo_faq_exports));
            await geoFaq2(env);
          });
          break;
        case "0 1 * * *":
          await runCronTask("geo-audit", env, async () => {
            const { default: geoAudit2 } = await Promise.resolve().then(() => (init_geo_audit(), geo_audit_exports));
            return (await geoAudit2(env)).summary;
          });
          break;
        default:
          console.warn(`[Cron] Unknown cron expression: ${cron}`);
      }
    } catch (err) {
      console.error(`[Cron] Error in ${cron}:`, err);
    }
  }
};
function beijingNow() {
  return new Date(Date.now() + 8 * 36e5);
}
__name(beijingNow, "beijingNow");
function beijingDay() {
  return beijingNow().getUTCDay();
}
__name(beijingDay, "beijingDay");
function beijingDate() {
  return beijingNow().getUTCDate();
}
__name(beijingDate, "beijingDate");
function isBeijingWeekday(day) {
  return beijingDay() === day;
}
__name(isBeijingWeekday, "isBeijingWeekday");
async function checkContentPipelinePaused(env) {
  const reason = await env.SEO_DATA.get("automation:pause-content-pipeline");
  if (!reason) return null;
  return `\u8DF3\u8FC7\uFF1A\u5185\u5BB9\u7BA1\u7EBF\u5DF2\u4EBA\u5DE5\u6682\u505C\uFF08${reason}\uFF09\u3002\u6062\u590D\uFF1APOST /api/settings/content-pipeline {"paused":false} \u6216\u5220\u9664 KV \u952E automation:pause-content-pipeline`;
}
__name(checkContentPipelinePaused, "checkContentPipelinePaused");
async function runCronTask(name, env, fn) {
  const start = Date.now();
  console.log(`[Cron:${name}] Starting...`);
  try {
    const skipReason = await fn();
    const duration = Date.now() - start;
    if (skipReason) {
      console.log(`[Cron:${name}] ${skipReason}`);
      await env.SEO_DATA.put(
        `cron:last_run:${name}`,
        JSON.stringify({
          name,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          duration,
          success: true,
          skipped: true,
          skipReason
        })
      );
      return;
    }
    console.log(`[Cron:${name}] Completed in ${duration}ms`);
    await env.SEO_DATA.put(
      `cron:last_run:${name}`,
      JSON.stringify({ name, timestamp: (/* @__PURE__ */ new Date()).toISOString(), duration, success: true, skipped: false })
    );
  } catch (err) {
    const duration = Date.now() - start;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cron:${name}] Failed after ${duration}ms:`, errMsg);
    await env.SEO_DATA.put(
      `cron:last_run:${name}`,
      JSON.stringify({ name, timestamp: (/* @__PURE__ */ new Date()).toISOString(), duration, success: false, error: errMsg })
    );
  }
}
__name(runCronTask, "runCronTask");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
