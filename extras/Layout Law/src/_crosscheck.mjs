import * as E from './venqore-layout-engine.js';
import fs from 'fs';
const PY = JSON.parse(fs.readFileSync('./layout-law-v2.json','utf8'));
let checks=0, fails=[];
const eq=(a,b,l)=>{checks++; if(a!==b) fails.push(`${l}: js=${a} py=${b}`);};
const near=(a,b,l,t=1.0)=>{checks++; if(Math.abs(a-b)>t) fails.push(`${l}: js=${a} py=${b}`);};

// 1. THE TERMINAL COMPOSER — every preset × every representative viewport
for (const pr of PY.pos.presets) {
  const solved = PY.pos.solved[pr.id];
  for (const [vp, s] of Object.entries(solved)) {
    const r = E.composeTerminal(pr.comp, +vp, s.vh);
    const L = `pos ${pr.id}@${vp}`;
    eq(r.regime, s.regime, `${L} regime`);
    eq(r.cartLines, s.cart_lines, `${L} cartLines`);
    near(r.cart.px, s.cart.px, `${L} cart px`);
    eq(r.cart.fit, s.cart.fit, `${L} cart fit`);
    eq(r.tender.mode, s.tender.mode, `${L} tender mode`);
    if (s.tender.px) { near(r.tender.px, s.tender.px, `${L} tender px`);
                       eq(r.tender.fit, s.tender.fit, `${L} tender fit`); }
    eq(!!r.catalog, !!s.catalog, `${L} catalog present`);
    if (s.catalog) {
      eq(r.catalog.mode, s.catalog.mode, `${L} catalog mode`);
      if (s.catalog.px) near(r.catalog.px, s.catalog.px, `${L} catalog px`);
      if (s.catalog.rows) { eq(r.catalog.rows, s.catalog.rows, `${L} catalog rows`);
                            eq(r.catalog.tiles, s.catalog.tiles, `${L} catalog tiles`); }
    }
    eq(r.dock.map(d=>d.id).join(','), s.dock.map(d=>d.id).join(','), `${L} dock`);
    eq(r.dockH, s.dock_h, `${L} dockH`);
    for (const k of Object.keys(s.reachable)) eq(r.reachable[k], s.reachable[k], `${L} reachable.${k}`);
  }
}
// 2. REACHABILITY, CONTINUOUSLY — every preset, every 8px from 320 to 3440,
//    at the interpolated height for that width. Nothing may ever be stranded.
for (const pr of PY.pos.presets) {
  for (let vw=320; vw<=3440; vw+=8) {
    const r = E.composeTerminal(pr.comp, vw);
    checks++;
    for (const [k,v] of Object.entries(r.reachable))
      if (!v) fails.push(`sweep ${pr.id}@${vw} UNREACHABLE ${k}`);
    if (r.cart.belowFloor && vw >= 360) fails.push(`sweep ${pr.id}@${vw} cart below floor ${Math.round(r.cart.px)}`);
    if (r.dock.length && r.dockH <= 0) fails.push(`sweep ${pr.id}@${vw} dock has no height`);
    // the catalog must never be a resident COLUMN on a screen too narrow for one
    if (r.catalog && (r.catalog.mode==='left'||r.catalog.mode==='right')
        && r.avail < PY.pos.catalog_resident_min_avail)
      fails.push(`sweep ${pr.id}@${vw} catalog column too narrow`);
  }
}
// 3. DOCUMENT
for (const [vp,s] of Object.entries(PY.document.solved)) {
  const d = E.layoutDocument(+vp);
  eq(d.lines.variant, s.lines.variant, `doc@${vp} lines`);
  eq(d.maxDensity, s.lines.max_density, `doc@${vp} density`);
  eq(d.summary, s.summary, `doc@${vp} summary`);
  eq(d.header, s.header, `doc@${vp} header`);
  eq(d.geometry.nav, s.nav, `doc@${vp} nav`);
}
// 4. NAV
for (const r of PY.nav_table) {
  const s=E.shell(r.vp,'dashboard'), o=E.shell(r.vp,'dashboard',{open:true});
  eq(s.nav, r.resting, `nav@${r.vp} resting`);
  eq(s.behaviour, r.on_open, `nav@${r.vp} behaviour`);
  if (r.on_open==='overlay') near(o.overlayWidth, r.drawer_w, `nav@${r.vp} drawer`);
}
// 5. CARDS — every category at every breakpoint, plus a continuous sweep
for (const [cid,table] of Object.entries(PY.promotion)) {
  for (const [vp,exp] of Object.entries(table)) {
    const g=E.geometry(+vp,{arch:'dashboard'}), r=E.resolveCard(cid,g);
    eq(r.cols, exp.cols, `card ${cid}@${vp} cols`);
    eq(r.variant, exp.variant, `card ${cid}@${vp} variant`);
    near(r.px, exp.width, `card ${cid}@${vp} px`, .5);
  }
}
for (let vw=320; vw<=3840; vw++) {
  const g=E.geometry(vw,{arch:'dashboard'});
  for (const cat of PY.categories) {
    const r=E.resolveCard(cat.id,g); checks++;
    if (!r.ok && !r.underflow) fails.push(`sweep ${cat.id}@${vw} below floor`);
    if (r.cols > g.cols) fails.push(`sweep ${cat.id}@${vw} overflow`);
  }
}
// 5b. THE DOCUMENT COMPOSER — every preset × every representative viewport
for (const pr of PY.document.presets) {
  for (const [vp, s] of Object.entries(PY.document.composed[pr.id])) {
    const r = E.composeDocument(pr.comp, +vp, s.vh);
    const L = `doc ${pr.id}@${vp}`;
    eq(r.nav, s.nav, `${L} nav`); eq(r.navHeld, s.nav_held, `${L} navHeld`);
    near(r.avail, s.avail, `${L} avail`);
    eq(r.details.mode, s.details.mode, `${L} details`);
    eq(r.details.twoCol, s.details.two_col, `${L} twoCol`);
    near(r.details.h, s.details.h, `${L} detailsH`);
    near(r.lines.px, s.lines.px, `${L} linesPx`);
    eq(r.lines.fit, s.lines.fit, `${L} lineFit`);
    near(r.lines.h, s.lines.h, `${L} linesH`);
    eq(r.lines.rowsVisible, s.lines.rows_visible, `${L} rowsVisible`);
    eq(r.summary.mode, s.summary.mode, `${L} summary`);
    near(r.summary.px, s.summary.px, `${L} summaryPx`);
    eq(r.summary.pin, s.summary.pin, `${L} pin`);
    eq(r.summary.canStick, s.summary.can_stick, `${L} canStick`);
    eq(r.density, s.density, `${L} density`);
    eq(r.dock.length, s.dock.length, `${L} dock`);
    eq(r.dockH, s.dock_h, `${L} dockH`); eq(r.reserve, s.reserve, `${L} reserve`);
    for (const k of Object.keys(s.reachable)) eq(r.reachable[k], s.reachable[k], `${L} reachable.${k}`);
  }
}
// 5c. DOCUMENT, CONTINUOUSLY — nothing stranded, nothing under a floor, and
//     the dock always reserves its own height rather than floating over the
//     last line, which is the same defect the Counter POS had.
for (const pr of PY.document.presets) {
  for (let vw = PY.min_viewport; vw <= 3440; vw += 8) {
    const r = E.composeDocument(pr.comp, vw); checks++;
    for (const [k, v] of Object.entries(r.reachable))
      if (!v) fails.push(`docsweep ${pr.id}@${vw} UNREACHABLE ${k}`);
    if (r.lines.px < PY.measured_floors.doc_table_card - .01)
      fails.push(`docsweep ${pr.id}@${vw} lines below floor ${Math.round(r.lines.px)}`);
    if (r.summary.mode === "right" && r.summary.px < PY.measured_floors.doc_summary_min - .01)
      fails.push(`docsweep ${pr.id}@${vw} summary below floor`);
    if (r.dock.length && r.reserve < r.dockH)
      fails.push(`docsweep ${pr.id}@${vw} dock not reserved`);
    if (r.lines.h < PY.document.metrics.lines_min_h - .01)
      fails.push(`docsweep ${pr.id}@${vw} lines have no height ${Math.round(r.lines.h)}`);
    if (r.summary.pin === "sticky" && !r.summary.canStick)
      fails.push(`docsweep ${pr.id}@${vw} sticky does not fit`);
  }
}

// 6. PLACEMENT — the resize handle's travel, against the solver's own table
for (const [cid, table] of Object.entries(PY.placement.box_limits)) {
  for (const [vp, exp] of Object.entries(table)) {
    const g = E.geometry(+vp, {arch:'dashboard'});
    const l = E.boxLimits(cid, g), L = `box ${cid}@${vp}`;
    eq(l.wmin, exp.wmin, `${L} wmin`); eq(l.wmax, exp.wmax, `${L} wmax`);
    eq(l.hmax, exp.hmax, `${L} hmax`); eq(l.underflow, exp.underflow, `${L} underflow`);
    for (const w of Object.keys(exp.hmin)) eq(l.hmin[w], exp.hmin[w], `${L} hmin[${w}]`);
  }
}
// 6b. PROJECTION — a deliberately gappy layout through every column class.
//     In bounds, no overlap, nothing lost, and every box still holds a fit.
const SRC = [
  {id:'a',catId:'C3',col:0, row:0,w:4,h:2},{id:'b',catId:'C3',col:4, row:0,w:4,h:2},
  {id:'c',catId:'C4',col:14,row:0,w:4,h:4},{id:'d',catId:'C5',col:0, row:2,w:6,h:6},
  {id:'e',catId:'C6',col:10,row:4,w:8,h:8},{id:'f',catId:'C1',col:22,row:0,w:2,h:1}];
const hit=(a,b)=>a.col<b.col+b.w&&b.col<a.col+a.w&&a.row<b.row+b.h&&b.row<a.row+a.h;
for (let vw = 320; vw <= 3440; vw += 4) {
  const g = E.geometry(vw, {arch:'dashboard'});
  const out = E.projectLayout(SRC, 24, g.cols, g); checks++;
  if (out.length !== SRC.length) fails.push(`project@${vw} lost a card`);
  for (const b of out) {
    if (b.col < 0 || b.col + b.w > g.cols) fails.push(`project@${vw} ${b.id} out of bounds`);
    if (!E.boxLimits(b.catId, g).underflow && !E.fitInBox(b.catId, b.w, b.h, g.col))
      fails.push(`project@${vw} ${b.id} ${b.w}x${b.h} holds no fit`);
  }
  for (let i=0;i<out.length;i++) for (let j=i+1;j<out.length;j++)
    if (hit(out[i],out[j])) fails.push(`project@${vw} ${out[i].id}/${out[j].id} overlap`);
  if (E.readingOrder(out).length !== SRC.length) fails.push(`project@${vw} reading order`);
}
// 6c. AUTHORED CLASSES ARE STICKY — projecting away and back must restore the
//     layout exactly, because the projection always runs from the authored one.
for (const n of [24,20,16,12,10,8,6,4]) {
  const store = {24: SRC}; checks++;
  const there = E.layoutFor(store, n);
  const back  = E.layoutFor(store, 24);
  const key = l => [...l].map(b=>`${b.id}:${b.col},${b.row},${b.w},${b.h}`).sort().join('|');
  if (key(back) !== key(SRC))
    fails.push(`authored ${n}: round trip changed the authored class`);
  if (there.length !== SRC.length) fails.push(`authored ${n}: lost a card`);
}
// 7. SPLITTER — travel, snaps, and the hard stop, against the solver
for (const [vp, per] of Object.entries(PY.splitter.travel)) {
  for (const [arch, exp] of Object.entries(per)) {
    const t = E.navTravel(+vp, arch), L = `split ${arch}@${vp}`;
    near(t.min, exp.min, `${L} min`, .01); near(t.max, exp.max, `${L} max`, .01);
    eq(E.contentFloor(arch), exp.content_floor, `${L} content floor`);
    eq(E.navSnaps(+vp, arch).map(s=>s.px).join(','),
       exp.snaps.map(s=>s.px).join(','), `${L} snaps`);
  }
}
for (let vw = 360; vw <= 3440; vw += 4) {
  for (const arch of ['dashboard','document','terminal']) {
    const t = E.navTravel(vw, arch); checks++;
    if (t.max < t.min) fails.push(`split@${vw} ${arch} inverted`);
    if (E.snapNav(t.max + 900, vw, arch).px > t.max + .01)
      fails.push(`split@${vw} ${arch} escaped max`);
    if (E.snapNav(-900, vw, arch).px < t.min - .01)
      fails.push(`split@${vw} ${arch} escaped min`);
    for (const s of E.navSnaps(vw, arch))
      if (s.px < t.min - .01 || s.px > t.max + .01)
        fails.push(`split@${vw} ${arch} snap ${s.px} outside travel`);
    // the whole point: a dragged sidebar can never starve the grid
    if (E.navBehaviour(vw) === 'push' && arch === 'dashboard') {
      const g = E.geometry(vw, {arch, navW: t.max, prefs:{intent:'expanded'}});
      if (g.nav !== 'hidden' && g.col < PY.constants.desk_col_floor - .01 && vw >= 1024)
        fails.push(`split@${vw} at max the column fell to ${g.col.toFixed(1)}`);
    }
  }
}
console.log(`${checks.toLocaleString()} checks`);
if (fails.length) { console.log(`${fails.length} FAILURES:`); fails.slice(0,25).forEach(f=>console.log('  ',f)); process.exit(1); }
else console.log('ALL AGREE — JS engine and Python solver identical on every combination');
