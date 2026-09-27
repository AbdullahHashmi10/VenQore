# Fiscal year and accounting-period implementation plan

**Sequence:** Start only after the cheque-book release and the calculator release are complete and stable.

## Product decision

Build fiscal years and accounting-period locks as one coherent accounting control. A fiscal year defines reporting boundaries; a lock protects posted history; a year-end close optionally transfers current-year profit/loss. These are related actions but must remain separately visible and auditable.

Do not extend the current controller in place as the primary design. Introduce first-class period records and make the accounting engine enforce their state.

## Stage 0 — Contain the current risk

1. Hide or disable the existing close action from customer-facing use until the replacement is ready.
2. Remove the ability for Billing feature deactivation to delete fiscal-close journals.
3. Correct marketing text or ship the lock guard before continuing to claim closed-period enforcement.
4. Add regression tests that reproduce the second-year double-close defect before replacing the calculation.

## Stage 1 — Fiscal-year domain and permissions

Create tenant-scoped tables (names may follow repository conventions):

- `fiscal_years`: UUID, tenant, name, start/end dates, status, retained-earnings account, close journal, opened/closed/reopened actors and timestamps, version, notes.
- `accounting_period_locks`: tenant, lock type (`soft`, `all_users`, optional `hard`), locked-through date, reason, actor, timestamps.
- `accounting_lock_exceptions`: tenant, user/all-users scope, start/end time, reason, granted/revoked actors and timestamps.
- `fiscal_year_close_checks`: fiscal year, check key, status, measured value, reviewer, reviewed time, note.
- `fiscal_year_events` or the existing audit system: immutable event history for create, change, preview, close, lock, exception, reopen, and failed attempts.

Enforce database constraints for unique tenant/date ranges, one active close operation per year, non-overlapping periods, valid start/end order, and one closing journal per fiscal year.

Add dedicated permissions. Owner/admin can receive defaults, but sensitive close/reopen grants must be explicit and editable. `finance.journal` alone is too broad.

## Stage 2 — Central period guard

Add a tenant-aware `AccountingPeriodGuard` and call it from both `AccountingService::createEntry()` and `reverseEntry()` before any write. The guard receives accounting date, operation type, user, source, and any validated exception.

Rules:

- Reject new entries dated on or before a lock date.
- Reject reversals or modifications that would alter a locked period.
- Never trust a controller flag claiming an exception.
- Allow only server-resolved, unexpired, tenant-scoped exceptions with a reason.
- Recheck the lock when an approval document is approved/posting occurs.
- Apply the same guard to imports, sync, scheduled commands, integrations, and offline replay because they converge on the accounting engine.
- Return a stable domain error that all user interfaces can translate into a clear next action.

## Stage 3 — Safe year definition and settings migration

Replace the ambiguous full-date setting with an explicit fiscal-year pattern (start month/day or end month/day) plus first-class fiscal-year records.

- Migrate the current setting without changing existing stores' intended reporting boundary.
- Support ordinary 12-month years and explicit short/long transition years.
- Resolve dates in the tenant timezone and define leap-day behavior.
- Prevent changing a pattern in a way that overlaps existing years or rewrites closed history.
- Show an impact preview before changing the pattern.
- Audit every change.
- Keep a compatibility adapter for old report callers during migration, then remove the old literal fallback.

## Stage 4 — Preview and pre-close checks

Create read-only preview and status services before permitting a close. At minimum show:

- exact year name/start/end/status;
- trial-balance equality;
- income, COGS, expense, and net profit/loss totals;
- proposed closing journal lines;
- retained-earnings account validation;
- pending approval documents whose accounting date falls in the year;
- draft/unposted or failed transactions;
- unreconciled cash/bank items where available;
- stock/COGS exceptions and incomplete depreciation runs;
- tax/report warnings supported by current modules.

Checks should be classified as blocking, warning, or informational. Any permitted override requires a note and audit record. Preview output must carry a version/hash that the close command revalidates.

## Stage 5 — Atomic close and open-next-year workflow

Implement a close service, not controller accounting logic.

Inside one database transaction:

1. Lock the fiscal-year row.
2. Verify status and idempotency.
3. Re-run all blocking checks and compare the preview version.
4. Calculate P&L strictly between that fiscal year's start and end dates.
5. Validate proposed lines against the actual ledger state.
6. Post exactly one idempotent closing journal linked to the fiscal-year record.
7. Mark the fiscal year closed and set the corresponding period lock.
8. Open/generate the next fiscal year when configured.
9. Record actor, approver, result, and close snapshot.

Owner/admin approval can reuse the proven manager-approval verification pattern, but the requester, approver, and policy must be explicit. Decide whether self-approval is allowed by tenant policy.

## Stage 6 — Controlled reopen and post-close corrections

Never delete a close journal.

- Default correction path: post an adjusting entry in an open adjustment period or next open period with a reference to the original item.
- Reopen path: dedicated permission, owner/admin authentication, reason, impact preview, and complete audit event.
- If reopening requires undoing the closing journal, create a reversal through the accounting engine and retain the full chain.
- Hard locks, if enabled, are irreversible by normal tenant users.
- Re-closing creates a new version linked to the earlier close/reopen history; it must not overwrite history.

## Stage 7 — Customer interface

Add a Financial Years area with:

- current year and lock status;
- list of previous and future years;
- create/open transition year;
- readiness checklist;
- preview and close wizard;
- closed-year detail and downloadable close report;
- authorized lock exception/reopen flow;
- clear banners when a transaction date is locked;
- links to the affected reports and pending approvals.

Add dashboard cards/alerts for days until year end, unresolved blocking checks, pending close approval, and last closed year. Card visibility must follow the new permissions and existing V6 scope/cache rules.

## Stage 8 — Reporting and Reckoner alignment

Create one fiscal-period resolver and use it consistently in:

- Reckoner `this_year`, `last_year`, fiscal quarters, comparisons, cache fingerprints, and labels;
- legacy and V3 reports;
- report exports;
- V6 and legacy dashboards;
- customer/supplier statements where “year” is offered;
- accounting and finance screens.

Keep clearly labeled calendar-year choices where useful. Do not silently change a label while retaining calendar dates. Historical closed reports must remain reproducible.

## Stage 9 — Tests and acceptance gates

Add focused tests while building, then run the complete regression once the feature is assembled.

Required new coverage includes:

- calendar and non-calendar fiscal years;
- first short/long year and leap-day boundary;
- two and three sequential closes with no repeated profit;
- overlapping, skipped, future, partial, and duplicate close attempts;
- concurrent close requests and idempotent retry;
- every lock mode, permission, exception expiry, and cross-tenant attempt;
- create, reverse, import, scheduled, integration, offline replay, and approval-time posting into a locked period;
- close/reopen/re-close audit chain without deletion;
- setting changes before and after close;
- preview-to-post race and changed-ledger detection;
- retained-earnings account missing/misconfigured;
- pending approval and unposted-document blockers;
- fiscal dates and labels across all report/dashboard surfaces;
- plan-gate behavior from the authoritative entitlement source;
- UI accessibility, error handling, and close-report export.

Final gates: focused fiscal-year suites, approval suites, security/tenant suites, complete backend suite, complete frontend suite, production build, fresh migration, migration from a representative existing database, and a manual owner/accountant walkthrough covering two consecutive years.

## Definition of done

The feature is ready for customers only when:

- multiple consecutive years close correctly;
- a closed period is actually protected at the central posting boundary;
- no product action deletes accounting history;
- an owner/accountant can define, preview, close, inspect, and—when policy permits—correct/reopen a year through the UI;
- all fiscal reports and dashboard periods agree;
- permissions, plan entitlements, audit history, concurrency, and tenant isolation are verified;
- the full release gates pass with evidence.

## Delivery estimate

For one experienced developer familiar with this repository: approximately **4–6 weeks** for a customer-ready implementation, including the central lock, UI, report alignment, migrations, and focused tests. A narrow close-and-lock release can be delivered in roughly **2–3 weeks**, but it must still fix FY-01 through FY-06 and must not claim complete report alignment until Stage 8 is finished.

