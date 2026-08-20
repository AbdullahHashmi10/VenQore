/* ======================================================================
   venqore-document — one editor, thirteen types, composed by the user.

   v1 chose an arrangement and moved the breakpoints around until it looked
   right. v2 does what the register now does: the arrangement is a
   COMPOSITION the person editing chooses, and the law's only job is to stop
   it breaking. Two numbers in here are derived rather than picked, and both
   came out of your review:

     · the docked summary appears where the summary is too TALL to hold
       still — which is why it lands on Pro first, exactly where you saw it.
     · the nav holds the rail wherever expanding it would cost THIS
       composition a line column.
   ====================================================================== */
const $ = s => document.querySelector(s);
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c;
  if (txt != null) e.textContent = txt; return e; };
const n2 = v => v.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const LINES = [
  ['Sufi Cooking Oil 5L', 'SUF-5L', 12, 'Ctn', 4850, 5, 18],
  ['Tapal Danedar 950g', 'TPL-950', 6, 'Ctn', 1650, 0, 18],
  ['Head & Shoulders 360ml', 'HNS-360', 24, 'Pc', 1290, 7.5, 18],
  ['Nestle Milk Pak 1L', 'NML-1L', 48, 'Pc', 285, 0, 0],
  ['Surf Excel 1kg', 'SRF-1K', 20, 'Pc', 640, 2, 18],
  ['Colgate MaxFresh 150g', 'CLG-150', 36, 'Pc', 410, 0, 18],
  ['Dettol Soap 100g', 'DTL-100', 60, 'Pc', 175, 0, 18],
  ['Lays Masala 62g', 'LAY-62', 144, 'Pc', 120, 3, 18],
];

const state = { type:'sales_invoice', w:1905, h:940, preset:'panel',
                comp: presetDocument('panel'), breakdown:false, openLine:null,
                scrolled:false, split:null };

/* ---- controls -------------------------------------------------------- */
DATA.types.forEach(t => {
  const b = el('button','chip', t.name); b.dataset.t = t.id;
  b.onclick = () => { state.type = t.id; render(); };
  $('#tbtns').appendChild(b);
});
DATA.presets.forEach(p => {
  const b = el('button','chip', p.name); b.dataset.p = p.id; b.title = p.for;
  b.onclick = () => { state.preset = p.id; state.comp = presetDocument(p.id); render(); };
  $('#pbtns').appendChild(b);
});
const DEVICES = [['Phone 390',390,745],['Tablet ⇅ 768',768,950],['Tablet ⇄ 1024',1024,695],
  ['Laptop 1280',1265,570],['Laptop 1440',1425,750],['FHD 1920',1905,940],['QHD 2560',2545,1290]];
DEVICES.forEach(([nm,w,h]) => {
  const b = el('button','chip', nm); b.dataset.w = w;
  b.onclick = () => { state.w=w; state.h=h; $('#w').value=w; $('#h').value=h; render(); };
  $('#dbtns').appendChild(b);
});
$('#w').oninput = e => { state.w = +e.target.value;
  const d = DEVICES.find(x => x[1] === state.w); if (d) { state.h = d[2]; $('#h').value = d[2]; }
  render(); };
$('#h').oninput = e => { state.h = +e.target.value; render(); };

/* ---- the composer ----------------------------------------------------- */
function seg(ctl) {
  const box = el('div');
  box.appendChild(el('label','ctl-l', ctl.label));
  const s = el('div','seg');
  ctl.options.forEach(([v, lbl]) => {
    const b = el('button', null, lbl);
    b.onclick = () => { state.comp[ctl.id] = v; state.preset = null; render(); };
    b.dataset.v = v; b.dataset.for = ctl.id;
    s.appendChild(b);
  });
  box.appendChild(s);
  if (ctl.note) box.appendChild(el('div','ctl-n', ctl.note));
  return box;
}
function slider(ctl) {
  const box = el('div');
  const l = el('label','ctl-l', ctl.label);
  const out = el('span'); out.style.cssText = 'float:right;font-weight:700;color:var(--vq-teal-700)';
  l.appendChild(out); box.appendChild(l);
  const i = el('input'); i.type = 'range'; i.min = ctl.min; i.max = ctl.max; i.step = ctl.step;
  i.style.width = '100%'; i.dataset.for = ctl.id;
  i.oninput = e => { state.comp[ctl.id] = +e.target.value; state.preset = null; render(); };
  box.appendChild(i);
  if (ctl.note) box.appendChild(el('div','ctl-n', ctl.note));
  box._out = out; box._i = i;
  return box;
}
const CTLBOX = {};
DATA.controls.forEach(c => {
  const b = c.kind === 'slider' ? slider(c) : seg(c);
  CTLBOX[c.id] = b; $('#ctls').appendChild(b);
});

/* ---- field vocabulary ------------------------------------------------- */
const LABEL = (t, key, fallback) => (t.labels && t.labels[key]) || fallback;
const FIELDS = {
  party:    t => [LABEL(t,'party','Party'), 'party', true],
  docno:    t => [LABEL(t,'docno','Document #'), 'text', false],
  partyref: t => ['Their reference', 'text', false],
  date:     t => ['Document date', 'date', true],
  due:      t => ['Due date', 'date', false],
  terms:    t => ['Payment terms', 'select', false],
  method:   t => ['Settlement method', 'select', false],
  account:  t => ['Money account', 'select', false],
  location: t => ['Location', 'select', false],
  project:  t => ['Project / cost centre', 'select', false],
  currency: t => ['Currency', 'select', false],
  fx:       t => ['Exchange rate', 'num', false],
};
const EXTRA_FIELDS = {
  valid_until:  ['Valid until', 'date', true],
  expected_date:['Expected delivery', 'date', false],
  frequency:    ['Billing frequency', 'select', false],
  next_run:     ['Next run date', 'date', false],
  active_paused:['Status', 'select', false],
  goods_status: ['Goods status', 'select', false],
  reason:       ['Reason', 'text', true],
  category:     ['Expense category', 'select', true],
  attachment:   ['Attachment', 'file', false],
  location_pair:['From → To location', 'select', true],
  source_doc:   ['Against document', 'party', true],
  doc_status:   ['Status', 'select', false],
  tax_inclusive_flag: ['Prices include tax', 'toggle', false],
  description:  ['Description', 'text', true],
  tax_amount:   ['Tax amount', 'num', false],
};
const VALUES = {party:'Ahsan Traders', text:'—', date:'20 Aug 2026', select:'—', num:'0.00',
                file:'Attach a file', toggle:'No'};

function field(label, kind, required, value, hint) {
  const f = el('div','f');
  const l = el('label', null, label);
  if (required) l.appendChild(el('span','req','*'));
  f.appendChild(l);
  const c = el('div','ctl');
  if (kind === 'party') {
    c.classList.add('sel');
    const av = el('span','avatar', (value || 'A')[0]);
    av.style.cssText = 'width:22px;height:22px;border-radius:6px;font-size:11px';
    c.appendChild(av); c.appendChild(el('span', null, value || VALUES.party));
  } else {
    c.appendChild(el('span', kind === 'select' && !value ? 'ph' : null, value || VALUES[kind]));
    if (kind === 'select' || kind === 'date') {
      const ch = el('span', null, kind === 'select' ? '⌄' : '▤');
      ch.style.cssText = 'margin-left:auto;opacity:.5'; c.appendChild(ch);
    }
  }
  f.appendChild(c);
  if (hint) f.appendChild(el('div','hint', hint));
  return f;
}

/* ---- money ------------------------------------------------------------ */
/* Money is stored to the paisa, so it is rounded to the paisa BEFORE the
   number ladder sees it. Otherwise 0.18 × a subtotal arrives carrying three
   binary-float decimals and the ladder faithfully prints its richest rung —
   PKR 193,746.5380 — which is not wrong, it is just not money. */
const r2 = v => Math.round(v * 100) / 100;
function totals(T) {
  const on = c => T.on.includes(c);
  const sub = r2(LINES.reduce((a, [,,q,,r,d]) => a + q * r * (1 - d/100), 0));
  const tax = on('tax_inclusive_flag') ? 0 : r2(sub * 0.18);
  const ship = T.side === 'sell' ? 2500 : 0, round = -0.31;
  const total = r2(sub + tax + ship + round);
  return {sub, tax, ship, round, total, settled: T.side === 'sell' ? 40000 : 0};
}

/* ---- zones ------------------------------------------------------------ */
const COLW = {idx:'34px', item:'minmax(140px,1fr)', qty:'70px', free:'62px', uom:'78px',
  rate:'92px', disc:'86px', tax:'70px', total:'104px', del:'40px'};
const COLLBL = {idx:'#', item:'Item', qty:'Qty', free:'Free', uom:'Unit', rate:'Rate',
  disc:'Disc', tax:'Tax %', total:'Amount', del:''};
const NUMC = ['qty','rate','disc','tax','total','idx','free'];

function detailsZone(D, T, dens, on) {
  if (D.details.mode === 'collapsed') {
    const t = totals(T);
    const s = el('button','strip');
    s.appendChild(el('span','chev','▸'));
    const box = el('div'); box.style.cssText = 'min-width:0;display:flex;flex-direction:column;gap:2px';
    box.appendChild(el('div','who', T.side === 'buy' ? 'Sufi Traders' : 'Ahsan Traders'));
    box.appendChild(el('div','meta', T.prefix + '-000148 · 20 Aug 2026 · Net 30'));
    s.appendChild(box);
    const a = el('span','amt');
    const f = formatToFit(t.total, Math.max(90, D.avail * .28), 15, 'PKR');
    a.textContent = f.text; a.title = f.exact;
    s.appendChild(a);
    s.onclick = () => { state.comp.details = 'open'; state.preset = null; render(); };
    s.title = 'Open the customer and details block';
    return s;
  }
  const hz = el('div','zone');
  const hh = el('div','zone-h');
  hh.appendChild(el('span', null, 'Details'));
  const tg = el('button','togg','Collapse ▴');
  tg.onclick = () => { state.comp.details = 'collapsed'; state.preset = null; render(); };
  tg.title = 'Collapse to one line and give the height to the items';
  hh.appendChild(tg);
  hz.appendChild(hh);

  const hdr = el('div','hdr');
  const cols = D.details.twoCol ? (D.avail > 1100 ? 4 : 2) : 1;
  hdr.style.gridTemplateColumns = 'repeat(' + cols + ',minmax(0,1fr))';
  const wanted = dens.header.filter(k => {
    if (T.off.includes(k)) return false;
    if (k === 'location' && !on('location')) return false;
    if (k === 'docno' && T.off.includes('docno_manual')) return false;
    return true;
  });
  wanted.forEach(k => {
    const [lbl, kind, req] = FIELDS[k](T);
    let val = null, hint = null;
    if (k === 'party') val = T.side === 'buy' ? 'Sufi Traders (Supplier)' : 'Ahsan Traders';
    if (k === 'docno') val = T.prefix + '-000148';
    if (k === 'method') val = T.id === 'expense' ? 'Bank' : 'Credit';
    if (k === 'terms') { val = 'Net 30'; hint = 'writes the due date — one control, not two'; }
    if (k === 'due') val = '19 Sep 2026';
    if (k === 'account') val = T.side === 'buy' ? 'Meezan · Current' : 'Cash in hand';
    if (k === 'location') val = 'Main warehouse';
    if (k === 'project') val = 'Retail · Karachi';
    if (k === 'partyref') val = 'SI-9921';
    if (k === 'currency') val = 'PKR';
    if (k === 'fx') val = '1.0000';
    hdr.appendChild(field(lbl, kind, req, val, hint));
  });
  Object.keys(EXTRA_FIELDS).forEach(k => {
    if (!on(k)) return;
    const [lbl, kind, req] = EXTRA_FIELDS[k];
    let hint = null;
    if (k === 'valid_until') hint = 'the defining field of a quote — it had no input at all before';
    if (k === 'expected_date') hint = 'accepted by the server, never rendered before';
    hdr.appendChild(field(lbl, kind, req, null, hint));
  });
  const nf = field('Notes', 'text', false, '—',
    'resident on every type — it was in six payloads with no input anywhere');
  nf.style.gridColumn = cols > 1 ? 'span ' + Math.min(2, cols) : 'auto';
  hdr.appendChild(nf);
  hz.appendChild(hdr);
  return hz;
}

/* The tap-to-adjust pattern from the register, brought here because you
   asked for it: a line is a summary until you touch it, then it opens its
   own controls in place. No modal, no separate edit screen. */
function adjustRow(i, line, cols) {
  const [nm, sku, qty, uom, rate, disc, tax] = line;
  const a = el('div','adjust');
  const f = (k, node) => { const b = el('div','adjfield');
    b.appendChild(el('div','k', k)); b.appendChild(node); a.appendChild(b); return b; };
  const st = el('div','stepper');
  st.appendChild(el('button', null, '−'));
  st.appendChild(el('div','n', String(qty)));
  st.appendChild(el('button', null, '+'));
  f('Quantity', st);
  f('Rate', el('div','adjbox', n2(rate)));
  if (cols.includes('disc')) f('Discount', el('div','adjbox', disc + '%'));
  if (cols.includes('uom'))  f('Unit', el('div','adjbox', uom));
  if (cols.includes('tax'))  f('Tax', el('div','adjbox', tax + '%'));
  if (cols.includes('free')) f('Free', el('div','adjbox', '0'));
  const rm = el('button','rm','Remove line');
  rm.onclick = e => { e.stopPropagation(); };
  f(' ', rm);
  return a;
}

function linesZone(D, T, cols) {
  const z = el('div','zone'); z.style.minWidth = '0';
  const h = el('div','zone-h');
  h.appendChild(el('span', null, 'Items'));
  const sp = el('span'); sp.style.flex = '1'; h.appendChild(sp);
  h.appendChild(el('span','mono-sm', LINES.length + ' lines · ' + D.lines.fit));
  z.appendChild(h);

  if (D.lines.fit === 'cards') {
    LINES.forEach((line, i) => {
      const [nm, sku, qty, uom, rate, disc] = line;
      const c = el('div','linecard' + (state.openLine === i ? ' open' : ''));
      const top = el('div','top');
      top.appendChild(el('span','nm', nm));
      const v = el('span','mini');
      const vv = el('span','v num', n2(qty * rate * (1 - disc/100)));
      v.appendChild(vv); top.appendChild(v);
      c.appendChild(top);
      const g = el('div','grid');
      const add = (k, val) => { const m = el('div','mini');
        m.appendChild(el('div','k', k)); m.appendChild(el('div','v', val)); g.appendChild(m); };
      add('Qty', String(qty)); add('Rate', n2(rate));
      if (cols.includes('disc')) add('Disc', disc + '%');
      if (cols.includes('uom')) add('Unit', uom);
      c.appendChild(g);
      c.onclick = () => { state.openLine = state.openLine === i ? null : i; render(); };
      z.appendChild(c);
      if (state.openLine === i) z.appendChild(adjustRow(i, line, cols));
    });
  } else {
    const wrap = el('div'); wrap.style.cssText = 'overflow-x:auto';
    const t = el('table','lines-tbl'); t.style.tableLayout = 'fixed';
    const cg = el('colgroup');
    cols.forEach(c => { const col = el('col'); col.style.width = COLW[c]; cg.appendChild(col); });
    t.appendChild(cg);
    const th = el('thead'), tr = el('tr');
    cols.forEach(c => tr.appendChild(el('th', NUMC.includes(c) ? 'n' : null, COLLBL[c])));
    th.appendChild(tr); t.appendChild(th);
    const tb = el('tbody');
    LINES.forEach((line, i) => {
      const [nm, sku, qty, uom, rate, disc, tax] = line;
      const r = el('tr');
      cols.forEach(c => {
        const td = el('td', NUMC.includes(c) ? 'n' : null);
        let node;
        if (c === 'idx') node = el('span','cell n', String(i + 1));
        else if (c === 'item') { node = el('span','cell name', nm); node.title = nm + ' · ' + sku; }
        else if (c === 'qty') node = el('button','cell n', String(qty));
        else if (c === 'free') node = el('button','cell n', '0');
        else if (c === 'uom') node = el('button','cell', uom);
        else if (c === 'rate') node = el('button','cell n', n2(rate));
        else if (c === 'disc') node = el('button','cell n', disc + '%');
        else if (c === 'tax') node = el('button','cell n', tax + '%');
        else if (c === 'total') node = el('span','cell n', n2(qty * rate * (1 - disc/100)));
        else { node = el('button','cell n','✕'); node.style.color = 'var(--vq-ink-400)'; }
        td.appendChild(node); r.appendChild(td);
      });
      tb.appendChild(r);
    });
    t.appendChild(tb); wrap.appendChild(t); z.appendChild(wrap);
  }
  const add = el('button','addline');
  add.appendChild(el('span', null, '+'));
  add.appendChild(el('span', null, 'Add a line'));
  const k = el('span','mono-sm','Alt+Q'); k.style.marginLeft = 'auto'; add.appendChild(k);
  z.appendChild(add);
  return z;
}

function summaryZone(D, T, on) {
  const t = totals(T);
  const z = el('div','zone');
  const h = el('div','zone-h');
  h.appendChild(el('span', null, 'Summary'));
  if (D.summary.pin === 'sticky') {
    const p = el('span','mono-sm','pinned'); p.style.marginLeft = 'auto';
    p.title = 'The whole column fits on this screen, so it holds still while the items scroll.';
    h.appendChild(p);
  }
  z.appendChild(h);
  const wpx = D.summary.mode === 'right' ? D.summary.px : D.avail;
  const row = (k, v, cls) => {
    const r = el('div','sum-row' + (cls ? ' ' + cls : ''));
    r.appendChild(el('span','k', k));
    const val = el('span','v num');
    const f = formatToFit(v, Math.max(80, wpx - 150), cls === 'tot' ? 22 : 13,
                          cls === 'tot' ? 'PKR' : '');
    val.textContent = f.text; val.title = f.exact;
    if (cls === 'tot') val.style.fontSize = '22px';
    r.appendChild(val); z.appendChild(r);
  };
  /* EXACTLY one row per key in the density's summary list — never an extra.
     The law measures this column's height from that list, so an extra row
     painted here is a column the law thinks fits and does not. */
  const dens = DATA.density.find(d => d.id === D.density);
  const ROWS = {
    subtotal:      () => ['Subtotal', t.sub],
    item_disc:     () => ['Item discounts', -1840],
    doc_disc:      () => ['Document discount', -900],
    tax:           () => ['Tax 18%', t.tax],
    tax_breakdown: () => ['Tax · GST 17% + further 1%', t.tax],
    shipping:      () => ['Delivery', t.ship],
    extra:         () => ['Other charges', 0],
    roundoff:      () => ['Round off', t.round],
    total:         () => [LABEL(T,'total','Total'), t.total, 'tot'],
    settled:       () => [LABEL(T,'settled','Amount settled'), t.settled],
    balance:       () => ['Balance', r2(t.total - t.settled), 'bal'],
  };
  dens.summary.forEach(k => { const r = (ROWS[k] || (() => [k, 0]))(); row(r[0], r[1], r[2]); });

  /* THE RANK LAW, on one row. Rank 1 (the primary) always has the surface;
     rank 2 gets it only while there is room, and everything that does not fit
     goes into the overflow rather than off the edge of the panel. */
  const a = el('div','actions');
  const pri = el('button','btn pri', LABEL(T,'save','Complete sale'));
  pri.style.minWidth = '0';
  a.appendChild(pri);
  const secondary = [];
  if (on('print')) secondary.push('Print');
  if (on('convert')) secondary.push('Convert');
  if (on('receive')) secondary.push('Receive');
  const bw = s2 => Math.round(s2.length * 7.6) + 34;
  let room = wpx - 28 - Math.max(120, bw(LABEL(T,'save','Complete sale'))) - 8 - 44;
  const shown = [];
  for (const s2 of secondary) { if (room - bw(s2) - 8 < 0) break;
                                room -= bw(s2) + 8; shown.push(s2); }
  shown.forEach(s2 => a.appendChild(el('button','btn', s2)));
  const more = el('button','btn','⋯');
  more.title = shown.length < secondary.length
    ? secondary.slice(shown.length).join(' · ') + ' — and everything else this type can do'
    : 'Everything else this type can do';
  a.appendChild(more);
  z.appendChild(a);
  return z;
}

/* THE DOCK — bottom-right, exactly as you asked, and a reserved row rather
   than a float: the scroller already carries `reserve` px of bottom padding,
   so the last line can always be scrolled clear of it. */
function dockBar(D, T) {
  const t = totals(T);
  const d = el('div','dockbar');
  // The bar's own width is known before it renders, so the number is fitted to
  // the room that is actually left rather than to a guess — no ellipsis on a
  // total, ever. The exact value stays one hover away.
  const label = LABEL(T,'save','Complete sale');
  const btnW = Math.round(label.length * 7.6) + 34;
  const showBd = D.avail > 560;
  const numW = Math.max(86, D.avail - 28 - 12 - btnW - (showBd ? 12 + 116 : 0));
  const box = el('div'); box.style.minWidth = '0';
  box.appendChild(el('div','k', LABEL(T,'total','Total')));
  const v = el('div','v');
  // The ladder is given 12% of headroom here. The engine's advance widths are
  // Space Grotesk's; if the webfont has not arrived yet the fallback is wider,
  // and a total that ellipsises is never acceptable — better one rung leaner
  // for a moment than "PKR 193,746…" on a register.
  const f = formatToFit(t.total, numW * 0.88, 20, 'PKR');
  v.textContent = f.text; v.title = f.exact;
  box.appendChild(v);
  if (t.settled) {
    const bal = el('div','bal');
    const bf = formatToFit(r2(t.total - t.settled), (numW - 52) * 0.88, 11, '');
    bal.textContent = 'Balance ' + bf.text; bal.title = bf.exact;
    box.appendChild(bal);
  }
  d.appendChild(box);
  if (showBd) {
    const g = el('button','btn ghost','Breakdown');
    g.onclick = () => { state.breakdown = !state.breakdown; render(); };
    d.appendChild(g);
  }
  d.appendChild(el('button','btn', label));
  return d;
}

/* ---- the summary splitter -------------------------------------------- */
function summarySplitter(D) {
  const bar = el('div','vsplit');
  bar.setAttribute('role','separator');
  bar.setAttribute('tabindex','0');
  bar.setAttribute('aria-orientation','vertical');
  bar.setAttribute('aria-label','Resize the summary');
  bar.setAttribute('aria-valuemin', 12);
  bar.setAttribute('aria-valuemax', 55);
  bar.setAttribute('aria-valuenow', Math.round(state.comp.split * 100));
  bar.title = 'Drag to resize · double-click restores the preset';
  const inner = D.avail - 24;
  const begin = ev => {
    ev.preventDefault();
    const s = state.scale || 1, x0 = ev.clientX, f0 = state.comp.split;
    state.split = true; bar.classList.add('dragging');
    const move = e => {
      const dx = (e.clientX - x0) / s;
      state.comp.split = clamp(f0 - dx / inner, .12, .55);
      state.preset = null; render();
      const nb = document.querySelector('.vsplit'); if (nb) nb.classList.add('dragging');
    };
    const up = () => { removeEventListener('pointermove', move); state.split = false; render(); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up, {once:true});
  };
  bar.onpointerdown = begin;
  bar.ondblclick = () => { if (state.preset)
    state.comp.split = presetDocument(state.preset).split; render(); };
  bar.onkeydown = e => {
    let f = state.comp.split, used = true;
    if (e.key === 'ArrowLeft')       f += .02;
    else if (e.key === 'ArrowRight') f -= .02;
    else if (e.key === 'Home')       f = .55;
    else if (e.key === 'End')        f = .12;
    else used = false;
    if (!used) return;
    e.preventDefault();
    state.comp.split = clamp(f, .12, .55); state.preset = null; render();
    const nb = document.querySelector('.vsplit'); if (nb) nb.focus();
  };
  return bar;
}

/* ---- render ---------------------------------------------------------- */
function render() {
  const w = state.w, h = state.h;
  $('#wv').textContent = w; $('#hv').textContent = h;
  const T = DATA.types.find(t => t.id === state.type);
  const D = composeDocument(state.comp, w, h);
  const on = c => T.on.includes(c);
  const dens = DATA.density.find(d => d.id === D.density);

  document.querySelectorAll('#tbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.t === state.type)));
  document.querySelectorAll('#pbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.p === state.preset)));
  document.querySelectorAll('#dbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(+b.dataset.w === w)));
  document.querySelectorAll('.seg button[data-for]').forEach(b => {
    b.setAttribute('aria-pressed', String(state.comp[b.dataset.for] === b.dataset.v));
    if (b.dataset.for === 'density') {
      const order = DATA.density.map(d => d.id);
      const blocked = order.indexOf(b.dataset.v) > order.indexOf(D.capped ? D.density : b.dataset.v)
        && order.indexOf(b.dataset.v) > order.indexOf(D.density) && D.capped;
      b.disabled = false;
      b.style.opacity = order.indexOf(b.dataset.v) > order.indexOf(D.density) &&
        state.comp.density === b.dataset.v ? '.5' : '';
    }
  });
  if (CTLBOX.split) { CTLBOX.split._i.value = state.comp.split;
    CTLBOX.split._out.textContent = Math.round(state.comp.split * 100) + '%';
    CTLBOX.split._i.disabled = D.summary.mode !== 'right'; }

  const stageW = $('.wrap').clientWidth - 2 * 14 - 8;
  const scale = Math.min(1, stageW / (w + 18));
  state.scale = scale;
  const dev = $('#device');
  dev.style.width = (w + 18) + 'px';
  dev.style.transform = 'scale(' + scale + ')';
  const sc = $('#screen');
  sc.style.height = h + 'px';
  sc.style.setProperty('--vq-margin-now', marginAt(w) + 'px');
  sc.style.setProperty('--vq-rail-now', railAt(w) + 'px');
  // The law's own box heights, handed to the stylesheet. One source of truth.
  sc.style.setProperty('--vq-zoneh',   DATA.metrics.zone_h + 'px');
  sc.style.setProperty('--vq-sumrow',  DATA.metrics.sum_row + 'px');
  sc.style.setProperty('--vq-sumtot',  DATA.metrics.sum_tot_row + 'px');
  sc.style.setProperty('--vq-actions', DATA.metrics.actions_h + 'px');
  sc.style.setProperty('--vq-btnh',    (DATA.metrics.actions_h - 24) + 'px');
  sc.style.setProperty('--vq-dockh',   DATA.metrics.dock_h + 'px');
  $('.stage').style.height = Math.round((h + 18) * scale) + 28 + 'px';
  sc.innerHTML = '';

  /* ---- bar ---- */
  const bar = el('div','dbar');
  const ham = el('button','iconbtn','☰');
  ham.title = 'The nav. Present at every width — and on a document it now holds the rail '
            + 'wherever expanding would cost THIS composition a line column.';
  bar.appendChild(ham);
  bar.appendChild(el('button','iconbtn','←'));
  const tw = el('div'); tw.style.cssText = 'min-width:0;flex:1';
  tw.appendChild(el('div','title', T.name));
  tw.appendChild(el('div','docno', T.prefix + '-000148 · Draft'));
  bar.appendChild(tw);
  if (D.navHeld && w > 700) bar.appendChild(el('span','heldpill','▤ rail held'));
  if (w > 560) { const k = el('span','mono-sm','⌘K'); k.style.marginRight = '4px'; bar.appendChild(k); }
  bar.appendChild(el('button','iconbtn','⚙'));
  sc.appendChild(bar);

  /* ---- body ---- */
  const main = el('div','docmain');
  const scroll = el('div','docscroll');
  scroll.style.paddingBottom = marginAt(w) + 'px';

  scroll.appendChild(detailsZone(D, T, dens, on));

  const body = el('div','docbody');
  body.style.marginTop = 'var(--vq-gutter)';
  if (D.summary.mode === 'right')
    body.style.gridTemplateColumns = 'minmax(0,1fr) 14px ' + Math.round(D.summary.px) + 'px';
  else body.style.gridTemplateColumns = 'minmax(0,1fr)';

  if (on('lines')) body.appendChild(linesZone(D, T, D.columns));
  else {
    const z = el('div','zone');
    const zh = el('div','zone-h'); zh.appendChild(el('span', null, 'Amount')); z.appendChild(zh);
    const g = el('div','hdr'); g.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))';
    g.appendChild(field('Amount excluding tax', 'num', true, '18,400.00'));
    g.appendChild(field('Tax amount', 'num', false, '3,312.00'));
    z.appendChild(g); body.appendChild(z);
  }

  if (D.summary.mode === 'right') {
    body.appendChild(summarySplitter(D));
    const col = el('div','sumcol' + (D.summary.pin === 'sticky' ? ' stick' : ''));
    // A sticky column must be bounded by the SCROLLPORT, not by the grid row
    // it lives in -- otherwise it is as tall as the line table and its own
    // Complete button sits below the fold, which is exactly the bug the
    // register had. `room` is what the law measured canStick against.
    if (D.summary.pin === 'sticky')
      col.style.maxHeight = Math.round(D.usable - D.details.h) + 'px';
    col.appendChild(summaryZone(D, T, on));
    body.appendChild(col);
  } else if (D.summary.mode === 'below') {
    const col = el('div','sumcol');
    col.style.marginTop = 'var(--vq-gutter)';
    col.appendChild(summaryZone(D, T, on));
    body.appendChild(col);
  }
  scroll.appendChild(body);
  main.appendChild(scroll);

  /* ---- the dock ---- */
  if (D.dock.length) {
    // A ROW, not a float. It is reserved from the start so nothing shifts,
    // and the bar fades into it once the summary has scrolled away — which is
    // the thing you asked for, without the thing the Counter register did.
    const row = el('div','dockrow');
    row.style.height = (D.dockH + marginAt(w)) + 'px';
    const d = dockBar(D, T);
    const always = D.summary.mode === 'off';
    if (always || state.scrolled) d.classList.add('on');
    row.appendChild(d);
    main.appendChild(row);
    scroll.onscroll = () => {
      const past = scroll.scrollTop > 40;
      if (past !== state.scrolled) { state.scrolled = past;
        d.classList.toggle('on', always || past); }
    };
  }
  sc.appendChild(main);

  /* A total may never be ellipsised. The engine's advance widths are Space
     Grotesk's, and if the webfont has not arrived the fallback is wider — so
     after layout the number is re-fitted against the box it actually got,
     stepping down the ladder until it fits. The exact value stays on hover. */
  refit(sc, T);

  /* ---- readout ---- */
  const R = k => '<b>' + k + '</b>';
  $('#readout').innerHTML =
    R(T.name) + ' at ' + R(w + '×' + h) + ' &nbsp;·&nbsp; nav ' + R(D.nav)
    + (D.navHeld ? ' <span style="color:var(--vq-butter-700)">(held — expanding would cost '
                   + 'this composition a line column)</span>' : '')
    + ' &nbsp;·&nbsp; content ' + R(Math.round(D.avail) + 'px')
    + ' &nbsp;·&nbsp; usable height ' + R(Math.round(D.usable) + 'px') + '<br>'
    + 'details ' + R(D.details.mode + (D.details.mode === 'open'
        ? ' · ' + (D.details.twoCol ? '2 columns' : '1 column') : ''))
    + ' &nbsp;·&nbsp; items ' + R(D.lines.fit) + ' @ ' + R(Math.round(D.lines.px) + 'px')
    + ' &nbsp;·&nbsp; ' + R(D.lines.rowsVisible + ' lines') + ' visible without scrolling<br>'
    + 'summary ' + R(D.summary.mode + (D.summary.mode === 'right'
        ? ' ' + Math.round(D.summary.px) + 'px · ' + D.summary.fit : ''))
    + ' &nbsp;·&nbsp; while you scroll ' + R(D.summary.pin)
    + ' <span style="color:var(--vq-ink-500)">(the column is ' + Math.round(D.summary.h)
    + 'px tall' + (D.summary.canStick ? ' and fits' : ' and does not fit') + ')</span>'
    + (D.dock.length ? ' &nbsp;·&nbsp; dock ' + R(D.dockH + 'px') + ' reserved' : '') + '<br>'
    + 'density ' + R(D.density) + (D.capped
        ? ' <span style="color:var(--vq-warning)">(you asked for ' + D.wantedDensity
          + '; this width supports ' + D.density + ')</span>' : '')
    + ' &nbsp;·&nbsp; columns ' + R(D.columns.join(' · '));

  $('#why').innerHTML = D.demoted
    ? '<div class="demote"><b>Why it looks like this here:</b> ' + D.demoted + '.</div>' : '';

  const caps = el('div');
  T.on.forEach(c => caps.appendChild(el('span','capchip', DATA.caps[c] || c)));
  T.off.forEach(c => caps.appendChild(el('span','capchip off', DATA.caps[c] || c)));
  $('#caps').innerHTML = '<b>' + T.name + '</b> — capabilities switched on, and the ones '
    + 'explicitly switched off:<br>';
  $('#caps').appendChild(caps);
}

function refit(sc, T) {
  const t = totals(T);
  const v = sc.querySelector('.dockbar .v');
  if (!v) return;
  const box = v.parentElement;
  for (let px = box.clientWidth || 200; px > 60; px -= 8) {
    const f = formatToFit(t.total, px, 20, 'PKR');
    v.textContent = f.text; v.title = f.exact;
    if (v.scrollWidth <= v.clientWidth + 1) return;
  }
}

/* ---- static tables --------------------------------------------------- */
function tbl(sel, head, rows, cls) {
  const t = $(sel); if (!t) return;
  t.innerHTML = '';
  if (cls) t.className = 'data ' + cls;
  const th = el('thead'), tr = el('tr');
  head.forEach(h => tr.appendChild(el('th', null, h)));
  th.appendChild(tr); t.appendChild(th);
  const tb = el('tbody');
  rows.forEach(r => {
    const x = el('tr');
    r.forEach(c => {
      let td;
      if (c && typeof c === 'object') { td = el('td', c.cls || null);
        if (c.html != null) td.innerHTML = c.html; else td.textContent = c.text; }
      else { td = el('td'); td.textContent = c == null ? '—' : c; }
      x.appendChild(td);
    });
    tb.appendChild(x);
  });
  t.appendChild(tb);
}

tbl('#ptable', ['Preset','Composition','For'],
  DATA.presets.map(p => [{html:'<b>' + p.name + '</b>'},
    {html:'<code>details ' + p.comp.details + ' · summary ' + p.comp.summary + ' · pin '
      + p.comp.pin + ' · ' + Math.round(p.comp.split*100) + '% · ' + p.comp.density + '</code>'},
    p.for]));

tbl('#stick', ['Density','Summary rows','Column height','Sticks on a 1280×570 laptop?'],
  DATA.density.map(d => {
    const hgt = summaryHeight(d.id) + DATA.metrics.actions_h;
    const room = 570 - 64 - 2*24 - DATA.metrics.strip_h;
    return [{html:'<b>' + d.name + '</b>'}, d.summary.length,
      {html:'<b>' + Math.round(hgt) + 'px</b>'},
      {html: hgt <= room ? '<b style="color:var(--vq-teal-700)">yes — it holds still</b>'
        : '<b style="color:var(--vq-butter-700)">no — it docks bottom-right</b>'
          + ' <span style="color:var(--vq-ink-500)">(' + Math.round(room) + 'px of room)</span>'}];
  }));

tbl('#dentable', ['Density','Built for','Header fields','Line columns'],
  DATA.density.map(d => [{html:'<b>' + d.name + '</b>'}, d.for,
    d.header.join(' · '), d.line_cols.join(' · ')]));

tbl('#fixtable', ['What the thirteen screens do today','What one editor does instead'],
  DATA.fixes.map(f => [f[1], {html:'<b>' + f[2] + '</b>'}]));

const CAPKEYS = Object.keys(DATA.caps);
tbl('#matrix', ['Capability'].concat(DATA.types.map(t => t.prefix)),
  CAPKEYS.map(k => [DATA.caps[k]].concat(DATA.types.map(t =>
    t.on.includes(k) ? {cls:'y', text:'●'} : {cls:'x', text:'·'}))), 'matrix');

tbl('#solved', ['Viewport','Nav','Content','Details','Line table','Summary','While you scroll'],
  Object.entries(DATA.composed.panel).sort((a,b) => +a[0] - +b[0]).map(([vp, s]) =>
    [{html:'<code>' + vp + '</code>'}, s.nav + (s.nav_held ? ' (held)' : ''),
     Math.round(s.avail) + 'px', s.details.mode,
     s.lines.fit + ' @ ' + Math.round(s.lines.px) + 'px',
     {html:'<b>' + s.summary.mode + '</b>' + (s.summary.px ? ' ' + Math.round(s.summary.px) + 'px' : '')},
     s.summary.pin]));

tbl('#keytable', ['Key','Action','Where it works'],
  DATA.keymap.map(k => [{html:'<code>' + k[0] + '</code>'}, k[1], k[2]]));

addEventListener('resize', () => { if (!state.split) render(); });
render();
