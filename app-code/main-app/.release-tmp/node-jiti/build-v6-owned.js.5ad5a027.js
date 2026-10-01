"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.V6_TOKEN_DIR = void 0;exports.shadowedV6Colours = shadowedV6Colours;exports.v6DeclaredNames = v6DeclaredNames;exports.v6ReservedPaletteFamilies = v6ReservedPaletteFamilies;
























































var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeUrl = require("node:url");function _interopRequireDefault(e) {return e && e.__esModule ? e : { default: e };} /**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Which custom-property names the V6 token layer already owns              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Two systems write `--vq-*` custom properties into the same cascade, and they
 * hold incompatible *types* of value:
 *
 *   resources/css/venqore-v6/tokens/*.css   `--vq-teal-600: #088975`
 *       The V6 design system. Authored by hand. Holds RESOLVED COLOURS,
 *       because V6 tokens are read as plain values: `background: var(--vq-accent-fill)`.
 *
 *   resources/css/theme.generated.css        `--vq-teal-600: 8 137 117`
 *       This engine. Holds BARE CHANNEL TRIPLETS, because Tailwind reads them
 *       through `rgb(var(--vq-teal-600) / <alpha-value>)` and an alpha
 *       modifier cannot be applied to a hex string.
 *
 * ── The failure this module exists to make impossible ───────────────────────
 *
 * app.css imports the V6 layer first and the generated sheet last, both at
 * `:root`, so on any name they share the generated triplet wins. A triplet is
 * not a colour, so `background: var(--vq-accent-fill)` becomes invalid at
 * computed-value time and the browser drops the declaration ENTIRELY — no
 * error, no fallback, just an unpainted element.
 *
 * That is exactly what happened. Thirteen V6 semantic tokens resolve through
 * the teal ramp — `--vq-accent`, `--vq-accent-fill`, `--vq-accent-fill-hover`,
 * `--vq-accent-text`, `--vq-accent-quiet`, `--vq-accent-quiet-line`,
 * `--vq-focus` in both modes, plus `--vq-series-1-ink` — so every primary
 * button, focus ring, tint wash and slot-1 chart mark in the product painted
 * nothing. The dashboard's "Add cards" button was a white label on the page
 * background with a mint glow behind it, which is the box-shadow surviving a
 * background that did not.
 *
 * ── Why the fix is a namespace and not a patch ──────────────────────────────
 *
 * Both conventions are load-bearing and neither can be deleted:
 *
 *   · ~371 hand-written `rgb(var(--vq-slate-500))` call sites need triplets
 *     under the plain palette name.
 *   · ~180 `teal-*` / `sky-*` Tailwind utility classes need triplets too.
 *   · The whole V6 token layer needs resolved colours under the same names.
 *
 * So the names have to stop overlapping. This module reports which palette
 * families V6 has claimed; the generator emits those — and only those — under
 * `--vq-tw-<family>-<shade>` instead, and tailwind.config.js reads the same
 * answer so the two always agree. Every other family keeps the plain name and
 * every existing call site is untouched.
 *
 * The list is DERIVED, never typed. Add a hue to V6 tomorrow and the collision
 * resolves itself on the next `npm run theme:build`; there is nothing to
 * remember and nothing to keep in sync.
 *
 * Build-time only — this reads from disk and must never be imported into
 * browser code.
 */const _dirname = _nodePath.default.dirname((0, _nodeUrl.fileURLToPath)("file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/.release-tmp/venqore_build_6.0.10_4d52a290/resources/js/theme/build/v6-owned.js"));const PROJECT_ROOT = _nodePath.default.resolve(_dirname, '../../../..'); /** The authored V6 token layer. The generator may not write into these names. */const V6_TOKEN_DIR = exports.V6_TOKEN_DIR = _nodePath.default.join(PROJECT_ROOT, 'resources/css/venqore-v6/tokens'); /**
 * A declaration, not a reference.
 *
 * `--vq-accent: var(--vq-teal-500)` declares `--vq-accent` and *reads*
 * `--vq-teal-500`; only the left-hand side counts as ownership. Anchoring on
 * the `{` or `;` before it is what keeps the `var(...)` on the right out of
 * the set.
 */const DECLARATION = /(?:^|[;{])\s*(--[a-zA-Z_][\w-]*)\s*:/g;let cachedNames = null; /** Every `--vq-*` name the V6 token layer declares, in any of its files. */function v6DeclaredNames() {if (cachedNames) return cachedNames;const names = new Set();let files = [];try {files = _nodeFs.default.readdirSync(V6_TOKEN_DIR).filter((f) => f.endsWith('.css'));} catch {// The token layer is absent (a partial checkout, or this engine being
    // reused elsewhere). Claim nothing rather than guess — the generator
    // then behaves exactly as it did before this module existed.
    cachedNames = names;return names;}for (const file of files) {const css = _nodeFs.default.readFileSync(_nodePath.default.join(V6_TOKEN_DIR, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' '); // comments declare nothing
    for (const match of css.matchAll(DECLARATION)) names.add(match[1]);}cachedNames = names;return names;}const SHADE_SUFFIX = /-(?:\d+)$/; /**
 * The palette families V6 has claimed, out of the ones handed in.
 *
 * A family counts as claimed the moment V6 declares ANY shade of it — a
 * half-owned ramp is the worst outcome of all, because half the ramp paints
 * and half does not, which reads as a component bug rather than a token bug.
 * (V6 declares five stops of `sky` and five of `lime`, not eleven.)
 *
 * @param {Iterable<string>} families e.g. CONTROLLED_PALETTES ∪ REQUIRED_ROLES
 * @returns {Set<string>} the subset V6 owns — today: teal, sky, lime
 */function v6ReservedPaletteFamilies(families) {const declared = v6DeclaredNames();const reserved = new Set();for (const name of declared) {if (!SHADE_SUFFIX.test(name)) continue;const family = name.replace(/^--vq-/, '').replace(SHADE_SUFFIX, '');reserved.add(family);}return new Set([...families].filter((family) => reserved.has(family)));} /**
 * Colour tokens the generated sheet would shadow with a triplet.
 *
 * The guard, expressed as a query rather than a rule, so a test and a CLI can
 * both ask it. A name is a real conflict only when V6 holds a resolved colour
 * there: `--vq-font-sans` and `--vq-space-3` also appear in both files, but
 * both sides hold the same string and neither side is a colour, so a duplicate
 * there is noise rather than breakage.
 *
 * @param {string} generatedCss contents of theme.generated.css
 * @returns {string[]} sorted names, empty when the namespaces are disjoint
 */function shadowedV6Colours(generatedCss) {const declared = v6DeclaredNames();const clean = generatedCss.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const TRIPLET = /^\s*(?:\d{1,3}\s+){2}\d{1,3}\s*$/;

  const hits = new Set();
  for (const match of clean.matchAll(/(?:^|[;{])\s*(--[a-zA-Z_][\w-]*)\s*:([^;}]*)/g)) {
    const [, name, value] = match;
    if (!declared.has(name)) continue;
    // A triplet on a name V6 owns is the bug. Anything else is a duplicate.
    if (TRIPLET.test(value) || /^\s*var\(--vq-ramp-/.test(value)) hits.add(name);
  }

  return [...hits].sort();
} /* v7-5ff53c1fcb9705b0 */