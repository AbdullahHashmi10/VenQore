# VenQore Public Site — Design Notes (landing-3d-redesign)

Session 3 · 2026-07-03 · branch `landing-3d-redesign`
Supersedes `MIDNIGHT_NEBULA_DESIGN.md` for the public marketing pages only. The
authenticated app is untouched.

---

## The idea in one line

**The site is a ledger, and the ledger is alive.**

VenQore's whole pitch is "the books are always right" — double-entry done
automatically, verified by 636 tests, reconciled to the cent. The previous
design (Midnight Nebula) said none of that visually: it was the generic
2025 AI-SaaS look — indigo/violet gradients, particle fields, cursor
spotlights, shimmer headlines — the exact styling the brief calls
"AI-generated rather than premium." Worse, it fought the brand: the VenQore
logo is a deep-teal isometric cube, and the site was purple.

This redesign builds the identity out of two things VenQore already owns:

1. **The logo** — an isometric cube assembled from smaller cubes, deep teal
   to mint. It is literally a 3D object. We make it live.
2. **The product truth** — double-entry means two sides that always balance.
   That is a visual idea: perfect equilibrium.

## Palette — 6 named values

| Token | Hex | Role |
|---|---|---|
| **Abyss** | `#071614` | Dark sections: hero, closing CTA, footer. Near-black with the logo's teal in it — not neutral black, not navy. |
| **Deep Teal** | `#1E7E82` | Brand anchor (logo dark faces). Links, active states, the vertical ledger rule. |
| **Mint** | `#7FE9CE` | The light of the system (logo's lit cube). Glows, highlights on dark, the live cubes in the 3D scene. |
| **Paper** | `#F5F2E9` | Light sections. Warm ledger paper, not sterile white. Most of the site lives here. |
| **Ink** | `#0D211D` | Text on paper. Green-black ink, matches Abyss family. |
| **Brass** | `#C4A468` | Scarce. Only for the balance readout, entry numbers, and the founder's signature — the "gilt edge" of the ledger. If brass appears more than once per screen, it's overused. |

Neutrals are derived, never invented: white/mint at low opacity on dark,
Ink at low opacity on Paper. No grays imported from a Tailwind palette.

## Type — 3 faces, 3 jobs

- **Fraunces** (display serif, 500–600): headlines only. The voice of a
  well-bound account book — warm, confident, absolutely not the grotesk
  every AI-styled SaaS ships with.
- **Inter** (400–700): UI and body. Invisible on purpose.
- **IBM Plex Mono** (400–600): every number, every entry label, every
  Dr/Cr line. In a product about figures, figures get their own voice.
  Tabular numerals everywhere money appears.

Served from fonts.bunny.net (already the site's font CDN; GDPR-quiet).

## Layout concept — "the ledger book"

Dark cover → paper pages → dark back cover.

- **Hero (Abyss)**: the one cinematic moment. Then the site opens like a book.
- **Content sections (Paper)**: every section is a numbered journal entry —
  `ENTRY 01 · THE PROBLEM`, `ENTRY 02 · DOUBLE-ENTRY, AUTOMATIC` — set in
  mono with a brass entry number and a hairline rule, like lines in a
  ledger. A thin Deep Teal vertical rule runs the left margin of each
  section. This numbering system, not any single effect, is what makes the
  site recognizable page after page.
- **Close (Abyss)**: CTA + footer.

Sub-pages (features, pricing, demo, vensynq, smartcapture, about, contact)
use the same book: dark header band, paper body, dark footer. No 3D on
sub-pages — the signature stays singular.

## The signature element — "The Ledger Engine"

One 3D scene, home hero only, built procedurally with react-three-fiber
(instanced boxes + lights — no downloaded models, nothing scraped).

What it shows — motion that explains, not decorates:

- Small mint cubes (transactions: a sale, a purchase, a return) stream
  toward a slowly rotating wireframe cube — the Qore, an echo of the logo.
- Each cube that enters emerges as **two**: a debit and a credit. They
  stack into two columns that stay **exactly the same height, always.**
- A brass beam rests across both columns, perfectly level. It never tips.
- HUD line under the scene, in mono: `TRIAL BALANCE 0.00 · ALWAYS`.

That's the product. If a viewer watches for five seconds they understand
double-entry better than a paragraph could teach them.

Interaction: gentle pointer parallax, slight camera orbit on scroll. No
other 3D, no scroll-jacking, nothing else moves that doesn't explain.

## Progressive enhancement — the non-negotiable, honored

The crawler layer from session 2 (`MarketingSeo` static HTML inside the
Inertia root) is preserved untouched and committed properly on this branch.

The ladder, top to bottom:

1. **Server HTML** — h1, pitch, pricing, links: present before any JS.
2. **React mount** — hero text and a static SVG of the balanced columns
   render immediately. The SVG is inline: zero extra requests. This is the
   full experience on low-end devices — a composed illustration, not a
   spinner, not a hole.
3. **The 3D chunk** (three + r3f, lazy `import()`) loads only after the
   page is idle AND the device opts in: `prefers-reduced-motion` off, no
   `Save-Data`, `deviceMemory ≥ 4` and `hardwareConcurrency ≥ 4` when
   reported, WebGL context creatable. Then it cross-fades over the SVG.
   Any failure, at any point → the SVG simply stays. three.js never blocks
   first paint; it is not in the main bundle.
4. Scene pauses when the tab is hidden or the hero is scrolled away.
   DPR capped at 1.75. No postprocessing.

A shopkeeper on a 2019 Android on 3G gets a fast, complete, good-looking
page. A designer on an M4 gets the Ledger Engine. Both get the same words.

## Deliberately left out

- The entire Midnight Nebula effect stack: particle fields, cursor
  spotlight, magnetic buttons, shimmer/gradient headlines, conic beam
  rotations, animated blobs. Scattered effects are the AI-generated tell;
  restraint is the premium tell.
- GSAP / Framer Motion — the one scene plus IntersectionObserver reveals
  don't justify 30–90 KB of animation runtime. (Reasonable to add later if
  a real need appears; today it's bundle discipline.)
- Downloaded 3D models/textures — the scene is primitives + light. Lighter,
  license-clean, and more ours than any Sketchfab asset could be.
- Fake testimonials, logo marquees of companies that aren't customers,
  "trusted by 1M+" numbers we don't have. The proof strip uses only claims
  the codebase can back: 636 tests, 0.00 drift, offline-first, 40+ reports.
- Dark-mode-everywhere. Most of the site is paper. Dark is the cover, not
  the book.

## Why this over the obvious default

The obvious move was Midnight Nebula 3.0: more purple, more particles, a
floating glass dashboard, maybe a Spline blob. It would look like fifty
other SaaS sites shipped this year, and it would say nothing about
VenQore. A ledger that proves itself in front of you — on the brand's own
teal, in a book's own typography — is something only this product can say.
The genre research backs it: the sites that hold up (SITCON 2026, Jeton,
Clay) pair one strong identity with fast, real, readable HTML; the ones
that don't (the Awwwards-bait shells) serve empty bodies to crawlers.
VenQore was an empty body two sessions ago. Never again.

## Verification gates (same command as session 2)

```
curl -s http://127.0.0.1:8000/ | grep -i "<h1>"        # must show the real headline
```

plus `npm run build` green, reduced-motion audit, and keyboard-only nav
pass. See CHANGELOG entry on this branch for results.
