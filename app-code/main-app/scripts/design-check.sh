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

count() { grep -rnE "$1" "$SRC" --include=*.jsx 2>/dev/null | wc -l | tr -d ' '; }

blocking() {
  local name="$1" pat="$2" n
  n=$(count "$pat")
  if [[ "$n" -eq 0 ]]; then
    ok "$name" "0"
  else
    bad "$name" "$n"
    grep -rnE "$pat" "$SRC" --include=*.jsx 2>/dev/null | head -5 | sed 's|^|      |'
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
blocking "coloured shadow"        'shadow-(indigo|violet|purple|teal|emerald|blue|sky|rose|red|amber)-[0-9]'
blocking "pigment names"          '\b(bg|text|border|ring|divide|from|to|via)-(indigo|slate|zinc|gray|stone)-[0-9]{2,3}'
blocking "dead Tailwind stops"    '-(neutral|brand|accent)-([0-9]*[13579]5|[0-9]+50)\b'
blocking "dual-axis charts"       'yAxisId'
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

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "  All design checks pass."
else
  echo "  Design checks FAILED. See DESIGN-RULES.md §16, and scripts/v6-*.py for the sweeps."
fi
exit "$FAIL"
