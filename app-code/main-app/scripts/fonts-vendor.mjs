#!/usr/bin/env node
/**
 * fonts-vendor.mjs — put the brand faces on disk, not on the network.
 *
 *     node scripts/fonts-vendor.mjs           # write the files
 *     node scripts/fonts-vendor.mjs --check   # fail if what is on disk is stale
 *
 * ── What this replaces ──────────────────────────────────────────────────────
 *
 * Three `<link>`/`@import` lines pointed at fonts.googleapis.com:
 *
 *   resources/css/venqore-v6/tokens/fonts.css   the three V6 brand faces
 *   resources/views/app.blade.php               Inter · Space Grotesk · Figtree · Source Serif 4
 *   resources/views/errors/503.blade.php        Outfit · Plus Jakarta Sans
 *   resources/views/installer/problem.blade.php Inter
 *
 * A till behind a shutter with no uplink resolves all four to nothing. Every
 * one of them fails SILENTLY — CSS has no error for a stylesheet that did not
 * arrive — so the screen paints in system-ui and looks merely *slightly wrong*
 * rather than broken. The expensive part is not the display voice; it is that
 * system-ui has PROPORTIONAL figures, so every currency column on the terminal
 * stops aligning, which is the single thing `--vq-font-numeric` exists to
 * guarantee.
 *
 * ── Why a generator and not six hand-written @font-face blocks ─────────────
 *
 * unicode-range is 20 lines of hex per family and one wrong codepoint means a
 * glyph silently falls back mid-word. The ranges here are copied verbatim out
 * of the fontsource package that ships the binary, so the declaration and the
 * file it names can never disagree. Re-running the script is the update path;
 * hand-editing the output is not.
 *
 * ── Variable, one file per subset ──────────────────────────────────────────
 *
 * A wght-axis variable face covers 400→700 in a single file, so the four
 * weights the token layer names are real instances rather than the browser
 * faking bold by smearing an outline. Twelve files, ~400 KB, against 30-odd
 * static cuts for the same coverage.
 *
 * latin-ext is not optional: ₹ (U+20B9) and ₨ (U+20A8) live in U+20A0–20C0,
 * and a POS that cannot draw its own currency symbol is broken in the most
 * visible way available.
 *
 * All six families are SIL Open Font License 1.1 — vendoring is licensed, and
 * OFL.txt sits beside the binaries because the licence requires it to.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NM = path.join(ROOT, 'node_modules', '@fontsource-variable');
const CHECK = process.argv.includes('--check');

/**
 * `family` is the name the token stacks and Blade `font-family` declarations
 * already use — NOT fontsource's "… Variable" suffix. Renaming a face here
 * would mean editing every stack that names it, which is the wrong direction.
 */
const FAMILIES = [
    { pkg: 'bricolage-grotesque', family: 'Bricolage Grotesque', why: 'V6 display voice' },
    { pkg: 'plus-jakarta-sans', family: 'Plus Jakarta Sans', why: 'V6 UI + body' },
    { pkg: 'space-grotesk', family: 'Space Grotesk', why: 'V6 numerics, eyebrows, code' },
    { pkg: 'inter', family: 'Inter', why: 'Appearance → Inter' },
    { pkg: 'figtree', family: 'Figtree', why: 'Appearance → Figtree; daylight-calm + midnight-nebula themes' },
    { pkg: 'source-serif-4', family: 'Source Serif 4', why: 'Appearance → Serif' },
];

const SUBSETS = ['latin', 'latin-ext'];

/** The three families the non-Vite Blade pages name. */
const PUBLIC_FAMILIES = ['inter', 'bricolage-grotesque', 'plus-jakarta-sans'];

/* ------------------------------------------------------------------ *
 * Read the shipped declarations
 * ------------------------------------------------------------------ */

/**
 * Pull the wght-axis faces out of a fontsource `index.css`.
 *
 * Fontsource also ships `opsz`, `wdth` and `standard` cuts for some families.
 * Nothing in this codebase sets `font-optical-sizing` or `font-variation-
 * settings`, so the extra axes are weight the browser would download and never
 * move — Bricolage's opsz file is 77 KB against 41 KB for wght alone.
 */
function readFaces(pkg) {
    const indexCss = path.join(NM, pkg, 'index.css');

    if (!fs.existsSync(indexCss)) {
        throw new Error(
            `[fonts] @fontsource-variable/${pkg} is not installed.\n`
            + `        npm i -D @fontsource-variable/${pkg}`,
        );
    }

    const css = fs.readFileSync(indexCss, 'utf8');
    const faces = {};

    for (const block of css.split('@font-face').slice(1)) {
        const src = block.match(/url\(\.\/files\/([^)]+)\)/)?.[1];
        if (!src) continue;

        const m = src.match(/^(.+?)-(latin|latin-ext)-wght-normal\.woff2$/);
        if (!m) continue;

        faces[m[2]] = {
            file: src,
            weight: block.match(/font-weight:\s*([^;]+);/)?.[1].trim(),
            range: block.match(/unicode-range:\s*([^;]+);/)?.[1].trim(),
        };
    }

    for (const subset of SUBSETS) {
        if (!faces[subset]) {
            throw new Error(`[fonts] ${pkg} ships no ${subset} wght face.`);
        }
    }

    return faces;
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

/**
 * `format('woff2')`, not fontsource's `format('woff2-variations')`.
 *
 * `woff2-variations` is the 2016 draft token. A browser that does not know it
 * discards the ENTIRE src descriptor — not just that one format hint — and the
 * face never loads. Plain `woff2` plus a `font-weight` RANGE is what Google
 * Fonts itself serves for variable faces, and every engine honours it.
 */
function face(family, faces, subset, prefix) {
    const d = faces[subset];

    return [
        '@font-face {',
        `    font-family: '${family}';`,
        '    font-style: normal;',
        `    font-weight: ${d.weight};`,
        '    font-display: swap;',
        `    src: url('${prefix}${d.file}') format('woff2');`,
        `    unicode-range: ${d.range};`,
        '}',
    ].join('\n');
}

function sheet(header, families, prefix) {
    const parts = [header];

    for (const f of families) {
        parts.push(`/* ── ${f.family} — ${f.why} ${'─'.repeat(Math.max(3, 60 - f.family.length - f.why.length))} */`);
        for (const subset of SUBSETS) parts.push(face(f.family, f.faces, subset, prefix));
        parts.push('');
    }

    return `${parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

/* ------------------------------------------------------------------ *
 * Headers
 * ------------------------------------------------------------------ */

const GENERATED = 'GENERATED by scripts/fonts-vendor.mjs from @fontsource-variable\n   (SIL Open Font License 1.1). Re-run it to update; do not hand-edit.';

const V6_HEADER = `/* ════════════════════════════════════════════════════════════════════════════
   VenQore V6 typefaces — SELF-HOSTED. No network at paint time.

     Bricolage Grotesque   display voice (expressive, slightly quirky, designer)
     Plus Jakarta Sans     UI + body (friendly geometric, tall x-height)
     Space Grotesk         numerics, eyebrows, code (measured but playful digits)

   ── What this replaced ──────────────────────────────────────────────────────

   One line: an @import of the Google Fonts CSS API, asking it for all three
   families at four weights each.

   A till with no uplink resolves that to nothing, falls through every entry in
   the stack and paints in system-ui — silently, because CSS has no error for a
   stylesheet that did not arrive. The costly part is not the display voice: it
   is that system-ui has PROPORTIONAL figures, so every currency column on the
   terminal stops aligning, which is the one thing --vq-font-numeric exists to
   guarantee. Offline-capable is not something you bolt onto a CDN import.

   ── Variable, not twelve static cuts ────────────────────────────────────────

   One file per family per subset carries the whole range, so the four weights
   the token layer names (--vq-fw-regular … --vq-fw-bold) are real instances
   rather than a browser faking bold by smearing the outline.

   ── Subsets ─────────────────────────────────────────────────────────────────

   latin + latin-ext. latin-ext is not optional here: ₹ (U+20B9), ₨ (U+20A8)
   and the rest of U+20A0–20C0 live in it, and a POS that cannot draw its own
   currency symbol is broken in the most visible way available.

   ${GENERATED}
   ════════════════════════════════════════════════════════════════════════════ */
`;

const APP_HEADER = `/* ════════════════════════════════════════════════════════════════════════════
   The Appearance-menu typefaces — SELF-HOSTED.

   Settings → Appearance offers six typeface choices. Three name a real family:
   Inter, Figtree and Serif (Source Serif 4). The other three — System, Grotesk,
   Mono — resolve to Space Grotesk or to the OS stack, and both are already
   covered: Space Grotesk by the V6 sheet, the OS stack by the OS.

   A face a user can PICK but the browser never downloads falls through to the
   next entry in its stack, which reads as "the setting does nothing". That was
   true offline for all three of these until they were vendored here.

   Figtree was already local at 400/500/600 as three static cuts. It is now one
   variable file covering 300–900, because the Appearance menu and both the
   daylight-calm and midnight-nebula themes ask for weights outside that trio.
   The three superseded statics moved to _to_delete/dead-code/.

   ${GENERATED}
   ════════════════════════════════════════════════════════════════════════════ */
`;

const PUBLIC_HEADER = `/* ════════════════════════════════════════════════════════════════════════════
   Faces for the Blade pages that do NOT go through Vite.

     resources/views/errors/503.blade.php         Bricolage Grotesque · Plus Jakarta Sans
     resources/views/installer/problem.blade.php  Inter

   Those two render precisely when the app is in trouble — mid-deploy, or with
   a half-finished install — so they cannot read the built asset manifest, and
   they must not reach the network either. They link this sheet at the fixed
   path /css/offline-fonts.css and it names /fonts/ directly.

   Yes, these six files are also under resources/fonts/. That copy is hashed
   into the Vite bundle; this one has a stable path a plain <link> can name.
   Six duplicated files is the cheaper half of that trade.

   ${GENERATED}
   ════════════════════════════════════════════════════════════════════════════ */
`;

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const resolved = FAMILIES.map((f) => ({ ...f, faces: readFaces(f.pkg) }));
const pick = (...pkgs) => pkgs.map((p) => resolved.find((f) => f.pkg === p));

const OFL = `The six families vendored beside this file are all licensed under the
SIL Open Font License, Version 1.1.

  Bricolage Grotesque   Copyright (c) 2022 The Bricolage Project Authors
  Plus Jakarta Sans     Copyright (c) 2020 The Plus Jakarta Sans Project Authors
  Space Grotesk         Copyright (c) 2020 The Space Grotesk Project Authors
  Inter                 Copyright (c) 2016 The Inter Project Authors
  Figtree               Copyright (c) 2022 The Figtree Project Authors
  Source Serif 4        Copyright (c) 2014-2023 Adobe

The full licence text is at https://openfontlicense.org and ships in each
node_modules/@fontsource-variable/<family>/LICENSE.

The OFL permits redistribution of the binaries as bundled here. It requires
that the fonts are not sold on their own, that this notice travels with them,
and that any MODIFIED font is renamed. None of these files are modified — they
are byte-identical copies of what fontsource publishes.
`;

/** [ path relative to ROOT, contents (string | Buffer) ] */
const outputs = [
    ['resources/css/venqore-v6/tokens/fonts.css',
        sheet(V6_HEADER, pick('bricolage-grotesque', 'plus-jakarta-sans', 'space-grotesk'), '../../../fonts/')],
    ['resources/css/fonts.css',
        sheet(APP_HEADER, pick('inter', 'figtree', 'source-serif-4'), '../fonts/')],
    ['public/css/offline-fonts.css',
        sheet(PUBLIC_HEADER, pick(...PUBLIC_FAMILIES), '/fonts/')],
    ['resources/fonts/OFL.txt', OFL],
];

for (const f of resolved) {
    for (const subset of SUBSETS) {
        const { file } = f.faces[subset];
        const bin = fs.readFileSync(path.join(NM, f.pkg, 'files', file));

        outputs.push([`resources/fonts/${file}`, bin]);
        if (PUBLIC_FAMILIES.includes(f.pkg)) outputs.push([`public/fonts/${file}`, bin]);
    }
}

let stale = 0;
let bytes = 0;

for (const [rel, content] of outputs) {
    const abs = path.join(ROOT, rel);
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    bytes += buf.length;

    const current = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    if (current && current.equals(buf)) continue;

    if (CHECK) {
        console.error(`  ✗ stale: ${rel}`);
        stale++;
        continue;
    }

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, buf);
    console.log(`  ${current ? 'updated' : 'wrote  '} ${rel}`);
}

if (CHECK) {
    if (stale) {
        console.error(`\n  ${stale} file(s) do not match what fonts-vendor.mjs produces.`);
        console.error('  Run: npm run fonts:vendor');
        process.exit(1);
    }
    console.log('  Vendored fonts are up to date.');
} else {
    console.log(`\n  ${outputs.length} files, ${(bytes / 1024).toFixed(0)} KB.`);
}
