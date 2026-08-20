# Rebuilding the Layout Law

Every number in this folder comes out of `law_v2.py`. Nothing else authors a
constant, and nothing here should ever be hand-edited — a hand edit is a number
that will silently disagree with the engine, which is the exact class of bug the
law exists to prevent.

```
python3 law_v2.py               # re-solve + re-validate -> out/layout-law-v2.json
python3 build_engine.py         # -> venqore-layout-engine.js
python3 build_css.py            # -> venqore-layout.css
python3 build_rulebook.py       # -> VENQORE_LAYOUT_LAW.md
python3 build_pages.py          # -> the three proof pages
python3 build_ds.py             # -> design system v6 (needs the v5 source)
node out/_crosscheck.mjs        # 35,255 checks: the JS engine vs the Python solver
python3 verify.py               # the rendered-DOM half: escapes, coverage, heights
python3 drive.py                # drives the shell with real pointer gestures
python3 drivedoc.py             # drives the document: scroll, drag the divider
```

`law_v2.py` prints `CLEAN` or lists every failing invariant. It will not write a
JSON it cannot validate, so a broken rule cannot reach the engine.

Requires: python3, node, `npm i @babel/standalone react react-dom playwright`
(only the last three are needed for `build_ds.py` and the browser checks).

## Where the sections are in law_v2.py

| § | What |
|---|---|
| A–E | constants, measured floors, residency, ranks |
| F | the terminal composer |
| G | the document editor's zones, types and capabilities |
| H | edit mode — the contract Reckoner drives |
| J | placement — Flow vs Free, and the projection between column classes |
| K | the splitter — travel, magnets, ARIA |
| L | the document composer |
| I | archetype nav defaults |
