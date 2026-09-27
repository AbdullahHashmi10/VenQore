# Fiscal Year & Accounting Period Implementation Details

**Date:** 2026-09-26  
**Status:** Completed  

---

## Architecture & Schema Overview

The Fiscal Year and Accounting Period system was implemented as two related but distinct controls:
1. **Fiscal Year**: Defines reporting boundaries, retains earnings accounts, pre-close readiness checklists, and atomic year-end profit/loss transfers.
2. **Accounting Period Lock**: Protects posted history against backdated writes, edits, or reversals on or before a locked-through date.

### Additive Tenant-Scoped Tables Created

- **`fiscal_years`**:
  - UUID primary key
  - `tenant_id` (string 64, indexed)
  - `name` (e.g. "FY 2025-2026")
  - `start_date`, `end_date` (date)
  - `status` (`draft`, `open`, `closing`, `closed`, `reopened`)
  - `retained_earnings_account_id`
  - `close_journal_entry_id`
  - `opened_by`, `opened_at`
  - `closing_requested_by`, `closing_approved_by`, `closed_at`
  - `reopened_by`, `reopened_at`, `reopen_reason`
  - `close_version` (integer default 1)
  - `preview_hash`
  - `notes`

- **`accounting_period_locks`**:
  - UUID primary key
  - `tenant_id`
  - `fiscal_year_id` (nullable)
  - `lock_type` (`soft`, `all_users`, `hard`)
  - `locked_through_date`
  - `reason`
  - `created_by`
  - `is_active`

- **`accounting_lock_exceptions`**:
  - UUID primary key
  - `tenant_id`
  - `period_lock_id`
  - `user_id` (nullable for all-users scope)
  - `scope` (`user`, `all_users`)
  - `valid_from`, `expires_at`
  - `reason`
  - `granted_by`, `revoked_by`, `revoked_at`
  - `is_active`

- **`fiscal_year_close_checks`**:
  - BigIncrements ID
  - `tenant_id`, `fiscal_year_id`, `check_key`
  - `severity` (`blocking`, `warning`, `informational`)
  - `status` (`pass`, `fail`, `warning`, `overridden`)
  - `measured_value`, `reviewed_by`, `reviewed_at`, `override_reason`

- **`fiscal_year_events`**:
  - Immutable event log for create, change, preview, close request, close approved, close completed, lock, exception, reopen, and reclose history.

---

## Central Accounting Period Guard

- **Location:** `App\Services\Accounting\AccountingPeriodGuard`
- **Write Boundary Hook:** Called directly inside `AccountingService::createEntry()` and `AccountingService::reverseEntry()`.
- **Enforcement Logic:**
  - Evaluates active period locks for the active tenant.
  - Rejects new entries dated on or before `locked_through_date`.
  - Rejects reversals altering a locked period date.
  - Allows writes ONLY IF a valid, active, unexpired exception exists for the tenant and actor.
  - Throws `App\Exceptions\PeriodLockedException`.

---

## Pre-Close Preview & Readiness Checklist

- **Location:** `App\Services\Accounting\FiscalYearService`
- Pre-close checks evaluate:
  - `balanced_trial_balance` (blocking)
  - `retained_earnings_account` (blocking)
  - `pending_approvals` (blocking)
  - `draft_transactions` (warning)
  - `asset_depreciation` (warning)
- Calculates P&L strictly between `start_date` and `end_date` (preventing double-counting lifetime profit).
- Generates a `preview_hash` snapshot that atomic close revalidates.

---

## Reopen & Correction Workflow

- **No Entry Deletion:** Fiscal close journal entries are NEVER deleted (including on plan feature deactivation in `BillingController`).
- **Reopen:** Requires `finance.period_reopen` or owner/admin authorization with PIN verification.
- Reverses the close journal entry via `AccountingService::reverseEntry()`, increments `close_version`, logs `fiscal_year_events`, and reverts period lock to prior closed year end.

---

## Permissions & Entitlement

Added dedicated permission keys in `config/permissions.php`:
- `finance.fiscal_year.view`
- `finance.fiscal_year.manage`
- `finance.fiscal_year.close`
- `finance.period_lock`
- `finance.period_reopen`
- `finance.period_exception`

Default grants:
- `owner` & `admin`: All fiscal permissions.
- `accountant`: View, manage, preview, and close.
- Operational roles (`manager`, `cashier`, `purchasing_officer`, `viewer`): None by default.
