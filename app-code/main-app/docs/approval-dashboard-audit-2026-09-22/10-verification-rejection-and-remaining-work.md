# Verification rejection and remaining work

Date: 22 September 2026

## Verdict

The IDE's latest claim that all completion gates are satisfied is rejected. Its focused tests demonstrate useful progress, but they do not cover or implement all requirements in document 09. Do not push, merge, or deploy this working tree.

## Directly verified outstanding work

1. `resources/js/Pages/NewPos.jsx` still posts twice to `store.sales.store`. It has not been moved to the trusted POS boundary. `resources/js/Domain/pos/usePayment.js` must also be audited as an active/alternate checkout path.
2. `resources/js/Pages/Approvals/Show.jsx` still prints raw JSON. Its resubmit request sends only version, notes, reason, and reason codes; it does not send the required corrected payload and amount. There is no original-editor correction flow or usable revision comparison. Withdrawal is not exposed there either.
3. No frontend code exposes `transaction_approval_mode`, the store approval switch, strict owner separation, employee default mode, or amount/document policies. Backend columns/controllers alone do not satisfy the staff invitation/edit and store-settings requirements.
4. Customer receipt and supplier payment approval adapters still create journal entries directly with hard-coded account codes. The expense adapter still directly creates its model and journal. They do not call the same canonical application services as the direct routes. Direct-versus-approved operational parity is therefore unproven.
5. The repository still has approximately 85 `createEntry()` call sites. `SaleObserver` still calls `createEntry()`. The new test merely prevents edits/deletes of a posted sale; it does not prove that the observer or the other posting paths cannot bypass approval. No complete enforced disposition table was delivered.
6. `ReckonerContext::scopeFingerprint()` ignores `dataScope`. Users with the same role/permissions but different assignments can share a cache entry. The claimed effective-scope protection is incomplete.
7. No evidence was provided for complete machine-readable view/scope/sensitivity/drill/export/action contracts for all 349 cards, repaired presets, or intentional V6 routing for every supported role.
8. Return notes are inconsistent: the HTTP test sends `reviewer_notes`, while the controller reads `notes`. The test does not verify that the reviewer instruction is retained.
9. The focused suite exercises only a small subset. The previous complete suite result was 6,126 passing and 148 failing. The IDE did not run and compare the full suite against commit `10988c43`, did not run all frontend checks, and supplied no regression classification.
10. The working tree contains an unexplained `scratch_user.php` file and many uncommitted changes. These must be reviewed and cleaned before a checkpoint.
11. The reported test totals derived from `suites.yaml` are not the actual full PHPUnit execution totals and conflict with the observed full-suite total. Do not present registry counts as a successful full test run.

## Instructions for the IDE

Continue implementing document 09. A focused green suite is not completion. Perform the following work before producing another report:

1. Wire every active POS client, including both submit locations in `NewPos.jsx`, through the trusted POS boundary. Audit `Domain/pos/usePayment.js` and every offline/sync caller. Add route-level tests for each active client payload.
2. Build correction and withdrawal in the actual UI. A returned maker must open the original transaction editor, see structured reasons/notes, edit valid fields, and resubmit a new immutable revision containing payload and amount. Add a useful revision comparison. Stop rendering raw payload JSON to normal users.
3. Add the staff invitation/create/edit controls and store-settings controls required by document 09. Test invitation round-trip, inheritance, direct, required, owner default, strict separation, threshold/type precedence, self-change denial, and audit actor/timestamp.
4. Extract or reuse canonical posting services so direct and approved customer receipts, supplier payments, expenses, and invoices execute the same domain behavior. Remove adapter-owned journal recipes. Add parity tests covering operational rows, allocations, badges, numbering, bank/register effects, journals, balances, stock, and audit history.
5. Complete the posting-path inventory for every `createEntry()` caller and every observer/job/command/import/webhook. Give each an enforced classification. Resolve `SaleObserver`; do not substitute a posted-sale immutability test for boundary enforcement.
6. Include normalized `dataScope` and every assignment-affecting field in the Reckoner scope fingerprint. Add two-user tests where role and permissions are equal but branch/warehouse/register/customer assignments differ.
7. Deliver the actual 349-card contract artifact and preset-resolution artifact, then verify V6 routing and card behavior for every role named in document 09.
8. Fix the `reviewer_notes`/`notes` contract and assert the stored transition/revision instruction.
9. Delete `scratch_user.php` if it is only a diagnostic artifact. Review every unrelated diff and retain it only with a reproduced defect and regression test.
10. Run the full backend suite and all frontend lint/tests/build. In an isolated worktree and isolated test database, run the same suite at `10988c43`; classify every current failure as baseline or regression and fix every regression. Do not weaken tests or use `suites.yaml` counts as a substitute.
11. Run migration/rollback verification only on `amd_pos_test`. Do not touch the quarantined database, remote branch, or pre-existing submodule state.
12. Replace document 08 again with exact command output and evidence for every completion gate. If any gate remains incomplete, say so and continue working rather than declaring completion.

The next report must include exact changed files, real executed test totals, full-suite comparison results, frontend results, posting-path disposition, card-contract artifacts, role matrix, and evidence that the UI workflows work end to end.

