/**
 * Kestrel Metal 官网统计加载器(修复版)
 * 修复:原版依赖管理台写入的 localStorage 配置,普通访客浏览器没有该配置,
 *      导致 GA4/Umami 从未对真实访客加载(数据为零)。
 * 本版:静态配置保底(所有访客生效),管理台 localStorage 仅作管理员本浏览器的临时覆盖。
 * 用法:填好下方 KM_ANALYTICS 的两个 ID → 提交仓库 → Cloudflare 自动部署。
 */
(function () {
  'use strict';

  // ===== 站点统计配置(部署前必填) =====
  var KM_ANALYTICS = {
    // GA4:analytics.google.com → Admin → Data Streams → Web → Measurement ID(G-开头)
    ga4_measurement_id: 'G-Q5WHY8L8BN',
    // Umami:cloud.umami.is → Settings → Websites → kestrelmetal.com → Website ID(UUID)
    umami_website_id: 'a7ba74c4-ee31-414b-8a9c-2fa239ae7557',
    // Umami 云版固定为 https://cloud.umami.is;自托管则填自己的域名
    umami_domain: 'https://cloud.umami.is'
  };

  // 管理台本地设置仅覆盖管理员自己的浏览器(可选,普通访客不受影响)
  try {
    var s = localStorage.getItem('km_admin_site_settings');
    if (s) {
      var over = JSON.parse(s);
      if (over.ga4_measurement_id) KM_ANALYTICS.ga4_measurement_id = over.ga4_measurement_id;
      if (over.umami_website_id) KM_ANALYTICS.umami_website_id = over.umami_website_id;
      if (over.umami_domain) KM_ANALYTICS.umami_domain = over.umami_domain;
    }
  } catch (e) {}

  var head = document.head || document.getElementsByTagName('head')[0];

  function loadThirdPartyAnalytics() {
    // ---- GA4(修复:不再依赖 localStorage,所有访客加载) ----
    try {
      if (KM_ANALYTICS.ga4_measurement_id) {
        var ga4 = document.createElement('script');
        ga4.async = true;
        ga4.src = 'https://www.googletagmanager.com/gtag/js?id=' + KM_ANALYTICS.ga4_measurement_id;
        head.appendChild(ga4);

        window.dataLayer = window.dataLayer || [];
        var gtag = function () { window.dataLayer.push(arguments); };
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', KM_ANALYTICS.ga4_measurement_id, { send_page_view: true, cookie_flags: 'SameSite=None;Secure' });
      }
    } catch (e) {}

    // ---- AI Referral 事件标记（GA4 指南 §4.2）----
    try {
      var AI_REFERRER_HOSTS = [
        'chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'pplx.ai',
        'claude.ai', 'copilot.microsoft.com', 'gemini.google.com',
        'ai.meta.com', 'grok.x.ai', 'grok.com', 'you.com', 'phind.com',
        'kagi.com', 'chat.deepseek.com', 'chat.mistral.ai'
      ];

      function matchAiHost(ref) {
        if (!ref) return null;
        var host;
        try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return null; }
        for (var i = 0; i < AI_REFERRER_HOSTS.length; i++) {
          var h = AI_REFERRER_HOSTS[i];
          if (host === h || host.slice(-(h.length + 1)) === '.' + h) return h;
        }
        return null;
      }

      var aiHost = matchAiHost(document.referrer);
      if (aiHost) {
        var alreadySent = null;
        try { alreadySent = sessionStorage.getItem('km_ai_referral'); } catch (e) {}
        if (alreadySent !== aiHost) {
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'ai_referral', {
              ai_referral_source: aiHost,
              ai_referral_page: window.location.pathname
            });
            try { sessionStorage.setItem('km_ai_referral', aiHost); } catch (e) {}
          }
          var umamiAttempts = 0;
          var fireUmami = function () {
            if (window.umami && typeof window.umami.track === 'function') {
              window.umami.track('ai_referral', {
                ai_referral_source: aiHost,
                ai_referral_page: window.location.pathname
              });
            } else if (umamiAttempts < 10) {
              umamiAttempts++;
              setTimeout(fireUmami, 1000);
            }
          };
          fireUmami();
        }
      }
    } catch (e) {}

    // ---- Umami(修复:同上) ----
    try {
      if (KM_ANALYTICS.umami_website_id) {
        var umamiScript = document.createElement('script');
        umamiScript.defer = true;
        umamiScript.src = (KM_ANALYTICS.umami_domain || 'https://cloud.umami.is') + '/script.js';
        umamiScript.setAttribute('data-website-id', KM_ANALYTICS.umami_website_id);
        head.appendChild(umamiScript);
      }
    } catch (e) {}
  }

  if (window.requestIdleCallback) {
    window.requestIdleCallback(loadThirdPartyAnalytics, { timeout: 3000 });
  } else {
    window.setTimeout(loadThirdPartyAnalytics, 2000);
  }
})();

(function () {
  'use strict';

  var MAX_LOG_ENTRIES = 500;
  var MAX_HISTORY_DAYS = 30;
  var BOUNCE_THRESHOLD_MS = 5000;

  function storageGet(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function generateVisitorId() {
    var id = storageGet('km_visitor_id');
    if (id && typeof id === 'string') return id;
    var newId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    storageSet('km_visitor_id', newId);
    return newId;
  }

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + (d.getDate())).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function getAnalyticsData() {
    var data = storageGet('km_analytics_data');
    if (!data) {
      data = {
        pageviews: 0,
        today: { date: todayStr(), pageviews: 0, visitors: 0 },
        weekly: { avgDuration: 0, bounceRate: 0 },
        topPages: {},
        dailyHistory: {}
      };
    }
    if (!data.today || data.today.date !== todayStr()) {
      if (data.today && data.today.date) {
        data.dailyHistory[data.today.date] = {
          pageviews: data.today.pageviews,
          visitors: data.today.visitors
        };
      }
      data.today = { date: todayStr(), pageviews: 0, visitors: 0 };
    }
    if (!data.topPages) data.topPages = {};
    if (!data.dailyHistory) data.dailyHistory = {};
    if (!data.weekly) data.weekly = { avgDuration: 0, bounceRate: 0 };
    return data;
  }

  function trimDailyHistory(history) {
    var keys = [];
    var k;
    for (k in history) {
      if (history.hasOwnProperty(k)) keys.push(k);
    }
    keys.sort();
    while (keys.length > MAX_HISTORY_DAYS) {
      var oldest = keys.shift();
      delete history[oldest];
    }
  }

  function calculateWeeklyStats(log) {
    var now = Date.now();
    var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    var totalDuration = 0;
    var bounceCount = 0;
    var count = 0;

    if (!log || !log.length) {
      return { avgDuration: 0, bounceRate: 0 };
    }

    for (var i = 0; i < log.length; i++) {
      var entry = log[i];
      if (!entry.timestamp) continue;
      if (now - entry.timestamp > sevenDaysMs) continue;
      var dur = typeof entry.duration === 'number' ? entry.duration : 0;
      totalDuration += dur;
      count++;
      if (dur < BOUNCE_THRESHOLD_MS) {
        bounceCount++;
      }
    }

    return {
      avgDuration: count > 0 ? Math.round(totalDuration / count) : 0,
      bounceRate: count > 0 ? Math.round((bounceCount / count) * 100) : 0
    };
  }

  function trackPage() {
    var visitorId = generateVisitorId();
    var data = getAnalyticsData();
    var path = window.location.pathname || '/';
    var title = document.title || '';
    var pageLoadTime = Date.now();

    data.pageviews = (data.pageviews || 0) + 1;
    data.today.pageviews = (data.today.pageviews || 0) + 1;

    var log = storageGet('km_visitor_log');
    if (!log) log = [];
    var alreadyCounted = false;
    for (var i = 0; i < log.length; i++) {
      if (log[i].id === visitorId && log[i].timestamp && (Date.now() - log[i].timestamp < 24 * 60 * 60 * 1000)) {
        alreadyCounted = true;
        break;
      }
    }
    if (!alreadyCounted) {
      var uniqueToday = {};
      for (var j = 0; j < log.length; j++) {
        if (log[j].timestamp) {
          var logDate = new Date(log[j].timestamp);
          var logDateStr = logDate.getFullYear() + '-' + ('0' + (logDate.getMonth() + 1)).slice(-2) + '-' + ('0' + logDate.getDate()).slice(-2);
          if (logDateStr === todayStr()) {
            uniqueToday[log[j].id] = true;
          }
        }
      }
      uniqueToday[visitorId] = true;
      var todayCount = 0;
      for (var uid in uniqueToday) {
        if (uniqueToday.hasOwnProperty(uid)) todayCount++;
      }
      data.today.visitors = todayCount;
    }

    data.topPages[path] = (data.topPages[path] || 0) + 1;

    var logEntry = {
      id: visitorId,
      path: path,
      title: title,
      timestamp: pageLoadTime,
      duration: 0
    };
    log.unshift(logEntry);
    while (log.length > MAX_LOG_ENTRIES) {
      log.pop();
    }
    storageSet('km_visitor_log', log);

    data.weekly = calculateWeeklyStats(log);
    trimDailyHistory(data.dailyHistory);
    storageSet('km_analytics_data', data);

    window.addEventListener('beforeunload', function () {
      var duration = Date.now() - pageLoadTime;
      var currentLog = storageGet('km_visitor_log');
      if (!currentLog || !currentLog.length) return;
      for (var i = 0; i < currentLog.length; i++) {
        if (currentLog[i].timestamp === pageLoadTime && currentLog[i].id === visitorId) {
          currentLog[i].duration = duration;
          break;
        }
      }
      storageSet('km_visitor_log', currentLog);
      var currentData = getAnalyticsData();
      currentData.weekly = calculateWeeklyStats(currentLog);
      storageSet('km_analytics_data', currentData);
    });

    window.addEventListener('pagehide', function () {
      var duration = Date.now() - pageLoadTime;
      var currentLog = storageGet('km_visitor_log');
      if (!currentLog || !currentLog.length) return;
      for (var i = 0; i < currentLog.length; i++) {
        if (currentLog[i].timestamp === pageLoadTime && currentLog[i].id === visitorId) {
          currentLog[i].duration = duration;
          break;
        }
      }
      storageSet('km_visitor_log', currentLog);
      var currentData = getAnalyticsData();
      currentData.weekly = calculateWeeklyStats(currentLog);
      storageSet('km_analytics_data', currentData);
    });
  }

  window.addEventListener('load', function () {
    try {
      trackPage();
    } catch (e) {}
  });
})();
