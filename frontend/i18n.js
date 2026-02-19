// i18n.js — Apex CCTV bilingual (zh/en) support
(function () {
  'use strict';

  var LANG_KEY = 'apexCctv.lang';
  var currentLang = 'zh';
  var displayedLang = 'zh';
  try { currentLang = localStorage.getItem(LANG_KEY) || 'zh'; } catch (e) {}

  var PAIRS = [
    // page titles
    { zh: 'Apex CCTV - 实时预览', en: 'Apex CCTV - Live View' },
    { zh: '设备管理 - Apex CCTV', en: 'Device Management - Apex CCTV' },
    { zh: '用户管理 - Apex CCTV', en: 'User Management - Apex CCTV' },
    { zh: '基础配置 - Apex CCTV', en: 'Basic Config - Apex CCTV' },
    { zh: '运维管理 - Apex CCTV', en: 'Operations - Apex CCTV' },

    // index.html - video page
    { zh: '请选择左侧通道开始播放', en: 'Select a channel to start playback' },
    { zh: '支持 HLS / HTTP-FLV / EasyPlayer H265', en: 'Supports HLS / HTTP-FLV / EasyPlayer H265' },
    { zh: '搜索设备/通道', en: 'Search devices/channels' },
    { zh: '加载通道', en: 'Load Channels' },
    { zh: '实时预览', en: 'Live View' },
    { zh: '录像回放', en: 'Recording Playback' },
    { zh: '设备列表', en: 'Device List' },
    { zh: '通道信息', en: 'Channel Info' },
    { zh: '流信息', en: 'Stream Info' },
    { zh: '最近告警', en: 'Recent Alerts' },
    { zh: '对讲状态', en: 'Talk Status' },
    { zh: '暂无告警', en: 'No alerts' },
    { zh: '查询录像', en: 'Query Records' },
    { zh: '开始回放', en: 'Start Playback' },
    { zh: '停止回放', en: 'Stop Playback' },

    // toolbar
    { zh: '播放', en: 'Play' },
    { zh: '暂停', en: 'Pause' },
    { zh: '抓拍', en: 'Snapshot' },
    { zh: '全屏', en: 'Fullscreen' },
    { zh: '对讲', en: 'Talk' },
    { zh: '对讲中', en: 'Talking' },

    // PTZ
    { zh: '预置位', en: 'Presets' },
    { zh: '缩放', en: 'Zoom' },
    { zh: '设置', en: 'Set' },
    { zh: '调用', en: 'Goto' },

    // nav
    { zh: '设备管理', en: 'Device Management' },
    { zh: '分组管理', en: 'Group Management' },
    { zh: '用户管理', en: 'User Management' },
    { zh: '角色管理', en: 'Role Management' },
    { zh: '网关告警', en: 'Gateway Alerts' },
    { zh: '协议告警', en: 'Protocol Alerts' },
    { zh: '1400告警', en: '1400 Alerts' },
    { zh: 'AI 分析', en: 'AI Analytics' },
    { zh: '基础配置', en: 'Basic Config' },
    { zh: '录像配置', en: 'Recording' },
    { zh: '告警配置', en: 'Alert Config' },
    { zh: '设备接入', en: 'Device Access' },
    { zh: '运维管理', en: 'Operations' },

    // user/device management
    { zh: '账号及权限', en: 'Accounts & Permissions' },
    { zh: '+ 添加用户', en: '+ Add User' },
    { zh: '+ 添加设备', en: '+ Add Device' },
    { zh: '+ 添加角色', en: '+ Add Role' },
    { zh: '编辑用户', en: 'Edit User' },
    { zh: '添加用户', en: 'Add User' },
    { zh: '编辑设备', en: 'Edit Device' },
    { zh: '添加设备', en: 'Add Device' },
    { zh: '编辑角色', en: 'Edit Role' },
    { zh: '添加角色', en: 'Add Role' },
    { zh: '查看实时视频', en: 'View Live Video' },
    { zh: 'PTZ 控制', en: 'PTZ Control' },
    { zh: '设备编码', en: 'Device Code' },
    { zh: '接入协议', en: 'Access Protocol' },
    { zh: '全部协议', en: 'All Protocols' },
    { zh: '全部状态', en: 'All Status' },
    { zh: '用户登录名', en: 'Login Name' },
    { zh: '用户昵称', en: 'Nickname' },
    { zh: '创建时间', en: 'Created' },
    { zh: '登录获取 Token', en: 'Login for Token' },
    { zh: '仅保存配置', en: 'Save Config' },
    { zh: '退出登录', en: 'Logout' },
    { zh: '平台连接', en: 'Platform Connection' },
    { zh: '播放 URL 测试', en: 'Play URL Test' },
    { zh: '播放诊断输出', en: 'Diagnostics' },
    { zh: '测试该 URL', en: 'Test URL' },
    { zh: '从视频页加载', en: 'Load from Video' },
    { zh: '登录密码（md5 提交）', en: 'Password (md5 hashed)' },
    { zh: '编辑时留空不修改', en: 'Leave empty to keep' },

    // demo cameras
    { zh: '办公区走廊 3F', en: 'Corridor 3F' },
    { zh: '地下车库 B1', en: 'Garage B1' },
    { zh: '电梯轿厢 #1', en: 'Elevator #1' },
    { zh: '停车场出口', en: 'Parking Exit' },
    { zh: '仓库 A 区', en: 'Warehouse A' },
    { zh: '仓库 B 区', en: 'Warehouse B' },
    { zh: '大楼正门', en: 'Main Entrance' },
    { zh: '园区东门', en: 'East Gate' },
    { zh: '园区西门', en: 'West Gate' },
    { zh: '消防通道', en: 'Fire Escape' },
    { zh: '屋顶天台', en: 'Rooftop' },
    { zh: '配电房', en: 'Power Room' },
    { zh: '大华枪机', en: 'Dahua Camera' },
    { zh: '澳洲测试', en: 'AU Test' },
    { zh: '临沂3Q测试', en: 'Linyi 3Q Test' },
    { zh: '安焦@home', en: 'Anjiao@home' },
    { zh: '安焦', en: 'Anjiao' },

    // short words
    { zh: '管理员', en: 'Admin' },
    { zh: '操作员', en: 'Operator' },
    { zh: '观看者', en: 'Viewer' },
    { zh: '描述 / 权限', en: 'Description / Permissions' },
    { zh: '角色名称', en: 'Role Name' },
    { zh: '设备', en: 'Devices' },
    { zh: '用户', en: 'Users' },
    { zh: '图库', en: 'Gallery' },
    { zh: '配置', en: 'Settings' },
    { zh: '收藏', en: 'Favorites' },
    { zh: '搜索', en: 'Search' },
    { zh: '刷新', en: 'Refresh' },
    { zh: '筛选', en: 'Filter' },
    { zh: '导出', en: 'Export' },
    { zh: '导入', en: 'Import' },
    { zh: '编号', en: 'ID' },
    { zh: '名称', en: 'Name' },
    { zh: '状态', en: 'Status' },
    { zh: '通道', en: 'Channels' },
    { zh: '通道数', en: 'Channels' },
    { zh: '启用', en: 'Enable' },
    { zh: '协议', en: 'Protocol' },
    { zh: '操作', en: 'Actions' },
    { zh: '编辑', en: 'Edit' },
    { zh: '删除', en: 'Delete' },
    { zh: '取消', en: 'Cancel' },
    { zh: '保存', en: 'Save' },
    { zh: '关闭', en: 'Close' },
    { zh: '密码', en: 'Password' },
    { zh: '角色', en: 'Role' },
    { zh: '昵称', en: 'Nickname' },
    { zh: '全部', en: 'All' },
    { zh: '在线', en: 'Online' },
    { zh: '离线', en: 'Offline' },
    { zh: '日期', en: 'Date' },
    { zh: '开始', en: 'Start' },
    { zh: '结束', en: 'End' },
    { zh: '就绪', en: 'Ready' },
    { zh: '清空', en: 'Clear' },
    { zh: '复制', en: 'Copy' },
    { zh: '上一页', en: 'Prev' },
    { zh: '下一页', en: 'Next' },
    { zh: '每页', en: 'Per page' },
    { zh: '用户名', en: 'Username' },
    { zh: '登录名', en: 'Login' },
    { zh: '搜', en: 'Go' },
    { zh: '去登录', en: 'Login' },
    { zh: '未登录', en: 'Not logged in' },
    { zh: '共 ', en: 'Total: ' },
    { zh: ' 条', en: '' },
  ];

  var zhSorted = PAIRS.slice().sort(function (a, b) { return b.zh.length - a.zh.length; });
  var enSorted = PAIRS.slice().sort(function (a, b) { return b.en.length - a.en.length; });

  var KEYS = {
    'pager.total':  { zh: '共 {n} 条', en: 'Total: {n}' },
    'pager.page':   { zh: '第 {p} / {t} 页', en: 'Page {p} / {t}' },
  };

  function replaceText(text, from, to) {
    var pairs = (from === 'zh') ? zhSorted : enSorted;
    var result = text;
    for (var i = 0; i < pairs.length; i++) {
      var f = pairs[i][from];
      if (f && result.indexOf(f) !== -1) {
        result = result.split(f).join(pairs[i][to]);
      }
    }
    return result;
  }

  function translateNode(root, from, to) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var i = 0; i < nodes.length; i++) {
      var orig = nodes[i].textContent;
      if (!orig || !orig.trim()) continue;
      var tr = replaceText(orig, from, to);
      if (tr !== orig) nodes[i].textContent = tr;
    }
    root.querySelectorAll('[placeholder]').forEach(function (el) {
      var o = el.placeholder;
      var t2 = replaceText(o, from, to);
      if (t2 !== o) el.placeholder = t2;
    });
    root.querySelectorAll('[title]').forEach(function (el) {
      var o = el.title;
      var t2 = replaceText(o, from, to);
      if (t2 !== o) el.title = t2;
    });
  }

  function t(key, params) {
    var entry = KEYS[key];
    if (!entry) return key;
    var text = entry[currentLang] || entry.zh || key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, function (_, k) {
      return (params[k] != null) ? String(params[k]) : '';
    });
  }

  function getLang()  { return currentLang; }

  function setLang(lang) {
    currentLang = (lang === 'en') ? 'en' : 'zh';
    try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
    applyLang();
  }

  function toggleLang() { setLang(currentLang === 'zh' ? 'en' : 'zh'); }

  function applyLang() {
    if (currentLang === displayedLang) return;
    var from = displayedLang;
    var to = currentLang;
    document.title = replaceText(document.title, from, to);
    translateNode(document.body, from, to);
    document.documentElement.lang = (to === 'en') ? 'en' : 'zh-CN';
    var btn = document.getElementById('_langBtn');
    if (btn) btn.textContent = (to === 'zh') ? 'EN' : '中文';
    displayedLang = to;
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang } }));
  }

  function translateNew(root) {
    if (currentLang === 'zh') return;
    translateNode(root || document.body, 'zh', currentLang);
  }

  var _mTimer = null;
  function setupObserver() {
    var observer = new MutationObserver(function () {
      if (currentLang === 'zh') return;
      if (_mTimer) clearTimeout(_mTimer);
      _mTimer = setTimeout(function () {
        translateNode(document.body, 'zh', currentLang);
      }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function injectToggle() {
    var topRight = document.querySelector('.top-right');
    if (!topRight) return;
    var btn = document.createElement('button');
    btn.id = '_langBtn';
    btn.type = 'button';
    btn.textContent = currentLang === 'zh' ? 'EN' : '中文';
    btn.style.cssText = 'padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:4px;background:rgba(255,255,255,.1);cursor:pointer;font:inherit;font-size:12px;color:rgba(255,255,255,.85);';
    btn.addEventListener('click', function (e) { e.stopPropagation(); toggleLang(); });
    topRight.insertBefore(btn, topRight.firstChild);
  }

  function init() {
    injectToggle();
    if (currentLang !== 'zh') {
      displayedLang = 'zh';
      applyLang();
    }
    setupObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.i18n = { t: t, getLang: getLang, setLang: setLang, toggleLang: toggleLang, translateNew: translateNew };
})();
