# Theming VenQore

Everything about how VenQore looks — every colour, font, size, corner radius,
shadow and spacing value across all 393 screens — is controlled from one folder:

```
resources/js/theme/
```

Nothing else in the codebase should contain a colour value.

---

## Change the theme

Open `resources/js/theme/active.js` and edit one line:

```js
export const ACTIVE_THEME = 'midnight-nebula';
```

Then rebuild:

```bash
npm run build     # or restart `npm run dev`
```

That's the whole procedure. No database setting, no cache to clear, no
per-store configuration. The choice lives in git, so how the product looks is
versioned alongside the code that renders it and reverts like any other commit.

### Themes that ship today

| id | Description |
|---|---|
| `midnight-nebula` | The original look. Deep indigo voids, saturated accents, compact density. Dark by default. |
| `daylight-calm` | Warm neutrals, muted slate-blue brand, larger type, noticeably more breathing room. Light by default. |

---

## Create a theme

1. Copy `resources/js/theme/themes/_template.js` to `themes/your-theme.js`.
2. Set the four `BASE` colours at the top. Most of the theme derives from them.
3. Register it in `active.js`:

   ```js
   import yourTheme from './themes/your-theme.js';

   export const AVAILABLE_THEMES = {
       'midnight-nebula': midnightNebula,
       'daylight-calm': daylightCalm,
       'your-theme': yourTheme,
   };
   ```

4. Point `ACTIVE_THEME` at it and run `npm run theme:build`.

The build validates every registered theme and refuses to compile one with
missing tokens, so a half-finished theme fails at your terminal rather than in
front of a customer. It also warns about any text/background pair that falls
below WCAG AA — worth reading, since "hard to read" is the most common complaint
about any interface and it is almost always a contrast or leading problem.

### The highest-leverage decisions

**The neutral ramp.** It drives nearly every surface, border and line of body
text, because the `slate` family alone accounts for ~24,000 class usages in this
codebase. Cool greys (blue undertone) read as *software*; warm greys (yellow or
red undertone) read as *paper*.

**Type size and leading.** More important than colour for perceived calm. An
audit of this codebase found ~2,700 hardcoded micro font sizes — 1,851 at 10px,
431 at 9px, 132 at 8px. No palette makes 8px text at 1.5 line-height comfortable.

**Density.** `density.space` feeds padding, margin and gap. Scaling it by ~1.25
is the difference between "dense terminal" and "calm application".

**Font weight.** `font-bold` appears 5,334 times and `font-black` 2,023. When
almost everything is heavy, nothing reads as emphasised and the whole interface
feels like it is shouting. A theme can redefine what those names resolve to
without anyone editing 7,000 class names.

---

## How it works

### Two layers

**Ramps** are 11-stop scales (50 → 950). They do *not* change between light and
dark mode, because the codebase already expresses mode by picking different
stops — `bg-white dark:bg-slate-900`. If the ramps flipped, every one of those
pairs would invert and the UI would turn inside out.

**Semantic tokens** (`bg-surface`, `text-ink`, `border-line`) *do* flip with the
mode. They need no `dark:` twin, which is the main reason to prefer them.

### Why old class names still work

The codebase carries roughly 40,000 hardcoded colour classes across 393
component files. Rewriting them all would mean touching the POS terminal, the
accounting ledger and every report — a lot of risk for a cosmetic change.

But `bg-indigo-600` is not really a colour. It is a *lookup*, resolved through
`tailwind.config.js`. That file now points every colour family at a CSS variable,
and `resources/css/theme.generated.css` decides what those variables mean. So all
1,345 usages of `bg-indigo-600` follow the active theme without one of them being
edited.

```
theme file  →  theme.generated.css  →  tailwind.config.js  →  bg-indigo-600
   (you)         (generated)            (indirection)          (393 files)
```

The honest cost: a class can now say "indigo" while rendering something that is
not indigo. That is why the semantic names exist. Use them in new code; rename
old files when you happen to be working in them. Both vocabularies resolve to the
same tokens, so the cleanup never has to be one big rewrite.

---

## Writing new code

### Colour

```jsx
// Preferred — says what it means, survives a rebrand, no dark: twin needed
<div className="bg-surface text-ink border border-line">
<button className="bg-brand-500 hover:bg-brand-600 text-ink-inverted">
<span className="text-danger-600">Overdue</span>

// Still works, follows the theme, but the name is legacy vocabulary
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">

// Never — invisible to the theme engine, will not follow a theme switch
<div style={{ color: '#6366f1' }}>
<div className="bg-[#05030f]">
```

### The one exception: SVG and charts

`fill`, `stroke` and `stopColor` on an SVG element render as HTML *attributes*,
and `var()` is only valid inside a CSS declaration. So this silently renders
nothing:

```jsx
<Area stroke="var(--vq-indigo-500)" />   // ✗
```

Recharts passes its colour props straight through as attributes, so every chart
hits this. Import resolved values instead:

```jsx
import { vq, role, chartSeries } from '@/theme/runtime';

<Area stroke={role.brand[500]} />
<Bar fill={vq.emerald[500]} />
<Pie data={data} colors={chartSeries} />
```

For mode-dependent values in a chart:

```jsx
import { useSemanticTokens } from '@/theme/useSemanticTokens';

const t = useSemanticTokens();
<CartesianGrid stroke={t.border} />
<XAxis tick={{ fill: t['ink-muted'] }} />
```

### Third-party brand colours

Amazon's orange and Google's blue are not yours to restyle. Hardcode them and
say why:

```jsx
// eslint-disable-next-line no-restricted-syntax -- Amazon brand orange
const AMAZON = '#ff9900';
```

---

## Commands

| Command | What it does |
|---|---|
| `npm run theme:build` | Regenerate `theme.generated.css` from the active theme. Runs automatically before `dev` and `build`. |
| `npm run theme:check` | Fail if the committed CSS is stale. Useful in CI. |
| `npm run theme:verify` | Prove the baseline theme still renders identically to stock Tailwind. |
| `npm run theme:codemod` | Dry-run scan for hardcoded values that escaped the theme. Add `--write` to fix. |

ESLint warns on any new hardcoded hex or inline `rgba()` in a colour property.

---

## File map

```
resources/js/theme/
├── active.js                  ← THE SWITCH. Start here.
├── contract.js                What a theme must provide; validation.
├── color.js                   Colour maths: ramp generation, contrast, mixing.
├── runtime.js                 JS access to resolved values (charts, SVG).
├── useSemanticTokens.js       React hook for mode-dependent values.
├── themes/
│   ├── _template.js           Copy this to start a new theme.
│   ├── midnight-nebula.js     The original look, captured verbatim.
│   └── daylight-calm.js       Warm, roomier, light-first.
└── build/
    ├── generate.js            Theme → CSS variables.
    ├── verify-parity.js       Proves the baseline is a visual no-op.
    └── codemod.js             Finds and fixes hardcoded values.

resources/css/theme.generated.css   ← GENERATED. Never edit.
tailwind.config.js                  ← Shape only, no values.
```

---

## Things worth knowing

**`resources/css/theme.generated.css` is generated.** Edits are overwritten on
every build. It is committed so that a fresh clone renders correctly before
anyone runs a build.

**Bare `rounded` and bare `shadow` keep Tailwind's stock values.** Only the named
steps (`rounded-lg`, `shadow-md`) are themed. Redefining the bare utilities would
move thousands of elements that never opted in.

**Density does not scale `w-*` or `h-*`.** Only padding, margin and gap. The
codebase mixes scale classes with fixed ones (`w-8` next to `h-[32px]`), so
growing `w-8` would knock those pairs out of alignment everywhere. Icon boxes
stay put; the breathing room comes from spacing.

**`neutral` is both a Tailwind family and a role, and the role wins.** So
`bg-neutral-500` gives the theme's chrome colour, not Tailwind's `#737373`.
Nothing currently uses `neutral-*`, so nothing depends on the old behaviour.

**The `void` family is ours, not Tailwind's.** It covers the deep backgrounds on
auth, marketing and platform-shell screens that used to be written as arbitrary
values like `bg-[#05030f]`. Every theme must define it.

**Light mode has a compensation layer.** The bottom of `resources/css/app.css`
nudges several slate classes one stop darker in light mode, because the UI was
authored dark-first and its light neutrals are too pale to read on white. A
theme designed light-first does not need it — the honest move is to delete those
rules rather than keep fighting them.
