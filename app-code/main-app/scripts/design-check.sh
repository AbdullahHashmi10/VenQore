#!/usr/bin/env bash
#
# Design conformance — DESIGN-RULES.md v3.1 §16.
#
#   ./scripts/design-check.sh            # report, exit 0 unless a BLOCKING rule fails
#   ./scripts/design-check.sh --strict   # every rule blocks
#   ./scripts/design-check.sh --baseline # record today's oxlint count as the ceiling
#
# Four groups on purpose.
#
# BLOCKING rules are at zero today. A new page that breaks one is a regression
# and the build should refuse it.
#
# OFFLINE is one rule with one job: no typeface may be fetched at paint time.
#
# ADHERENCE parses the JSX rather than grepping it, because the things it
# catches — `<Alert tone="urgent">`, `<IconButton>` with no label — are legal
# strings in legal places and depend entirely on WHICH component the attribute
# sits on. Grep cannot see that. It blocks.
#
# RATCHET rules are above zero and always were. They are held at their current
# count: a change may lower them, never raise them. A check that has always
# failed is a check nobody reads, so these do not block — they just refuse to
# get worse.
#
# ── Why the two oxlint sections self-test first ─────────────────────────────
#
# oxlint exits 1 for "found problems" AND for "your config is broken", and a
# missing native binding (npm's optional-dependency bug, which bites whenever a
# lockfile crosses platforms) crashes node before a file is read. All three
# produce an empty diagnostic list. A harness that greps that list for errors
# finds none and prints a green zero — a check reporting success for the wrong
# reason, which is worse than no check at all.
#
# So neither section trusts a zero until it has watched the rules catch planted
# violations in scripts/ds-adherence.fixture.jsx.
#
set -uo pipefail
cd "$(dirname "$0")/.."

SRC="resources/js"
STRICT=0
BASELINE=0
[[ "${1:-}" == "--strict" ]] && STRICT=1
[[ "${1:-}" == "--baseline" ]] && BASELINE=1
FAIL=0

OXLINT="node_modules/.bin/oxlint"
DS_CONFIG="resources/js/Components/ds/_adherence.oxlintrc.json"
FIXTURE="scripts/ds-adherence.fixture.jsx"
CEILING_FILE="scripts/.oxlint-ceiling"

ok()   { printf "  \033[32m✓\033[0m %-26s %s\n" "$1" "${2:-}"; }
bad()  { printf "  \033[31m✗\033[0m %-26s %s\n" "$1" "${2:-}"; FAIL=1; }
note() { printf "  \033[33m•\033[0m %-26s %s\n" "$1" "${2:-}"; }

# .jsx AND .tsx/.ts. The vendored chart library under Components/Charts is
# TypeScript, so a .jsx-only sweep reported a green zero for `yAxisId` while 72
# of them shipped. Any rule that is about the RENDERED result has to see them.
INCL=(--include=*.jsx --include=*.tsx --include=*.ts)

count() { grep -rnE "$1" "$SRC" "${INCL[@]}" 2>/dev/null | wc -l | tr -d ' '; }

blocking() {
  local name="$1" pat="$2" n
  n=$(count "$pat")
  if [[ "$n" -eq 0 ]]; then
    ok "$name" "0"
  else
    bad "$name" "$n"
    grep -rnE "$pat" "$SRC" "${INCL[@]}" 2>/dev/null | head -5 | sed 's|^|      |'
  fi
}

# Held at the count recorded when the V6 rollout landed. Lower is fine.
ratchet() {
  local name="$1" pat="$2" ceiling="$3" n
  n=$(count "$pat")
  if [[ "$n" -le "$ceiling" ]]; then
    ok "$name" "$(printf '%-5s (ceiling %s)' "$n" "$ceiling")"
  else
    bad "$name" "$(printf '%-5s (ceiling %s — this went UP)' "$n" "$ceiling")"
  fi
}

echo
echo "  DESIGN-RULES v3.1 — blocking"
blocking "arbitrary z-index"      'z-\[[0-9]+\]'
blocking "radius above ceiling"   'rounded-(3xl|\[[0-9.]+(rem|px)\])'
blocking "weight above 700"       'font-(extrabold|black)'
blocking "illegal duration"       'duration-(75|100|150|300|500|700|1000)\b|duration-\[[0-9]+ms\]'
# The original list omitted orange, cyan and green — and every violation in the
# codebase was in one of those three, so the rule reported a green zero while 15
# coloured shadows shipped. If you add a palette, add it here.
blocking "coloured shadow"        'shadow-(indigo|violet|purple|fuchsia|pink|plum|teal|emerald|green|lime|blue|sky|cyan|rose|red|orange|coral|amber|yellow|butter)-[0-9]'
blocking "pigment names"          '\b(bg|text|border|ring|divide|from|to|via)-(indigo|slate|zinc|gray|stone)-[0-9]{2,3}'
blocking "dead Tailwind stops"    '-(neutral|brand|accent)-([0-9]*[13579]5|[0-9]+50)\b'
# The rule is "we do not SHIP a dual-axis chart", not "no library may support
# one". Components/Charts is the vendored bklit library — 23 files we do not
# author, whose own API carries yAxisId. Our call sites must stay at zero.
dual_n=$(grep -rnE 'yAxisId' "$SRC" "${INCL[@]}" 2>/dev/null | grep -vc '/Components/Charts/' || true)
if [[ "$dual_n" -eq 0 ]]; then ok "dual-axis charts" "0"
else bad "dual-axis charts" "$dual_n"
  grep -rnE 'yAxisId' "$SRC" "${INCL[@]}" 2>/dev/null | grep -v '/Components/Charts/' | head -5 | sed 's|^|      |'
fi

# purple / violet / fuchsia / pink all resolve to V6's PLUM playmate. Plum is a
# real colour — §5 slot 6 — but only for categorical DATA. As chrome it simply
# contradicts the teal identity, which is how the product came to render teal→
# plum gradients on its buttons, avatars and the AI bubble. Charts reach plum
# through `series` in theme/runtime.js, never through a Tailwind class.
# WooCommerce is the one exception: purple is WooCommerce's own brand mark.
plum_n=$(grep -rnE '\b([a-z-]+:)*(bg|text|border|ring|divide|from|to|via|shadow|fill|stroke)-(purple|violet|fuchsia|pink)-[0-9]{2,3}' \
           "$SRC" "${INCL[@]}" 2>/dev/null | grep -vc '/Pages/WooCommerce/' || true)
if [[ "$plum_n" -eq 0 ]]; then
  ok "plum as chrome" "0"
else
  bad "plum as chrome" "$plum_n"
  grep -rnE '\b([a-z-]+:)*(bg|text|border|ring|divide|from|to|via|shadow|fill|stroke)-(purple|violet|fuchsia|pink)-[0-9]{2,3}' \
    "$SRC" "${INCL[@]}" 2>/dev/null | grep -v '/Pages/WooCommerce/' | head -5 | sed 's|^|      |'
fi

# A variant with nothing after it — `hover:` , `disabled:` — is what a codemod
# leaves when it deletes the utility and not the modifier. Tailwind emits
# nothing for it, so the style is silently gone and the class list still reads
# as though it were there. 80 of these were shipping.
blocking "dangling variant"       '[a-z0-9]-[a-z0-9/.:\[\]%-]+[ \t]+([a-z-]+:)*(hover|focus|active|disabled|checked|group-hover|dark):([ \t]|"|'"'"'|`)'
# Not a colour rule. A class that does not exist in tailwind.config.js compiles
# to nothing and the element silently inherits — the single most expensive
# mistake available here, and it cost two rounds during the rollout.
blocking "class that cannot exist" '\b(border|divide)-border\b|\bbg-card\b|\btext-primary\b|\btext-secondary\b|\bborder-subtle\b'

# ──────────────────────────────────────────────────────────────────────────
# Offline
# ──────────────────────────────────────────────────────────────────────────
#
# Every one of these was a <link>/@import at the Google font CDN, and every one
# failed SILENTLY on a till with no uplink — CSS has no error for a stylesheet
# that did not arrive. The screen paints in system-ui, whose figures are
# PROPORTIONAL, so every currency column stops aligning. Faces are vendored
# under resources/fonts/ — see scripts/fonts-vendor.mjs.
echo
echo "  offline — blocking"

cdn_hits=$(grep -rn "fonts\.googleapis\.com\|fonts\.gstatic\.com" resources/css resources/views 2>/dev/null || true)
if [[ -z "$cdn_hits" ]]; then
  ok "font CDN reference" "0"
else
  bad "font CDN reference" "$(printf '%s\n' "$cdn_hits" | wc -l | tr -d ' ')"
  printf '%s\n' "$cdn_hits" | head -5 | sed 's|^|      |'
fi

fonts_out=$(node scripts/fonts-vendor.mjs --check 2>&1)
fonts_rc=$?
if [[ "$fonts_rc" -eq 0 ]]; then
  ok "vendored faces" "current"
else
  bad "vendored faces" "stale or missing — run: npm run fonts:vendor"
  printf '%s\n' "$fonts_out" | grep -E "stale|not installed|npm i" | head -3 | sed 's|^|      |'
fi

# ──────────────────────────────────────────────────────────────────────────
# Design-system adherence
# ──────────────────────────────────────────────────────────────────────────
echo
echo "  design-system adherence — blocking"

DS_ARMED=0

if [[ ! -x "$OXLINT" ]]; then
  # Not skipped quietly. A check that vanishes when a dependency is missing is
  # a check that reports success for the wrong reason.
  bad "ds prop + enum" "oxlint not installed — run: npm ci"
elif [[ ! -f "$FIXTURE" ]]; then
  bad "adherence self-test" "$FIXTURE is missing — the harness cannot be trusted"
else
  if node scripts/ds-adherence.mjs --check >/dev/null 2>&1; then
    ok "ds contract" "current"
  else
    bad "ds contract" "STALE — a .d.ts moved; run: npm run ds:contract"
  fi

  # Prove the rules fire before believing a zero from them.
  probe=$("$OXLINT" -c "$DS_CONFIG" "$FIXTURE" 2>&1)
  broken=""

  for rule in enum no-unknown-prop required-prop; do
    printf '%s' "$probe" | grep -q "ds($rule)" || broken="$broken $rule"
  done

  # The fixture also uses the app's OWN SidebarItem, which has different props.
  # If that shows up, the rule is firing on bare JSX names instead of resolving
  # imports, and every count it produces is noise.
  printf '%s' "$probe" | grep -q "SidebarItem" && broken="$broken name-resolution"

  if [[ -n "$broken" ]]; then
    bad "adherence self-test" "HARNESS BROKEN —$broken never fired"
    printf '%s\n' "$probe" | head -6 | sed 's|^|      |'
    echo "      The count below would be meaningless, so it is not run."
  else
    DS_ARMED=1
    ok "adherence self-test" "3 rules armed"

    ds_out=$("$OXLINT" -c "$DS_CONFIG" "$SRC" 2>&1)
    ds_n=$(printf '%s' "$ds_out" | grep -c "error ds(" || true)

    if [[ "$ds_n" -eq 0 ]]; then
      ok "ds prop + enum" "0"
    else
      bad "ds prop + enum" "$ds_n"
      printf '%s' "$ds_out" | grep "error ds(" | head -5 | sed 's|^|      |'
    fi
  fi
fi

echo
echo "  ratchet — may fall, must not rise"
ratchet  "raw hex"                '#[0-9a-fA-F]{3,8}\b'                              684
ratchet  "dark: twins"            'dark:(bg|text|border|divide)-neutral-[0-9]'         6
ratchet  "hover:scale"            '(group-)?hover:scale-'                              3

# oxlint's own correctness pass. Its ceiling is not a design decision, it is
# whatever the codebase happened to contain the day it was switched on, so it
# is recorded rather than typed — `--baseline` writes it, and from then on the
# number may only fall.
if [[ -x "$OXLINT" && -f "$FIXTURE" ]]; then
  # Same self-test. The fixture carries a duplicate object key, which is an
  # oxlint `correctness` error and invisible to the ds config.
  ox_probe=$("$OXLINT" "$FIXTURE" 2>&1)

  if ! printf '%s' "$ox_probe" | grep -q "no-dupe-keys"; then
    bad "oxlint self-test" "HARNESS BROKEN — oxlint did not flag the planted fixture"
    printf '%s\n' "$ox_probe" | head -6 | sed 's|^|      |'
  else
    # Counted from the diagnostics, not from oxlint's summary line: the summary
    # is only emitted on a TTY, so parsing it works by hand and returns 0 in CI.
    ox_out=$("$OXLINT" "$SRC" 2>&1)
    ox_n=$(printf '%s' "$ox_out" | grep -cE ": error " || true)
    ox_n=${ox_n:-0}

    if [[ "$BASELINE" -eq 1 ]]; then
      echo "$ox_n" > "$CEILING_FILE"
      note "oxlint correctness" "$(printf '%-5s (ceiling recorded)' "$ox_n")"
    elif [[ -f "$CEILING_FILE" ]]; then
      ox_ceiling=$(tr -d '[:space:]' < "$CEILING_FILE")
      if [[ "$ox_n" -le "$ox_ceiling" ]]; then
        ok "oxlint correctness" "$(printf '%-5s (ceiling %s)' "$ox_n" "$ox_ceiling")"
      else
        bad "oxlint correctness" "$(printf '%-5s (ceiling %s — this went UP)' "$ox_n" "$ox_ceiling")"
        printf '%s' "$ox_out" | grep -E ": error " | head -5 | sed 's|^|      |'
      fi
    else
      note "oxlint correctness" "$(printf '%-5s (no ceiling yet — run: npm run design:baseline)' "$ox_n")"
    fi
  fi
elif [[ "$BASELINE" -eq 1 ]]; then
  bad "oxlint correctness" "cannot baseline — oxlint or the fixture is missing"
fi

# ── token namespace — blocking ──────────────────────────────────────────────
#
# Two layers write --vq-* into the same cascade and they hold different TYPES.
# The V6 token layer holds resolved colours; theme.generated.css holds bare
# channel triplets, because Tailwind reads them through
# `rgb(var(--vq-teal-600) / <alpha-value>)`. app.css loads the generated sheet
# last, so on any shared name the triplet wins — and a triplet is not a colour,
# so every `var()` reading it as one is dropped by the browser silently.
#
# That shipped. Thirteen semantic tokens (every accent, every focus ring, the
# slot-1 chart mark) painted nothing product-wide, in both modes, with no error
# anywhere and no failing test. The generator now routes the colliding families
# to --vq-tw-* by itself; this is the check that says it still does.
echo
echo "  token namespace — blocking"

if [[ -f resources/css/theme.generated.css ]]; then
  shadow_out=$(node --input-type=module -e "
    import fs from 'node:fs';
    const { shadowedV6Colours } = await import('./resources/js/theme/build/v6-owned.js');
    const css = fs.readFileSync('resources/css/theme.generated.css', 'utf8');
    process.stdout.write(shadowedV6Colours(css).join('\n'));
  " 2>&1) || shadow_out="HARNESS BROKEN — $shadow_out"

  if [[ -z "$shadow_out" ]]; then
    ok "V6 colour token shadowed" "0"
  else
    bad "V6 colour token shadowed" "$(printf '%s\n' "$shadow_out" | wc -l | tr -d ' ')"
    printf '%s\n' "$shadow_out" | head -8 | sed 's|^|      |'
    echo "      → these names hold a V6 colour and a generated triplet. Run: npm run theme:build" | sed 's|^|  |'
  fi
else
  note "V6 colour token shadowed" "theme.generated.css missing — run npm run theme:build"
fi

# The other half of the same rule: a component may not re-declare a design
# token to work around it painting nothing. Every one of these was a symptom.
tokpatch=$(grep -rnE -- '--vq-[a-z0-9-]+:[^;]*!important' "$SRC" --include=*.jsx 2>/dev/null || true)
if [[ -z "$tokpatch" ]]; then
  ok "token override in a page" "0"
else
  bad "token override in a page" "$(printf '%s\n' "$tokpatch" | wc -l | tr -d ' ')"
  printf '%s\n' "$tokpatch" | head -5 | sed 's|^|      |'
fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "  All design checks pass."
else
  echo "  Design checks FAILED. See DESIGN-RULES.md §16, and scripts/v6-*.py for the sweeps."
fi
exit "$FAIL"
