#!/usr/bin/env python3
"""Render a page and report console errors + DOM measurements."""
import sys, json, asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main(path, shots, probe=None):
    errs = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={"width": 1500, "height": 1000},
                              device_scale_factor=2)
        pg.on("console", lambda m: errs.append(f"[{m.type}] {m.text}") if m.type in ("error","warning") else None)
        pg.on("pageerror", lambda e: errs.append(f"[pageerror] {e}"))
        await pg.goto("file://" + str(Path(path).resolve()))
        await pg.wait_for_timeout(1400)
        for name, script, clip in shots:
            if script:
                await pg.evaluate(script)
                await pg.wait_for_timeout(500)
            if clip == "full":
                await pg.screenshot(path=f"out/shot_{name}.png", full_page=True)
            elif clip:
                elh = await pg.query_selector(clip)
                if elh: await elh.screenshot(path=f"out/shot_{name}.png")
            else:
                await pg.screenshot(path=f"out/shot_{name}.png")
            print("shot", name)
        if probe:
            r = await pg.evaluate(probe)
            print(json.dumps(r, indent=1)[:4000])
        await b.close()
    print("\nconsole:", "clean" if not errs else "")
    for e in errs[:20]: print("  ", e)

if __name__ == "__main__":
    spec = json.loads(Path(sys.argv[1]).read_text())
    asyncio.run(main(spec["path"], spec["shots"], spec.get("probe")))
