/* Bundle all ten pages into one self-contained document with a hash router,
   so the whole site can be looked at from a phone without a server. */
import fs from 'node:fs';
import path from 'node:path';

const dist = '/home/claude/v6/dist';
const ORDER = ['index', 'blueprint', 'pos', 'documents', 'dashboard', 'smartcapture', 'reckoner', 'ledger', 'vensynq', 'features', 'pricing', 'about', 'contact', 'onboarding', 'register', 'signin'];

const b64 = (p) => fs.readFileSync(p).toString('base64');

/* The Artifact wrapper supplies the <head>, so this file cannot declare a
   charset of its own. Escaping every non-ASCII codepoint makes the document
   byte-identical under any encoding the host happens to pick. */
const asciiHtml = (s) => s.replace(/[^\x00-\x7F]/g, c => '&#' + c.codePointAt(0) + ';');
const asciiJs   = (s) => s.replace(/[^\x00-\x7F]/g, c => {
  const cp = c.codePointAt(0);
  return cp > 0xFFFF
    ? '\\u' + (0xD800 + ((cp - 0x10000) >> 10)).toString(16).padStart(4, '0') +
      '\\u' + (0xDC00 + ((cp - 0x10000) & 0x3FF)).toString(16).padStart(4, '0')
    : '\\u' + cp.toString(16).padStart(4, '0');
});
const jstr = (v) => asciiJs(JSON.stringify(v));

/* Inline the faces and the mark. */
let css = fs.readFileSync(path.join(dist, 'assets/venqore.css'), 'utf8');
css = css.replace(/url\("fonts\/([^"]+)"\)/g, (_, f) =>
  `url("data:font/woff2;base64,${b64(path.join(dist, 'assets/fonts', f))}")`);
const logo = `data:image/png;base64,${b64(path.join(dist, 'assets/logo.png'))}`;

const js = fs.readFileSync(path.join(dist, 'assets/venqore.js'), 'utf8') + '\n' +
           fs.readFileSync(path.join(dist, 'assets/demos.js'), 'utf8');
const fluid = fs.readFileSync(path.join(dist, 'assets/fluid.js'), 'utf8');

const pages = {};
for (const name of ORDER) {
  let src = fs.readFileSync(path.join(dist, `${name}.html`), 'utf8');
  const bodyM = src.match(/<body([^>]*)>([\s\S]*)<\/body>/);
  let body = bodyM[2];
  const bodyClass = (bodyM[1].match(/class="([^"]*)"/) || [, ''])[1];

  // Pull out the page's own inline script (onboarding) to run after the swap.
  const inline = [];
  body = body.replace(/<script>([\s\S]*?)<\/script>/g, (_, code) => { inline.push(code); return ''; });
  // Strip the asset <script src> tags; they are bundled.
  body = body.replace(/<script src="[^"]*"[^>]*><\/script>/g, '');
  body = body.replace(/src="assets\/logo\.png"/g, `src="${logo}"`);
  // Cross-page links become routes.
  body = body.replace(/href="([a-z]+)\.html((?:#[\w-]+)?)"/g, (m, p, h) =>
    ORDER.includes(p) ? `href="#/${p}${h.replace('#', '~')}"` : m);
  const title = (src.match(/<title>([^<]*)<\/title>/) || [, 'VenQore'])[1];
  pages[name] = { body, bodyClass, title, inline, fluid: /assets\/fluid\.js/.test(src) };
}

const doc = `<title>VenQore Public Pages</title>
<style>${css}
/* Router chrome only. Nothing here exists on the real pages. */
#vq-note{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:1000;
 display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px;
 background:var(--vq-glass);backdrop-filter:blur(18px) saturate(160%);
 border:1px solid var(--vq-line);box-shadow:var(--vq-elev-3);max-width:calc(100vw - 32px)}
#vq-note b{font-size:13px;font-weight:500;color:var(--vq-text-2);white-space:nowrap;word-spacing:normal}
#vq-note select{height:34px;border-radius:999px;border:1px solid var(--vq-line);
 background:var(--vq-surface);color:var(--vq-text);font-size:13px;padding:0 30px 0 12px;
 font-family:var(--vq-font-sans);appearance:none;word-spacing:normal;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236B7A73' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
 background-repeat:no-repeat;background-position:right 11px center}
@media(max-width:520px){#vq-note b{display:none}}
</style>
${ORDER.map(n => `<template data-route="${n}">${asciiHtml(pages[n].body)}</template>`).join('\n')}
<div id="vq-app"></div>
<div id="vq-note">
  <b>Preview · 16 pages</b>
  <select id="vq-jump" aria-label="Jump to a page">
    ${ORDER.map(n => `<option value="${n}">${({
      index: 'Landing', blueprint: 'Blueprint', pos: 'The register', documents: 'Documents',
      dashboard: 'Dashboard', smartcapture: 'SmartCapture', reckoner: 'The Reckoner',
      ledger: 'Core Ledger', vensynq: 'VenSynQ', features: 'Features',
      pricing: 'Pricing', about: 'About', contact: 'Contact', onboarding: 'Onboarding flow',
      register: 'Register', signin: 'Sign in' })[n]}</option>`).join('')}
  </select>
</div>
<script>
(function(){
  var PAGES = ${jstr(Object.fromEntries(ORDER.map(n => [n, { c: pages[n].bodyClass, t: pages[n].title, f: pages[n].fluid }])))};
  var INLINE = ${jstr(Object.fromEntries(ORDER.map(n => [n, pages[n].inline.join('\n')])))};
  var CORE = ${jstr(js)};
  var FLUID = ${jstr(fluid)};
  var app = document.getElementById('vq-app'), jump = document.getElementById('vq-jump');

  /* A theme the host already stamped is the viewer's explicit choice; it wins
     over anything this page remembers. */
  try { var r = document.documentElement;
        var t = r.getAttribute('data-theme') || localStorage.getItem('vq-theme')
                || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        r.setAttribute('data-theme', t); r.classList.toggle('dark', t === 'dark'); } catch(e){}

  function route(){
    var h = (location.hash || '#/index').slice(2);
    var anchor = '';
    var i = h.indexOf('~');
    if (i >= 0) { anchor = h.slice(i + 1); h = h.slice(0, i); }
    if (!PAGES[h]) h = 'index';
    var tpl = document.querySelector('template[data-route="' + h + '"]');
    app.innerHTML = tpl.innerHTML;
    document.body.className = PAGES[h].c || '';
    document.title = PAGES[h].t;
    jump.value = h;

    // Re-run page behaviour against the fresh DOM. Every listener the core
    // attaches is on an element that was just created, so nothing doubles up.
    try { new Function(CORE)(); } catch(e) { console.error(e); }
    if (INLINE[h]) { try { new Function(INLINE[h])(); } catch(e) { console.error(e); } }
    if (PAGES[h].f) { try { new Function(FLUID)(); } catch(e) {} }

    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', route);
  jump.addEventListener('change', function(){ location.hash = '#/' + jump.value; });
  route();
})();
</script>`;

const out = '/home/claude/v6/venqore-v6-preview.html';
fs.writeFileSync(out, asciiHtml(doc), 'ascii');
console.log(`✓ ${out}  ${(doc.length / 1024).toFixed(0)} KB`);
