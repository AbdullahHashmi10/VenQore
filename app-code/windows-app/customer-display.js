'use strict';
/* Customer-facing second screen. Everything is set with textContent — the state comes from the POS page. */
const root = document.getElementById('root');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const money = (cur, v) => (v === '' || v === undefined || v === null ? '' : `${cur ? cur + ' ' : ''}${v}`);
let lastCount = 0;
let clockTimer = null;

function logo(s) { const i = el('img'); i.src = s.logo || 'assets/icon.svg'; i.alt = ''; return i; }

function idle(s) {
  const w = el('div', 'idle'); const c = el('div');
  c.append(logo(s), el('h1', 'display', s.storeName ? `Welcome to ${s.storeName}` : 'Welcome'), el('p', '', s.message || 'Your items will appear here.'));
  const clock = el('div', 'clock'); c.append(clock); w.append(c);
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); clearInterval(clockTimer); clockTimer = setInterval(tick, 10_000);
  return w;
}

function paid(s) {
  const w = el('div', 'paid'); const c = el('div');
  const b = el('div', 'badge'); b.innerHTML = '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  c.append(b, el('h1', 'display', 'Thank you!'));
  if (s.change && Number(String(s.change).replace(/[^\d.-]/g, '')) > 0) { c.append(el('p', 'eyebrow', 'Your change'), el('div', 'change', money(s.currency, s.change))); }
  if (s.message) c.append(el('p', 'muted', s.message));
  w.append(c);
  return w;
}

function cart(s) {
  const w = el('div', 'wrap');
  const panel = el('section', 'panel');
  const head = el('div', 'head'); head.append(logo(s), el('h1', 'display', s.storeName || 'Your order'));
  const list = el('div', 'items');
  s.items.slice(-9).forEach((it, i, arr) => {
    const row = el('div', 'item' + (i === arr.length - 1 && s.items.length > lastCount ? ' new' : ''));
    row.append(el('span', 'n', it.name), el('span', 't num', money(s.currency, it.total)), el('span', 'q num', `${it.qty} × ${money(s.currency, it.price)}${it.note ? ' · ' + it.note : ''}`));
    list.append(row);
  });
  panel.append(head, list);
  const sum = el('aside', 'sum');
  const rows = el('div', 'rows');
  const add = (label, v, neg, plain) => { if (v === '' || v === undefined) return; const r = el('div'); r.append(el('span', '', label), el('span', 'num', (neg ? '− ' : '') + (plain ? v : money(s.currency, v)))); rows.append(r); };
  add('Items', String(s.items.length), false, true); add('Subtotal', s.subtotal); add('Discount', s.discount, true); add('Tax', s.tax);
  const total = el('div', 'total'); total.append(el('div', 'eyebrow', 'Total to pay'), el('div', 'big', money(s.currency, s.total)));
  sum.append(rows, total);
  if (s.message) sum.append(el('p', 'muted', s.message));
  w.append(panel, sum);
  lastCount = s.items.length;
  return w;
}

function render(s) {
  clearInterval(clockTimer);
  root.replaceChildren(s.mode === 'paid' ? paid(s) : s.mode === 'idle' || !s.items.length ? idle(s) : cart(s));
}

render({ mode: 'idle', items: [] });
window.customerDisplay.onUpdate(render);
