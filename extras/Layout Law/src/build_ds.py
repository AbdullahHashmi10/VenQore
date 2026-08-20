#!/usr/bin/env python3
"""Inject the Layout Law into the VenQore Design System → v6.

The v5 bundle is a React app compiled by in-browser Babel, so a new section is
three edits: a component, a TOC entry, and a call site. Everything the component
renders is generated from layout-law.json, so the design system cannot drift
from the engine either.
"""
import json, re, shutil
from pathlib import Path

ROOT = Path(__file__).parent
OUT = ROOT / "out"
SRC = Path("/mnt/user-data/uploads/AMD POS/extras/Design System/"
           "VenQore Design System v5 (COMPLETE standalone).html")
L = json.loads((OUT / "layout-law-v2.json").read_text())
C, N, T, MF = L["constants"], L["nav"], L["terminal"], L["measured_floors"]

def j(x):
    return json.dumps(x, separators=(",", ":"))

SECTION = """
/* ---------- Layout Law (v2.0) — generated from layout-law.json ---------- */
const LL = __LAW__;

function LLTable({ head, rows, mono }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--vq-line-soft)",
                  borderRadius: "var(--vq-r-lg)", background: "var(--vq-surface)" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520,
                      font: "500 13px/1.5 var(--vq-font-sans)" }}>
        <thead><tr>{head.map((h, i) => (
          <th key={i} style={{ textAlign: "left", padding: "9px 12px",
              font: "800 10px/1 var(--vq-font-sans)", letterSpacing: ".08em",
              textTransform: "uppercase", color: "var(--vq-text-3)",
              borderBottom: "1px solid var(--vq-line)", whiteSpace: "nowrap" }}>{h}</th>
        ))}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{r.map((c, k) => (
            <td key={k} style={{ padding: "8px 12px",
                borderBottom: "1px solid var(--vq-line-soft)", verticalAlign: "top",
                fontFamily: mono && k > 0 ? "var(--vq-font-numeric)" : undefined,
                fontVariantNumeric: mono && k > 0 ? "tabular-nums" : undefined }}
                dangerouslySetInnerHTML={{ __html: String(c) }} />
          ))}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function LLNote({ children }) {
  return (
    <div style={{ borderLeft: "3px solid var(--vq-teal-400)", padding: "12px 0 12px 16px",
                  margin: "18px 0", borderRadius: "0 10px 10px 0",
                  font: "500 14px/1.65 var(--vq-font-sans)", color: "var(--vq-text-2)",
                  background: "linear-gradient(90deg, rgb(11 170 143 / .07), transparent 70%)" }}>
      {children}
    </div>
  );
}

function LLBig({ n, label, sub }) {
  return (
    <div style={{ background: "var(--vq-surface)", border: "1px solid var(--vq-line-soft)",
                  borderRadius: "var(--vq-r-lg)", padding: "18px 20px", flex: "1 1 220px" }}>
      <div style={{ font: "700 38px/1 var(--vq-font-display)", letterSpacing: "-.03em",
                    color: "var(--vq-teal-600)" }}>{n}</div>
      <div style={{ font: "800 10px/1 var(--vq-font-sans)", letterSpacing: ".09em",
                    textTransform: "uppercase", color: "var(--vq-text-3)",
                    margin: "10px 0 6px" }}>{label}</div>
      <div style={{ font: "500 13px/1.55 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{sub}</div>
    </div>
  );
}

function LayoutLawSection() {
  return (
    <section id="layout" style={{ scrollMarginTop: 60 }}>
      <SectionHead
        eyebrow="Layout Law v2.0"
        title="One law for every screen, at every size"
        subtitle="v1.0 answered how a card survives every screen. v2.0 answers how a screen does. Every number here is derived or measured — never chosen — and the rule book, the CSS, the engine and this section are all generated from the same layout-law.json, so they cannot drift apart." />

      <Card title="The three shell numbers" subtitle="Everything else is arithmetic on these">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <LLBig n="264 / 72" label="Sidebar · rail"
            sub="The rail ramps in across 1024–1096 so its arrival costs the content nothing." />
          <LLBig n="24px" label="Gutter, both axes"
            sub="size(n) = n·UNIT + (n−1)·24. CSS Grid computes this natively from gap." />
          <LLBig n="64px" label="Row track"
            sub="Equal to the header height. A 2-row card is 2×64 + 1×24 = 152px and lines up exactly with two stacked 1-row cards." />
        </div>
        <LLNote>
          <b>The alignment fix, in one formula.</b> Treating the gutter as something
          <i> added between</i> cards made a 2-row card 128px while two stacked 1-row cards
          were 152px, and the two never lined up. Making the gutter part of the
          <b> pitch</b> means a 2-row card spans across it and absorbs it. You do not implement this —
          <code style={{ fontFamily: "var(--vq-font-numeric)" }}> gap</code> does. If the old
          markup used <code style={{ fontFamily: "var(--vq-font-numeric)" }}>margin-bottom</code>,
          that alone was the bug.
        </LLNote>
      </Card>

      <Card title="Row ladder" subtitle="The only legal card heights">
        <LLTable mono head={["Rows", "Height", "Working"]} rows={LL.rowLadder} />
      </Card>

      <Card title="The nav law"
            subtitle="The hamburger exists at every width, on every archetype. What it does depends on whether pushing is affordable here.">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          <LLBig n="1216px" label="The push threshold"
            sub="264 + 48 + 904, where 904 is the content width at the 1024 rail — the narrowest desktop grid already in production. Expanding may cost you cards per row; it may never cost you the grid." />
          <LLBig n="1248px" label="Subnav becomes a column"
            sub="Below it, a Settings or Reports subnav is a horizontal tab strip. v1.0 shipped it as a column from 1024 and it broke its own 92px column floor at four breakpoints." />
          <LLBig n="1708px" label="A document may expand the nav"
            sub="The first width at which a 264px sidebar still leaves room for the 10-column line table and the summary panel." />
        </div>
        <LLTable mono head={["Viewport", "At rest", "Hamburger", "On toggle", "Cols at rest", "Cols after", "Reflows?"]}
                 rows={LL.navTable} />
        <LLNote>
          <b>A pushing step can never be free.</b> By the time the viewport has grown by the
          chrome&rsquo;s width, the no-chrome baseline has grown by the same amount, so the
          deficit is permanent. There are three honest ways out and the law uses all three:
          <b> ramp</b> (margin and rail, as a clamp over a band at least as long as the chrome),
          <b> overlay</b> (zero width — which is the real reason a narrow window overlays),
          and <b> absorb</b> (permitted only where no region <i>loses a fit</i>, which is a
          checkable property rather than an opinion).
        </LLNote>
      </Card>

      <Card title="Six archetypes" subtitle="Every screen in the product is one of these">
        <LLTable head={["Archetype", "Scrolls", "Rule", "Nav default"]} rows={LL.archetypes} />
      </Card>

      <Card title="Six card categories"
            subtitle="A category is not a size. It is an ordered list of fits, each with a floor measured from real advance widths.">
        <LLTable head={["Category", "Role", "Min", "Max", "Fits"]} rows={LL.categories} />
        <LLNote>
          A card starts at the fit its author designed. If the column is narrow it gets
          <b> wider</b>; only when widening is exhausted does it <b>degrade</b> to a leaner fit,
          which trades a column for a row and re-lays its inside. That is the mechanism that
          guarantees nobody loses data to their screen size.
        </LLNote>
      </Card>

      <Card title="The number ladder"
            subtitle="A card never sizes to its worst-case number. The number formats down to the card.">
        <LLTable mono head={["Rung", "Sample", "@20", "@26", "@38", "Note"]} rows={LL.ladder} />
        <LLNote>
          A 20-digit, 4-decimal value is <b>723px</b> at metric size. The widest card the law
          can produce at 1920 is 1593px and a metric card is ~380px, so no card can ever be
          sized to it. Currency drops first, then decimals, then magnitude — and the exact
          value is always one hover away. Full precision belongs in the ledger, never on a
          dashboard.
        </LLNote>
      </Card>

      <Card title="The rank law"
            subtitle="The structural answer to “it feels overwhelming”. Rank decides residency, and residency is enforced.">
        <LLTable head={["Rank", "Used", "Lives", "Budget", "Why"]} rows={LL.ranks} />
        <LLNote>
          Applied to the register: <b>{LL.capCount} capabilities</b>, none dropped,
          <b> {LL.capSurface} visible at rest</b> — against roughly sixty today.
        </LLNote>
      </Card>

      <Card title="Measured floors"
            subtitle="Computed from the type scale and Space Grotesk advance widths. There is no judgement in these.">
        <LLTable mono head={["Floor", "Pixels", "What it is"]} rows={LL.floors} />
      </Card>

      <Card title="The register is composed, not chosen"
            subtitle="Seven starting points, and every knob behind them belongs to the person standing at the till. The fractions are theirs; the floors are the law's.">
        <LLTable head={["Preset", "Composition", "Built for"]} rows={LL.terminals} />
        <div style={{ height: 14 }} />
        <LLTable head={["Control", "Choices", "What clamps it"]} rows={LL.posControls} />
        <LLNote>
          A catalog is a resident column only above <b>{LL.catalogMinVw}px</b> — derived, not
          chosen: it needs {LL.catalogMinAvail}px of content to sit beside a full cart and a
          tender. Below that it is one button, full screen. Triggers are never floated over a
          pane: a dock is a real layout row whose height is subtracted before anything vertical
          is measured, so it cannot overlap by construction.
        </LLNote>
      </Card>

      <Card title="One document editor, thirteen types — composed"
            subtitle="A type is a configuration, never a different screen. The arrangement is the user's: collapse the details, move the summary, decide what happens to it when you scroll.">
        <LLTable head={["Density", "For", "Header fields", "Line columns"]} rows={LL.densities} />
        <div style={{ height: 14 }} />
        <LLTable head={["Preset", "Composition", "For"]} rows={LL.docPresets} />
        <div style={{ height: 14 }} />
        <LLTable mono head={["Density", "Summary rows", "Column height", "Sticks on a 1280×570?"]}
                 rows={LL.stickTable} />
        <LLNote>
          The docked summary is a height rule, not a preference. Holding a panel still only
          works if the whole panel fits on screen — and a summary's height <i>is</i> its
          density, because the density list is literally the list of summary rows. Pro is the
          first density that stops fitting, so the law names it without being told to. The dock
          itself is a reserved row anchored bottom-right, never a float over the last line.
        </LLNote>
      </Card>

      <Card title="Edit mode" subtitle="Changes what the user may change, never what the law allows">
        <LLTable head={["Gesture", "Does", "Snapped to"]} rows={LL.editGrants} />
        <div style={{ height: 14 }} />
        <LLTable head={["Placement", "Stores", "Packs", "Why", "Prior art"]} rows={LL.placement} />
        <LLNote>
          Free placement stores a box per column class and projects between them by the ratio
          — Gridstack's <code>moveScale</code> — settling collisions <b>downward only</b>, which
          is what keeps the right side empty if you left it empty. The projection always runs
          from an <b>authored</b> class, never from another projection, so rounding never
          compounds and returning to the class you authored in restores it exactly.
        </LLNote>
        <div style={{ height: 14 }} />
        <LLTable head={["Splitter", "Minimum", "Maximum", "Snaps to"]} rows={LL.splitters} />
        <LLNote>
          A splitter stops where the No-Regression Rule says the region beside it would lose a
          fit. And <b>264 was never a taste call</b>: at 1920,
          <code> 1920 − 48 − 264 = 1608 = 12×112 + 11×24</code> — the default sidebar is exactly
          the width that yields twelve columns at exactly the 112px target.
        </LLNote>
        <ul style={{ font: "500 14px/1.7 var(--vq-font-sans)", color: "var(--vq-text-2)",
                     maxWidth: "74ch", marginTop: 16 }}>
          {LL.editInvariants.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </Card>
    </section>
  );
}
"""

def build_payload():
    def fits(cat):
        return "<br>".join(
            f"<code>{f['cols']}×{f['rows']}</code> {f['variant']} "
            f"<span style='opacity:.55'>≥{f['floor']}px</span>" for f in cat["fits"])
    caps = L["pos"]["capabilities"]
    sched = {k: v for k, v in L["arch_nav"].items()}
    return {
      "rowLadder": [[r, f"<b>{h}px</b>", f"{r}×{C['row']} + {int(r)-1}×{C['gutter']}"]
                    for r, h in L["row_heights"].items()],
      "navTable": [[f"<code>{r['vp']}</code>", r["resting"], "always",
                    f"<b>{r['on_open']}</b>",
                    f"{r['cols_rest']} @ {r['col_rest']:.1f}",
                    f"{r['cols_open']} @ {r['col_open']:.1f}",
                    "yes — the user asked" if r["reflow"] else "no"]
                   for r in L["nav_table"]],
      "archetypes": [[f"<b>{a['name']}</b>", a["scroll"], a["rule"],
                      ("no nav" if sched[a["id"]]["rail_min"] is None else
                       ("rail from 1024" if sched[a["id"]]["expanded_min"] is None
                        else f"rail from 1024, expanded from <b>{sched[a['id']]['expanded_min']}</b>"))]
                     for a in L["archetypes"]],
      "categories": [[f"<b>{c['name']}</b> <code>{c['id']}</code>", c["role"],
                      f"{c['fits'][-1]['cols']}×{c['fits'][-1]['rows']}",
                      f"{c['max'][0]}×{c['max'][1]}", fits(c)]
                     for c in L["categories"]],
      "ladder": [[f"<code>{n['key']}</code>",
                  f"<span style='font-family:var(--vq-font-numeric)'>{n['sample']}</span>",
                  f"{n['w20']:.0f}", f"{n['w26']:.0f}", f"{n['w38']:.0f}", n["note"]]
                 for n in L["numeric_ladder"]],
      "ranks": [[f"<b>{r['rank']} · {r['name']}</b>", r["freq"], r["residency"],
                 "unbounded" if r["budget_desktop"] is None
                 else f"{r['budget_desktop']} on the surface", r["why"]]
                for r in L["ranks"]],
      "floors": [[f"<code>{k}</code>", f"<b>{v:.0f}px</b>", d] for k, v, d in [
        ("cart_line_full", MF["cart_line_full"], "a cart line with every control inline"),
        ("cart_line_relay", MF["cart_line_relay"], "name on line 1, controls on line 2"),
        ("cart_line_min", MF["cart_line_min"], "name + total; tap a line to adjust"),
        ("tender_full", MF["tender_full"], "the grand total at 38px + padding"),
        ("tender_min", MF["tender_min"], "an abbreviated total in a sticky bar"),
        ("catalog_grid3", MF["catalog_grid3"], "three image tiles per row"),
        ("catalog_list", MF["catalog_list"], "rows: name, price, stock"),
        ("doc_table_full", MF["doc_table_full"], "ten line columns"),
        ("doc_table_std", MF["doc_table_std"], "seven line columns"),
        ("doc_table_lean", MF["doc_table_lean"], "five line columns"),
        ("doc_summary_full", MF["doc_summary_full"], "a resident summary panel"),
        ("doc_header_2col", MF["doc_header_2col"], "two header field columns"),
      ]],
      "terminals": [[f"<b>{v['name']}</b><br><span style=\"color:var(--vq-text-3)\">{v.get('tagline','')}</span>",
                     "catalog <code>" + v["comp"]["catalog"]["mode"] + "</code>"
                       + (f" {v['comp']['catalog']['size']*100:.0f}%" if v["comp"]["catalog"]["size"] else "")
                       + f" · cart <code>{v['comp']['split']['cart']*100:.0f}%</code>"
                       + f" · tender <code>{v['comp']['split']['tender']*100:.0f}%</code>",
                     v.get("for", "")]
                    for v in L["pos"]["presets"]],
      "posControls": [[f"<b>{c['label']}</b>",
                       " · ".join(f"<code>{o}</code>" for o in c["options"]) if c.get("options")
                         else f"<code>{c['range'][0]}</code>–<code>{c['range'][1]}</code>",
                       c.get("note", "—")] for c in L["pos"]["controls"]],
      "catalogMinVw": L["pos"]["catalog_resident_min_vw"],
      "catalogMinAvail": int(L["pos"]["catalog_resident_min_avail"]),
      "docPresets": [[f"<b>{d['name']}</b>",
                      f"details <code>{d['comp']['details']}</code> · summary "
                      f"<code>{d['comp']['summary']}</code> · pin <code>{d['comp']['pin']}</code>"
                      f" · <code>{d['comp']['split']*100:.0f}%</code> · <code>{d['comp']['density']}</code>",
                      d["for"]] for d in L["document"]["presets"]],
      "stickTable": (lambda DM: [[f"<b>{d['name']}</b>", str(len(d["summary"])),
          f"<b>{DM['zone_h'] + (len(d['summary'])-1)*DM['sum_row'] + DM['sum_tot_row'] + DM['actions_h']}px</b>",
          "yes — it holds still"
            if DM['zone_h'] + (len(d['summary'])-1)*DM['sum_row'] + DM['sum_tot_row'] + DM['actions_h']
               <= 570 - 64 - 48 - DM['strip_h']
            else "<b>no — it docks bottom-right</b>"]
        for d in L["document"]["density"]])(L["document"]["metrics"]),
      "placement": [[f"<b>{m['name']}</b>", f"<code>{m['stores']}</code>", m["packs"],
                     m["why"], m["prior_art"]] for m in L["placement"]["modes"]],
      "splitters": [[f"<b>{x['id']}</b><br><span style=\"color:var(--vq-text-3)\">{x['region']}</span>",
                     x["min"], x["max"], x["snaps"]] for x in L["splitter"]["where"]],
      "densities": [[f"<b>{d['name']}</b>", d["for"], " · ".join(d["header"]),
                     " · ".join(d["line_cols"])] for d in L["document"]["density"]],

      "editGrants": [[f"<b>{g['id']}</b>", g["gesture"], g["snap"]]
                     for g in L["edit"]["grants"]],
      "editInvariants": L["edit"]["invariants"],
      "capCount": len(caps),
      "capSurface": len([c for c in caps if c["home"] in ("surface", "line-visible")]),
    }

def main():
    s = SRC.read_text(errors="replace")
    assert "function BrandSection" in s and "<BrandSection />" in s

    section = SECTION.replace("__LAW__", j(build_payload()))

    # 1. the component, before the first foundation section
    s = s.replace("/* ---------- Brand / foundation guideline sections ---------- */",
                  section + "\n/* ---------- Brand / foundation guideline sections ---------- */", 1)
    # 2. the TOC entry, first in the foundation group
    s = s.replace('  { id: "brand", label: "Brand" },',
                  '  { id: "layout", label: "Layout Law" },\n  { id: "brand", label: "Brand" },', 1)
    # 3. the call site
    s = s.replace("        <BrandSection />",
                  "        <LayoutLawSection />\n        <BrandSection />", 1)
    # 4. version marks
    s = s.replace(">V5<", ">V6<", 1).replace('>v5<', '>v6<', 1)
    s = s.replace("v5 &ldquo;Qore&rdquo; — the complete standalone gallery",
                  "v6 &ldquo;Qore&rdquo; — the complete standalone gallery", 1)
    s = s.replace(
      "Every screen, section, token and component in this project, assembled onto one page "
      "from the real sources — not the thin 5-6 component spec sheet.",
      "Every screen, section, token and component in this project, assembled onto one page "
      "from the real sources. <b>v6</b> adds the Layout Law: one set of rules that decides "
      "the shell, the grid, the register and the document editor at every screen size, "
      "generated from <code>layout-law.json</code> so this page can never drift from the "
      "engine that ships.", 1)

    for probe in ['id: "layout"', "function LayoutLawSection", "<LayoutLawSection />"]:
        assert probe in s, probe
    dst = OUT / "VenQore Design System v6 (COMPLETE standalone).html"
    dst.write_text(s)

    # Precompile the JSX. The v5 "COMPLETE standalone" never actually rendered:
    # @babel/standalone 7.29 defaults preset-react to the AUTOMATIC jsx runtime,
    # which emits `import { jsx as _jsx } from "react/jsx-runtime"` into a plain
    # non-module <script>, and every browser refuses it with "Cannot use import
    # statement outside a browser module". Compiling ahead of time with
    # runtime:"classic" removes Babel from the page entirely.
    import subprocess
    r = subprocess.run(["node", str(ROOT / "precompile.js"), str(dst), str(dst) + ".tmp"],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit("precompile failed: " + r.stdout + r.stderr)
    Path(str(dst) + ".tmp").replace(dst)
    print(r.stdout.strip())
    print("design system v6:", dst.stat().st_size, "bytes")

if __name__ == "__main__":
    main()
