# ROADMAP.md — Product Roadmap (from 2026-07-07)

> Assumes: solo founder + AI agents (current mode), pre-revenue. Each phase lists engineering, product, security, infra, GTM-readiness. GAPS/FEATURES references in parentheses.

## 0–30 days — "Make it safe and honest" (Launch-hardening)
**Theme: nothing new; everything true.**
- Security: C1 terminal APIs, H6 throttles+Pusher signature, prod guards + credential rotation (C5), 2FA owners, wildcard-permission removal (H4).
- Correctness: C4 offline idempotency (client UUID + server unique index), M4 SaleService constructor fix.
- Infra: CI pipeline (C6: mysql service, pest, eslint, build, gitleaks), Sentry (M6), platform DB backups + restore drill + RUNBOOK.md (H9), scheduler/queue alerting (healthchecks pings).
- Repo: C5 cleanup — scratch/ the debug scripts, archive root docs to docs/archive/, ZIPs out of repo, delete duplicate tests/ tree (M3).
- Product polish: EmptyState rollout + activation checklist (UIUX 1/7), TenantMiddleware perf + debug-log removal (H1).
- GTM: pricing page PKR toggle verified; demo store hardened + reset alerting (M11); privacy/ToS counsel pass started (H10).
- **Exit criteria: pen-test-lite clean; CI green; a stranger can sign up, import products, sell offline, see a correct P&L, and export data — unassisted.**

## 31–60 days — "Earn the claim" (Engine unification + activation)
- Engineering: POS → V3 cutover behind per-tenant flag with 2-week shadow-posting on internal store (C3, uses RunShadowMigration); Money value object at AccountingService choke point (C2 phase 1).
- Product: report drill-down to journal (FEATURES 6) — the demo-able moat; import concierge templates Loyverse/Vyapar/Excel (FEATURES 7); receipt-printer spike → decision: QZ-Tray vs print-server (FEATURES 4).
- Infra: Redis cache/session/queue + Horizon on SaaS deploy (H7); S3 media (H8).
- Security: mass-assignment hardening on financial models (H3); route-permission coverage report + close write routes; H2 membership check.
- GTM: 20 design-partner stores recruited (free Business plan for feedback + testimonials — Pakistan retail WhatsApp groups, personal network); onboarding time-to-first-sale instrumented (<10 min target); 10 SEO cornerstone articles drafted (MARKETING.md); AppSumo application submitted (their pipeline takes weeks).
- **Exit criteria: V3 posts 100% of POS sales on flagged tenants with zero reconciliation diffs for 14 days; 20 active pilot stores.**

## 61–90 days — "Launch" 
- Product: receipt printing shipped (4); plan-gate upsell modals (UIUX 9); WhatsApp receipts MVP if WA API approved (14); Pos.jsx decomposition alongside printer work (M1).
- Engineering: Money object phase 2 (FIFO/reports); report query budgets + snapshot pre-aggregation for top 10 (M2).
- Launches: **AppSumo campaign live** (60-day window) → **Product Hunt** mid-campaign (LAUNCH.md timelines) → PK soft-launch events.
- Support scale: docs site + Vena KB filled from pilot questions; support SLA definition; status page.
- **Exit criteria: first 300+ paying/LTD customers; churn + activation dashboards live (platform revenue services exist); support <24h response held through launch spike.**

## 4–6 months — "Compound"
- Product: mobile companion (owner dashboard) (9); Urdu/RTL framework + top-40 screens (10); customer payment links w/ JazzCash/Easypaisa (13); Shopify channel (16); accountant read-only role + statement exports.
- Platform: public API + keys (plan-gated) (15); webhook subscriptions for partners; reseller/white-label pilot on DRM rails (Pakistan dealers — Marg's own playbook used against it).
- Engineering: legacy engine deleted (C3 complete); i18n infra done; a11y pass on POS+forms (M9).
- GTM: review-engine running (G2/Capterra/Trustpilot — LTD buyers are prolific reviewers); YouTube tutorial library (20 videos); 3 marketplace/agency partnerships.
- Targets: $8–15k MRR equivalent (subs + amortized LTD), 500+ weekly-active stores, NPS ≥ 40.

## 7–12 months — "Own the beachhead"
- Product: restaurant mode (KOT/tables) (11) OR deep retail vertical (pharmacy w/ batch-expiry compliance) — pick ONE by data; franchise/HQ consolidated reporting; purchase planning AI (12); Tally/QBO export bridge (accountant acceptance).
- Platform: SOC2-lite security documentation for bigger deals; uptime SLO 99.9% public.
- Team: first 2 hires — support lead (PK, bilingual) + full-stack engineer. Founder exits support rotation.
- GTM: Pakistan reseller network 10+ dealers; accountant referral program; case-study engine (1/month); regional expansion test (UAE/Saudi or Bangladesh).
- Targets: $40–60k MRR equivalent, 2,000+ active stores, LTD cohort add-on attach ≥20%, infrastructure cost <6% of revenue.

## Standing rules
1. Nothing ships to the money path without a reconciliation/invariant test.
2. Every feature ships with its plan-gate, its empty state, and its docs page — or it isn't done.
3. One beachhead (PK retail/food SMB) until $50k MRR; every "enterprise" distraction gets a polite no.
4. CHANGELOG.md discipline continues — it's already excellent; it becomes the public changelog.
