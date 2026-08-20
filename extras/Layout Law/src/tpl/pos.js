/* ======================================================================
   venqore-pos — the terminal COMPOSER.
   Every pixel on screen comes from composeTerminal(). Nothing here picks a
   breakpoint, and nothing here decides what fits — it only draws what the
   law returns for the composition the operator has dialled in.
   ====================================================================== */
const $ = s => document.querySelector(s);
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c;
  if (txt != null) e.textContent = txt; return e; };
const n0 = v => v.toLocaleString('en-US');
const SW = {teal:'var(--vq-teal-300)', sky:'var(--vq-sky-400)', lime:'var(--vq-lime-400)',
  coral:'var(--vq-coral-400)', butter:'var(--vq-butter-400)', plum:'var(--vq-plum-400)'};
const clone = o => JSON.parse(JSON.stringify(o));

const DEVICES = [['Phone 390',390,745],['Phone 414',414,790],['Tablet ⇅ 768',768,950],
  ['Tablet ⇄ 1024',1024,695],['Laptop 1280',1265,570],['Laptop 1440',1425,750],
  ['FHD 1920',1905,940],['QHD 2560',2545,1290]];

const state = {
  preset: 'column',
  comp: clone(LAW_POS.presets.find(p => p.id === 'column').comp),
  w: 1905, h: 940, rail: true,
  cart: DATA.cart.map(r => ({ name:r[0], sku:r[1], qty:r[2], price:r[3] })),
  sel: -1, sheet: null, navOpen: false, rank: false, tendered: 30000,
};

/* ---- composer controls ------------------------------------------------ */
LAW_POS.presets.forEach(p => {
  const b = el('button','chip', p.name);
  b.dataset.p = p.id; b.title = p.tagline;
  b.onclick = () => { state.preset = p.id; state.comp = clone(p.comp);
                      state.sheet = null; render(); };
  $('#pbtns').appendChild(b);
});
DEVICES.forEach(([nm,w,h]) => {
  const b = el('button','chip', nm); b.dataset.w = w; b.dataset.h = h;
  b.onclick = () => { state.w=w; state.h=h; $('#w').value=w; $('#h').value=h; render(); };
  $('#dbtns').appendChild(b);
});
$('#w').oninput = e => { state.w = +e.target.value; render(); };
$('#h').oninput = e => { state.h = +e.target.value; render(); };
$('#rankbtn').onclick = () => { state.rank = !state.rank; render(); };
$('#railbtn').onclick = () => { state.rail = !state.rail; render(); };

function seg(label, value, options, labels, onPick, disabled) {
  const c = el('div','ctl');
  c.appendChild(el('div','lbl', label));
  const s = el('div','seg');
  options.forEach((o, i) => {
    const b = el('button', null, (labels && labels[i]) || String(o));
    b.setAttribute('aria-pressed', String(o === value));
    if (disabled && disabled(o)) b.disabled = true;
    b.onclick = () => { onPick(o); render(); };
    s.appendChild(b);
  });
  c.appendChild(s); return c;
}
function slider(label, value, lo, hi, step, fmt, onSet) {
  const c = el('div','ctl');
  const l = el('div','lbl', label);
  l.appendChild(el('b', null, fmt(value)));
  c.appendChild(l);
  const i = el('input'); i.type = 'range'; i.min = lo; i.max = hi; i.step = step;
  i.value = value;
  i.oninput = e => { onSet(+e.target.value); render(); };
  c.appendChild(i); return c;
}
function buildControls(T) {
  const g = $('#ctls'); g.innerHTML = '';
  const c = state.comp;
  g.appendChild(seg('Catalog', c.catalog.mode,
    ['off','left','right','top','bottom','overlay'],
    ['Off','Left','Right','Top','Bottom','Button'],
    v => { c.catalog.mode = v; if ((v==='top'||v==='bottom') && !c.catalog.size) c.catalog.size = 0; }));
  if (c.catalog.mode === 'left' || c.catalog.mode === 'right')
    g.appendChild(slider('Catalog width', c.catalog.size, .12, .55, .01,
      v => Math.round(v*100)+'%', v => c.catalog.size = v));
  if (c.catalog.mode === 'top' || c.catalog.mode === 'bottom') {
    g.appendChild(slider('Catalog height', c.catalog.size, 0, .55, .05,
      v => v ? Math.round(v*100)+'%' : 'by rows', v => c.catalog.size = v));
    if (!c.catalog.size)
      g.appendChild(seg('Strip rows', c.catalog.rows, [1,2,3], null, v => c.catalog.rows = v));
  }
  if (c.catalog.mode !== 'off')
    g.appendChild(slider('Tiles per row', c.catalog.tiles || 0, 0, 8, 1,
      v => v ? String(v) : 'auto', v => c.catalog.tiles = v || null));
  g.appendChild(slider('Cart share', c.split.cart, .30, 1, .01,
    v => Math.round(v*100)+'%', v => c.split.cart = v));
  g.appendChild(seg('Tender', c.tender, ['column','bar','sheet'],
    ['Column','Bar','Button'], v => c.tender = v));
  if (c.tender === 'column')
    g.appendChild(slider('Tender share', c.split.tender, 0, .45, .01,
      v => Math.round(v*100)+'%', v => c.split.tender = v));
  g.appendChild(seg('Floor plan', c.floor, ['off','left','overlay'],
    ['Off','Column','Button'], v => c.floor = v));
}

/* ---- cart maths ------------------------------------------------------- */
const sub = () => state.cart.reduce((a,l) => a + l.qty*l.price, 0);
const DISC = () => Math.min(1250, sub()*0.05);
const TAX  = () => (sub() - DISC()) * 0.18;
const TOTAL = () => sub() - DISC() + TAX();
const qtyOf = sku => (state.cart.find(l => l.sku === sku) || {}).qty || 0;
function addItem(p) {
  const [name, sku, , price] = p;
  const l = state.cart.find(x => x.sku === sku);
  if (l) l.qty++; else state.cart.push({ name, sku, qty:1, price });
  render();
}
function money(node, value, fontPx, avail, ccy) {
  const f = formatToFit(value, avail, fontPx, ccy || '');
  node.textContent = f.text;
  node.title = f.exact + (f.truncated ? '  (shortened to fit — exact value here)' : '');
  node.style.fontSize = fontPx + 'px';
  if (f.truncated) node.style.cursor = 'help';
  return node;
}

/* ---- pieces ----------------------------------------------------------- */
function paneHead(title, extra) {
  const h = el('div','pane-h');
  h.appendChild(el('span', null, title));
  const sp = el('span'); sp.style.flex = '1'; h.appendChild(sp);
  if (extra) h.appendChild(extra);
  return h;
}
function tile(p) {
  const [nm,sku,,price,c] = p;
  const t = el('button','tile'); t.dataset.rank = '1';
  const sw = el('div','sw'); sw.style.background = SW[c]; t.appendChild(sw);
  t.appendChild(el('div','nm', nm));
  t.appendChild(el('div','pr', n0(price)));
  const q = qtyOf(sku);
  if (q) t.appendChild(el('span','inCart', String(q)));
  t.onclick = () => addItem(p);
  return t;
}
function catalogBand(cat) {
  const g = el('div','band');
  g.style.gridTemplateColumns = 'repeat(' + cat.tiles + ',minmax(0,1fr))';
  g.style.height = cat.h + 'px';
  DATA.products.slice(0, cat.tiles * cat.rows).forEach(p => g.appendChild(tile(p)));
  return g;
}
function catalogBody(fit, per) {
  const b = el('div','pane-b');
  if (fit === 'list' || per < 2) {
    DATA.products.forEach(p => {
      const [nm,sku,stock,price,c] = p;
      const r = el('button','catrow'); r.dataset.rank = '1';
      const sw = el('div','sw'); sw.style.background = SW[c]; r.appendChild(sw);
      const box = el('div'); box.style.cssText = 'flex:1;min-width:0';
      box.appendChild(el('div','line-name', nm));
      box.appendChild(el('div','line-sub', sku + ' · ' + stock + ' in stock'));
      r.appendChild(box);
      const q = qtyOf(sku);
      if (q) r.appendChild(el('span','badge', String(q)));
      r.appendChild(el('div','num', n0(price)));
      r.onclick = () => addItem(p);
      b.appendChild(r);
    });
  } else {
    const g = el('div');
    g.style.cssText = 'display:grid;gap:12px;padding:12px;grid-template-columns:repeat('
      + per + ',minmax(0,1fr))';
    DATA.products.forEach(p => g.appendChild(tile(p)));
    b.appendChild(g);
  }
  return b;
}
function catalogPane(cat) {
  const p = el('div','pane'); p.dataset.rank = '1';
  p.appendChild(paneHead('Catalog', el('span','mono-sm', DATA.products.length + ' items')));
  p.appendChild(catalogBody(cat.fit, cat.tiles));
  return p;
}
function stepper(line) {
  const s = el('div','step'); s.dataset.rank = '1';
  const m = el('button', null, '−');
  m.onclick = e => { e.stopPropagation();
    line.qty--; if (line.qty <= 0) state.cart = state.cart.filter(x => x !== line); render(); };
  s.appendChild(m);
  s.appendChild(el('span', null, String(line.qty)));
  const pl = el('button', null, '+');
  pl.onclick = e => { e.stopPropagation(); line.qty++; render(); };
  s.appendChild(pl);
  return s;
}
function cartBody(fit, w) {
  const b = el('div','pane-b');
  if (!state.cart.length) {
    b.appendChild(el('div','empty','Scan a barcode or tap an item to start.'));
    return b;
  }
  state.cart.forEach((line, i) => {
    const wrap = el('div');
    const l = el('button','line' + (i === state.sel ? ' sel' : ''));
    l.onclick = () => { state.sel = state.sel === i ? -1 : i; render(); };
    if (fit === 'minimal') {
      const box = el('div'); box.style.cssText = 'flex:1;min-width:0';
      box.appendChild(el('div','line-name', line.name));
      box.appendChild(el('div','line-sub', line.qty + ' × ' + n0(line.price)));
      l.appendChild(box);
      l.appendChild(el('div','line-tot num', n0(line.qty*line.price)));
    } else if (fit === 'relay') {
      const box = el('div');
      box.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:7px';
      box.appendChild(el('div','line-name', line.name));
      const r2 = el('div'); r2.style.cssText = 'display:flex;align-items:center;gap:10px';
      r2.appendChild(stepper(line));
      r2.appendChild(el('div','line-rate num', n0(line.price)));
      const t = el('div','line-tot num', n0(line.qty*line.price));
      t.style.marginLeft = 'auto'; r2.appendChild(t);
      box.appendChild(r2); l.appendChild(box);
      l.style.paddingTop = '10px'; l.style.paddingBottom = '10px';
    } else {
      l.appendChild(el('div','line-name', line.name));
      l.appendChild(stepper(line));
      l.appendChild(el('div','line-rate num', n0(line.price)));
      l.appendChild(el('div','line-tot num', n0(line.qty*line.price)));
      const d = el('span','line-del','✕'); d.dataset.rank = '1';
      d.onclick = e => { e.stopPropagation();
        state.cart = state.cart.filter(x => x !== line); state.sel = -1; render(); };
      l.appendChild(d);
    }
    wrap.appendChild(l);
    if (i === state.sel) {
      const adj = el('div','line-adj');
      ['Discount','Price','Free qty','Convert','Note','Batch','Tax'].forEach(t => {
        const a = el('button','adj', t); a.dataset.rank = '2'; adj.appendChild(a); });
      wrap.appendChild(adj);
    }
    b.appendChild(wrap);
  });
  return b;
}
function partyRow(w) {
  const r = el('button','party'); r.dataset.rank = '1';
  r.appendChild(el('div','avatar','A'));
  const box = el('div'); box.style.cssText = 'flex:1;min-width:0;text-align:left';
  box.appendChild(el('div','line-name','Ahsan Traders'));
  box.appendChild(el('div','line-sub',
    w > 320 ? 'Balance PKR 18,400 · 5% default discount' : 'Bal 18,400'));
  r.appendChild(box);
  if (w > 300) r.appendChild(el('span','mono-sm','F11'));
  return r;
}
function fieldRow() {
  const r = el('div','fieldrow');
  [['Cash','Method'],['5%','Discount'],['GST 18%','Tax'],['Main','Location'],['Split','Payment']]
    .forEach(([v,k]) => {
      const c = el('button','fchip'); c.dataset.rank = '2';
      c.appendChild(el('span','fk', k)); c.appendChild(el('span','fv', v));
      r.appendChild(c);
    });
  return r;
}
/* The tender is built ONCE and used in three places — the resident column, the
   full sheet and the bar. Same controls every time, so nothing a cashier
   learned in one composition is missing from another. */
function tenderBody(fit, w, full) {
  const b = el('div','pane-b');
  const avail = Math.max(90, w - 40 - 110);
  b.appendChild(partyRow(w));
  b.appendChild(fieldRow());
  [['Subtotal', sub()], ['Discount', -DISC()], ['Tax 18%', TAX()]].forEach(([k,v]) => {
    const r = el('div','tot'); r.appendChild(el('span','k', k));
    r.appendChild(money(el('span','v num'), v, 15, avail)); b.appendChild(r);
  });
  const g = el('div','tot grand'); g.appendChild(el('span','k','Total'));
  const fs = fit === 'full' || full ? 34 : fit === 'compact' ? 26 : 22;
  g.appendChild(money(el('span','v num'), TOTAL(), fs, Math.max(90, w - 40 - 74), 'PKR'));
  b.appendChild(g);
  const fl = el('div','field');
  fl.appendChild(el('label', null, 'Amount tendered'));
  const inp = el('input'); inp.value = n0(state.tendered); inp.dataset.rank = '1';
  inp.onchange = e => { state.tendered = +e.target.value.replace(/[^\d.]/g,'') || 0; render(); };
  fl.appendChild(inp); b.appendChild(fl);
  const ch = el('div','tot'); ch.appendChild(el('span','k','Change'));
  const cv = money(el('span','v num'), state.tendered - TOTAL(), 17, avail);
  cv.style.color = state.tendered >= TOTAL() ? 'var(--vq-success)' : 'var(--vq-danger)';
  ch.appendChild(cv); b.appendChild(ch);
  if (full) {
    // The keypad belongs in the full sheet. In a resident column the tendered
    // field plus the pinned actions are enough, and a keypad only pushes the
    // things that matter into the scroll.
    const kp = el('div','keypad');
    ['1','2','3','⌫','4','5','6','C','7','8','9','00','·','0','+500','+1000'].forEach(k =>
      kp.appendChild(el('button', null, k)));
    b.appendChild(kp);
  }
  return b;
}
/* Rank-1 actions live in a PINNED footer, never in the scrolling body. This is
   the fix for the Scan bug: on a short screen Hold, Drawer and the method
   controls used to scroll away with no way back to them. */
function tenderActions(w) {
  const f = el('div','pane-f');
  const a = el('div','actions');
  const pay = el('button','cta'); pay.dataset.rank = '1';
  pay.appendChild(el('span', null, 'Complete'));
  pay.appendChild(money(el('span','num'), TOTAL(), 15, Math.max(60, w - 210)));
  pay.style.flex = '2';
  a.appendChild(pay);
  const hold = el('button','cta ghost','Hold'); hold.dataset.rank = '1'; a.appendChild(hold);
  const drw = el('button','cta ghost','Drawer'); drw.dataset.rank = '2'; a.appendChild(drw);
  f.appendChild(a); return f;
}
function tenderPane(t) {
  const p = el('div','pane'); p.dataset.rank = '1';
  p.appendChild(paneHead('Tender'));
  p.appendChild(tenderBody(t.fit, t.px));
  p.appendChild(tenderActions(t.px));
  return p;
}
const TABLES = [['T1','Free'],['T2','2 guests'],['T3','Free'],['T4','4 guests'],
  ['T5','Bill asked'],['T6','Free'],['T7','6 guests'],['T8','Free'],
  ['B1','Free'],['B2','3 guests'],['P1','Free'],['P2','Free']];
function floorBody(per) {
  const b = el('div','pane-b');
  const g = el('div');
  g.style.cssText = 'display:grid;gap:10px;padding:12px;grid-template-columns:repeat('
    + Math.max(1, per) + ',minmax(0,1fr))';
  TABLES.forEach(([t,s]) => {
    const c = el('button','tile'); c.dataset.rank = '1';
    c.style.height = per > 1 ? '96px' : '58px';
    const nm = el('div', null, t);
    nm.style.cssText = 'font-family:var(--vq-font-display);font-size:18px;font-weight:700';
    c.appendChild(nm); c.appendChild(el('div','line-sub', s));
    if (s !== 'Free') { c.style.borderColor = 'var(--vq-teal-400)';
                        c.style.background = 'var(--vq-teal-50)'; }
    g.appendChild(c);
  });
  b.appendChild(g); return b;
}
function floorPane(f) {
  const p = el('div','pane'); p.dataset.rank = '1';
  p.appendChild(paneHead('Floor', el('span','mono-sm','4 of 12 seated')));
  p.appendChild(floorBody(f.fit === 'map' ? 2 : 1));
  return p;
}

/* ---- splitters --------------------------------------------------------
   Nobody in the POS category ships these. Dynamics 365 is the only product
   with free pane geometry at all, and there it is authored in an admin tool
   and exported as XML — not dragged at the register. */
function splitter(leftKey, rightKey, T) {
  const s = el('div','split');
  s.title = 'Drag to resize — the law stops you at the floor';
  s.onpointerdown = e => {
    e.preventDefault();
    s.setPointerCapture(e.pointerId);
    s.dataset.drag = 'true';
    const x0 = e.clientX, scale = currentScale();
    const a0 = frac(leftKey), b0 = frac(rightKey);
    const pool = T.avail;
    const move = ev => {
      const d = ((ev.clientX - x0) / scale) / pool;
      setFrac(leftKey, a0 + d);
      if (rightKey) setFrac(rightKey, b0 - d);
      render(true);
    };
    const up = () => { s.removeEventListener('pointermove', move);
      s.removeEventListener('pointerup', up); delete s.dataset.drag; render(); };
    s.addEventListener('pointermove', move);
    s.addEventListener('pointerup', up);
  };
  return s;
}
const frac = k => k === 'catalog' ? state.comp.catalog.size
                : k === 'tender' ? state.comp.split.tender : state.comp.split.cart;
function setFrac(k, v) {
  if (k === 'catalog') state.comp.catalog.size = Math.max(.12, Math.min(.55, v));
  else if (k === 'tender') state.comp.split.tender = Math.max(0, Math.min(.45, v));
  else state.comp.split.cart = Math.max(.30, Math.min(1, v));
}
let _scale = 1;
const currentScale = () => _scale;

/* ---- render ----------------------------------------------------------- */
function render(skipControls) {
  const w = state.w, h = state.h;
  $('#wv').textContent = w; $('#hv').textContent = h;
  const T = composeTerminal(state.comp, w, h);
  if (!skipControls) buildControls(T);

  document.querySelectorAll('#pbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.p === state.preset)));
  document.querySelectorAll('#dbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(+b.dataset.w === w && +b.dataset.h === h)));
  $('#rankbtn').setAttribute('aria-pressed', String(state.rank));
  $('#railbtn').setAttribute('aria-pressed', String(state.rail));

  const stageW = $('.wrap').clientWidth - 2*14 - 8;
  _scale = Math.min(1, stageW / (w + 18));
  const dev = $('#device');
  dev.style.width = (w + 18) + 'px';
  dev.style.transform = 'scale(' + _scale + ')';
  const sc = $('#screen');
  sc.style.height = h + 'px';
  sc.style.setProperty('--vq-margin-now', marginAt(w) + 'px');
  sc.style.setProperty('--vq-rail-now', railAt(w) + 'px');
  $('.stage').style.height = Math.round((h + 18) * _scale) + 28 + 'px';
  sc.innerHTML = '';
  sc.dataset.rankmode = String(state.rank);

  /* --- rail + bar --- */
  const railW = state.rail ? Math.round(railAt(w)) : 0;
  if (railW > 0) {
    const rail = el('div','rail'); rail.dataset.rank = '2';
    rail.style.width = railW + 'px';
    ['⌂','▤','↻','⛁','₨','⚙'].forEach((gl,i) => {
      const b = el('button','railicon', gl); if (i===1) b.classList.add('on');
      rail.appendChild(b); });
    sc.appendChild(rail);
  }
  const main = el('div','main');
  const bar = el('div','tbar');
  const ham = el('button','iconbtn','☰'); ham.dataset.rank = '2';
  ham.title = 'The nav — present at every width, on every screen';
  ham.onclick = () => { state.navOpen = !state.navOpen; render(); };
  bar.appendChild(ham);
  bar.appendChild(el('button','iconbtn','←')).dataset.rank = '2';
  bar.appendChild(el('span','brand','VenQore'));
  const sub2 = el('span','mono-sm', LAW_POS.presets.find(p=>p.id===state.preset).name);
  sub2.style.cssText = 'opacity:.65;color:inherit'; bar.appendChild(sub2);
  const sp = el('span'); sp.style.flex = '1'; bar.appendChild(sp);
  if (w >= 720) {
    const st = el('span','status'); st.dataset.rank = '3';
    st.appendChild(el('span','dot')); st.appendChild(el('span',null,'Online'));
    bar.appendChild(st);
  }
  bar.appendChild(el('button','iconbtn','⚙')).dataset.rank = '3';
  main.appendChild(bar);

  /* --- terminal --- */
  const term = el('div','term');
  const search = el('div','searchrow'); search.dataset.rank = '1';
  const mag = el('span',null,'⌕'); mag.style.opacity = '.45'; search.appendChild(mag);
  const si = el('input');
  si.placeholder = state.comp.catalog.mode === 'off'
    ? 'Scan a barcode, or type a name or SKU' : 'Scan or search…';
  search.appendChild(si);
  if (w >= 560) search.appendChild(el('span','mono-sm','F1'));
  term.appendChild(search);

  const cat = T.catalog;
  if (cat && cat.mode === 'top') term.appendChild(catalogBand(cat));

  /* --- panes, with draggable splitters between them --- */
  const panes = el('div','panes');
  const cols = [];
  if (cat && cat.mode === 'left') cols.push(['catalog', catalogPane(cat), cat.px]);
  if (T.floor && T.floor.mode === 'left') cols.push(['floor', floorPane(T.floor), T.floor.px]);
  const cartPane = el('div','pane'); cartPane.dataset.rank = '1';
  const qty = state.cart.reduce((a,l) => a + l.qty, 0);
  cartPane.appendChild(paneHead('Cart',
    el('span','mono-sm', state.cart.length + ' lines · ' + qty + ' qty')));
  cartPane.appendChild(cartBody(T.cart.fit, T.cart.px));
  if (T.cart.underflow) { cartPane.style.overflowX = 'auto';
    cartPane.querySelector('.pane-b').style.minWidth = T.cart.minWidth + 'px'; }
  cols.push(['cart', cartPane, T.cart.px]);
  if (T.tender.mode === 'column') cols.push(['tender', tenderPane(T.tender), T.tender.px]);
  if (cat && cat.mode === 'right') cols.push(['catalog', catalogPane(cat), cat.px]);

  cols.forEach(([key, node, px], i) => {
    node.style.width = px + 'px';
    panes.appendChild(node);
    if (i < cols.length - 1) {
      const next = cols[i+1][0];
      panes.appendChild(splitter(key === 'cart' ? 'cart' : key,
                                 next === 'cart' ? 'cart' : next, T));
    }
  });
  term.appendChild(panes);
  if (cat && cat.mode === 'bottom') term.appendChild(catalogBand(cat));

  /* --- THE DOCK: a real row. Never a floating button over the panes. --- */
  if (T.dock.length) {
    const d = el('div','dock');
    d.style.height = T.dockH + 'px';
    T.dock.forEach(item => {
      if (item.id === 'tender') {
        if (item.inline) {
          const box = el('div','docktotal');
          box.appendChild(el('div','k','Total'));
          box.appendChild(money(el('div','v'), TOTAL(), 22, Math.max(90, w*0.4), 'PKR'));
          d.appendChild(box);
        }
        const b = el('button','cta dockpay'); b.dataset.rank = '1';
        b.appendChild(el('span','lab', item.label));
        if (!item.inline)
          b.appendChild(money(el('span','amt'), TOTAL(), 19, Math.max(80, w*0.42), 'PKR'));
        b.onclick = () => { state.sheet = 'tender'; render(); };
        d.appendChild(b);
      } else {
        const b = el('button','cta ghost'); b.dataset.rank = '2';
        b.style.flex = '1';
        b.appendChild(el('span', null, item.label));
        if (item.id === 'catalog')
          b.appendChild(el('span','mono-sm', DATA.products.length + ''));
        b.onclick = () => { state.sheet = item.id; render(); };
        d.appendChild(b);
      }
    });
    term.appendChild(d);
  }
  main.appendChild(term);
  sc.appendChild(main);

  /* --- overlays --- */
  const anyOverlay = state.sheet || state.navOpen;
  const scrim = el('div','scrim2'); scrim.dataset.open = String(!!anyOverlay);
  scrim.onclick = () => { state.sheet = null; state.navOpen = false; render(); };
  sc.appendChild(scrim);

  if (T.overlays.some(o => o.id === 'catalog')) {
    const sh = el('div','sheet full'); sh.dataset.open = String(state.sheet === 'catalog');
    const hd = el('div','sheet-h');
    hd.appendChild(el('span', null, 'Catalog'));
    hd.appendChild(el('span','mono-sm', qty + ' in cart')).style.marginLeft = '10px';
    const x = el('button','iconbtn','✕'); x.style.marginLeft = 'auto';
    x.onclick = () => { state.sheet = null; render(); };
    hd.appendChild(x); sh.appendChild(hd);
    const per = Math.max(2, Math.floor((w - 32 + 12) / (132 + 12)));
    sh.appendChild(catalogBody('grid', per));
    const f = el('div','sheet-f'); const a = el('div','actions');
    const done = el('button','cta','Done'); done.style.flex = '2';
    done.onclick = () => { state.sheet = null; render(); };
    a.appendChild(done);
    const tot = el('div','docktotal'); tot.appendChild(el('div','k','Total'));
    tot.appendChild(money(el('div','v'), TOTAL(), 20, Math.max(90, w*0.35), 'PKR'));
    a.insertBefore(tot, a.firstChild);
    f.appendChild(a); sh.appendChild(f);
    sc.appendChild(sh);
  }
  if (T.overlays.some(o => o.id === 'tender')) {
    const narrow = w < 620;
    const sh = el('div', 'sheet' + (narrow ? ' bottom' : ' wide'));
    sh.dataset.open = String(state.sheet === 'tender');
    const hd = el('div','sheet-h');
    hd.appendChild(el('span', null, 'Take payment'));
    const x = el('button','iconbtn','✕'); x.style.marginLeft = 'auto';
    x.onclick = () => { state.sheet = null; render(); };
    hd.appendChild(x); sh.appendChild(hd);
    const sw = narrow ? w : Math.min(560, w*0.96);
    sh.appendChild(tenderBody('full', sw, true));
    sh.appendChild(tenderActions(sw));
    sc.appendChild(sh);
  }
  if (T.overlays.some(o => o.id === 'floor')) {
    const sh = el('div','sheet full'); sh.dataset.open = String(state.sheet === 'floor');
    const hd = el('div','sheet-h'); hd.appendChild(el('span',null,'Floor'));
    const x = el('button','iconbtn','✕'); x.style.marginLeft = 'auto';
    x.onclick = () => { state.sheet = null; render(); };
    hd.appendChild(x); sh.appendChild(hd);
    sh.appendChild(floorBody(Math.max(2, Math.floor(w/200))));
    sc.appendChild(sh);
  }
  const nav = el('div','navdrawer'); nav.dataset.open = String(state.navOpen);
  nav.style.width = Math.min(264, w - 56) + 'px';
  const nh = el('div','sheet-h'); nh.appendChild(el('span','brand','VenQore'));
  const nx = el('button','iconbtn','✕'); nx.style.marginLeft = 'auto';
  nx.onclick = () => { state.navOpen = false; render(); };
  nh.appendChild(nx); nav.appendChild(nh);
  const nb = el('div','pane-b');
  ['Home','Sell','Purchase','Stock','Contacts','Money','VenSynQ','Insights','Settings']
    .forEach((t,i) => { const a = el('button','navitem', t);
      if (i===1) a.classList.add('on'); nb.appendChild(a); });
  nav.appendChild(nb); sc.appendChild(nav);

  /* --- readout --- */
  const catTxt = !cat ? 'off'
    : cat.mode === 'overlay' ? 'button (' + cat.reason + ')'
    : (cat.mode === 'top' || cat.mode === 'bottom')
      ? cat.mode + ' · ' + cat.rows + ' row' + (cat.rows>1?'s':'') + ' × ' + cat.tiles + ' tiles'
      : cat.mode + ' · ' + Math.round(cat.px) + 'px · ' + cat.fit;
  const tTxt = T.tender.mode + (T.tender.px ? ' · ' + Math.round(T.tender.px) + 'px · '
    + T.tender.fit : (T.tender.reason ? ' (' + T.tender.reason + ')' : ''));
  $('#readout').innerHTML =
    '<b>' + w + '×' + h + '</b> · content <b>' + Math.round(T.avail) + '×' + T.H
    + 'px</b> · usable after the dock <b>' + T.usableH + 'px</b> → <b>' + T.regime + '</b><br>'
    + 'catalog <b>' + catTxt + '</b> · cart <b>' + Math.round(T.cart.px) + 'px · '
    + T.cart.fit + '</b> (' + T.cartLines + ' lines) · tender <b>' + tTxt + '</b><br>'
    + 'dock: <b>' + (T.dock.map(d=>d.label).join(' · ') || 'nothing — everything is resident')
    + '</b>' + (T.dockH ? ' (' + T.dockH + 'px, a real row)' : '') + '<br>'
    + 'reachable: ' + Object.entries(T.reachable)
        .map(([k,v]) => (v ? '✓ ' : '✕ ') + k).join(' &nbsp; ');
  $('#why').innerHTML = T.notes.length
    ? T.notes.map(n => '· ' + n).join('<br>')
    : '';
  $('#why').style.display = T.notes.length ? 'block' : 'none';
  const pr = LAW_POS.presets.find(p => p.id === state.preset);
  $('#pdesc').innerHTML = '<b>' + pr.name + ' — ' + pr.tagline + '</b><br><b>For:</b> '
    + pr.for + '<br><b>Why it exists:</b> ' + pr.why;
}

/* ---- static tables ---------------------------------------------------- */
function tbl(sel, head, rows) {
  const t = $(sel); if (!t) return;
  t.innerHTML = '';
  const th = el('thead'), tr = el('tr');
  head.forEach(h => tr.appendChild(el('th', null, h)));
  th.appendChild(tr); t.appendChild(th);
  const tb = el('tbody');
  rows.forEach(r => { const x = el('tr');
    r.forEach(c => { const td = el('td');
      if (c && typeof c === 'object' && c.html != null) td.innerHTML = c.html;
      else td.textContent = c == null ? '—' : c;
      x.appendChild(td); });
    tb.appendChild(x); });
  t.appendChild(tb);
}
tbl('#ptable', ['Preset','Catalog','Cart','Tender','Built for'],
  LAW_POS.presets.map(p => [{html:'<b>'+p.name+'</b>'},
    p.comp.catalog.mode + (p.comp.catalog.size ? ' ' + Math.round(p.comp.catalog.size*100) + '%' : ''),
    Math.round(p.comp.split.cart*100) + '%',
    p.comp.tender + (p.comp.split.tender ? ' ' + Math.round(p.comp.split.tender*100) + '%' : ''),
    p.for]));
tbl('#cotable', ['Control','Options','What the law does about it'],
  LAW_POS.controls.map(c => [{html:'<b>'+c.label+'</b>'},
    {html: c.options ? c.options.map(o=>'<code>'+o+'</code>').join(' ')
                     : '<code>' + c.range[0] + '–' + c.range[1] + '</code>'}, c.note]));
const HOME = {surface:'Working surface — always visible', 'line-visible':'On every cart line',
  line:'Revealed by selecting a line', field:'Revealed by its own field', bar:'Terminal bar',
  sheet:'Sheet — one control away', drawer:'Settings drawer', auto:'No UI — automatic'};
tbl('#captable', ['Rank','Capability','Lives','Note','In the code'],
  DATA.caps.map(c => [
    {html:'<span class="tag r'+c.rank+'">'+c.rank+' '+DATA.ranks[c.rank-1].name+'</span>'},
    {html:'<b>'+c.label+'</b>'}, HOME[c.home]||c.home, c.note||'—',
    {html: c.src ? '<code>'+c.src+'</code>' : '—'}]));
tbl('#fixtable', ['What the shipped POS does today','What the law does instead'],
  DATA.fixes.map(f => [f[1], {html:'<b>'+f[2]+'</b>'}]));
tbl('#keytable', ['Key','Action','Where it works'],
  DATA.keymap.map(k => [{html:'<code>'+k[0]+'</code>'}, k[1], k[2]]));

addEventListener('resize', () => render());
render();
