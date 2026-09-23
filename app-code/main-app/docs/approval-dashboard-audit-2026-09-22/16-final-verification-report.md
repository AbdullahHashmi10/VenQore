# Post-Push Verification Report: Commit 0d33d5b0

**Generated At:** 2026-09-23 13:50:00 UTC  
**Verification Scope:** Exact pushed commit `0d33d5b07a56a82aabcc9015a330e8639dd0ad2a` on branch `main`  
**Baseline Reference Commit:** `10988c439169faee75fa3d622f98f6d7d6f51954`  
**Execution Environment:** Isolated sequential test environments on separate dedicated MariaDB databases  

---

## 1. Executive Summary & Verdict

### Overall Verdict: **FAIL** (Defects & Build Script blocker identified on pushed commit)

While the approval engine, transaction correction flows, and V6 role dashboards all function according to specification and passed their structural gates and live manual journeys, the overall verification is marked **`FAIL`** in accordance with the strict audit instructions due to two specific findings on commit `0d33d5b0`:
1. **Current-Only Test Failure (Permission Override Precedence):** `Tests\Feature\Auth\PermissionOverrideModeTest > user reverts to inherited permissions when override mode` failed because `app/Models/User.php` evaluates `$membership->permissions` before checking if `permission_override_mode === 'inherit'`.
2. **`npm run build` Script Misconfiguration:** The `build` script in `package.json` invokes `node scratch/audit_ziggy_routes.cjs`. Because `scratch/` was removed prior to commit, `npm run build` fails with exit code 1 (even though direct `vite build && vite build --ssr` compiles cleanly).

In adherence to the non-intervention rule for verification passes, **zero application code, tests, configuration, or migrations were modified during this verification**.

---

## 2. Environment Provenance & Isolation Proof

All evidence files are retained under `docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/`.

- **Provenance Artifact:** [`provenance.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/provenance.json)
- **Database Connection Proof:** [`db_connection_proof.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/db_connection_proof.json)
- **Runtime Versions:**
  - PHP: `8.2.12`
  - Composer: `2.7.2`
  - Node.js: `v22.20.0`
  - npm: `10.9.3`
  - MariaDB: `10.4.32-MariaDB`
- **Lockfile & Config Integrity:**
  - `composer.lock` SHA-256: `12d123fcb5195cd8bc18415d1d13bebfe67dd5a62e4a5cdbb0e6d42946fedd5b` (identical between baseline and current)
  - `package-lock.json` SHA-256: `fb9451346da1f48095cb812f0ab744fc3cd478bd98783e2b54463f9438fba77a` (identical between baseline and current)
  - `phpunit.xml` SHA-256: `e63848cc9fb77ac23b28c705f576142f3eb236d496023455da39c407c0721c0d` (identical between baseline and current)
- **Isolated Database Targets:**
  - Baseline Run: `amd_pos_test_baseline_10988c43` (127.0.0.1:3306)
  - Current Run: `amd_pos_test_current_0d33d5b0` (127.0.0.1:3306)

---

## 3. Sequential Full Test Suite Execution & Comparison

The test suite was run sequentially with complete isolation between runs.

| Metric | Baseline Commit (`10988c43`) | Current Commit (`0d33d5b0`) | Delta |
| :--- | :--- | :--- | :--- |
| **Database** | `amd_pos_test_baseline_10988c43` | `amd_pos_test_current_0d33d5b0` | Isolated |
| **Total Tests** | 6,242 | 6,321 | +79 tests |
| **Total Assertions** | 94,159 | 98,645 | +4,486 assertions |
| **Passed Tests** | 6,131 | 6,225 | +94 tests |
| **Failed Tests** | 111 | 96 | -15 failures |
| **Execution Duration** | 1,106.40s (18m 26s) | 1,117.10s (18m 37s) | Sequential |
| **Console Output** | [`baseline_console.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/baseline_console.log) | [`current_console.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/current_console.log) | Retained |
| **JUnit XML** | [`baseline_junit.xml`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/baseline_junit.xml) | [`current_junit.xml`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/current_junit.xml) | Retained |
| **Execution Metadata** | [`baseline_meta.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/baseline_meta.json) | [`current_meta.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/current_meta.json) | Retained |

### Full-Suite Comparison Analysis
- **Comparison Artifact:** [`full_suite_isolated_comparison.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/full_suite_isolated_comparison.json)
- **Shared Failures (Pre-existing in Baseline):** 94 failures
- **Fixed in Current (Baseline-Only Failures Resolved):** 13 failures
- **Current-Only Failures:** 2
  1. `Tests\Feature\Auth\PermissionOverrideModeTest > user reverts to inherited permissions when override mode`  
     *Root Cause:* In `app/Models/User.php` (`getPermissionsAttribute()`), the method checks `if (!empty($membership->permissions))` before checking `if ($membership->permission_override_mode === 'inherit')`.
  2. `Tests\Feature\Chat\SupportTicketsTest > platform admin can batch update sto`  
     *Context:* Test was added in commit `0f4beb94` after baseline `10988c43` and fails on batch ticket route payload handling.

---

## 4. Step 6: Frontend & Structural Gates

Summary evidence recorded in [`step6_structural_gates_summary.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/step6_structural_gates_summary.json).

| Gate | Command | Exit Code | Result | Evidence Log |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Unit Tests** | `npm test` | 0 | **PASS** | [`npm_test.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/npm_test.log) (12 test files, 160 passed) |
| **Frontend Lint** | `npm run lint` | 1 | **FAIL** | [`npm_lint.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/npm_lint.log) (Pre-existing oxlint issues across legacy JSX) |
| **Frontend Build** | `npm run build` | 1 | **FAIL** | [`npm_build.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/npm_build.log) (`package.json` references missing `scratch/audit_ziggy_routes.cjs`) |
| **Approval Feature Suite** | `pest tests/tests/Feature/Approval` | 0 | **PASS** | [`approval_suite.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/approval_suite.log) (53 tests, 1,554 assertions) |
| **Posting Callsite Enforcement** | `pest PostingCallsiteEnforcementTest.php` | 0 | **PASS** | [`callsite_enforcement.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/callsite_enforcement.log) (2 tests, 842 assertions) |
| **Runtime Role Dashboard Matrix** | `pest RuntimeRoleDashboardMatrixTest.php` | 0 | **PASS** | [`role_dashboard_matrix.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/role_dashboard_matrix.log) (4 tests, 385 assertions) |
| **Transaction Editor Correction** | `pest TransactionEditorCorrectionTest.php` | 0 | **PASS** | [`editor_correction_suite.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/editor_correction_suite.log) (10 tests, 92 assertions) |
| **Ziggy Route Integrity** | `pest ZiggyRouteIntegrityTest.php` | 0 | **PASS** | [`ziggy_route_integrity.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/ziggy_route_integrity.log) (7 tests, 32 assertions) |
| **Git Diff Check** | `git diff --check` | 0 | **PASS** | [`git_diff_check.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/git_diff_check.log) (0 whitespace/conflict errors) |
| **Asset Manifest Verification** | Internal Checker | 0 | **PASS** | [`manifest_verification.log`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/manifest_verification.log) (All manifest assets verified) |

---

## 5. Step 7: Four Real Correction Journeys

Summary evidence recorded in [`step7_manual_journeys_evidence.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/step7_manual_journeys_evidence.json).

Each journey was executed using ordinary employee accounts across two isolated tenants (`store-alpha` and `store-beta`) in `amd_pos_test_current_0d33d5b0`:

| Step / Verification Rule | Customer Receipt | Supplier Payment | Operating Expense | Sales Invoice |
| :--- | :--- | :--- | :--- | :--- |
| **1. Pending Zero Financial Footprint** | **PASS** | **PASS** | **PASS** | **PASS** |
| **2. Approver Return with Preset Reason** | **PASS** (`INCORRECT_AMOUNT`) | **PASS** (`INCORRECT_AMOUNT`) | **PASS** (`INCORRECT_AMOUNT`) | **PASS** (`INCORRECT_AMOUNT`) |
| **3. Other Maker in Same Tenant Blocked (403)** | **PASS** | **PASS** | **PASS** | **PASS** |
| **4. Cross-Tenant User Blocked (403/404)** | **PASS** | **PASS** | **PASS** | **PASS** |
| **5. Original Maker Access Allowed** | **PASS** | **PASS** | **PASS** | **PASS** |
| **6. Editor Restores Payload & Return Notes** | **PASS** | **PASS** | **PASS** | **PASS** |
| **7. Resubmit URL Correctly Generated** | **PASS** | **PASS** | **PASS** | **PASS** |
| **8. Stale Expected Version Rejected** | **PASS** | **PASS** | **PASS** | **PASS** |
| **9. Resubmission Creates Immutable Revision** | **PASS** (v3, rev 2) | **PASS** (v3, rev 2) | **PASS** (v3, rev 2) | **PASS** (v3, rev 2) |
| **10. Approval Posts Exactly Once to Ledger** | **PASS** | **PASS** | **PASS** | **PASS** |
| **11. Retry Approval Blocked (No Double Post)** | **PASS** | **PASS** | **PASS** | **PASS** |
| **12. Rejection Never Posts to Financials** | **PASS** | **PASS** | **PASS** | **PASS** |

### Policy Clarification on Platform Admin Exception
In `ApprovalCorrectionResolver.php`:
`if ($doc->maker_id !== $user->id && !$user->isPlatformAdmin()) { abort(403); }`
- **Policy Finding:** Platform administrators bypass maker ownership checks by design to enable platform-wide support oversight, customer data recovery, and administrative interventions. Ordinary tenant users and employees are strictly isolated to their own created submissions and tenants.

---

## 6. Step 8: Manual Inspection Across All 10 Role Dashboards

Summary evidence recorded in [`step8_dashboard_inspection_evidence.json`](file:///E:/AMD%20POS/AMD%20POS/app-code/main-app/docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/step8_dashboard_inspection_evidence.json).

| Role | Status Code | Component | Configured Cards | Resolved Cards | Layout Cap (<=40) | Cards in Registry | Cashier Financial Guard | Legacy `/dashboard-v1` Route |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **owner** | 200 | `NewDashboard` | 24 | 23 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **admin** | 200 | `NewDashboard` | 24 | 23 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **manager** | 200 | `NewDashboard` | 20 | 18 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **cashier** | 200 | `NewDashboard` | 10 | 10 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboards/CashierDashboard`) |
| **accountant** | 200 | `NewDashboard` | 18 | 16 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboards/AccountantDashboard`) |
| **purchasing_officer** | 200 | `NewDashboard` | 12 | 12 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboards/PurchasingDashboard`) |
| **inventory_controller** | 200 | `NewDashboard` | 14 | 14 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **sales_executive** | 200 | `NewDashboard` | 12 | 12 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **shift_supervisor** | 200 | `NewDashboard` | 14 | 14 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboard`) |
| **viewer** | 200 | `NewDashboard` | 8 | 8 | **PASS** | **PASS** | **PASS** | **PASS** (`Dashboards/ViewerDashboard`) |

- **User Cache Isolation:** **PASS** (Cache keys properly scoped to user and tenant).
- **Cross-Tenant Data Isolation:** **PASS** (Tenant scopes enforce strict isolation).

---

## 7. Proposed Repair List (For Owner Review)

To achieve a 100% clean build and zero-regression status, the following targeted repairs are recommended:

1. **Permission Override Mode Precedence Fix in `app/Models/User.php`:**
   In `getPermissionsAttribute()`, check if `$membership->permission_override_mode === 'inherit'` before checking `$membership->permissions`. If mode is `inherit`, return `config("permissions.{$membership->role}", [])`.
2. **`package.json` Build Script Clean-up:**
   Update `"build": "vite build && vite build --ssr"` in `package.json` to remove the defunct call to `node scratch/audit_ziggy_routes.cjs`.
3. **`SupportTicketsTest` Batch Route Fix:**
   Align the test payload or batch update endpoint parameters in `app/Http/Controllers/Chat/SupportTicketController.php`.

---

## 8. Verification Conclusion

All raw evidence has been retained and verified. In accordance with the instructions, execution is now stopped without modifying code or making remote repository changes.
