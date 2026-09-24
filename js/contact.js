(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initScrollProgress();
    initScrollReveal();
    initBackToTop();
  });

  function initScrollReveal() {
    var revealEls = document.querySelectorAll('[data-reveal]');
    if (!revealEls.length) return;
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }
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

function handleContactSubmit(e) {
  e.preventDefault();
  var btn = e.target.querySelector('.submit-btn');
  var originalText = btn.textContent;
  btn.textContent = 'Sending...';
  btn.disabled = true;

  var formData = new FormData(e.target);
  var inquiryData = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    company: formData.get('company') || '',
    country: formData.get('country') || '',
    product_name: formData.get('product') || '',
    quantity: '',
    status: 'pending',
    message: formData.get('message'),
    source_page: window.location.pathname,
    created_at: new Date().toISOString(),
    replies: []
  };

  try {
    var key = 'km_admin_inquiries';
    var inquiries = JSON.parse(localStorage.getItem(key) || '[]');
    inquiries.push(inquiryData);
    localStorage.setItem(key, JSON.stringify(inquiries));
    console.log('[Inquiry] Saved to Admin storage:', inquiryData);
  } catch (err) {
    console.error('[Inquiry] Failed to save:', err);
  }

  // 同步到后端存储：等待后端确认后再提示成功，避免"假成功"漏单
  syncToBackend(inquiryData)
    .then(function () {
      btn.textContent = '✓ Message Sent!';
      btn.style.background = '#28a745';
      if (window.Analytics) {
        Analytics.trackInquiryForm(inquiryData.product_name);
      }
      setTimeout(function () {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
        e.target.reset();
      }, 2000);
    })
    .catch(function (err) {
      console.error('[Inquiry] Failed to sync to backend:', err);
      btn.textContent = 'Submission failed';
      btn.style.background = '#dc3545';
      alert('Sorry, your message could not be sent. Please try again, or email us directly at kalee@kestrelmetal.com');
      setTimeout(function () {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
  return false;
}

function syncToBackend(inquiryData) {
  // 从本地存储获取API密钥；localStorage 被禁/未注入时回退到公开密钥（与 js/includes.js 一致）
  var apiKey;
  try {
    apiKey = localStorage.getItem('km_inquiry_api_key');
  } catch (e) { apiKey = null; }
  if (!apiKey) {
    apiKey = 'c73a2621683b6456423317f522f77f98bb57273ccbbda6853cee7fa27c5a6370';
  }

  // 构建API请求
  var apiUrl = '/api/inquiries';
  var requestData = {
    name: inquiryData.name,
    email: inquiryData.email,
    phone: inquiryData.phone,
    company: inquiryData.company,
    country: inquiryData.country,
    product_name: inquiryData.product_name,
    quantity: inquiryData.quantity,
    message: inquiryData.message,
    source_page: inquiryData.source_page
  };

  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(requestData)
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Backend sync failed: ' + response.status);
    }
    return response.json();
  })
  .then(function(data) {
    console.log('[Inquiry] Synced to backend successfully:', data);
  });
}
