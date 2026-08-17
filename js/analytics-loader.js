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

    if (cfg.baidu_stat_token) {
      var hm = document.createElement('script');
      hm.async = true;
      hm.src = 'https://hm.baidu.com/hm.js?' + cfg.baidu_stat_token;
      var first = document.getElementsByTagName('script')[0];
      if (first && first.parentNode) first.parentNode.insertBefore(hm, first);
      window._hmt = window._hmt || [];
    }
  } catch (e) {}
})();
