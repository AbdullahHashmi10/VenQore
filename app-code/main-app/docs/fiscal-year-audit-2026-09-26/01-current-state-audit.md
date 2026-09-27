# Fiscal year and accounting-period audit

**Date:** 2026-09-26  
**Status:** Audit complete; implementation must follow the cheque-book and calculator releases.

## Executive verdict

VenQore has three useful fragments, but it does not yet have a complete fiscal-year feature:

1. Store Settings contains a `fiscal_year_start` date.
2. Several reports use that setting as their default start date.
3. `POST /s/{store}/v3/fiscal-year/close` creates a year-end journal that transfers profit or loss to account `3100`.

The current endpoint must not be presented to customers as a safe financial-year close. It does not create or manage fiscal-year records, does not lock the closed period, has no close screen, has no preview or checklist, and has a material multi-year calculation defect.

## What works today

- Tenant-scoped `fiscal_year_start` can be entered in Admin Settings.
- `SettingsHelper::getFiscalYearStart()` derives the current fiscal-year start month/day.
- Many legacy reports default to that derived date.
- The close endpoint is plan-gated and route-gated by `finance.journal`.
- The submitted approver must be an active owner/admin member of the same tenant; a PIN is required when another user approves.
- A first close can generate balanced P&L-closing lines and post through the central accounting engine.
- The journal and approver are audit-logged by the accounting engine.
- Existing tests cover a successful first close, same-date duplicate rejection, tenant isolation, approver role, and approver PIN.

## Release-blocking findings

### FY-01 — A second fiscal-year close can close lifetime profit again (critical)

`FiscalYearController` sums every income and expense posting from inception through the requested end date and explicitly excludes all earlier `fiscal_year_close` entries. After Year 1 is closed, Year 2 therefore includes Year 1 operating activity again. The new closing journal can overstate retained earnings and leave P&L accounts with non-zero/incorrect balances.

The calculation must use the selected fiscal year's explicit start and end dates, and it must reconcile its proposed lines against the actual pre-close account balances for that period.

### FY-02 — Closing does not lock the period (critical)

The migration seeds a `period_lock_date` setting, but no application code reads or enforces it. `AccountingService::createEntry()` and `reverseEntry()` accept dates in a supposedly closed period. The marketing claim that postings into closed periods are refused is currently false.

Lock enforcement belongs in the central accounting write boundary so every current and future posting path is covered. Controllers may add friendly validation, but they cannot be the security boundary.

### FY-03 — Close deletion violates ledger immutability (critical)

`BillingController` can “deactivate” fiscal-year closing by deleting every fiscal close journal through `deleteEntries()`. A plan/feature change must never erase accounting history. Any reopening or correction must be permission-controlled, reasoned, audited, and performed with reversing entries or a formally modeled reopen operation.

### FY-04 — No real fiscal-year or accounting-period records (high)

There is no table containing year name, start, end, status, lock state, closed time, actor, approver, closing journal, reopen reason, or version. Duplicate protection only checks for a close journal on the exact requested date. It cannot prevent overlapping years, skipped years, two concurrent closes, or an arbitrary mid-year close.

### FY-05 — No customer close/open workflow (high)

There is only a POST endpoint. There is no list/status page, year creation/open action, preview, readiness checklist, review screen, progress state, close report, or controlled reopen flow. The Settings screen only edits a date.

### FY-06 — Date and concurrency safeguards are incomplete (high)

The endpoint accepts an arbitrary valid date, including a future date or a date unrelated to the configured fiscal year. The duplicate check and posting are not enclosed in one locked transaction, and there is no tenant-scoped database uniqueness constraint or idempotency key for a close.

### FY-07 — Reporting periods disagree (high)

Legacy financial reports often use `getFiscalYearStart()`, but Reckoner explicitly uses calendar years/quarters and says the product has no fiscal-year system. Several dashboards, exports, statements, and reports also use `startOfYear()`. A store with a July–June year will see inconsistent “This year” figures across screens.

### FY-08 — Fiscal settings are weakly governed (high)

The visible setting posts through `AdminController::updateSettings()`, which accepts arbitrary keys and does not validate `fiscal_year_start`. It can be changed after transactions or a close without an effective-date rule, impact preview, dedicated permission, or a fiscal-setting audit event. Invalid values silently fall back to `2025-01-01` in the helper.

## Important missing controls

- Dedicated permissions such as `finance.fiscal_year_view`, `finance.fiscal_year_manage`, `finance.period_lock`, and `finance.period_reopen`.
- Explicit fiscal-year states: draft/open, closing, closed, and reopened/adjustment-open where applicable.
- A soft lock and optional irreversible hard lock. Any temporary exception needs scope, expiry, reason, actor, and audit history.
- A pre-close checklist for trial-balance equality, pending approval documents, draft/unposted transactions, unreconciled cash/bank activity, inventory/COGS readiness, depreciation, tax review, and missing retained-earnings configuration.
- A preview showing proposed closing lines, profit/loss, retained-earnings account, warnings, and the exact period being closed.
- A close snapshot/hash so the reviewed figures can be compared with the figures actually posted.
- An explicit adjustment workflow after close. Corrections should post in an open adjustment period or the next period, according to policy.
- A close certificate/report with the period, balances, journal, actor, approver, timestamps, checklist results, and later reopen/exception history.
- Notifications and dashboard cards for a year approaching end, close tasks outstanding, period closed, and exceptions/reopens.
- Safe fiscal-year changes for first/short/long years, leap-day boundaries, tenant timezone, and transition to a new year pattern.
- Clear behavior for documents created before close but approved afterward. Approval-time posting must recheck the lock and reject or move the accounting date according to an explicit policy.
- Background jobs, imports, WooCommerce, sync/offline POS, Smart Capture, depreciation commands, and marketplace settlements must all pass through the same lock guard.

## Additional inconsistencies and risks

- The fiscal setting stores a full date but the helper uses only its month/day. The UI default is the stale literal `2025-01-01`, which obscures that behavior.
- `getFiscalYearStart()` uses the application clock rather than explicitly resolving in the tenant timezone.
- The close description uses only the end year, which is ambiguous for non-calendar and short/long fiscal years.
- Retained earnings is hard-coded to account code `3100`; the close has no readiness check that the account exists, is active, and has the correct equity role.
- The plan catalogue and the database-seeded plan limits disagree about which subscriptions include fiscal-year closing. Product entitlement needs one authoritative source.
- The current same-date duplicate test does not cover sequential years, overlaps, concurrent requests, future dates, setting changes, locked backdating, or post-close approvals.
- Marketing pages promise closed-period refusal even though it is not implemented.

## Benchmark used for completeness

Established accounting systems distinguish fiscal-year definitions from lock dates. Current Odoo documentation includes named start/end dates for exceptional fiscal years, a pre-close checklist, lock dates, logged temporary exceptions, and an optional irreversible hard lock. This audit uses those controls as a completeness benchmark, not as a requirement to copy Odoo's interface.

