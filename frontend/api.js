// api.js — Apex CCTV shared API layer (state, fetch wrapper, EasyCVR helpers)
(function () {
  'use strict';

  var STORE_KEY = 'apexCctv.easycvr';
  var DIAG_KEY  = 'apexCctv.diag';

  var state = {
    baseUrl: 'http://13.238.254.66:18000',
    upstreamUrl: 'http://13.238.254.66:18000',
    token: '',
    username: '',
    deviceId: '',
    proto: 'HLS',
  };

  var diag = { lines: [] };

  function nowTs() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  function logDiag(line) {
    var s = '[' + nowTs() + '] ' + String(line);
    diag.lines.push(s);
    if (diag.lines.length > 500) diag.lines.splice(0, diag.lines.length - 500);
    try { localStorage.setItem(DIAG_KEY, diag.lines.join('\n')); } catch (e) {}
    try { console.log(s); } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var v = JSON.parse(raw);
      if (typeof v.baseUrl === 'string') state.baseUrl = v.baseUrl;
      if (typeof v.upstreamUrl === 'string') state.upstreamUrl = v.upstreamUrl;
      if (typeof v.token === 'string') state.token = v.token;
      if (typeof v.username === 'string') state.username = v.username;
      if (typeof v.deviceId === 'string') state.deviceId = v.deviceId;
      if (typeof v.proto === 'string') state.proto = v.proto;
    } catch (e) {}
  }

  function saveState(patch) {
    if (patch) {
      Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        baseUrl: state.baseUrl,
        upstreamUrl: state.upstreamUrl,
        token: state.token,
        username: state.username,
        deviceId: state.deviceId,
        proto: state.proto,
      }));
    } catch (e) {}
  }

  function normalizeUrl(u) {
    return (u || '').trim().replace(/\/+$/, '') || 'http://13.238.254.66:18000';
  }

  function joinUrl(base, path) {
    var p = (path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p) || /^wss?:\/\//i.test(p)) return p;
    var b = normalizeUrl(base);
    return p.startsWith('/') ? (b + p) : (b + '/' + p);
  }

  function joinUpstream(path) {
    return joinUrl(state.upstreamUrl, path);
  }

  function toUpstreamUrl(playUrl) {
    try {
      var u = new URL(playUrl);
      if (u.hostname === '127.0.0.1' || u.hostname === 'localhost') {
        var b = new URL(normalizeUrl(state.upstreamUrl));
        u.protocol = b.protocol;
        u.hostname = b.hostname;
        u.port = b.port;
        return u.toString();
      }
    } catch (e) {}
    return playUrl;
  }

  function apiGet(path, params, token) {
    var base = normalizeUrl(state.baseUrl);
    var url = new URL(joinUrl(base, path));
    var qs = new URLSearchParams();
    Object.entries(params || {}).forEach(function (kv) {
      if (kv[1] == null) return;
      var s = String(kv[1]).trim();
      if (s) qs.set(kv[0], s);
    });
    url.search = qs.toString();

    var headers = {};
    if (token) headers['Token'] = token;

    return fetch(url.toString(), { method: 'GET', headers: headers })
      .then(function (res) {
        return res.text().then(function (text) {
          var json = null;
          try { json = JSON.parse(text); } catch (e) {}
          if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (text || '').slice(0, 500));
          return json || text;
        });
      });
  }

  function apiPost(path, body, token) {
    var base = normalizeUrl(state.baseUrl);
    var url = joinUrl(base, path);
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Token'] = token;

    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body || {}) })
      .then(function (res) {
        return res.text().then(function (text) {
          var json = null;
          try { json = JSON.parse(text); } catch (e) {}
          if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (text || '').slice(0, 500));
          return json || text;
        });
      });
  }

  function unwrapEasyDarwin(json) {
    if (!json || typeof json !== 'object') return { ok: false, msg: 'not JSON', body: null, raw: json };
    var ed = json.EasyDarwin || json.easydarwin || json;
    var header = ed.Header || ed.header || {};
    var body = ed.Body || ed.body || ed;
    var code = header.ErrorNum != null ? header.ErrorNum : (header.errorNum != null ? header.errorNum : (header.Code != null ? header.Code : 200));
    var msg = header.ErrorString || header.errorString || header.Message || header.message || '';
    var ok = Number(code) === 200 || Number(code) === 0;
    return { ok: ok, code: code, msg: msg, body: body, raw: json };
  }

  function getProtoUrl(addrs, proto) {
    if (!addrs || typeof addrs !== 'object') return '';
    var raw = addrs[proto] || addrs[String(proto).toUpperCase()] || addrs[String(proto).toLowerCase()] || '';
    return joinUrl(state.baseUrl, raw);
  }

  function isLoggedIn() { return !!state.token; }

  loadState();

  window.ApexApi = {
    state: state,
    logDiag: logDiag,
    loadState: loadState,
    saveState: saveState,
    normalizeUrl: normalizeUrl,
    joinUrl: joinUrl,
    joinUpstream: joinUpstream,
    toUpstreamUrl: toUpstreamUrl,
    apiGet: apiGet,
    apiPost: apiPost,
    unwrapEasyDarwin: unwrapEasyDarwin,
    getProtoUrl: getProtoUrl,
    isLoggedIn: isLoggedIn,
    STORE_KEY: STORE_KEY,
    DIAG_KEY: DIAG_KEY,
  };
})();
