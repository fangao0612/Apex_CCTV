// nav.js — Apex CCTV shared navigation injection + dropdown behavior
(function () {
  'use strict';

  var NAV_ITEMS = [
    { id: 'video', label: '实时预览', href: 'index.html', mode: 'live' },
    { id: 'playback', label: '录像回放', href: 'index.html', mode: 'playback' },
    { id: 'device', label: '设备', children: [
      { label: '设备管理', href: 'device_management.html' },
      { label: '分组管理', href: '#' }
    ]},
    { id: 'user', label: '用户', children: [
      { label: '用户管理', href: 'user_management.html' },
      { label: '角色管理', href: '#' }
    ]},
    { id: 'gallery', label: '图库', children: [
      { label: '网关告警', href: '#' },
      { label: '协议告警', href: '#' },
      { label: '1400告警', href: '#' }
    ]},
    { id: 'ai', label: 'AI 分析', href: '#' },
    { id: 'config', label: '配置', children: [
      { label: '基础配置', href: 'base_config.html' },
      { label: '录像配置', href: '#' },
      { label: '告警配置', href: '#' },
      { label: '设备接入', href: '#' },
      { label: '运维管理', href: 'ops_management.html' }
    ]}
  ];

  function detectActivePage() {
    var path = location.pathname.split('/').pop() || 'index.html';
    var hash = location.hash;
    if (path === '' || path === 'index.html' || path === 'admin_panel.html' || path === 'homepage.html') {
      return hash === '#playback' ? 'playback' : 'video';
    }
    if (path === 'device_management.html') return 'device';
    if (path === 'user_management.html') return 'user';
    if (path === 'base_config.html' || path === 'ops_management.html') return 'config';
    return '';
  }

  function buildNav() {
    var header = document.querySelector('.topbar');
    if (!header) return;

    var activeId = detectActivePage();

    var topLeft = header.querySelector('.top-left');
    if (!topLeft) {
      topLeft = document.createElement('div');
      topLeft.className = 'top-left';
      topLeft.innerHTML = '<strong>Apex CCTV</strong>';
      header.insertBefore(topLeft, header.firstChild);
    }

    var existing = header.querySelector('.top-center');
    if (existing) return; // nav already rendered (e.g. in HTML)

    var nav = document.createElement('nav');
    nav.className = 'top-center';
    nav.setAttribute('aria-label', '主导航');

    NAV_ITEMS.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'nav-item';
      div.setAttribute('data-nav', item.id);
      if (item.id === activeId) div.setAttribute('aria-current', 'page');

      if (item.mode) {
        var a = document.createElement('a');
        a.href = item.href + (item.mode === 'playback' ? '#playback' : '');
        a.textContent = item.label;
        a.setAttribute('data-nav-mode', item.mode);
        a.addEventListener('click', function (e) {
          var currentPage = (location.pathname.split('/').pop() || 'index.html');
          if (currentPage === '' || currentPage === 'index.html') {
            e.preventDefault();
            location.hash = item.mode === 'playback' ? '#playback' : '';
            document.querySelectorAll('.nav-item').forEach(function (ni) { ni.removeAttribute('aria-current'); });
            div.setAttribute('aria-current', 'page');
            window.dispatchEvent(new CustomEvent('nav-mode-switch', { detail: { mode: item.mode } }));
          }
        });
        div.appendChild(a);
      } else if (item.href && !item.children) {
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        div.appendChild(a);
      } else {
        div.appendChild(document.createTextNode(item.label));
      }

      if (item.children) {
        var dd = document.createElement('div');
        dd.className = 'dropdown';
        dd.setAttribute('role', 'menu');
        item.children.forEach(function (child) {
          var ca = document.createElement('a');
          ca.href = child.href;
          ca.setAttribute('role', 'menuitem');
          ca.textContent = child.label;
          dd.appendChild(ca);
        });
        div.appendChild(dd);
      }

      nav.appendChild(div);
    });

    var topRight = header.querySelector('.top-right');
    if (topRight) {
      header.insertBefore(nav, topRight);
    } else {
      header.appendChild(nav);
      var tr = document.createElement('div');
      tr.className = 'top-right';
      tr.innerHTML = '<span>管理员</span>';
      header.appendChild(tr);
    }
  }

  function setupDropdowns() {
    var navItems = document.querySelectorAll('.nav-item');
    function closeAll() { navItems.forEach(function (i) { i.classList.remove('open'); }); }

    navItems.forEach(function (item) {
      item.addEventListener('click', function (e) {
        var dd = item.querySelector('.dropdown');
        if (!dd) { closeAll(); return; }
        var isOpen = item.classList.contains('open');
        closeAll();
        if (!isOpen) item.classList.add('open');
        e.stopPropagation();
      });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  }

  function init() {
    buildNav();
    setupDropdowns();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ApexNav = { init: init, setupDropdowns: setupDropdowns };
})();
