# UX Consistency Audit — Locked-State Presentation

Four independent components in the frontend render "you don't have access to this" states, each built separately with different icons, colors, copy tone, and even different semantic meaning (plan-tier lock vs. unreleased-feature notice). This is a direct UX-consistency problem for end users, and it mirrors the backend duplication documented in `PLAN_ENTITLEMENT_SOURCE_OF_TRUTH.md`.

## The four components

| Component | Data source read | Icon | Visual pattern | Color language | Copy | CTA |
|---|---|---|---|---|---|---|
| `resources\js\Components\PlanGate.jsx` | `usePlan().hasFeature(feature)` → Inertia prop `plan.features[key]` | Heroicons `LockClosedIcon` | Bordered box, feature hidden entirely (not shown blurred) | Amber border/background | "Feature Locked" / "The requested feature is not included in your current subscription plan." | Text link "Upgrade Plan" → `store.billing` |
| `resources\js\Components\FeatureLock.jsx` | Directly reads `store?.features[key]` (bypasses `usePlan()` hook entirely) | lucide-react `Lock` | Blurred overlay — children rendered blurred behind a lock panel | Plan-tinted (`PLAN_COLORS`: growth = indigo, business = purple) | "{label} requires {planLabel}" | Gradient pill button "Upgrade to {planLabel}" — dispatches custom `amd:plan-limit` window event rather than navigating directly |
| `resources\js\Components\FeatureLockBadge.jsx` | `isLocked` boolean passed in as a prop by the caller (no defined canonical source) | lucide-react `Lock` (badge overlay) | Small lock badge, click opens a modal | Amber badge; modal uses slate/purple | Modal: **"Coming Soon — V1.1"** — "This advanced module is part of our upcoming Gold Release expansion. We are currently finalizing the security and performance audits." | **No upgrade CTA at all** |
| `resources\js\Components\UpgradeModal.jsx` | Own hardcoded feature/icon map, independent of the other three | Emoji-based icons (e.g. `✨` for growth_engine) defined per-feature in the component itself | Modal dialog | Its own palette, not reconciled with the other three | Feature-specific copy defined inline (e.g. references "Growth Engine (AI retention)") | Presumably an upgrade CTA (not fully detailed in evidence gathered) |

## Why this matters beyond aesthetics

1. **Semantic collision:** `FeatureLockBadge.jsx`'s "Coming Soon — V1.1" framing tells the user a feature is *unreleased*, while `PlanGate.jsx` and `FeatureLock.jsx` tell the user a feature *exists but requires a higher plan*. If a given feature is actually plan-gated (built and working, just entitlement-blocked) but happens to render through `FeatureLockBadge.jsx`, the user is told something false — that it doesn't exist yet — when in fact upgrading would unlock it immediately. This directly suppresses upgrade conversions for genuinely available features.
2. **No shared source of "what plan unlocks this":** `FeatureLock.jsx`'s `planLabel` and `UpgradeModal.jsx`'s feature map are both hand-maintained per-component, independent of the backend seeder — meaning a locked-state UI could show the wrong required tier (e.g. tell a user "requires Growth" for something that's actually Business-only, or vice versa) with no code path catching the mismatch.
3. **Inconsistent CTA behavior:** `PlanGate.jsx` navigates directly to billing; `FeatureLock.jsx` dispatches a custom window event (`amd:plan-limit`) presumably caught by a listener elsewhere to open a modal; `FeatureLockBadge.jsx` has no CTA at all. A user encountering three different locked features on three different pages gets three different interaction models for functionally the same action ("I want this, how do I get it").
4. **Color language is not a system:** amber (PlanGate) vs indigo/purple plan-tinted (FeatureLock) vs amber badge + slate/purple modal (FeatureLockBadge) — no single "locked" color exists across the product. A design system audit (separate from this entitlement audit) would likely flag this independently.

## Underlying cause (cross-reference)

All four components trace back to the same root issue documented in `ROOT_CAUSE_ANALYSIS.md`: there is no single shared `<LockedFeature>` primitive or shared entitlement-display config, so each was built independently, likely at different times by different contributors, each solving "show a lock" from scratch rather than reusing prior work.

## Scope note

This audit did not exhaustively grep for every usage site of each of these four components across all Pages — it establishes that the four components exist and differ, and traces their data sources and copy. A full sweep of which pages use which component (to know exactly how many end-user surfaces are affected) was not performed and would be a reasonable follow-up before prioritizing a fix.
