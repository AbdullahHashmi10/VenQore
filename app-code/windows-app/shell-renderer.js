'use strict';
/* VenQore Station shell — runs with no Node access; talks to main only through window.station. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── Icons (stroke, 24 grid) ───────────────────────────────────────────────────
const ICONS = {
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  'wifi-off': '<line x1="2" y1="2" x2="22" y2="22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><polyline points="21 3 21 8 16 8"/>',
  settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M10 20v-5h4v5"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  backspace: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>',
  network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-3h14v3M12 8v5"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const paintIcons = (root = document) => $$('i[data-icon]', root).forEach(el => { el.outerHTML = icon(el.dataset.icon); });
paintIcons();

// ── State ─────────────────────────────────────────────────────────────────────
// The <webview> is created here and only inserted into the page on the first
// navigation, with its src already set. A <webview> that is already in the
// HTML can miss a src set during boot and leave a paired till stuck on the
// loader; creating it with its first URL avoids that race entirely.
const pos = document.createElement('webview');
pos.id = 'pos';
pos.setAttribute('partition', 'persist:venqore_cloud');
pos.setAttribute('allowpopups', '');
function navigate(url) {
  if (!pos.isConnected) {
    pos.setAttribute('src', url);
    $('#stage').prepend(pos);
    return;
  }
  pos.setAttribute('src', url);
}
let loaderTimer = null;
const S = { st: null, prefs: {}, cloud: '', hw: null, online: null, loaded: false, retry: 0, retryTimer: null, posUrl: null, update: {}, settingsTab: 'printers' };
const show = (el, on = true) => { (typeof el === 'string' ? $(el) : el).classList.toggle('hidden', !on); };
const visible = (sel) => !$(sel).classList.contains('hidden');

function toast(message, type = 'info', action = null, ms = 4500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : type === 'warning' ? 'alert' : 'info')}<span>${esc(message)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.className = 'btn sm'; b.textContent = action.label;
    b.onclick = () => { action.run(); el.remove(); };
    el.appendChild(b);
  }
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function banner(text, actionLabel, run, kind = 'warn') {
  $('.banner-text').textContent = text;
  const b = $('#banner-action');
  show(b, !!actionLabel);
  b.textContent = actionLabel || '';
  b.onclick = () => { show('#banner', false); run && run(); };
  $('#banner').dataset.kind = kind;
  show('#banner', true);
}
$('#banner-close').onclick = () => show('#banner', false);

function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${esc(label || '')}`; }
  else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  S.st = await station.state();
  S.prefs = S.st.prefs; S.cloud = S.st.cloudUrl; S.hw = S.st.hardware; S.update = S.st.update || {};
  document.documentElement.dataset.theme = S.prefs.theme === 'dark' ? 'dark' : 'light';
  const host = new URL(S.cloud).host;
  $('#slug-pre').textContent = `${host}/s/`;
  $('#pair-version').textContent = `VenQore Station ${S.st.version}${S.st.dev ? ' · development' : ''}`;
  $('#about').textContent = `VenQore Station ${S.st.version} · Electron ${S.st.electron} · ${S.st.portable ? 'portable' : 'installed'} · © VenQore Group`;
  if (S.st.profile) {   // only ever present on the computer the profile was issued for
    const tag = document.createElement('span'); tag.className = 'bar-env'; tag.textContent = `LOCAL · ${host}`; tag.title = 'Connected to a local server, not the live VenQore site';
    $('.bar-left').append(tag);
  }
  applyWindow(S.st.window);
  renderHardware(S.hw);
  renderUpdate(S.update);
  setNet(S.st.online);
  show('#btn-drawer', !!S.prefs.hasPin);
  route();
}

function route() {
  show('#ov-pair', false); show('#ov-consent', false);
  if (!S.prefs.connectedStore) return showPair();
  if (S.prefs.activityTrackingEnabled && !S.prefs.consentAccepted) { show('#ov-loader', false); show('#ov-consent', true); return; }
  loadPos();
}

function posUrl() { return `${S.cloud}/s/${encodeURIComponent(S.prefs.connectedStore)}/pos`; }

function loadPos(url) {
  show('#ov-pair', false); show('#ov-error', false); show('#ov-offline', false);
  showLoader('Opening your POS', `${new URL(S.cloud).host}/s/${S.prefs.connectedStore || ''}`);
  S.posUrl = url || posUrl();
  navigate(S.posUrl);
  setStore(S.prefs.connectedStore);
}

function showLoader(title, sub) {
  $('#loader-title').textContent = title;
  $('#loader-sub').textContent = sub || '';
  $('#loader-bar').style.width = '12%';
  show('#ov-loader', true);
  clearTimeout(loaderTimer);
  loaderTimer = setTimeout(() => {
    if (!visible('#ov-loader')) return;
    show('#ov-loader', false);
    S.online === false ? showOffline() : showError('VenQore is taking too long to answer', 'The connection is very slow or the server is busy. Try again.', S.posUrl);
  }, 30000);
}
function hideLoader() {
  clearTimeout(loaderTimer);
  $('#loader-bar').style.width = '100%';
  setTimeout(() => show('#ov-loader', false), 180);
}

function setStore(slug) {
  const el = $('#bar-store');
  show(el, !!slug);
  if (slug) $('span', el).textContent = slug;
}

// ── Pairing ───────────────────────────────────────────────────────────────────
function showPair(prefill = '') {
  navigate('about:blank');
  S.loaded = false;
  show('#ov-loader', false); show('#ov-error', false); show('#ov-offline', false);
  show('#ov-pair', true);
  $('#pair-slug').value = prefill || S.prefs.connectedStore || (S.st.profile && S.st.profile.slug) || '';
  $('#pair-code-hint').textContent = S.prefs.hasDeviceSecret ? 'This till was paired before — the code is only needed if the store asks for one.' : 'Only needed the first time this till is paired.';
  setTimeout(() => ($('#pair-slug').value ? $('#pair-code') : $('#pair-slug')).focus(), 50);
}

$('#pair-code').addEventListener('input', (e) => {
  let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4);
  e.target.value = v;
});
$('#pair-slug').addEventListener('input', (e) => {
  const m = /\/s\/([a-z0-9-]+)/i.exec(e.target.value);
  if (m) e.target.value = m[1];
});

$('#pair-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#pair-error');
  show(err, false);
  const slug = $('#pair-slug').value.trim();
  if (!slug) { err.textContent = 'Enter your store name.'; show(err, true); $('#pair-slug').focus(); return; }
  const btn = $('#pair-submit');
  busy(btn, true, 'Pairing…');
  const r = await station.pair({ slug, code: $('#pair-code').value });
  busy(btn, false);
  if (!r.ok) { err.textContent = r.error; show(err, true); return; }
  S.prefs = (await station.state()).prefs;
  $('#pair-code').value = '';
  show('#banner', false);
  toast('Till paired with ' + r.slug, 'success');
  route();
});

$('#pair-signin').onclick = () => {
  show('#ov-pair', false);
  showLoader('Opening sign in', new URL(S.cloud).host);
  S.posUrl = `${S.cloud}/login`;
  navigate(S.posUrl);
};
$('#pair-register').onclick = (e) => { e.preventDefault(); station.openExternal(`${new URL(S.cloud).origin}/register`); };

$('#consent-accept').onclick = async () => {
  await station.consent();
  S.prefs.consentAccepted = true;
  show('#ov-consent', false);
  loadPos();
};

// ── Webview lifecycle ─────────────────────────────────────────────────────────
const NET_ERRORS = new Set([-7, -21, -100, -101, -102, -104, -105, -106, -109, -118, -130, -137, -324]);

pos.addEventListener('did-start-loading', () => { if (visible('#ov-loader')) $('#loader-bar').style.width = '55%'; });
pos.addEventListener('dom-ready', () => {
  if (pos.getURL() === 'about:blank') return;
  S.loaded = true; S.retry = 0;
  hideLoader();
  show('#ov-offline', false);
});

pos.addEventListener('did-navigate', (e) => {
  if (e.url === 'about:blank') return;
  noteUrl(e.url);
  const code = e.httpResponseCode;
  if (code >= 500 || code === 404) {
    showError(code === 404 ? 'Page not found' : 'VenQore is having a problem',
      code === 404 ? 'That store or page does not exist. Check the store name in Station settings → Station.' : `The server answered ${code}. This is usually brief — try again in a moment.`, e.url);
  } else if (code) {
    show('#ov-error', false);
  }
});
pos.addEventListener('did-navigate-in-page', (e) => { if (e.isMainFrame) noteUrl(e.url); });

function noteUrl(url) {
  const m = /\/s\/([a-z0-9-]{1,63})(\/|$|\?)/i.exec(url);
  if (m) {
    const slug = m[1].toLowerCase();
    if (slug !== S.prefs.connectedStore) {
      station.linkStore(slug).then(r => { if (r && r.ok) { S.prefs.connectedStore = slug; setStore(slug); } });
    } else setStore(slug);
  }
}

pos.addEventListener('did-fail-load', (e) => {
  if (!e.isMainFrame || e.errorCode === -3 || e.errorCode === 0) return;
  console.warn('[Shell] load failed', e.errorCode, e.errorDescription, e.validatedURL);
  show('#ov-loader', false);
  if (NET_ERRORS.has(e.errorCode)) return showOffline(e.validatedURL);
  showError('This page could not be opened', `${e.errorDescription || 'Load error'} (${e.errorCode}).`, e.validatedURL);
});

function showError(title, desc, url) {
  $('#err-title').textContent = title;
  $('#err-desc').textContent = desc;
  $('#err-url').textContent = url || '';
  show('#ov-loader', false);
  show('#ov-error', true);
}
$('#err-retry').onclick = () => { show('#ov-error', false); showLoader('Trying again'); pos.reload(); };
$('#err-pos').onclick = () => S.prefs.connectedStore ? loadPos() : showPair();

function showOffline(url) {
  if (url && url !== 'about:blank') S.posUrl = url;
  show('#ov-offline', true);
  clearTimeout(S.retryTimer);
  const waits = [3, 5, 10, 20, 30];
  let left = waits[Math.min(S.retry, waits.length - 1)];
  S.retry++;
  const tick = () => {
    $('#offline-retry').textContent = `Retrying in ${left} s…`;
    if (left-- <= 0) return retryNow();
    S.retryTimer = setTimeout(tick, 1000);
  };
  tick();
}
function retryNow() {
  clearTimeout(S.retryTimer);
  $('#offline-retry').textContent = 'Retrying…';
  navigate(S.posUrl || posUrl());
}
$('#offline-now').onclick = retryNow;

// ── Connection / lock ─────────────────────────────────────────────────────────
function setNet(online) {
  S.online = online;
  const el = $('#st-net');
  el.className = 'stat ' + (online === null ? '' : online ? 'ok' : 'bad');
  $('.lbl', el).textContent = online === null ? 'Connecting…' : online ? 'Online' : 'Offline';
}
station.on('connection', ({ online }) => {
  const was = S.online;
  setNet(online);
  if (online && was === false) {
    if (visible('#ov-offline')) retryNow();
    toast('Back online', 'success', null, 2500);
  }
  if (!online && !S.loaded && S.prefs.connectedStore && !visible('#ov-pair')) showOffline();
});
station.on('sync', ({ at }) => { $('#st-net').title = `Internet connection · last sync ${new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; });
station.on('offline-lock', ({ locked, lastSync }) => {
  const was = visible('#ov-lock');
  show('#ov-lock', locked);
  if (locked) $('#lock-last').textContent = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
  if (was && !locked && S.prefs.connectedStore) loadPos();
});
station.on('pairing-required', ({ code }) => {
  if (visible('#ov-pair')) return;
  banner(code === 'DEVICE_AUTH_FAILED'
    ? 'The store disconnected this till. Printing still works — pair again so the store can see it.'
    : 'This till is not paired with the store yet. Printing works; pair it so the store can manage this terminal.',
  'Pair now', () => showPair(S.prefs.connectedStore));
});
station.on('guest', ({ event }) => {
  if (event === 'crashed') toast('The POS stopped unexpectedly and was reloaded.', 'warning');
  if (event === 'unresponsive') banner('The POS is not responding.', 'Reload', () => pos.reload());
  if (event === 'responsive') show('#banner', false);
});
station.on('toast', (t) => toast(t.message, t.type, t.action?.kind === 'open-file' ? { label: 'Open', run: () => station.openFile(t.action.path) } : null, 6000));

// ── Hardware chips ────────────────────────────────────────────────────────────
function chipState(el, cls, label, title) {
  el.className = 'stat ' + (cls || '');
  $('.lbl', el).textContent = label;
  if (title) el.title = title;
}
function activePrinter(hw) {
  if (!hw || !hw.printers) return null;
  return hw.printers.find(p => p.isStationDefault) || hw.printers.find(p => p.thermal) || hw.printers.find(p => p.isDefault) || null;
}
function renderHardware(hw) {
  if (!hw) return;
  S.hw = hw;
  const p = activePrinter(hw);
  const pc = $('#st-printer');
  if (!hw.printers.length) chipState(pc, 'warn', 'No printer', 'No printer found — open Station settings');
  else if (!p) chipState(pc, 'warn', 'Choose printer');
  else {
    const name = (p.displayName || p.name).replace(/^tcp:\/\//, '');
    const cls = p.state === 'ready' ? 'ok' : p.state === 'offline' || p.state === 'error' ? 'bad' : p.state === 'warning' ? 'warn' : '';
    chipState(pc, cls, p.state === 'ready' || !p.status ? name : `${name} · ${p.status}`, `Receipt printer: ${name}${p.status ? ' — ' + p.status : ''}`);
  }
  const sc = hw.serial?.scanner, sl = hw.serial?.scale;
  show('#st-scanner', !!sc?.wanted);
  if (sc?.wanted) chipState($('#st-scanner'), sc.connected ? 'ok' : 'bad', sc.connected ? 'Scanner' : 'Scanner unplugged', `${sc.path} · ${sc.connected ? 'connected' : sc.error || 'not connected'}`);
  show('#st-scale', !!sl?.wanted);
  if (sl?.wanted && !sl.connected) chipState($('#st-scale'), 'bad', 'Scale unplugged', sl.error || '');
  const cd = hw.customerDisplay || {};
  show('#st-display', cd.open || cd.screens > 1);
  if (cd.open || cd.screens > 1) chipState($('#st-display'), cd.open ? 'ok' : '', cd.open ? 'Display on' : 'Display off', 'Customer display');
  if (visible('#settings')) refreshDeviceStates();
}
station.on('hardware', renderHardware);
station.on('weight', (r) => {
  const el = $('#st-scale');
  if (!el.classList.contains('hidden')) chipState(el, r.stable ? 'ok' : 'warn', `${r.weight.toFixed(3)} kg${r.stable ? '' : ' ~'}`, r.raw);
  $('#sl-weight').textContent = `${r.weight.toFixed(3)} kg`;
  const st = $('#sl-stable');
  st.className = 'chip ' + (r.overload ? 'bad' : r.stable ? 'ok' : 'warn');
  st.innerHTML = `<span class="dot"></span>${r.overload ? 'Overload' : r.stable ? 'Stable' : 'Settling'}`;
});
station.on('scan', (code) => { $('#sc-last').textContent = `Last scan: ${code}`; });
$$('#bar-status .stat[data-tab]').forEach(b => b.onclick = () => openSettings(b.dataset.tab));

// ── Window ────────────────────────────────────────────────────────────────────
function applyWindow(w) { if (w) show('#win-ctl', !w.fullscreen); }
station.on('window', applyWindow);
$$('[data-win]').forEach(b => b.onclick = () => station.windowAction(b.dataset.win));

// ── Bar actions ───────────────────────────────────────────────────────────────
$('#btn-reload').onclick = () => { show('#ov-error', false); show('#ov-offline', false); S.loaded ? pos.reload() : (S.prefs.connectedStore ? loadPos() : showPair()); };
$('#btn-privacy').onclick = () => togglePrivacy();
$('#ov-privacy').onclick = () => togglePrivacy(false);
function togglePrivacy(force) {
  const on = force ?? visible('#ov-privacy') === false;
  show('#ov-privacy', on);
  $('#stage').classList.toggle('blurred', on);
  $('#btn-privacy').classList.toggle('on', on);
}
$('#btn-drawer').onclick = async () => {
  const pin = await askPin({ title: 'Open cash drawer', sub: 'Manager PIN required for a no-sale drawer open', verify: true });
  if (pin === null) return;
  const r = await station.openDrawer(null);
  toast(r.success ? 'Cash drawer opened' : r.error, r.success ? 'success' : 'error');
};
$('#btn-settings').onclick = () => openSettings();
$('#btn-exit').onclick = () => onCloseRequest({ needPin: S.prefs.hasPin });

station.on('command', (cmd) => {
  if (cmd === 'reload') $('#btn-reload').click();
  if (cmd === 'settings') openSettings();
  if (cmd === 'privacy') togglePrivacy();
});
station.on('zoom', (z) => { $('#zoom').value = Math.round(z * 100); $('#zoom-val').textContent = `${Math.round(z * 100)}%`; toast(`POS size ${Math.round(z * 100)}%`, 'info', null, 1200); });
station.on('devtools-request', async () => {
  if (S.st.dev || !S.prefs.hasPin) return station.devtools({});
  const pin = await askPin({ title: 'Developer tools', sub: 'Manager PIN required' });
  if (pin !== null) { const r = await station.devtools({ pin }); if (!r.success) toast(r.error, 'error'); }
});

// ── Exit ──────────────────────────────────────────────────────────────────────
station.on('close-request', onCloseRequest);
async function onCloseRequest({ needPin }) {
  if (needPin) {
    let quitting = false;
    await askPin({
      title: 'Exit VenQore Station', sub: 'Enter the manager PIN to close the till',
      check: async (pin) => { const r = await station.quit({ pin }); quitting = r.success; return r; },
    });
    return quitting;
  }
  const idle = visible('#ov-pair') || !S.loaded;
  if (idle) return station.quit({});
  if (await confirmBox({ title: 'Exit VenQore Station?', body: 'The POS will close and the printer, drawer and scanner will disconnect.', ok: 'Exit', danger: true })) station.quit({});
}

function confirmBox({ title, body, ok = 'OK', danger = false }) {
  return new Promise((resolve) => {
    $('#confirm-title').textContent = title;
    $('#confirm-body').textContent = body;
    const okBtn = $('#confirm-ok');
    okBtn.textContent = ok;
    okBtn.className = `btn lg ${danger ? 'danger' : 'primary'}`;
    $('#confirm-badge').className = `badge-icon ${danger ? 'bad' : 'accent'}`;
    show('#modal-confirm', true);
    okBtn.focus();
    const done = (v) => { show('#modal-confirm', false); okBtn.onclick = null; $('#confirm-cancel').onclick = null; resolve(v); };
    okBtn.onclick = () => done(true);
    $('#confirm-cancel').onclick = () => done(false);
    $('#modal-confirm').onkeydown = (e) => { if (e.key === 'Escape') done(false); };
  });
}

// ── PIN pad ───────────────────────────────────────────────────────────────────
/**
 * askPin({ title, sub, verify?, check?, length? }) → pin string | null
 *  verify: check against the stored PIN before resolving
 *  check:  custom async (pin) → { ok|success, error } — stays open until it passes
 */
function askPin({ title, sub, verify = false, check = null, max = 8 }) {
  return new Promise((resolve) => {
    let pin = '';
    const card = $('.pin-card');
    $('#pin-title').textContent = title;
    $('#pin-sub').textContent = sub || '';
    show('#pin-error', false);
    const dots = () => { $('#pin-dots').innerHTML = Array.from({ length: Math.max(4, pin.length) }, (_, i) => `<span class="${i < pin.length ? 'on' : ''}"></span>`).join(''); };
    const fail = (msg) => {
      pin = ''; dots();
      $('#pin-error').textContent = msg || 'Wrong PIN'; show('#pin-error', true);
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    };
    const close = (v) => { show('#modal-pin', false); document.removeEventListener('keydown', onKey, true); $('#pin-pad').onclick = null; $('#pin-ok').onclick = null; resolve(v); };
    const submit = async () => {
      if (pin.length < 4) return fail('Enter at least 4 digits');
      const ok = $('#pin-ok');
      busy(ok, true, 'Checking…');
      let r = { ok: true };
      if (check) r = await check(pin);
      else if (verify) r = await station.verifyPin(pin);
      busy(ok, false);
      if (r && (r.ok || r.success)) close(pin); else fail(r && r.error);
    };
    const press = (k) => {
      if (k === 'cancel') return close(null);
      if (k === 'back') { pin = pin.slice(0, -1); return dots(); }
      if (/^\d$/.test(k) && pin.length < max) { pin += k; dots(); show('#pin-error', false); }
    };
    const onKey = (e) => {
      if (visible('#modal-pin') === false) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') submit();
      else if (e.key === 'Escape') press('cancel');
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    $('#pin-pad').onclick = (e) => { const b = e.target.closest('button'); if (b) press(b.dataset.k); };
    $('#pin-ok').onclick = submit;
    document.addEventListener('keydown', onKey, true);
    dots();
    show('#modal-pin', true);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════
async function openSettings(tab) {
  if (visible('#settings')) { if (tab) selectTab(tab); return; }
  if (S.prefs.hasPin && (S.prefs.lockSettings || S.prefs.activityTrackingEnabled)) {
    const pin = await askPin({ title: 'Station settings', sub: 'Manager PIN required', verify: true });
    if (pin === null) return;
  }
  const st = await station.state();
  S.st = st; S.prefs = st.prefs; S.update = st.update || S.update;
  show('#settings', true);
  selectTab(tab || S.settingsTab);
}
function closeSettings() { show('#settings', false); }
$('#set-close').onclick = closeSettings;
$('#settings').addEventListener('mousedown', (e) => { if (e.target.id === 'settings') closeSettings(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && visible('#settings') && !visible('#modal-pin') && !visible('#modal-confirm')) closeSettings();
});
$$('#set-tabs button').forEach(b => b.onclick = () => selectTab(b.dataset.tab));

function selectTab(tab) {
  S.settingsTab = tab;
  $$('#set-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $$('.pane').forEach(p => show(p, p.dataset.pane === tab));
  ({ printers: renderPrinters, devices: renderDevices, display: renderDisplay, station: renderStation, security: renderSecurity })[tab]?.();
}

function seg(el, value, onPick) {
  $$('button', el).forEach(b => {
    b.classList.toggle('on', b.dataset.v === String(value));
    b.onclick = () => { $$('button', el).forEach(x => x.classList.toggle('on', x === b)); onPick(b.dataset.v); };
  });
}
async function savePrefs(updates, quiet = false) {
  const r = await station.savePrefs(updates);
  if (!r.success) { toast(r.error || 'Could not save', 'error'); return r; }
  S.prefs = r.prefs;
  if (!quiet) toast('Saved', 'success', null, 1400);
  return r;
}

// ── Printers pane ─────────────────────────────────────────────────────────────
const KIND = { windows: 'Windows printer', network: 'Network printer' };
const stateChip = (p) => {
  const cls = p.state === 'ready' ? 'ok' : (p.state === 'offline' || p.state === 'error') ? 'bad' : p.state === 'warning' ? 'warn' : '';
  return `<span class="chip ${cls}"><span class="dot"></span>${esc(p.status || (p.state === 'unknown' ? 'Unknown' : p.state))}</span>`;
};

async function renderPrinters(force = false) {
  const list = await station.printers(force);
  const def = S.prefs.defaultPrinter || '';
  const sel = $('#pr-default');
  sel.innerHTML = `<option value="">Automatic — first receipt printer</option>` + list.map(p =>
    `<option value="${esc(p.name)}" ${p.name === def ? 'selected' : ''}>${esc(p.displayName || p.name)}${p.thermal ? ' · receipt' : ''}${p.status && p.state !== 'ready' ? ' — ' + esc(p.status) : ''}</option>`).join('');
  if (def && !list.some(p => p.name === def)) sel.insertAdjacentHTML('beforeend', `<option value="${esc(def)}" selected>${esc(def)} — not connected</option>`);
  sel.onchange = async () => {
    const r = await station.setDefaultPrinter(sel.value || null);
    if (!r.success) return toast(r.error, 'error');
    S.prefs.defaultPrinter = sel.value || null;
    toast('Receipt printer saved', 'success', null, 1500);
    renderPrinters();
  };

  renderRoles(list);
  $('#pr-list').innerHTML = list.length ? list.map(p => printerCard(p, def)).join('') : `<p class="hint">No printers found. Install the printer's Windows driver, or add a network printer below.</p>`;
  $$('#pr-list .pr').forEach(card => wirePrinterCard(card, list.find(p => p.name === card.dataset.name)));
  renderJobs();
}

async function renderRoles(list) {
  const roles = (await station.printRoles()).filter(r => r.role !== 'receipt');
  const opts = (cur, blank) => `<option value="">${blank}</option>` + list.map(p => `<option value="${esc(p.name)}" ${p.name === cur ? 'selected' : ''}>${esc(p.displayName || p.name)}${p.status && p.state !== 'ready' ? ' — ' + esc(p.status) : ''}</option>`).join('')
    + (cur && !list.some(p => p.name === cur) ? `<option value="${esc(cur)}" selected>${esc(cur)} — not connected</option>` : '');
  $('#pr-roles').innerHTML = roles.map(r => `<div class="role" data-role="${r.role}">
      <span class="role-name">${esc(r.label)}</span>
      <select class="select" data-k="printer">${opts(r.printer, 'Same as bills')}</select>
      <select class="select" data-k="fallback">${opts(r.fallback, 'No backup')}</select>
    </div>`).join('');
  $$('#pr-roles .role').forEach(row => row.querySelectorAll('select').forEach(sel => sel.onchange = async () => {
    const printer = row.querySelector('[data-k=printer]').value, fallback = row.querySelector('[data-k=fallback]').value;
    const res = await station.setPrintRole(row.dataset.role, { printer, fallback });
    toast(res.success ? 'Saved' : (res.error || 'Could not save'), res.success ? 'success' : 'error', null, 1500);
    if (!res.success) renderPrinters();
  }));
}

function printerCard(p, def) {
  const prof = p.profile || {};
  return `<div class="pr ${p.name === def ? 'default' : ''}" data-name="${esc(p.name)}">
    <div class="pr-row">
      <span class="pr-ico">${icon(p.kind === 'network' ? 'network' : 'printer')}</span>
      <div style="min-width:0"><div class="pr-name">${esc(p.displayName || p.name)}</div>
        <div class="pr-meta">${esc(KIND[p.kind] || '')}${p.driver ? ' · ' + esc(p.driver) : ''}${p.port ? ' · ' + esc(p.port) : ''}</div></div>
      ${p.name === def ? '<span class="chip accent">Customer bills</span>' : p.thermal ? '<span class="chip">ESC/POS</span>' : '<span class="chip">Driver</span>'}
      ${stateChip(p)}
    </div>
    <div class="pr-body hidden">
      <div class="kv">
        <span>Print mode</span><div class="seg" data-k="mode"><button data-v="auto">Auto</button><button data-v="escpos">ESC/POS (fast)</button>${p.kind === 'network' ? '' : '<button data-v="driver">Windows driver</button>'}</div>
        <span>Paper</span><div class="seg" data-k="paper"><button data-v="auto">From POS</button><button data-v="58mm">58 mm</button><button data-v="80mm">80 mm</button><button data-v="104mm">4 inch</button></div>
        <span>Cut</span><div class="seg" data-k="cut"><button data-v="partial">Partial</button><button data-v="full">Full</button><button data-v="none">No cutter</button></div>
        <span>Drawer cable</span><div class="seg" data-k="drawerPin"><button data-v="2">Pin 2 (standard)</button><button data-v="5">Pin 5</button></div>
        <span>Darkness</span><input type="range" min="120" max="220" step="5" data-k="darkness" value="${Number(prof.darkness) || 165}">
        <span>Buzzer</span><label class="toggle"><input type="checkbox" data-k="beep" ${prof.beep ? 'checked' : ''}><span></span></label>
      </div>
      <div class="row-gap wrap">
        <button class="btn sm primary" data-act="test">${icon('printer')}Test print</button>
        <button class="btn sm" data-act="drawer">${icon('cash')}Open drawer</button>
        ${p.name === def ? '' : '<button class="btn sm" data-act="default">Use for receipts</button>'}
        ${p.kind === 'network' ? `<button class="btn sm danger" data-act="remove">${icon('trash')}Remove</button>` : ''}
      </div>
    </div>
  </div>`;
}

function wirePrinterCard(card, p) {
  const body = $('.pr-body', card);
  $('.pr-row', card).onclick = () => show(body, body.classList.contains('hidden'));
  const prof = p.profile || {};
  $$('.seg[data-k]', card).forEach(el => seg(el, prof[el.dataset.k] ?? (el.dataset.k === 'drawerPin' ? 2 : 'auto'), async (v) => {
    await station.setPrinterProfile({ name: p.name, profile: { [el.dataset.k]: el.dataset.k === 'drawerPin' ? Number(v) : v } });
    toast('Printer setting saved', 'success', null, 1200);
  }));
  const dark = $('input[data-k="darkness"]', card);
  dark.onchange = () => station.setPrinterProfile({ name: p.name, profile: { darkness: Number(dark.value) } });
  const beep = $('input[data-k="beep"]', card);
  beep.onchange = () => station.setPrinterProfile({ name: p.name, profile: { beep: beep.checked } });
  $$('[data-act]', card).forEach(b => b.onclick = async (e) => {
    e.stopPropagation();
    const act = b.dataset.act;
    if (act === 'test') { busy(b, true, 'Printing…'); const r = await station.testPrint(p.name); busy(b, false); printResult(r, 'Test page sent'); }
    if (act === 'drawer') { const r = await station.openDrawer(p.name); printResult(r, 'Drawer opened'); }
    if (act === 'default') { await station.setDefaultPrinter(p.name); S.prefs.defaultPrinter = p.name; renderPrinters(); }
    if (act === 'remove') { await station.removeNetworkPrinter(p.name); renderPrinters(true); }
  });
}

function printResult(r, okMsg) {
  const msg = r.success ? `${okMsg}${r.mode ? ' · ' + r.mode : ''}` : r.error || 'Failed';
  $('#pr-result').textContent = msg;
  toast(msg, r.success ? 'success' : 'error');
  renderJobs();
}

$('#pr-refresh').onclick = async (e) => { busy(e.currentTarget, true, 'Refreshing'); await renderPrinters(true); busy(e.currentTarget, false); };
$('#pr-test').onclick = async (e) => { const b = e.currentTarget; busy(b, true, 'Printing…'); const r = await station.testPrint($('#pr-default').value || null); busy(b, false); printResult(r, 'Test page sent'); };
$('#pr-drawer').onclick = async () => printResult(await station.openDrawer($('#pr-default').value || null), 'Drawer opened');
$('#np-add').onclick = async (e) => {
  const b = e.currentTarget;
  busy(b, true, 'Checking printer…');
  const r = await station.addNetworkPrinter({ label: $('#np-label').value, host: $('#np-host').value, port: $('#np-port').value });
  busy(b, false);
  if (!r.success) { $('#np-result').textContent = r.error; return toast(r.error, 'error'); }
  $('#np-result').textContent = r.status?.online === false ? 'Added — but the printer is not answering yet. Check its IP and that it is switched on.' : `Added · ${r.status?.label || 'Ready'}`;
  $('#np-label').value = ''; $('#np-host').value = '';
  renderPrinters(true);
};

async function renderJobs() {
  const jobs = await station.history();
  $('#pr-jobs').innerHTML = jobs.length ? jobs.slice(0, 12).map(j => `<div class="job">
      <span class="num muted">${esc(new Date(j.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}</span>
      <span>${esc(j.label || 'Job')} → ${esc(j.printer)}</span>
      <span class="muted">${esc(j.mode || '')}${j.ms ? ' · ' + j.ms + ' ms' : ''}</span>
      <span class="chip ${j.ok ? 'ok' : 'bad'}"><span class="dot"></span>${j.ok ? 'Printed' : 'Failed'}</span>
      ${j.ok ? '' : `<span class="err">${esc(j.error || '')}</span>`}</div>`).join('') : '<p class="hint">Nothing printed yet.</p>';
}
station.on('job', () => { if (visible('#settings') && S.settingsTab === 'printers') renderJobs(); });

// ── Devices pane ──────────────────────────────────────────────────────────────
const BAUDS = [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
let PORTS = [];
async function renderDevices() {
  seg($('#sc-mode'), S.prefs.scannerWedge === false ? 'event' : 'wedge', (v) => savePrefs({ scannerWedge: v === 'wedge' }));
  seg($('#sc-suffix'), S.prefs.scannerSuffix || 'enter', (v) => savePrefs({ scannerSuffix: v }));
  seg($('#sl-poll'), S.prefs.scalePoll || 'none', () => {});
  seg($('#sl-unit'), S.prefs.scaleUnit || 'kg', () => {});
  $('#pl-l1').value = S.prefs.poleIdleLine1 || ''; $('#pl-l2').value = S.prefs.poleIdleLine2 || '';
  $('#pl-l1').onchange = $('#pl-l2').onchange = () => savePrefs({ poleIdleLine1: $('#pl-l1').value, poleIdleLine2: $('#pl-l2').value });
  await scanPorts();
}

async function scanPorts() {
  const r = await station.serialList();
  PORTS = r.ports || [];
  $('#sp-list').innerHTML = PORTS.length
    ? PORTS.map(p => `<div class="port"><span class="num">${esc(p.path)}</span><span>${esc(p.friendlyName || p.manufacturer || 'Serial device')}</span></div>`).join('')
    : `<p class="hint">${esc(r.error || 'No COM ports found. Plug the device in and press Scan.')}</p>`;
  for (const kind of ['scanner', 'scale', 'pole']) {
    const g = $(`.group[data-dev="${kind}"]`);
    const saved = S.prefs[`${kind}Port`];
    const portSel = $('[data-port]', g);
    portSel.innerHTML = `<option value="">Choose COM port…</option>` + PORTS.map(p => `<option value="${esc(p.path)}" ${p.path === saved ? 'selected' : ''}>${esc(p.path)} — ${esc(p.friendlyName || p.manufacturer || 'Serial device')}</option>`).join('')
      + (saved && !PORTS.some(p => p.path === saved) ? `<option value="${esc(saved)}" selected>${esc(saved)} — unplugged</option>` : '');
    const baud = $('[data-baud]', g);
    const sb = Number(S.prefs[`${kind}BaudRate`]) || 9600;
    baud.innerHTML = BAUDS.map(b => `<option value="${b}" ${b === sb ? 'selected' : ''}>${b} baud</option>`).join('');
    $('[data-connect]', g).onclick = async (e) => {
      if (!portSel.value) return toast('Choose a COM port first', 'warning');
      const b = e.currentTarget; busy(b, true, 'Connecting');
      const opts = kind === 'scale' ? { poll: $('#sl-poll .on')?.dataset.v || 'none', unit: $('#sl-unit .on')?.dataset.v || 'kg' } : {};
      const res = await station.serialOpen({ kind, path: portSel.value, baudRate: Number(baud.value), ...opts });
      busy(b, false);
      toast(res.success ? `${kind === 'pole' ? 'Pole display' : kind[0].toUpperCase() + kind.slice(1)} connected on ${portSel.value}` : res.error, res.success ? 'success' : 'error');
      S.prefs = (await station.state()).prefs;
    };
    $('[data-disconnect]', g).onclick = async () => { await station.serialClose(kind); S.prefs[`${kind}Port`] = null; toast('Disconnected', 'info', null, 1500); };
  }
  refreshDeviceStates();
}
$('#sp-scan').onclick = async (e) => { busy(e.currentTarget, true, 'Scanning'); await scanPorts(); busy(e.currentTarget, false); };
$('#pl-test').onclick = async () => { const r = await station.poleTest(); toast(r.success ? 'Sent to pole display' : r.error, r.success ? 'success' : 'error'); };

function refreshDeviceStates() {
  const s = S.hw?.serial || {};
  for (const kind of ['scanner', 'scale', 'pole']) {
    const d = s[kind]; const chip = $(`.group[data-dev="${kind}"] [data-state]`);
    if (!chip || !d) continue;
    chip.className = 'chip ' + (d.connected ? 'ok' : d.wanted ? 'bad' : '');
    chip.innerHTML = `<span class="dot"></span>${d.connected ? `Connected · ${esc(d.path)}` : d.wanted ? esc(d.error || 'Waiting for device') : 'Not set up'}`;
  }
}

// ── Display pane ──────────────────────────────────────────────────────────────
function renderDisplay() {
  const cd = S.hw?.customerDisplay || {};
  $('#cd-screens').textContent = cd.screens > 1 ? `${cd.screens} screens connected.` : 'Only one screen is connected. Plug in the customer monitor and choose "Extend these displays" in Windows.';
  const c = $('#cd-state'); c.className = 'chip ' + (cd.open ? 'ok' : ''); c.innerHTML = `<span class="dot"></span>${cd.open ? 'Showing' : 'Off'}`;
  $('#cd-auto').checked = !!S.prefs.customerDisplayAuto;
  const z = Math.round((Number(S.prefs.zoom) || 1) * 100);
  $('#zoom').value = z; $('#zoom-val').textContent = `${z}%`;
  seg($('#win-mode'), S.prefs.windowMode || 'fullscreen', (v) => savePrefs({ windowMode: v }));
  seg($('#theme'), S.prefs.theme || 'light', (v) => { document.documentElement.dataset.theme = v; savePrefs({ theme: v }, true); });
}
$('#cd-open').onclick = async () => { const r = await station.customerDisplayOpen(); toast(r.success ? 'Customer display on' : r.error, r.success ? 'success' : 'warning', null, 6000); setTimeout(renderDisplay, 400); };
$('#cd-close').onclick = async () => { await station.customerDisplayClose(); setTimeout(renderDisplay, 300); };
$('#cd-auto').onchange = (e) => savePrefs({ customerDisplayAuto: e.target.checked });
$('#zoom').oninput = (e) => { $('#zoom-val').textContent = `${e.target.value}%`; };
$('#zoom').onchange = (e) => station.zoom(Number(e.target.value) / 100);

// ── Station pane ──────────────────────────────────────────────────────────────
function renderStation() {
  const p = S.prefs;
  $('#stn-store').textContent = p.connectedStore || 'Not linked';
  $('#stn-terminal').textContent = p.terminalId || 'Assigned after pairing';
  $('#stn-device').textContent = p.deviceId || '—';
  $('#stn-cloud').textContent = new URL(S.cloud).host;
  $('#stn-sync').textContent = p.lastOnlineSyncAt ? new Date(p.lastOnlineSyncAt).toLocaleString() : '—';
  const chip = $('#stn-pair');
  chip.className = 'chip ' + (p.hasDeviceSecret ? 'ok' : 'warn');
  chip.innerHTML = `<span class="dot"></span>${p.hasDeviceSecret ? 'Paired' : 'Not paired'}`;
  $('#opt-autostart').checked = !!p.autoStart;
  $('#opt-awake').checked = !!p.keepAwake;
  $('#opt-safegfx').checked = !!p.safeGraphics;
  show($('#opt-autostart').closest('.line'), !S.st.portable);
  renderUpdate(S.update);
}
$('#stn-repair').onclick = () => { closeSettings(); showPair(S.prefs.connectedStore); };
$('#stn-disconnect').onclick = async () => {
  if (!await confirmBox({ title: 'Disconnect this till?', body: 'The POS closes and this terminal shows the pairing screen. Sales already saved in VenQore are not affected.', ok: 'Disconnect', danger: true })) return;
  let pin;
  if (S.prefs.hasPin) { pin = await askPin({ title: 'Disconnect store', sub: 'Manager PIN required', verify: true }); if (pin === null) return; }
  const r = await station.disconnectStore({ pin });
  if (!r.success) return toast(r.error, 'error');
  S.prefs.connectedStore = null; setStore(null); closeSettings(); showPair();
};
$('#opt-autostart').onchange = (e) => savePrefs({ autoStart: e.target.checked });
$('#opt-awake').onchange = (e) => savePrefs({ keepAwake: e.target.checked });
$('#opt-safegfx').onchange = async (e) => {
  const want = e.target.checked;
  if (!await confirmBox({ title: 'Restart Station?', body: want ? 'Safe graphics turns off GPU acceleration. Use it if the screen is blank or flickers.' : 'Turn GPU acceleration back on.', ok: 'Restart now' })) { e.target.checked = !want; return; }
  const r = await savePrefs({ safeGraphics: want }, true);
  if (r.success) restartStation();
};

function renderUpdate(u = {}) {
  S.update = u;
  const chip = $('#upd-chip');
  const map = {
    idle: ['', 'Not checked yet', 'Station checks for updates automatically.'],
    checking: ['info', 'Checking', 'Looking for a new version…'],
    current: ['ok', 'Up to date', `You have the latest version (${S.st?.version || ''}).`],
    downloading: ['info', `Downloading ${u.percent || 0}%`, `Version ${u.version || ''} is downloading in the background.`],
    ready: ['accent', 'Ready to install', `Version ${u.version || ''} is ready. It installs on restart.`],
    error: ['warn', 'Could not check', u.error || 'The update server could not be reached.'],
    portable: ['', 'Manual updates', 'This is the portable build. Install the setup version for automatic updates.'],
  };
  const [cls, label, text] = map[u.state] || map.idle;
  chip.className = 'chip ' + cls; chip.innerHTML = `<span class="dot"></span>${esc(label)}`;
  $('#upd-text').textContent = text;
  show('#upd-progress', u.state === 'downloading');
  $('#upd-bar').style.width = `${u.percent || 0}%`;
  show('#upd-install', u.state === 'ready');
  if (u.state === 'ready' && !S.updateToastShown) {
    S.updateToastShown = true;
    toast(`Station ${u.version} is ready`, 'success', { label: 'Restart', run: () => station.installUpdate() }, 12000);
  }
}
station.on('update', renderUpdate);
$('#upd-check').onclick = async () => { const r = await station.checkUpdates(); if (!r.success) toast(r.error, 'warning'); };
$('#upd-install').onclick = () => station.installUpdate();

$('#sup-diag').onclick = async (e) => { const b = e.currentTarget; busy(b, true, 'Collecting…'); const r = await station.diagnostics(); busy(b, false); if (r.success) $('#sup-result').textContent = `Saved: ${r.path}`; };
$('#sup-logs').onclick = () => station.openLogs();
$('#sup-cache').onclick = async () => {
  if (!await confirmBox({ title: 'Clear the cache?', body: 'Fixes an outdated or broken-looking POS. You stay signed in. The POS reloads.', ok: 'Clear cache' })) return;
  let pin; if (S.prefs.hasPin) { pin = await askPin({ title: 'Clear cache', sub: 'Manager PIN required', verify: true }); if (pin === null) return; }
  const r = await station.clearCache({ pin });
  toast(r.success ? 'Cache cleared' : r.error, r.success ? 'success' : 'error');
  if (r.success) pos.reload();
};
$('#sup-restart').onclick = () => restartStation();
async function restartStation() {
  let pin; if (S.prefs.hasPin) { pin = await askPin({ title: 'Restart Station', sub: 'Manager PIN required', verify: true }); if (pin === null) return; }
  const r = await station.relaunch({ pin });
  if (!r.success) toast(r.error, 'error');
}

// ── Security pane ─────────────────────────────────────────────────────────────
function renderSecurity() {
  const p = S.prefs;
  const pc = $('#pin-state'); pc.className = 'chip ' + (p.hasPin ? 'ok' : 'warn'); pc.innerHTML = `<span class="dot"></span>${p.hasPin ? 'PIN set' : 'No PIN'}`;
  $('#pin-set').textContent = p.hasPin ? 'Change PIN' : 'Set PIN';
  show('#pin-remove', p.hasPin);
  $('#opt-locksettings').checked = !!p.lockSettings;
  $('#opt-monitor').checked = !!p.activityTrackingEnabled;
  const mc = $('#mon-state'); mc.className = 'chip ' + (p.activityTrackingEnabled ? 'info' : ''); mc.innerHTML = `<span class="dot"></span>${p.activityTrackingEnabled ? 'On' : 'Off'}`;
  show('#btn-drawer', !!p.hasPin);
}
$('#pin-set').onclick = async () => {
  let current = null;
  if (S.prefs.hasPin) { current = await askPin({ title: 'Current PIN', sub: 'Enter the PIN you use now', verify: true }); if (current === null) return; }
  const next = await askPin({ title: 'New PIN', sub: '4 to 8 digits' }); if (next === null) return;
  const again = await askPin({ title: 'Confirm new PIN', sub: 'Type it once more', check: async (v) => (v === next ? { ok: true } : { ok: false, error: 'PINs do not match' }) });
  if (again === null) return;
  const r = await station.setPin({ current, next });
  if (!r.success) return toast(r.error, 'error');
  S.prefs.hasPin = true; toast('Manager PIN saved', 'success'); renderSecurity();
};
$('#pin-remove').onclick = async () => {
  const current = await askPin({ title: 'Remove PIN', sub: 'Enter the current PIN', verify: true }); if (current === null) return;
  const r = await station.setPin({ current, next: null });
  if (!r.success) return toast(r.error, 'error');
  S.prefs.hasPin = false; S.prefs.lockSettings = false; toast('PIN removed', 'success'); renderSecurity();
};
$('#opt-locksettings').onchange = async (e) => {
  if (e.target.checked && !S.prefs.hasPin) { e.target.checked = false; return toast('Set a manager PIN first', 'warning'); }
  await savePrefs({ lockSettings: e.target.checked });
};
$('#opt-monitor').onchange = async (e) => {
  const r = await savePrefs({ activityTrackingEnabled: e.target.checked });
  if (!r.success) { e.target.checked = !e.target.checked; return; }
  renderSecurity();
  if (e.target.checked) { closeSettings(); navigate('about:blank'); S.loaded = false; route(); }
};

// ── Go ────────────────────────────────────────────────────────────────────────
boot().catch(e => { console.error(e); showError('Station could not start', String(e && e.message || e), ''); });
