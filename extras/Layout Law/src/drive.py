#!/usr/bin/env python3
"""Drive the shell page with real pointer gestures and report what the law did."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

PAGE = "file://" + str((Path(__file__).parent / "out/venqore-shell.html").resolve())

async def box(pg, sel):
    h = await pg.query_selector(sel)
    return await h.bounding_box() if h else None

async def drag(pg, x0, y0, x1, y1, steps=14, shot=None, at=0.6):
    await pg.mouse.move(x0, y0); await pg.mouse.down()
    for i in range(1, steps + 1):
        t = i / steps
        await pg.mouse.move(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
        if shot and abs(t - at) < .5 / steps:
            await pg.wait_for_timeout(120)
            await pg.screenshot(path=f"out/shot_{shot}.png")
            print("  mid-drag shot", shot)
    await pg.wait_for_timeout(80)
    await pg.mouse.up(); await pg.wait_for_timeout(200)

async def main():
    errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={"width":1560,"height":1050}, device_scale_factor=2)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error"
              and "ERR_TUNNEL" not in m.text else None)
        await pg.goto(PAGE); await pg.wait_for_timeout(1200)

        await pg.evaluate("state.w=1265;state.h=760;state.edit=true;state.mode='free';"
                          "document.querySelector('#w').value=1265;render();"
                          "document.querySelector('.stage').scrollIntoView({block:'start'});")
        await pg.wait_for_timeout(500)
        print("scale:", await pg.evaluate("state.scale"))

        # ---- 1. move a card to the far right, leaving a hole -------------
        src = await box(pg, '.card[data-id="f"]')
        print("\n1. MOVE  'Net profit' right + down")
        await drag(pg, src["x"] + 90, src["y"] + 46,
                       src["x"] + 90 + 430, src["y"] + 46 + 200,
                   shot="e_ghost_move", at=0.55)
        print("  ", await pg.evaluate(
          "JSON.stringify(state.layouts[Object.keys(state.layouts)[0]].find(b=>b.id==='f'))"))
        print("   gaps preserved:", await pg.evaluate(
          "(()=>{const g=geometry(state.w,{arch:'dashboard'});const bs=state.layouts[g.cols];"
          "const filled=new Set();bs.forEach(b=>{for(let r=b.row;r<b.row+b.h;r++)"
          "for(let c=b.col;c<b.col+b.w;c++)filled.add(r+':'+c)});"
          "const maxR=Math.max(...bs.map(b=>b.row+b.h));let holes=0;"
          "for(let r=0;r<maxR;r++)for(let c=0;c<g.cols;c++)if(!filled.has(r+':'+c))holes++;"
          "return holes})()"))
        await pg.screenshot(path="out/shot_e_free_moved.png")

        # ---- 2. resize with the SE handle -------------------------------
        print("\n2. RESIZE  'Gross revenue' by dragging the corner")
        before = await pg.evaluate("JSON.stringify(state.layouts[Object.keys(state.layouts)[0]]"
                                   ".find(b=>b.id==='e'))")
        h = await box(pg, '.card[data-id="e"] .rz')
        await drag(pg, h["x"]+9, h["y"]+9, h["x"]+9+230, h["y"]+9+150,
                   shot="e_ghost_resize", at=0.6)
        after = await pg.evaluate("JSON.stringify(state.layouts[Object.keys(state.layouts)[0]]"
                                  ".find(b=>b.id==='e'))")
        print("   before", before, "\n   after ", after)

        # ---- 3. resize PAST the maximum: the handle must stop ------------
        print("\n3. RESIZE past the category max — the handle must stop")
        h = await box(pg, '.card[data-id="e"] .rz')
        await drag(pg, h["x"]+9, h["y"]+9, h["x"]+9+2000, h["y"]+9+2000, steps=10)
        print("   after a 2000px drag:", await pg.evaluate(
          "JSON.stringify(state.layouts[Object.keys(state.layouts)[0]].find(b=>b.id==='e'))"),
          "max:", await pg.evaluate("JSON.stringify(LAW.categories.find(c=>c.id==='C3').max)"))

        # ---- 4. the splitter --------------------------------------------
        print("\n4. SPLITTER  drag the nav divider")
        await pg.evaluate("state.mode='flow';render()")
        s = await box(pg, '.split')
        print("   handle:", None if not s else {k:round(v) for k,v in s.items()})
        await drag(pg, s["x"]+2, s["y"]+300, s["x"]+2+170, s["y"]+300,
                   shot="e_split_drag", at=0.75)
        print("   navW now:", await pg.evaluate("state.navW"),
              " cols:", await pg.evaluate("geometry(state.w,{arch:'dashboard',navW:state.navW,"
                                          "prefs:{intent:state.intent}}).cols"))
        await pg.screenshot(path="out/shot_e_split_after.png")

        print("\n5. SPLITTER dragged far past the end — must stop at the law")
        s = await box(pg, '.split')
        await drag(pg, s["x"]+2, s["y"]+300, s["x"]+2+1400, s["y"]+300, steps=10)
        r = await pg.evaluate("({navW:state.navW,travel:navTravel(state.w,state.arch),"
                              "cols:geometry(state.w,{arch:'dashboard',navW:state.navW,"
                              "prefs:{intent:state.intent}}).cols,"
                              "col:geometry(state.w,{arch:'dashboard',navW:state.navW,"
                              "prefs:{intent:state.intent}}).col})")
        print("  ", json.dumps(r))

        # ---- 6. keyboard ------------------------------------------------
        print("\n6. KEYBOARD on the splitter")
        await pg.evaluate("state.navW=null;render()")
        await pg.focus('.split')
        for k in ["Home", "ArrowRight", "ArrowRight", "End", "Enter"]:
            await pg.keyboard.press(k); await pg.wait_for_timeout(90)
            await pg.focus('.split')
            print(f"   {k:11s} -> navW {await pg.evaluate('state.navW')}")

        # ---- 7. class projection: shrink the window ---------------------
        print("\n7. PROJECTION  author at 12, then walk down the classes")
        await pg.evaluate("state.w=1905;state.navW=null;state.mode='free';state.layouts={};render()")
        await pg.wait_for_timeout(200)
        for vw in [1905, 1425, 1265, 1024, 768, 390]:
            r = await pg.evaluate(f"""(()=>{{state.w={vw};render();
              const g=geometry({vw},{{arch:'dashboard',prefs:{{}} }});
              const cur=currentBoxes(g);
              return {{vw:{vw},cols:g.cols,mode:cur.mode,
                boxes:cur.boxes?cur.boxes.length:null,
                deep:cur.boxes?Math.max(...cur.boxes.map(b=>b.row+b.h)):null,
                overlap:cur.boxes?cur.boxes.some((a,i)=>cur.boxes.slice(i+1).some(b=>
                  a.col<b.col+b.w&&b.col<a.col+a.w&&a.row<b.row+b.h&&b.row<a.row+a.h)):null,
                oob:cur.boxes?cur.boxes.some(b=>b.col<0||b.col+b.w>g.cols):null}};}})()""")
            print("  ", json.dumps(r))

        # ---- 8. containment is verified properly by verify.py -----------
        print("\n8. CONTAINMENT — see verify.py, which walks parked overlays and "
              "scroll containers correctly across all three pages")

        await pg.evaluate("state.w=1905;state.h=940;state.mode='free';state.edit=true;"
                          "state.layouts={};render();"
                          "document.querySelector('.stage').scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(400)
        await b.close()
    print("\nconsole errors:", errs[:8] or "none")

asyncio.run(main())
