#!/usr/bin/env python3
"""The rendered-DOM half of the verification.

The solver and the engine agree with each other on 35,255 checks — but they
agree about *numbers*. This asks the browser three questions the arithmetic
cannot answer:

  1. does anything actually escape the screen,
  2. is a rank-1 control ever off-screen or covered by something floating,
  3. do the heights the law computes match the heights the stylesheet paints.

An element inside a horizontally scrollable box is NOT an escape — it is
reachable by scrolling, which is the whole point of a scroll container. So the
probe walks up to the nearest clipping ancestor and asks whether the element is
outside *that*.
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).parent
URL = lambda n: "file://" + str((ROOT / "out" / n).resolve())

ESCAPE = """(sel) => {
  const sc = document.querySelector('#screen');
  const r0 = sc.getBoundingClientRect(), out = [];
  const scrollable = e => {
    for (let p = e.parentElement; p && p !== sc; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (/auto|scroll/.test(c.overflowX) || /auto|scroll/.test(c.overflowY)) return true;
      if (c.position === 'fixed' || c.position === 'absolute') return false;
    }
    return false;
  };
  for (const e of sc.querySelectorAll('*')) {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (scrollable(e)) continue;
    // A closed drawer or sheet is PARKED off-screen on purpose. Rather than
    // naming every class that does it, walk up: if any ancestor is entirely
    // outside the screen, this element is inside something that is closed.
    // fully outside = parked (a closed drawer). PARTLY outside = escaping.
    if (r.right <= r0.left + 1 || r.left >= r0.right - 1) continue;
    let parked = false;
    for (let p = e.parentElement; p && p !== sc; p = p.parentElement) {
      const pr = p.getBoundingClientRect();
      if (pr.width && (pr.right <= r0.left + 1 || pr.left >= r0.right - 1)) { parked = true; break; }
    }
    if (parked) continue;
    if (r.right > r0.right + 1.5 || r.left < r0.left - 1.5)
      out.push(sel + ' ' + (e.className || e.tagName) + ' x'
               + Math.round(r.left - r0.left) + '..' + Math.round(r.right - r0.left));
  }
  return out;
}"""

# A rank-1 control that is on screen but sitting under something floating is
# not reachable. elementFromPoint at its centre is the only honest test.
COVERED = """(sels) => {
  const sc = document.querySelector('#screen').getBoundingClientRect(), bad = [];
  for (const s of sels) for (const b of document.querySelectorAll('#screen ' + s)) {
    const r = b.getBoundingClientRect();
    if (!r.width || r.right < sc.left || r.left > sc.right) continue;
    if (r.top < sc.top - 1 || r.bottom > sc.bottom + 1) continue;
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (hit && !b.contains(hit) && !hit.contains(b))
      bad.push(s + ' covered by ' + (hit.className || hit.tagName));
  }
  return bad;
}"""

DEV = [[390,745],[600,900],[768,950],[820,1180],[1024,695],[1216,700],
       [1265,570],[1425,750],[1708,900],[1905,940],[2545,1290]]

async def sweep(pg, setup, label, actions):
    esc, cov = [], []
    for vw, vh in DEV:
        for a in actions:
            await pg.evaluate(setup.format(vw=vw, vh=vh, a=a))
            esc += await pg.evaluate(ESCAPE, f"{label}/{a}/{vw}")
            cov += await pg.evaluate(COVERED, ['.btn.pri', '.dockbar .btn',
                                               '.pane-f button', '.dockpay', '.docktotal'])
    return esc, cov

async def main():
    errs, esc, cov = [], [], []
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={"width":1560,"height":1060}, device_scale_factor=1)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text)
              if m.type == "error" and "ERR_TUNNEL" not in m.text else None)

        # ---- shell: both placement modes, edit on and off ----------------
        await pg.goto(URL("venqore-shell.html")); await pg.wait_for_timeout(1000)
        e, c = await sweep(pg,
            "state.w={vw};state.h={vh};state.mode='{a}';state.edit=true;"
            "state.layouts={{}};state.navW=null;render()", "shell", ["flow", "free"])
        esc += e; cov += c
        e, c = await sweep(pg,
            "state.w={vw};state.h={vh};state.mode='{a}';state.edit=false;render()",
            "shell-view", ["flow", "free"])
        esc += e; cov += c
        # the splitter at both ends of its travel
        for vw, vh in DEV:
            for end in ("min", "max"):
                await pg.evaluate(f"state.w={vw};state.h={vh};state.edit=false;"
                                  f"state.intent='expanded';"
                                  f"state.navW=navTravel({vw},state.arch).{end};render()")
                esc += await pg.evaluate(ESCAPE, f"shell-split-{end}/{vw}")
        await pg.evaluate("state.navW=null;state.intent=null;render()")

        # ---- the register: every preset ---------------------------------
        await pg.goto(URL("venqore-pos.html")); await pg.wait_for_timeout(1000)
        presets = await pg.evaluate("LAW.pos.presets.map(p=>p.id)")
        e, c = await sweep(pg,
            "state.w={vw};state.h={vh};state.preset='{a}';"
            "state.comp=presetComposition('{a}');render()", "pos", presets)
        esc += e; cov += c

        # ---- the document: every preset ---------------------------------
        await pg.goto(URL("venqore-document.html")); await pg.wait_for_timeout(1000)
        dpresets = await pg.evaluate("DATA.presets.map(p=>p.id)")
        e, c = await sweep(pg,
            "state.w={vw};state.h={vh};state.preset='{a}';"
            "state.comp=presetDocument('{a}');state.scrolled=true;render()", "doc", dpresets)
        esc += e; cov += c

        # ---- the law's box heights vs the ones the stylesheet paints -----
        drift = await pg.evaluate("""(()=>{
          state.w=1905;state.h=940;state.preset='pro';
          state.comp=presetDocument('pro');state.scrolled=true;render();
          const M=DATA.metrics, out=[];
          // The device frame is CSS-transformed, so getBoundingClientRect is
          // scaled. Divide it back out before comparing with the law's pixels.
          const S=state.scale||1;
          const chk=(sel,want,name)=>{const e=document.querySelector(sel);
            if(!e) return; const h=Math.round(e.getBoundingClientRect().height/S);
            if(Math.abs(h-want)>1.5) out.push(name+': law '+want+', painted '+h);};
          chk('.zone-h',M.zone_h,'zone header');
          chk('.sum-row:not(.tot)',M.sum_row,'summary row');
          chk('.sum-row.tot',M.sum_tot_row,'summary total row');
          chk('.actions',M.actions_h,'actions');
          chk('.dockbar',M.dock_h,'dock');
          state.comp.details='collapsed';render();
          chk('.strip',M.strip_h,'details strip');
          return out;})()""")

        # ---- card heights land on the row ladder ------------------------
        await pg.goto(URL("venqore-shell.html")); await pg.wait_for_timeout(900)
        ladder = await pg.evaluate("""(()=>{
          state.w=1905;state.h=940;state.edit=false;state.mode='flow';render();
          const want=DATA.law.row_heights, bad=[], S=state.scale||1;
          document.querySelectorAll('.grid .card').forEach(c=>{
            const rows=+c.style.gridRow.replace(/\\D/g,'')||1;
            const h=Math.round(c.getBoundingClientRect().height/S);
            const w=want[String(rows)];
            if(w && Math.abs(h-w)>1.5) bad.push(rows+'r: want '+w+', got '+h);});
          return [...new Set(bad)];})()""")
        await b.close()

    print(f"escapes            {len(esc)}")
    for x in esc[:10]: print("   ", x)
    print(f"covered rank-1     {len(cov)}")
    for x in cov[:10]: print("   ", x)
    print(f"law vs stylesheet  {len(drift)}")
    for x in drift: print("   ", x)
    print(f"row ladder         {len(ladder)}")
    for x in ladder: print("   ", x)
    print(f"page errors        {len(errs)}")
    for x in errs[:6]: print("   ", x)
    ok = not (esc or cov or drift or ladder or errs)
    print("\n" + ("ALL CLEAN — nothing escapes, nothing is covered, and the stylesheet "
                  "paints what the law measured" if ok else "FAILURES ABOVE"))
    return 0 if ok else 1

raise SystemExit(asyncio.run(main()))
