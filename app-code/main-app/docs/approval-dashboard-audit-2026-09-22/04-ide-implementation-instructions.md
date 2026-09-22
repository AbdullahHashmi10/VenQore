# IDE implementation instructions

Paste the text below into the implementation IDE. Execute one batch at a time. The immediate request is Batch 1 plus the verified integration report; stop before Batch 2.

---

Work in `app-code/main-app` only. Preserve all unrelated and uncommitted work, especially current sales, restaurant, register-shift and dashboard changes. Do not deploy, modify production data, repair historical payment data, or copy changes into production/legacy repositories.

Read these first:

- `docs/approval-dashboard-audit-2026-09-22/01-current-state-and-implementation-plan.md`
- `docs/approval-dashboard-audit-2026-09-22/02-technical-change-specification.md`
- `docs/approval-dashboard-audit-2026-09-22/03-existing-bugs-and-repair-plan.md`
- `docs/approval-dashboard-audit-2026-09-22/claude-review/00-VERDICT-on-codex-plan.md`
- `docs/approval-dashboard-audit-2026-09-22/claude-review/01-what-to-actually-build.md`
- `docs/approval-dashboard-audit-2026-09-22/claude-review/02-bugs-found-independently.md`

Treat both audits as source-backed guidance, not infallible truth. Verify every claim against the current working tree. Where they conflict, follow these instructions.

## Batch 1 — implement now

1. Make the payments list read-only.
   - Delete the two `Payment::where(...)->update(...)` normalizations and the unscoped payment-date `DB::statement(...)` from `PaymentController::index()`.
   - Do not add a scoped replacement or historical repair.
   - Add a two-tenant regression with deliberately backdated sale-linked payments; GET the list and assert dates and types for both tenants are unchanged.

2. Fix sensitive dashboard responses (B02).
   - Inspect every dashboard builder and route alias actually reachable by store members.
   - Do not serialize unauthorized profit, COGS, margin, company balances, charity totals, debtor/creditor contacts or balances.
   - Enforce on the server. Preserve legitimate owner/accountant access through explicit permissions.

3. Fix cashier session totals (B05).
   - Inspect the existing RegisterShift work and sale attribution before choosing fields.
   - Use only the cashier's authorized shift/register data and tenant-local time.
   - If reliable attribution is unavailable, return an honest unavailable state or clearly labeled own-day result. Never label whole-store sales as the cashier's session.

4. Fix permission inconsistency and cross-store membership fallback (B04/B07).
   - Use one canonical permission decision across `User::hasPermission`, middleware, dashboard/API access and frontend capability props.
   - Owner retains consistent full control by default; restricted admin respects explicit effective permissions.
   - With a tenant bound, resolve only that tenant's active membership or return none. Do not fall back to another store and do not mutate `last_store_id` during authorization.
   - Do not implement the historical empty-permission migration in this batch.

5. Stop displaying fabricated aging percentages and hardcoded pending-journal counts. Reuse a verified real aging source only if already suitable; otherwise return an honest unavailable/empty state for now.

## Verification report required before Batch 2

- Recount every current `AccountingService::createEntry()` caller and call site. Include controllers, engines, observers, jobs, imports, recurring processes, sync and commands. Save a machine-readable or Markdown route/action/posting matrix in the audit folder.
- Trace `SaleObserver` registration and exact status conditions. Determine how to prevent approval drafts from creating a Sale or journal and how to prevent duplicate final posting.
- Trace every entry point for customer receipt, supplier payment, administrative sales invoice and expense.
- Test each role preset through `ReckonerRegistry → checkAvailability → FrameFiller → DashboardSanitizer`. Do not declare a key dead merely because it is absent from `cards.json`; several old keys exist directly in `ReckonerRegistry`, and fallback candidates exist. Report actually unresolved keys and actual final card counts per role.
- Confirm the exact-349 assertion and identify tests/fixtures that must change before adding cards.

## Batch 2 — plan now, implement only after Batch 1 review

Build the maker-checker workflow for exactly four types: customer receipt, supplier payment, administrative sales invoice and expense.

Required behavior:

- Pending documents and immutable revisions stay outside all financial, stock, final-numbering and loyalty tables.
- Draft → pending → returned with one or more preset reasons plus required note → correction in the original editor → new revision → approval and atomic posting.
- Reviewer cannot edit submitted values. Approve accepts revision/version/idempotency data, never a replacement financial payload.
- Approval uses row locking, optimistic version checks, idempotency and full revalidation. Two concurrent approvals create exactly one posting.
- Ordinary server-verified POS checkout remains immediate. Never trust request `source=pos`, `approved_by`, `approval_status` or bypass fields.
- Existing discount/below-cost PIN controls remain independent.
- Unsupported document types are not accepted by the approval API. Do not break their existing routes while building the narrow release.

Add store and per-employee controls:

- Store setting: administrative approvals enabled/disabled.
- Store setting: strict owner separation enabled/disabled; default disabled.
- `tenant_users.transaction_approval_mode`: `inherit`, `required`, or `direct`; default `inherit`.
- In staff invitation/create/edit UI, show **Require approval for this employee** and an advanced **Inherit store default** option.
- Authorized owner/admin can change another member's mode; employee cannot change their own.
- Owner direct-posts by default and the decision is audited. Employees set to `required` must submit the four supported types. Employees set to `direct` still need the underlying transaction permission and remain subject to amount/type policies and existing special controls.
- Toggling approval off changes future submissions only. Existing pending submissions remain pending until approved, rejected, withdrawn or explicitly migrated through a separate audited operation.
- Record who changed the employee mode and when. Carry the selected mode through invitations and acceptance.

Effective policy order:

1. Existing transaction permission must pass.
2. If store approval is disabled, normal posting applies.
3. Owner direct-posts unless strict owner separation is enabled.
4. Employee `required` enters review; `direct` posts directly; `inherit` follows store/role policy.
5. A stricter amount/type rule may still require review.
6. POS eligibility is a separate server decision.

Defer transaction outbox and pending-cash-custody tables in the initial release only if all external effects are prevented before commit and retry/deduplication behavior is explicit. Never present a pending receipt as posted or include it in ledger balances.

At the end of Batch 2, stop for a customer demo before expanding to more transaction types.

## Later batches

Batch 3: verify and repair role presets, add approval/shift cards, extend `ReckonerContext` with effective scope, and add scope/permission/data-contract fingerprints to cache keys before any personal card. Replace the exact-349 live assertion with versioned original-key parity plus complete-contract validation.

Batch 4: explicit view/scope/sensitivity/drill/export/action contracts for the full catalogue.

Batch 5: explicit permission override mode (`inherit`/`custom`), safe migration, real aging and shared DashboardPolicy.

Batch 6: remaining adapters and complete posting-boundary coverage based on the verified posting matrix.

## Testing and completion report

Use the canonical MySQL test configuration and verify it points only to the dedicated test database before database tests. Add meaningful tenant, authorization, financial-isolation and concurrency tests. Do not claim unexecuted tests passed.

Finish Batch 1 and the verification report, then stop. Return:

1. Files changed and behavior fixed.
2. Tests run and exact results.
3. Corrections to either audit based on current code/runtime evidence.
4. Remaining risks or blockers.
5. Exact four-type route/observer/job entry points ready for Batch 2.
