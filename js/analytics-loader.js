(function () {
  'use strict';
  try {
    var s = localStorage.getItem('km_admin_site_settings');
    if (!s) return;
    var cfg = JSON.parse(s);
    if (!cfg.ga4_measurement_id) return;

    var head = document.head || document.getElementsByTagName('head')[0];

    var ga4 = document.createElement('script');
    ga4.async = true;
    ga4.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.ga4_measurement_id;
    head.appendChild(ga4);

    window.dataLayer = window.dataLayer || [];
    var gtag = function () { window.dataLayer.push(arguments); };
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', cfg.ga4_measurement_id, { send_page_view: true, cookie_flags: 'SameSite=None;Secure' });
  } catch (e) {}
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
    var day = ('0' + d.getDate()).slice(-2);
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

(function () {
  'use strict';
  try {
    var s = localStorage.getItem('km_admin_site_settings');
    if (!s) return;
    var cfg = JSON.parse(s);
    if (!cfg.umami_website_id) return;
    
    var umamiScript = document.createElement('script');
    umamiScript.defer = true;
    umamiScript.src = (cfg.umami_domain || 'https://cloud.umami.is') + '/script.js';
    umamiScript.setAttribute('data-website-id', cfg.umami_website_id);
    var head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(umamiScript);
  } catch (e) {}
})();
