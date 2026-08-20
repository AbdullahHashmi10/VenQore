#!/usr/bin/env python3
"""Drive the document page: scroll, drag the divider, check nothing is covered."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

PAGE = "file://" + str((Path(__file__).parent / "out/venqore-document.html").resolve())

CONTAIN = """(()=>{const sc=document.querySelector('#screen').getBoundingClientRect();
  const bad=[];document.querySelectorAll('#screen *').forEach(e=>{
    const r=e.getBoundingClientRect();
    if(r.width>0&&r.height>0&&(r.right>sc.right+1.5||r.left<sc.left-1.5))
      bad.push((e.className||e.tagName)+' r'+Math.round(r.right-sc.right)+' b'+Math.round(r.bottom-sc.bottom));});
  return bad.slice(0,6)})()"""

# The Counter-POS defect, restated for this screen: does the dock cover the
# last line even when the user has scrolled all the way down?
COVERED = """(()=>{const d=document.querySelector('.dockbar');
  if(!d||!d.classList.contains('on'))return {dock:false};
  const s=document.querySelector('.docscroll');
  s.scrollTop=s.scrollHeight;
  const db=d.getBoundingClientRect();
  const last=[...document.querySelectorAll('.lines-tbl tbody tr, .linecard')].pop()
          || document.querySelector('.addline');
  const lb=last.getBoundingClientRect();
  const overlap = !(lb.bottom<=db.top||lb.top>=db.bottom||lb.right<=db.left||lb.left>=db.right);
  return {dock:true, overlap, gap: Math.round(db.top-lb.bottom),
          bottomed: Math.round(s.scrollHeight-s.scrollTop-s.clientHeight)}})()"""

async def main():
    errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={"width":1560,"height":1060}, device_scale_factor=2)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error"
              and "ERR_TUNNEL" not in m.text else None)
        await pg.goto(PAGE); await pg.wait_for_timeout(1200)

        print("1. THE DOCK — appears on scroll, and never covers the last line")
        for preset, vw, vh in [("pro",1905,940), ("panel",1425,750), ("stack",1265,570),
                               ("touch",768,950), ("panel",390,745)]:
            await pg.evaluate(f"state.preset='{preset}';state.comp=presetDocument('{preset}');"
                              f"state.w={vw};state.h={vh};state.scrolled=false;render();"
                              "document.querySelector('.stage').scrollIntoView({block:'start'})")
            await pg.wait_for_timeout(250)
            await pg.evaluate("(()=>{const s=document.querySelector('.docscroll');"
                              "s.scrollTop=200;s.dispatchEvent(new Event('scroll'))})()")
            await pg.wait_for_timeout(250)
            r = await pg.evaluate(COVERED)
            c = await pg.evaluate(CONTAIN)
            print(f"   {preset:6s} {vw:5d}x{vh:<4d} {json.dumps(r):64s} escapes={c}")

        print("\n2. THE DIVIDER between the items and the summary")
        await pg.evaluate("state.preset='panel';state.comp=presetDocument('panel');"
                          "state.w=1905;state.h=940;render();"
                          "document.querySelector('.stage').scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(350)
        h = await (await pg.query_selector('.vsplit')).bounding_box()
        print("   handle:", {k: round(v) for k, v in h.items()})
        before = await pg.evaluate("state.comp.split")
        await pg.mouse.move(h["x"]+7, h["y"]+90); await pg.mouse.down()
        for i in range(1, 13):
            await pg.mouse.move(h["x"]+7 - i*14, h["y"]+90)
            if i == 8:
                await pg.wait_for_timeout(120)
                await pg.screenshot(path="out/shot_d2_split.png")
        await pg.mouse.up(); await pg.wait_for_timeout(220)
        after = await pg.evaluate("state.comp.split")
        print(f"   split {before:.2f} -> {after:.2f}   summary "
              f"{await pg.evaluate('Math.round(composeDocument(state.comp,state.w,state.h).summary.px)')}px")
        # drag it past the end: it must stop, not break
        await pg.mouse.move(h["x"]+7, h["y"]+90); await pg.mouse.down()
        await pg.mouse.move(h["x"]+7 - 2000, h["y"]+90); await pg.mouse.up()
        await pg.wait_for_timeout(200)
        print("   dragged 2000px past the end -> split",
              round(await pg.evaluate("state.comp.split"), 3),
              "lines", await pg.evaluate(
                "Math.round(composeDocument(state.comp,state.w,state.h).lines.px)"), "px")

        print("\n3. TAP A LINE on a narrow screen — controls open in place")
        await pg.evaluate("state.preset='touch';state.comp=presetDocument('touch');"
                          "state.w=390;state.h=745;state.openLine=null;render();"
                          "document.querySelector('.stage').scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(300)
        card = await pg.query_selector('.linecard')
        if card:
            await card.click(); await pg.wait_for_timeout(250)
            print("   openLine:", await pg.evaluate("state.openLine"),
                  " adjust row present:", await pg.evaluate("!!document.querySelector('.adjust')"))
            await pg.screenshot(path="out/shot_d2_phone_adj.png")
        else:
            print("   ! no line cards at 390")

        print("\n4. CONTAINMENT sweep — every preset, every device")
        bad = await pg.evaluate("""(()=>{const out=[];
          for (const p of DATA.presets) for (const [vw,vh] of
              [[390,745],[600,900],[768,950],[820,1180],[1024,695],[1265,570],[1425,750],[1708,900],[1905,940],[2545,1290]]) {
            state.preset=p.id;state.comp=presetDocument(p.id);state.w=vw;state.h=vh;render();
            const sc=document.querySelector('#screen').getBoundingClientRect();
            document.querySelectorAll('#screen *').forEach(e=>{const r=e.getBoundingClientRect();
              if(r.width>0&&r.height>0&&(r.right>sc.right+1.5||r.left<sc.left-1.5))
                out.push(p.id+' '+vw+' '+(e.className||e.tagName));});
            // every rank-1 action must be on screen
            const btns=[...document.querySelectorAll('#screen .btn.pri, #screen .dockbar .btn')];
            const vis=btns.filter(b=>{const r=b.getBoundingClientRect();
              return r.width>0&&r.left>=sc.left-1&&r.right<=sc.right+1&&r.top>=sc.top-1&&r.bottom<=sc.bottom+1;});
            if(!vis.length) out.push(p.id+' '+vw+'x'+vh+' NO PRIMARY ACTION ON SCREEN');
          }
          return out.slice(0,12)})()""")
        print("   ", bad or "clean — nothing escapes, and every screen has a primary action")

        await pg.evaluate("state.preset='panel';state.comp=presetDocument('panel');"
                          "state.w=768;state.h=950;render();"
                          "document.querySelector('.stage').scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(400)
        await (await pg.query_selector('.stage')).screenshot(path="out/shot_d2_tab768.png")
        await pg.evaluate("state.w=1024;state.h=695;render()"); await pg.wait_for_timeout(350)
        await (await pg.query_selector('.stage')).screenshot(path="out/shot_d2_tab1024.png")
        await pg.evaluate("state.preset='touch';state.comp=presetDocument('touch');"
                          "state.w=390;state.h=745;state.openLine=1;render()")
        await pg.wait_for_timeout(350)
        await (await pg.query_selector('.stage')).screenshot(path="out/shot_d2_phone.png")
        await b.close()
    print("\nconsole errors:", errs[:8] or "none")

asyncio.run(main())
