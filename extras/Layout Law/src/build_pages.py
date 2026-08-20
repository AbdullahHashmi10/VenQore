#!/usr/bin/env python3
"""Assemble the self-contained proof pages from tpl/ + the generated engine.

Placeholder substitution, not string formatting: the pages contain JS template
literals and CSS braces, and every attempt to run those through an f-string or
str.format is a bug waiting to happen.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).parent
OUT, TPL = ROOT / "out", ROOT / "tpl"
LAW = json.loads((OUT / "layout-law-v2.json").read_text())

def engine_iife():
    """The ES module, de-moduled so the pages can stay single-file."""
    js = (OUT / "venqore-layout-engine.js").read_text()
    js = js.replace("export const ", "const ").replace("export function ", "function ")
    js = js.replace("export default {", "const _engineDefault = {")
    return js

PRODUCTS = [
  ("Panadol Extra 500mg", "PAN-500", 4, 185.00, "teal"),
  ("Surf Excel 1kg", "SRF-1K", 12, 640.00, "sky"),
  ("Nestle Milk Pak 1L", "NML-1L", 40, 285.00, "lime"),
  ("Colgate MaxFresh 150g", "CLG-150", 18, 410.00, "coral"),
  ("Lays Masala 62g", "LAY-62", 96, 120.00, "butter"),
  ("Dettol Soap 100g", "DTL-100", 55, 175.00, "plum"),
  ("Tapal Danedar 950g", "TPL-950", 8, 1650.00, "teal"),
  ("Shan Biryani Masala", "SHN-BIR", 34, 190.00, "coral"),
  ("Olpers Cream 200ml", "OLP-200", 21, 230.00, "sky"),
  ("Head & Shoulders 360ml", "HNS-360", 6, 1290.00, "butter"),
  ("Kurkure Chutney 55g", "KUR-55", 120, 60.00, "lime"),
  ("Sufi Cooking Oil 5L", "SUF-5L", 3, 4850.00, "plum"),
  ("Knorr Noodles 66g", "KNR-66", 74, 95.00, "teal"),
  ("Safeguard Soap 130g", "SFG-130", 44, 210.00, "sky"),
  ("Nurpur Butter 200g", "NUR-200", 15, 620.00, "butter"),
  ("Bake Parlor Ketchup 1kg", "BKP-1K", 9, 780.00, "coral"),
  ("Peek Freans Sooper", "PKF-SOO", 210, 50.00, "lime"),
  ("Vim Dishwash Bar", "VIM-BAR", 63, 85.00, "plum"),
  ("Ariel Powder 500g", "ARL-500", 27, 545.00, "teal"),
  ("Pepsi 1.5L", "PEP-15", 88, 260.00, "sky"),
  ("Fresher Juice 1L", "FRS-1L", 31, 320.00, "coral"),
  ("Rafhan Custard 300g", "RAF-300", 12, 415.00, "butter"),
]
CART = [
  ("Sufi Cooking Oil 5L", "SUF-5L", 2, 4850.00),
  ("Tapal Danedar 950g", "TPL-950", 1, 1650.00),
  ("Head & Shoulders 360ml", "HNS-360", 1, 1290.00),
  ("Nestle Milk Pak 1L", "NML-1L", 6, 285.00),
  ("Surf Excel 1kg", "SRF-1K", 2, 640.00),
  ("Colgate MaxFresh 150g", "CLG-150", 3, 410.00),
  ("Lays Masala 62g", "LAY-62", 12, 120.00),
  ("Dettol Soap 100g", "DTL-100", 4, 175.00),
  ("Shan Biryani Masala", "SHN-BIR", 2, 190.00),
  ("Knorr Noodles 66g", "KNR-66", 8, 95.00),
  ("Pepsi 1.5L", "PEP-15", 6, 260.00),
  ("Peek Freans Sooper", "PKF-SOO", 10, 50.00),
]

def sub(html, mapping):
    for k, v in mapping.items():
        token = "/*__" + k + "__*/"
        if token not in html and ("/*__" + k + "__*/null") not in html:
            print(f"  ! placeholder {k} not found", file=sys.stderr)
        html = html.replace("/*__" + k + "__*/null", v).replace("/*__" + k + "__*/", v)
    return html

def build_pos():
    data = {
      "products": PRODUCTS, "cart": CART,
      "caps": LAW["pos"]["capabilities"], "overrides": LAW["pos"]["overrides"],
      "fixes": LAW["pos"]["fixes"], "keymap": LAW["pos"]["keymap"],
      "ranks": LAW["ranks"], "viewports": LAW["viewports"],
    }
    html = sub((TPL / "pos.html").read_text(), {
      "TOKENS": (TPL / "tokens.css").read_text(),
      "LAYOUT": (OUT / "venqore-layout.css").read_text(),
      "POSCSS": (TPL / "pos.css").read_text(),
      "DATA": json.dumps(data, separators=(",", ":")),
      "ENGINE": engine_iife(),
      "APP": (TPL / "pos.js").read_text(),
    })
    (OUT / "venqore-pos.html").write_text(html)
    print("venqore-pos.html", f"{(OUT/'venqore-pos.html').stat().st_size/1024:.0f}KB")

def build_doc():
    D = LAW["document"]
    data = {
      "types": D["types"], "density": D["density"],
      "caps": D["capabilities"], "fixes": D["fixes"],
      "zones": [{k: v for k, v in z.items()} for z in D["zones"]],
      "solved": D["solved"], "keymap": LAW["pos"]["keymap"],
      "presets": D["presets"], "controls": D["controls"],
      "metrics": D["metrics"], "composed": D["composed"],
      "line_fits": D["line_fits"], "summary_fits": D["summary_fits"],
      "products": PRODUCTS,
    }
    html = sub((TPL / "doc.html").read_text(), {
      "TOKENS": (TPL / "tokens.css").read_text(),
      "LAYOUT": (OUT / "venqore-layout.css").read_text(),
      "DOCCSS": (TPL / "doc.css").read_text(),
      "DATA": json.dumps(data, separators=(",", ":")),
      "ENGINE": engine_iife(),
      "APP": (TPL / "doc.js").read_text(),
    })
    (OUT / "venqore-document.html").write_text(html)
    print("venqore-document.html", f"{(OUT/'venqore-document.html').stat().st_size/1024:.0f}KB")

def build_shell():
    data = {
      "law": {k: LAW[k] for k in ["constants","nav","nav_table","arch_nav","archetypes",
                                  "ranks","categories","promotion","row_heights",
                                  "numeric_ladder","measured_floors","edit","underflow",
                                  "breakpoints","legal_column_counts","min_viewport",
                                  "placement","splitter"]},
    }
    html = sub((TPL / "shell.html").read_text(), {
      "TOKENS": (TPL / "tokens.css").read_text(),
      "LAYOUT": (OUT / "venqore-layout.css").read_text(),
      "SHELLCSS": (TPL / "shell.css").read_text(),
      "DATA": json.dumps(data, separators=(",", ":")),
      "ENGINE": engine_iife(),
      "APP": (TPL / "shell.js").read_text(),
    })
    (OUT / "venqore-shell.html").write_text(html)
    print("venqore-shell.html", f"{(OUT/'venqore-shell.html').stat().st_size/1024:.0f}KB")

if __name__ == "__main__":
    which = sys.argv[1:] or ["pos", "doc", "shell"]
    if "pos" in which: build_pos()
    if "doc" in which and (TPL / "doc.html").exists(): build_doc()
    if "shell" in which and (TPL / "shell.html").exists(): build_shell()
