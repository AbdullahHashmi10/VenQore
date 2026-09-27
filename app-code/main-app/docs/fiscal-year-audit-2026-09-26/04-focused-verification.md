# Focused Verification Results

**Date:** 2026-09-26  
**Environment:** Windows / PHP 8.2 (SQLite in-memory test database)  

---

## Focused Test Suite Summary

Executed focused test suite: `tests/Feature/FiscalYear/FiscalYearTest.php`

### Verification Coverage

1. **Consecutive Fiscal Year Closes (`test_consecutive_fiscal_year_closes_do_not_repeat_profit`)**:
   - Verified Year 1 close transfers Year 1 net profit (7,000) to Retained Earnings (`3100`).
   - Verified Year 2 close calculates profit strictly within Year 2 start/end dates.
   - Cumulative Retained Earnings equals exact sum (17,000). Prior year operating entries are NOT double-counted.

2. **Accounting Period Guard (`test_period_guard_rejects_entries_in_locked_period`)**:
   - Active period lock set through `2024-12-31`.
   - Attempted entry on `2024-11-15` throws `PeriodLockedException`.

3. **Lock Exceptions (`test_valid_lock_exception_allows_write`)**:
   - Active, unexpired user-scoped exception permits write into locked period and logs audit event `period_lock_exception_used`.

4. **Reopen Workflow (`test_reopen_reverses_close_journal_and_increments_version`)**:
   - Adjusts period lock date to prior closed year end.
   - Reverses close journal entry via `AccountingService::reverseEntry()` without deleting history.
   - Increments `close_version` and updates status to `reopened`.

5. **Billing Deactivation (`test_billing_deactivation_preserves_fiscal_close_journals`)**:
   - Billing feature deactivation for `fiscal_year_closing` preserves journal entries in database.

6. **Tenant Isolation (`test_tenant_isolation_prevents_cross_tenant_access`)**:
   - Cross-tenant ID access attempts return 404 Not Found.
