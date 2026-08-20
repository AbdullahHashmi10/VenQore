/* ======================================================================
   venqore-shell — the nav law, the grid, the splitter, and edit mode.

   Everything the user can do here is a gesture the LAW snaps before it
   commits. The handle stops at the boundary; it never lets go of an illegal
   value and springs back.
   ====================================================================== */
const $ = s => document.querySelector(s);
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c;
  if (txt != null) e.textContent = txt; return e; };
const L = DATA.law;
const GUT = L.constants.gutter, ROWH = L.constants.row;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const NAVITEMS = [['⌂','Home'],['▤','Sell'],['⇩','Purchase'],['⛁','Stock'],
  ['◍','Contacts'],['₨','Money'],['◈','VenSynQ'],['◔','Insights'],['⚙','Settings']];

/* A card is a DESCRIPTOR — a category and an authored reading — never a pixel
   size. In Free mode it additionally carries a BOX per column class, which is
   the only thing that has to be projected between classes. */
const DEFAULT_CARDS = [
  {id:'a', catId:'C1', title:'New sale',        kind:'tile',   icon:'＋'},
  {id:'b', catId:'C1', title:'Scan',            kind:'tile',   icon:'⌗'},
  {id:'c', catId:'C1', title:'Open drawer',     kind:'tile',   icon:'▣'},
  {id:'d', catId:'C2', title:"Today's sales",   kind:'strip',  value:1284500},
  {id:'e', catId:'C3', title:'Gross revenue',   kind:'metric', value:161577.85, delta:12.4},
  {id:'f', catId:'C3', title:'Net profit',      kind:'metric', value:48210.5,  delta:-3.1},
  {id:'g', catId:'C3', title:'Receivables',     kind:'metric', value:2841900,  delta:5.8},
  {id:'h', catId:'C4', title:'Sales by module', kind:'panel'},
  {id:'i', catId:'C4', title:'Top customers',   kind:'panel'},
  {id:'j', catId:'C5', title:'Cash flow & revenue', kind:'board'},
  {id:'k', catId:'C6', title:'Profit & loss',       kind:'canvas'},
];
const CATNAME = {C1:'Tile', C2:'Strip', C3:'Metric', C4:'Panel', C5:'Board', C6:'Canvas'};
const CATKIND = {C1:'tile', C2:'strip', C3:'metric', C4:'panel', C5:'board', C6:'canvas'};

const state = {
  w:1905, h:940, arch:'dashboard', open:false, intent:null, edit:false,
  mode:'flow',          // 'flow' | 'free'
  navW:null,            // the user's splitter width; null = the law's default
  cards: DEFAULT_CARDS.map(c => ({...c})),
  layouts:{},           // { [columnClass]: [box] } — AUTHORED classes only
  drag:null, split:null, scale:1, undo:[], seq:0,
};

/* ---- undo: snapshots of the layout, not of gestures ------------------- */
const snapshot = () => JSON.stringify({cards:state.cards, layouts:state.layouts,
                                       mode:state.mode, navW:state.navW});
function mark() { state.undo.push(snapshot()); if (state.undo.length > 40) state.undo.shift(); }
function undo() {
  const s = state.undo.pop(); if (!s) return;
  const o = JSON.parse(s);
  state.cards = o.cards; state.layouts = o.layouts; state.mode = o.mode; state.navW = o.navW;
  render();
}

/* ---- controls --------------------------------------------------------- */
const DEVICES = [['Phone 390',390,745],['Tablet ⇅ 768',768,950],['Tablet ⇄ 1024',1024,695],
  ['Laptop 1280',1265,570],['1216 · the threshold',1216,700],
  ['Laptop 1440',1425,750],['FHD 1920',1905,940],['QHD 2560',2545,1290]];
DEVICES.forEach(([nm,w,h]) => {
  const b = el('button','chip', nm); b.dataset.w = w;
  b.onclick = () => { state.w=w; state.h=h; state.open=false; $('#w').value=w; render(); };
  $('#dbtns').appendChild(b);
});
L.archetypes.forEach(a => {
  const b = el('button','chip', a.name); b.dataset.a = a.id; b.title = a.rule;
  b.onclick = () => { state.arch = a.id; render(); };
  $('#abtns').appendChild(b);
});
$('#w').oninput = e => { state.w = +e.target.value;
  const d = DEVICES.find(x => x[1] === state.w); if (d) state.h = d[2];
  if (navBehaviour(state.w) === 'push') state.open = false;
  render(); };
$('#editbtn').onclick = () => { state.edit = !state.edit; render(); };
$('#resetbtn').onclick = () => { mark(); state.cards = DEFAULT_CARDS.map(c => ({...c}));
  state.layouts = {}; state.navW = null; render(); };

/* ---- geometry helpers ------------------------------------------------- */
const pitchX = g => g.col + GUT;
const pitchY = ()  => ROWH + GUT;

/* Flow: the packer's answer. Free: boxes for this column class, projected
   ONCE from the nearest authored class (never from another projection). */
function currentBoxes(g) {
  const res = state.cards.map(c => ({...c, ...resolveCard(c.catId, g, c.variant)}));
  const bands = packCards(res, g.cols);
  if (state.mode === 'free' && freeAllowed(g)) {
    if (!Object.keys(state.layouts).length)
      state.layouts[g.cols] = boxesFromBands(bands)
        .map(b => ({...b, catId: state.cards.find(c => c.id === b.id).catId}));
    // a card added or removed since the layout was authored
    const store = {};
    for (const k of Object.keys(state.layouts))
      store[k] = state.layouts[k].filter(b => state.cards.some(c => c.id === b.id));
    let boxes = layoutFor(store, g.cols, g);
    const have = new Set(boxes.map(b => b.id));
    for (const c of state.cards) if (!have.has(c.id)) boxes.push(freeSlot(boxes, c, g));
    return {mode:'free', boxes: settle(boxes), bands, res};
  }
  return {mode:'flow', boxes:null, bands, res};
}

/* The first empty cell, scanning row-major, that can hold this card's
   smallest legal box. Nothing is ever dropped on top of something else. */
function freeSlot(boxes, card, g) {
  const lim = boxLimits(card.catId, g);
  const w = lim.wmin, h = lim.hmin[w] || 1;
  const hit = (a,b) => a.col < b.col+b.w && b.col < a.col+a.w && a.row < b.row+b.h && b.row < a.row+a.h;
  for (let row = 0; row < 200; row++)
    for (let col = 0; col + w <= g.cols; col++) {
      const box = {id:card.id, catId:card.catId, col, row, w, h};
      if (!boxes.some(b => hit(b, box))) return box;
    }
  return {id:card.id, catId:card.catId, col:0, row:999, w, h};
}

/* ---- card bodies ------------------------------------------------------ */
function cardBody(c, r, px) {
  const box = el('div','cbody');
  if (c.kind === 'tile') {
    const t = el('div','tile');
    t.appendChild(el('div','tileic', c.icon || '◆'));
    if (r.variant !== 'icon') t.appendChild(el('div','tilelab', c.title));
    box.appendChild(t); return box;
  }
  if (c.kind === 'strip') {
    const wrap = el('div');
    wrap.style.cssText = r.variant === 'inline'
      ? 'display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex:1'
      : 'display:flex;flex-direction:column;gap:6px;justify-content:center;flex:1';
    wrap.appendChild(el('div','eyebrow', c.title));
    const v = el('div','metric');
    const f = formatToFit(c.value ?? 0, Math.max(70, px - 40 - (r.variant === 'inline' ? 150 : 0)), 26, 'PKR');
    v.textContent = f.text; v.title = f.exact; v.style.fontSize = '26px';
    wrap.appendChild(v); box.appendChild(wrap); return box;
  }
  box.appendChild(el('div','eyebrow', c.title));
  if (c.kind === 'metric') {
    const fs = (r.variant === 'compact' || r.variant === 'stacked') ? 26 : 38;
    const v = el('div','metric');
    const f = formatToFit(c.value ?? 0, Math.max(70, px - 40), fs, 'PKR');
    v.textContent = f.text; v.title = f.exact; v.style.fontSize = fs + 'px';
    v.style.marginTop = '6px'; box.appendChild(v);
    const d = el('div', 'delta ' + ((c.delta ?? 0) > 0 ? 'up' : 'dn'),
      ((c.delta ?? 0) > 0 ? '▲ ' : '▼ ') + Math.abs(c.delta ?? 0) + '%');
    d.style.marginTop = '8px'; box.appendChild(d);
    if (r.variant === 'full') {
      const s = el('div','spark');
      [38,52,44,61,49,72,66,84,70,91,78,96].forEach(v2 => {
        const i = el('i'); i.style.height = v2 + '%'; s.appendChild(i); });
      box.appendChild(s);
    }
    return box;
  }
  if (c.kind === 'panel') {
    const l = el('div','blist');
    (c.id === 'i'
      ? [['Ahsan Traders',284],['Sufi Mart',217],['Al-Karam Stores',163],
         ['Meezan Retail',119],['Bilal & Sons',86],['Noor General',54]]
      : [['Retail POS',92],['Wholesale',71],['E-commerce',54],['Distribution',38],
         ['Services',22],['Manufacturing',11]])
      .forEach(([n, p]) => {
        const row = el('div','brow');
        row.appendChild(el('span','bn', n));
        if (r.variant === 'full') { const b = el('span','bb');
          b.style.width = Math.round(Math.min(100, p / (c.id === 'i' ? 3 : 1)) * 0.9) + 'px';
          row.appendChild(b); }
        row.appendChild(el('span','bv', c.id === 'i' ? p + 'k' : p + '%'));
        l.appendChild(row);
      });
    box.appendChild(l); return box;
  }
  const ch = el('div','chart');
  const n = r.variant === 'min' ? 8 : r.variant === 'narrow' ? 12 : 18;
  for (let i = 0; i < n; i++) { const b = el('i');
    b.style.height = (28 + Math.abs(Math.sin(i * 1.7)) * 66) + '%'; ch.appendChild(b); }
  box.appendChild(ch);
  return box;
}

/* ---- one card element ------------------------------------------------- */
function cardEl(c, r, g, box) {
  const node = el('div','card');
  node.dataset.c = r.cols; node.dataset.id = c.id;
  if (box) {
    node.style.gridColumn = (box.col + 1) + ' / span ' + box.w;
    node.style.gridRow    = (box.row + 1) + ' / span ' + box.h;
  } else {
    node.style.gridColumn = 'span ' + r.cols;
    node.style.gridRow    = 'span ' + r.rows;
  }
  if (r.underflow) { node.dataset.underflow = 'true';
    node.style.setProperty('--vq-card-min', r.minWidth + 'px'); }
  node.appendChild(el('div','badge',
    c.catId + ' ' + (box ? box.w + '×' + box.h : r.cols + '×' + r.rows) + ' ' + r.variant));
  node.appendChild(cardBody(c, r, r.px));
  if (state.edit) {
    const x = el('button','xbtn','✕'); x.title = 'Remove';
    x.onpointerdown = e => e.stopPropagation();
    x.onclick = e => { e.stopPropagation(); mark();
      state.cards = state.cards.filter(k => k.id !== c.id);
      for (const k in state.layouts)
        state.layouts[k] = state.layouts[k].filter(b => b.id !== c.id);
      render(); };
    node.appendChild(x);
    const rz = el('div','rz'); rz.title = 'Drag to resize — the handle stops at the law';
    rz.onpointerdown = e => startGesture(e, c, g, 'resize');
    node.appendChild(rz);
    node.onpointerdown = e => { if (e.target.closest('.rz,.xbtn')) return;
      startGesture(e, c, g, 'move'); };
  }
  return node;
}

/* ---- the grid --------------------------------------------------------- */
function renderGrid(g) {
  const wrap = el('div','gridwrap');
  wrap.dataset.edit = String(state.edit);

  const lines = el('div','gridlines');
  lines.style.gridTemplateColumns = 'repeat(' + g.cols + ',minmax(0,1fr))';
  for (let i = 0; i < g.cols; i++) lines.appendChild(el('i'));
  wrap.appendChild(lines);

  const grid = el('div','grid');
  grid.style.gridTemplateColumns = 'repeat(' + g.cols + ',minmax(0,1fr))';
  grid.dataset.edit = String(state.edit);
  grid.dataset.mode = state.mode;

  const cur = currentBoxes(g);
  const d = state.drag;

  if (cur.mode === 'free') {
    let boxes = cur.boxes.map(b => ({...b}));
    let ghost = null;
    if (d && d.dest) {
      boxes = boxes.filter(b => b.id !== d.card.id);
      const moving = {...d.box, ...d.dest};
      ghost = moving;
      boxes = settle([...boxes.map(b => ({...b})), moving]);
      // keep the moving card exactly where the pointer put it
      const m = boxes.find(b => b.id === d.card.id);
      if (m) { m.col = moving.col; m.row = moving.row; m.w = moving.w; m.h = moving.h; }
    }
    if (ghost) {
      const gh = el('div','ghost');
      gh.style.gridColumn = (ghost.col + 1) + ' / span ' + ghost.w;
      gh.style.gridRow    = (ghost.row + 1) + ' / span ' + ghost.h;
      gh.appendChild(el('div','gl', ghost.w + ' × ' + ghost.h +
        '  ·  ' + Math.round(width(ghost.w, g.col)) + 'px'));
      grid.appendChild(gh);
    }
    for (const b of boxes) {
      const c = state.cards.find(x => x.id === b.id); if (!c) continue;
      const fit = fitInBox(c.catId, b.w, b.h, g.col) ||
                  {variant:'underflow', cols:b.w, rows:b.h, floor:0};
      const r = {catId:c.catId, cols:b.w, rows:b.h, variant:fit.variant,
                 px: width(b.w, g.col), floor: fit.floor};
      const node = cardEl(c, r, g, b);
      if (d && d.card.id === b.id) {
        node.classList.add(d.kind === 'resize' ? 'resizing' : 'dragging');
        if (d.kind === 'resize') node.appendChild(szChip(d, g));
        // The card follows the POINTER; the ghost holds the snapped cell. That
        // separation is the whole point of a placeholder -- if the card sat on
        // the ghost you could not see where it was going to land.
        if (d.kind === 'move' && d.offset)
          node.style.transform = 'translate(' + d.offset.x + 'px,' + d.offset.y + 'px)';
      }
      grid.appendChild(node);
    }
  } else {
    /* FLOW. The ghost is a real participant in the pack, so the outline you
       see is the slot the card will actually occupy — including the reflow
       that landing there causes. */
    let list = cur.res;
    let ghostId = null;
    if (d && d.kind === 'move' && d.index != null) {
      list = cur.res.filter(x => x.id !== d.card.id);
      const me = cur.res.find(x => x.id === d.card.id);
      ghostId = '__ghost__';
      list.splice(clamp(d.index, 0, list.length), 0, {...me, id: ghostId});
    } else if (d && d.kind === 'resize' && d.dest) {
      list = cur.res.map(x => x.id !== d.card.id ? x : ({...x, cols:d.dest.w, rows:d.dest.h,
        variant:(fitInBox(d.card.catId, d.dest.w, d.dest.h, g.col)||{}).variant || x.variant,
        px: width(d.dest.w, g.col)}));
    }
    for (const band of packCards(list, g.cols)) for (const r of band.cards) {
      if (r.id === ghostId) {
        const gh = el('div','ghost');
        gh.style.gridColumn = 'span ' + r.cols; gh.style.gridRow = 'span ' + r.rows;
        gh.appendChild(el('div','gl', 'lands here  ·  ' + r.cols + ' × ' + r.rows));
        grid.appendChild(gh); continue;
      }
      const c = state.cards.find(x => x.id === r.id); if (!c) continue;
      const node = cardEl(c, r, g, null);
      if (d && d.card.id === r.id) {
        node.classList.add(d.kind === 'resize' ? 'resizing' : 'dragging');
        if (d.kind === 'resize') node.appendChild(szChip(d, g));
      }
      grid.appendChild(node);
    }
  }
  wrap.appendChild(grid);
  const rows = cur.mode === 'free'
    ? Math.max(1, ...cur.boxes.map(b => b.row + b.h))
    : cur.bands.reduce((a, b) => a + b.rows, 0);
  lines.style.height = span(rows, ROWH) + 'px';
  return {wrap, ...cur};
}

/* The live size, and — when the handle has run out of travel — WHY. */
function szChip(d, g) {
  const c = el('div','szchip');
  c.appendChild(el('b', null, d.dest.w + ' × ' + d.dest.h));
  c.appendChild(el('span', null, ' · ' + Math.round(width(d.dest.w, g.col)) + ' × '
    + height(d.dest.h) + 'px'));
  const cat = L.categories.find(x => x.id === d.card.catId);
  if (d.atMax) c.appendChild(el('i', 'stop', 'max ' + cat.max[0] + '×' + cat.max[1]));
  else if (d.atMin) c.appendChild(el('i', 'stop', 'floor ' +
    (fitInBox(d.card.catId, d.dest.w, d.dest.h, g.col) || {}).floor + 'px'));
  return c;
}

/* ---- gestures --------------------------------------------------------- */
function startGesture(ev, card, g, kind) {
  ev.preventDefault();
  const cur = currentBoxes(g);
  const box = cur.mode === 'free'
    ? cur.boxes.find(b => b.id === card.id)
    : (r => ({id:card.id, catId:card.catId, col:0, row:0, w:r.cols, h:r.rows}))
        (cur.res.find(x => x.id === card.id));
  const lim = boxLimits(card.catId, g);
  state.drag = {kind, card, g, box:{...box}, lim, x0:ev.clientX, y0:ev.clientY,
                dest:null, index:null, live:false, marked:false};
  addEventListener('pointermove', onGesture);
  addEventListener('pointerup', endGesture, {once:true});
  addEventListener('pointercancel', cancelGesture, {once:true});
  addEventListener('keydown', escGesture);
}
function escGesture(e) { if (e.key === 'Escape') cancelGesture(); }
function cancelGesture() { state.drag = null; stopGesture(); render(); }
function stopGesture() {
  removeEventListener('pointermove', onGesture);
  removeEventListener('keydown', escGesture);
}
let raf = 0;
function onGesture(ev) {
  const d = state.drag; if (!d) return;
  const s = state.scale || 1;
  const dx = (ev.clientX - d.x0) / s, dy = (ev.clientY - d.y0) / s;
  if (!d.live && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;    // not a drag yet
  if (!d.live) { d.live = true; if (!d.marked) { mark(); d.marked = true; } }
  const g = d.g;

  if (d.kind === 'resize') {
    const w = clamp(d.box.w + Math.round(dx / pitchX(g)), d.lim.wmin,
                    Math.min(d.lim.wmax, g.cols - (state.mode === 'free' ? d.box.col : 0)));
    const h = clamp(d.box.h + Math.round(dy / pitchY()), d.lim.hmin[w] ?? 1, d.lim.hmax);
    d.dest = {col:d.box.col, row:d.box.row, w, h};
    d.atMax = w === Math.min(d.lim.wmax, g.cols - d.box.col) || h === d.lim.hmax;
    d.atMin = w === d.lim.wmin || h === (d.lim.hmin[w] ?? 1);
  } else if (state.mode === 'free' && freeAllowed(g)) {
    const w = d.box.w, h = d.box.h;
    const dc = Math.round(dx / pitchX(g)), dr = Math.round(dy / pitchY());
    d.dest = {col: clamp(d.box.col + dc, 0, g.cols - w),
              row: Math.max(0, d.box.row + dr), w, h};
    d.offset = {x: Math.round(dx - (d.dest.col - d.box.col) * pitchX(g)),
                y: Math.round(dy - (d.dest.row - d.box.row) * pitchY())};
  } else {
    // FLOW: the destination is an INDEX. Nearest slot by the pointer's
    // position over the rendered cards, so the outline follows the reading
    // order the user is actually building.
    const cards = [...document.querySelectorAll('.grid .card')];
    let idx = state.cards.length;
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      if (ev.clientY < r.bottom && ev.clientX < r.left + r.width / 2) {
        idx = state.cards.findIndex(c => c.id === cards[i].dataset.id); break; }
    }
    const from = state.cards.findIndex(c => c.id === d.card.id);
    d.index = idx > from ? idx - 1 : idx;
  }
  if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); });
}
function endGesture() {
  const d = state.drag; if (!d) { stopGesture(); return; }
  stopGesture();
  if (!d.live) { state.drag = null; render(); return; }
  const g = d.g;
  if (d.kind === 'resize') {
    if (state.mode === 'free' && freeAllowed(g)) {
      const boxes = currentBoxes(g).boxes.map(b => b.id === d.card.id ? {...b, ...d.dest} : {...b});
      authored(g.cols, settle(boxes));
    } else {
      // In Flow you are not choosing a size, you are choosing a READING: the
      // dragged box picks the richest fit that fits inside it.
      const f = fitInBox(d.card.catId, d.dest.w, d.dest.h, g.col);
      if (f) state.cards.find(c => c.id === d.card.id).variant = f.variant;
    }
  } else if (state.mode === 'free' && freeAllowed(g)) {
    const boxes = currentBoxes(g).boxes
      .map(b => b.id === d.card.id ? {...b, ...d.dest} : {...b});
    authored(g.cols, settle(boxes));
  } else if (d.index != null) {
    const from = state.cards.findIndex(c => c.id === d.card.id);
    const [m] = state.cards.splice(from, 1);
    state.cards.splice(clamp(d.index, 0, state.cards.length), 0, m);
  }
  state.drag = null; render();
}
/* Editing at a class AUTHORS that class. Other authored classes are left
   alone; derived ones were never stored, so there is nothing to invalidate. */
function authored(n, boxes) {
  state.layouts[n] = boxes.map(b => ({id:b.id, catId:b.catId, col:b.col, row:b.row,
                                      w:b.w, h:b.h}));
}

/* ---- the splitter ----------------------------------------------------- */
function splitterEl(g, sh) {
  const t = navTravel(state.w, state.arch);
  const bar = el('div','split');
  bar.setAttribute('role','separator');
  bar.setAttribute('tabindex','0');
  bar.setAttribute('aria-orientation','vertical');
  bar.setAttribute('aria-label','Resize the navigation');
  bar.setAttribute('aria-controls','vqnav');
  bar.setAttribute('aria-valuemin', Math.round(t.min));
  bar.setAttribute('aria-valuemax', Math.round(t.max));
  bar.setAttribute('aria-valuenow', Math.round(g.navW));
  bar.title = 'Drag to resize · Enter collapses · double-click restores the default';

  const begin = ev => {
    ev.preventDefault();
    const s = state.scale || 1;
    state.split = {x0: ev.clientX, w0: g.navW, t};
    bar.classList.add('dragging');
    const move = e => {
      const px = state.split.w0 + (e.clientX - state.split.x0) / s;
      const r = snapNav(px, state.w, state.arch);
      state.navW = r.px; state.snapWhy = r.snapped; render();
      const nb = document.querySelector('.split'); if (nb) nb.classList.add('dragging');
    };
    const up = () => { removeEventListener('pointermove', move); state.split = null;
      state.snapWhy = null; render(); };
    addEventListener('pointermove', move);
    addEventListener('pointerup', up, {once:true});
  };
  bar.onpointerdown = begin;
  bar.ondblclick = () => { state.navW = null; state.snapWhy = null; render(); };
  /* Keyboard is for precision, so the arrows NUDGE and ignore the magnets --
     a magnet whose radius exceeds the step would otherwise swallow every
     press and the handle would never move. Home / End / Enter still land on
     the law's own stops. */
  bar.onkeydown = e => {
    const step = L.splitter.step_px;
    let px = g.navW, used = true, magnetic = false;
    if (e.key === 'ArrowLeft')       px -= step;
    else if (e.key === 'ArrowRight') px += step;
    else if (e.key === 'Home')     { px = t.min; magnetic = true; }
    else if (e.key === 'End')      { px = t.max; magnetic = true; }
    else if (e.key === 'Enter')    { px = g.navW > t.min + 1
                                        ? t.min
                                        : (state.lastNavW || L.constants.sidebar_expanded);
                                     magnetic = true; }
    else used = false;
    if (!used) return;
    e.preventDefault();
    if (g.navW > t.min + 1) state.lastNavW = g.navW;
    state.navW = magnetic ? snapNav(px, state.w, state.arch).px
                          : clamp(Math.round(px), t.min, t.max);
    render();
    const nb = document.querySelector('.split'); if (nb) nb.focus();
  };
  return bar;
}

/* ---- render ----------------------------------------------------------- */
function render() {
  const w = state.w, h = state.h;
  $('#wv').textContent = w;
  document.querySelectorAll('#dbtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(+b.dataset.w === w)));
  document.querySelectorAll('#abtns .chip').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.a === state.arch)));
  $('#editbtn').setAttribute('aria-pressed', String(state.edit));

  const prefs = { open: state.open, intent: state.intent };
  const sh = shell(w, state.arch, prefs);
  const g  = geometry(w, { arch: state.arch, prefs, navW: state.navW });
  const travel = navTravel(w, state.arch);

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
  $('.stage').style.height = Math.round((h + 18) * scale) + 28 + 'px';
  sc.innerHTML = '';

  /* ---- nav ---- */
  const overlay = sh.behaviour === 'overlay';
  const navW = overlay ? Math.round(state.navW != null && state.open
                                    ? clamp(state.navW, travel.min, travel.max)
                                    : sh.overlayWidth)
                       : Math.round(g.navW);
  const nav = el('div', 'nav' + (overlay ? ' overlay' : ''));
  nav.id = 'vqnav';
  nav.dataset.state = navW < L.constants.sidebar_expanded - 40 && !overlay ? 'rail' : sh.nav;
  nav.style.width = navW + 'px';
  if (state.split) nav.classList.add('dragging');
  if (overlay) nav.dataset.open = String(state.open);
  const nh = el('div','navhead');
  nh.appendChild(el('div','navlogo','V'));
  if (navW > 120) nh.appendChild(el('div','navbrand','VenQore'));
  nav.appendChild(nh);
  const nl = el('div','navlist');
  NAVITEMS.forEach(([ic, t], i) => {
    const a = el('button','ni' + (i === 1 ? ' on' : ''));
    a.appendChild(el('span','ic', ic));
    if (navW > 120) a.appendChild(el('span','lbl', t));
    a.title = t; nl.appendChild(a);
  });
  nav.appendChild(nl);

  if (overlay) {
    const scr = el('div','scrim3'); scr.dataset.open = String(state.open);
    scr.onclick = () => { state.open = false; render(); };
    sc.appendChild(scr);
  }

  const main = el('div','main');
  const hdr = el('div','hdr');
  const ham = el('button','iconbtn','☰');
  ham.title = 'The hamburger is present at EVERY width, on every archetype.';
  ham.onclick = () => {
    if (sh.behaviour === 'push') {
      state.intent = (sh.nav === 'expanded') ? 'rail' : 'expanded';
      state.navW = null; state.open = false;
    } else state.open = !state.open;
    render();
  };
  hdr.appendChild(ham);
  hdr.appendChild(el('div','t', L.archetypes.find(a => a.id === state.arch).name));
  const sp = el('div'); sp.style.flex = '1'; hdr.appendChild(sp);
  hdr.appendChild(el('span', 'pushpill ' + sh.behaviour,
    sh.behaviour === 'push' ? '▶ pushes' : '▤ overlays'));
  if (state.arch === 'dashboard') {
    const eb = el('button','iconbtn', state.edit ? '✓' : '✎');
    eb.setAttribute('aria-pressed', String(state.edit));
    eb.title = state.edit ? 'Done' : 'Edit this dashboard';
    eb.onclick = () => { state.edit = !state.edit; render(); };
    hdr.appendChild(eb);
  }
  hdr.appendChild(el('button','iconbtn','⚙'));
  main.appendChild(hdr);

  /* ---- edit toolbar: a real row, so nothing floats over the cards ---- */
  if (state.edit && state.arch === 'dashboard') {
    const tb = el('div','etoolbar');
    tb.appendChild(el('span','lab','Placement'));
    L.placement.modes.forEach(m => {
      const b = el('button','eb', m.name);
      const allowed = m.id === 'flow' || freeAllowed(g);
      b.setAttribute('aria-pressed', String(state.mode === m.id && allowed));
      b.disabled = !allowed;
      b.title = allowed ? m.why
        : 'Free placement needs ' + L.placement.min_free_cols + ' columns. ' + L.placement.mobile;
      b.onclick = () => { mark(); state.mode = m.id;
        if (m.id === 'free' && !state.layouts[g.cols]) {
          const cur = currentBoxes(geometry(w, {arch:state.arch, prefs, navW:state.navW}));
          authored(g.cols, boxesFromBands(cur.bands)
            .map(b2 => ({...b2, catId: state.cards.find(c => c.id === b2.id).catId})));
        }
        render(); };
      tb.appendChild(b);
    });
    tb.appendChild(el('div','sep'));
    tb.appendChild(el('span','lab','Add'));
    ['C1','C2','C3','C4','C5','C6'].forEach(id => {
      const b = el('button','eb', CATNAME[id]);
      b.title = L.categories.find(c => c.id === id).role;
      b.onclick = () => { mark();
        const nid = 'n' + (++state.seq);
        state.cards.push({id:nid, catId:id, kind:CATKIND[id],
          title:'New ' + CATNAME[id].toLowerCase(), icon:'◆',
          value: 128450.5, delta: 4.2});
        render(); };
      tb.appendChild(b);
    });
    tb.appendChild(el('div','sep'));
    const ub = el('button','eb','⟲ Undo'); ub.disabled = !state.undo.length;
    ub.onclick = undo; tb.appendChild(ub);
    const cls = el('span','lab');
    cls.textContent = 'class ' + g.cols + (state.layouts[g.cols] ? ' · authored' : ' · derived');
    cls.style.marginLeft = 'auto'; tb.appendChild(cls);
    main.appendChild(tb);
  }

  const canvas = el('div','canvas');
  const gr = renderGrid(g);
  canvas.appendChild(gr.wrap);
  main.appendChild(canvas);

  if (overlay) sc.appendChild(nav);
  else { sc.appendChild(nav);
         if (sh.nav !== 'hidden') sc.appendChild(splitterEl(g, sh)); }
  sc.appendChild(main);
  if (overlay && state.open) {
    const bar = splitterEl({...g, navW}, sh);
    bar.style.cssText = 'position:absolute;left:' + navW + 'px;top:0;bottom:0;width:8px;z-index:47';
    sc.appendChild(bar);
  }
  if (state.split) {
    const rd = el('div','splitread');
    rd.style.left = (navW + 12) + 'px';
    rd.style.top = '78px'; rd.style.transform = 'none';
    rd.innerHTML = '<b>' + navW + 'px</b>  ·  travel ' + Math.round(travel.min) + '–'
      + Math.round(travel.max) + '<br>' + g.cols + ' columns @ ' + g.col.toFixed(1) + 'px'
      + (state.snapWhy ? '<br><span class="sn">snapped: ' + state.snapWhy + '</span>' : '');
    sc.appendChild(rd);
    navSnaps(w, state.arch).forEach(s => {
      const gd = el('div','navguide' + (state.snapWhy === s.why ? ' snap' : ''));
      gd.style.left = s.px + 'px'; sc.appendChild(gd);
    });
  }

  /* ---- readout ---- */
  const rest = navDefault(w, state.arch);
  const boxes = gr.mode === 'free' ? gr.boxes : null;
  $('#readout').innerHTML =
    'viewport <b>' + w + 'px</b> &nbsp;·&nbsp; archetype <b>' + state.arch + '</b>'
    + ' &nbsp;·&nbsp; nav at rest <b>' + rest + '</b>'
    + (state.intent ? ' &nbsp;·&nbsp; your choice <b>' + state.intent + '</b>' : '')
    + ' &nbsp;·&nbsp; it <b>' + (sh.behaviour === 'push' ? 'pushes' : 'overlays') + '</b> here<br>'
    + 'nav <b>' + navW + 'px</b>'
    + (state.navW != null ? ' <span style="color:var(--vq-teal-700)">(you dragged it)</span>' : '')
    + ' &nbsp;·&nbsp; splitter travel <b>' + Math.round(travel.min) + '–'
    + Math.round(travel.max) + 'px</b> &nbsp;·&nbsp; stops at <b>content '
    + L.splitter.travel[String(nearestBp(w))]?.[state.arch]?.content_floor + 'px</b><br>'
    + 'content <b>' + Math.round(g.avail) + 'px</b> → <b>' + g.cols + ' columns</b> @ <b>'
    + g.col.toFixed(2) + 'px</b>'
    + (g.col < L.constants.desk_col_floor - 0.01 && w >= 1024
        ? ' <span style="color:var(--vq-warning)">(below the 92px desktop floor)</span>' : '')
    + '<br>placement <b>' + (gr.mode === 'free' ? 'FREE' : 'FLOW') + '</b>'
    + (gr.mode === 'free'
        ? ' &nbsp;·&nbsp; ' + boxes.length + ' boxes · ' +
          Math.max(1, ...boxes.map(b => b.row + b.h)) + ' rows deep · ' +
          (state.layouts[g.cols] ? 'authored at this class'
            : 'projected from class ' + nearestAuthored(g.cols))
        : ' &nbsp;·&nbsp; ' + gr.bands.length + ' bands · '
          + gr.bands.map(b => b.cards.length + '×' + b.rows + 'r'
              + (b.slack ? ' (' + b.slack + ' slack)' : '')).join(' · '));

  const ax = $('#axis'), lo = 320, hi = 2600;
  ax.querySelector('.cursor').style.left =
    (Math.min(hi, Math.max(lo, w)) - lo) / (hi - lo) * 100 + '%';
  drawTravel(w, travel);
}
const nearestBp = w => L.breakpoints.reduce((a, b) =>
  Math.abs(b.vp - w) < Math.abs(a - w) ? b.vp : a, L.breakpoints[0].vp);
function nearestAuthored(n) {
  const keys = Object.keys(state.layouts).map(Number).sort((a,b)=>a-b);
  const above = keys.filter(k => k > n);
  return above.length ? above[0] : keys[keys.length - 1];
}

/* the splitter's travel, drawn ------------------------------------------ */
function drawTravel(w, t) {
  const box = $('#travel'); box.innerHTML = '';
  const scale = 1 / Math.max(t.max, 400);
  const band = el('div','band');
  band.style.left = (t.min * scale * 100) + '%';
  band.style.width = ((t.max - t.min) * scale * 100) + '%';
  box.appendChild(band);
  navSnaps(w, state.arch).forEach(s => {
    const m = el('div','snap'); m.style.left = (s.px * scale * 100) + '%';
    m.appendChild(el('b', null, s.px + (s.why === 'rail' ? ' rail'
      : s.why === 'default' ? ' default' : ' · ' + s.why.split(' ')[0] + ' cols')));
    box.appendChild(m);
  });
  const g = geometry(w, {arch: state.arch, prefs:{open:state.open, intent:state.intent},
                         navW: state.navW});
  const now = el('div','now'); now.style.left = (g.navW * scale * 100) + '%';
  box.appendChild(now);
}

/* the static axis furniture */
(function axis() {
  const ax = $('#axis'), lo = 320, hi = 2600;
  const at = v => (v - lo) / (hi - lo) * 100 + '%';
  [[1024,'1024 rail arrives'],[1216,'1216 PUSH THRESHOLD'],[1280,'1280 expanded']]
    .forEach(([v, t]) => {
      const m = el('div','mark'); m.style.left = at(v); ax.appendChild(m);
      const l = el('div','lbl', t); l.style.left = at(v); ax.appendChild(l);
    });
  const z1 = el('div','zone','overlay'); z1.style.left = '2%';
  z1.style.color = 'var(--vq-butter-700)'; ax.appendChild(z1);
  const z2 = el('div','zone','push'); z2.style.left = '75%';
  z2.style.color = 'var(--vq-teal-800)'; ax.appendChild(z2);
  ax.appendChild(el('div','cursor'));
})();

addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
});

/* ---- static tables ---------------------------------------------------- */
function tbl(sel, head, rows) {
  const t = $(sel); if (!t) return;
  t.innerHTML = '';
  const th = el('thead'), tr = el('tr');
  head.forEach(h => tr.appendChild(el('th', null, h)));
  th.appendChild(tr); t.appendChild(th);
  const tb = el('tbody');
  rows.forEach(r => {
    const x = el('tr');
    r.forEach(c => {
      const td = el('td');
      if (c && typeof c === 'object' && c.html != null) td.innerHTML = c.html;
      else td.textContent = c == null ? '—' : c;
      x.appendChild(td);
    });
    tb.appendChild(x);
  });
  t.appendChild(tb);
}
tbl('#navtable',
  ['Viewport','At rest','Hamburger','On toggle','Drawer','Cols at rest','Cols after','Grid reflows?'],
  L.nav_table.map(r => [{html:'<code>' + r.vp + '</code>'}, r.resting, 'always',
    {html:'<b>' + r.on_open + '</b>'}, r.drawer_w ? r.drawer_w + 'px' : '—',
    r.cols_rest + ' @ ' + r.col_rest.toFixed(1),
    r.cols_open + ' @ ' + r.col_open.toFixed(1),
    r.reflow ? 'yes — you asked for it' : 'no']));

tbl('#archtable', ['Archetype','Rail at','Expanded at','Subnav column at','Why'],
  Object.entries(L.arch_nav).map(([k, v]) => [{html:'<b>' + k + '</b>'},
    v.rail_min == null ? 'never' : '1024',
    v.expanded_min == null ? 'never' : v.expanded_min,
    v.subnav_col_min || '—', v.why]));

tbl('#cattable', ['Category','Role','Min','Max','Fits — each with a measured pixel floor'],
  L.categories.map(c => [{html:'<b>' + c.name + '</b> <code>' + c.id + '</code>'}, c.role,
    c.fits[c.fits.length-1].cols + '×' + c.fits[c.fits.length-1].rows,
    c.max[0] + '×' + c.max[1],
    {html: c.fits.map(f => '<code>' + f.cols + '×' + f.rows + '</code> ' + f.variant
      + ' <span style="color:var(--vq-ink-400)">≥' + f.floor + 'px</span>').join('<br>')}]));

tbl('#modetable', ['Mode','Stores','Packs','Why it exists','Prior art'],
  L.placement.modes.map(m => [{html:'<b>' + m.name + '</b>'}, {html:'<code>' + m.stores + '</code>'},
    m.packs, m.why, {html:'<span style="color:var(--vq-ink-500)">' + m.prior_art + '</span>'}]));

tbl('#boxtable', ['Category','Handle stops at (1920, 12 cols)','Shortest legal height per width'],
  L.categories.map(c => {
    const g = geometry(1905, {arch:'dashboard'});
    const l = boxLimits(c.id, g);
    return [{html:'<b>' + c.name + '</b> <code>' + c.id + '</code>'},
      {html:'<code>' + l.wmin + '–' + l.wmax + '</code> columns · <code>1–' + l.hmax + '</code> rows'},
      {html: Object.keys(l.hmin).map(w => w + '→' + l.hmin[w] + 'r').join(' · ')}];
  }));

tbl('#splittable', ['Splitter','Minimum','Maximum','Snaps to','Persists as'],
  L.splitter.where.map(s => [{html:'<b>' + s.id + '</b><br><span style="color:var(--vq-ink-500)">'
    + s.region + '</span>'}, s.min, s.max, s.snaps, {html:'<code>' + s.persists + '</code>'}]));

tbl('#keytable', ['Key','Does'],
  Object.entries(L.splitter.aria.keys).map(([k, v]) => [{html:'<code>' + k + '</code>'}, v]));

tbl('#projtable', ['Column class','What the same layout becomes','Source'],
  [24,20,16,12,10,8,6,4].map(n => {
    const g = geometry(1905, {arch:'dashboard'});
    const src = [{id:'a',catId:'C3',col:0,row:0,w:4,h:2},{id:'b',catId:'C3',col:4,row:0,w:4,h:2},
                 {id:'c',catId:'C4',col:14,row:0,w:4,h:4},{id:'e',catId:'C6',col:10,row:4,w:8,h:8}];
    const out = projectLayout(src, 24, n);
    return [{html:'<code>' + n + '</code>'},
      {html: out.map(b => '<code>' + b.id + '</code> at ' + b.col + ',' + b.row
        + ' · ' + b.w + '×' + b.h).join('<br>')},
      n === 24 ? 'authored' : 'projected once, from 24'];
  }));

tbl('#edittable', ['Gesture','Does','Snapped to'],
  L.edit.grants.map(g => [{html:'<b>' + g.id + '</b>'}, g.gesture, g.snap]));

const inv = $('#invariants');
L.edit.invariants.forEach(i => { const li = el('li'); li.textContent = i; inv.appendChild(li); });

addEventListener('resize', () => { if (!state.drag && !state.split) render(); });
render();
