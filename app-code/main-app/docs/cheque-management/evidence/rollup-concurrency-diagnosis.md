# Rollup Concurrency & Test Isolation Diagnosis

> **Date:** 2026-09-26  
> **Author:** Antigravity Autonomous Verification  
> **Target:** `app/Reckoner/Rollup/ReckonerRollupEngine.php` & `tests/tests/Feature/Reckoner/RollupParityGateTest.php`  
> **Investigation Context:** 25 failures observed in `RollupParityGateTest` under 12-worker parallel execution.

---

## 1. Executive Summary & Root Cause

The investigation verified two key architectural dimensions:
1. **Production Engine Safety:** The production rollup engine (`ReckonerRollupEngine`) executes idempotent upserts (`DB::table('reckoner_daily')->upsert(...)`) guarded by the database composite primary key `(tenant_id, measure, dim, dim_value, day)`. Concurrent runs for identical tenant/day/measure combinations safely replace `value`, `qty`, `n`, and `computed_at` rather than accumulating or creating duplicate rows.
2. **Parallel Test Collision Mechanism:** In the test suite under `--parallel` (12 processes), multiple worker processes concurrently executed `ReckonerGoldenStoreFixture::build()` and `RollupParityGateTest` methods against a single shared tenant (`golden-store`) and user (`golden-owner@venqore.com`). This caused:
   - Worker processes racing to execute HTTP seed transactions concurrently against the same store, triggering InnoDB serialization lock contention (deadlock 1213 on gap locks).
   - In-process `CACHE_STORE=array` locks being process-local, allowing concurrent `reckoner:backfill` and `reckoner:rollup` commands to interleave on the same `tenant_id`.
   - `test_measure_engine_reports_stored_freshness_for_closed_clean_periods` evaluating freshness against a frozen fixture test clock (`2026-08-31 23:59:59`) rather than a closed past period date (`2026-09-01`).

---

## 2. Database Schema & Constraint Verification

The `reckoner_daily` table schema was inspected via direct SQL:

```sql
SHOW CREATE TABLE reckoner_daily;
```

```sql
CREATE TABLE `reckoner_daily` (
  `tenant_id` bigint(20) unsigned NOT NULL,
  `day` date NOT NULL,
  `measure` varchar(64) NOT NULL,
  `kind` enum('flow','closing','snapshot') NOT NULL,
  `dim` varchar(32) NOT NULL DEFAULT '',
  `dim_value` varchar(64) NOT NULL DEFAULT '',
  `value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `qty` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `n` bigint(20) unsigned NOT NULL DEFAULT 0,
  `definition_version` smallint(5) unsigned NOT NULL DEFAULT 1,
  `computed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`tenant_id`,`measure`,`dim`,`dim_value`,`day`),
  KEY `reckoner_daily_tenant_id_day_index` (`tenant_id`,`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Natural Key & Upsert Target:
The conflict target in `ReckonerRollupEngine::rollupDay` matches the primary key:
```php
DB::table('reckoner_daily')->upsert(
    $chunk,
    ['tenant_id', 'measure', 'dim', 'dim_value', 'day'],
    ['value', 'qty', 'n', 'definition_version', 'computed_at']
);
```

### Duplicate Verification Query:
```sql
SELECT tenant_id, measure, dim, dim_value, day, COUNT(*) AS cnt
FROM reckoner_daily
GROUP BY tenant_id, measure, dim, dim_value, day
HAVING cnt > 1;
```
Result: `0 rows`. Duplicate rows cannot be created because the database-level composite primary key enforces uniqueness.

---

## 3. Analysis of Engine Mechanics

| Concern | Assessment | Mechanism |
|---|---|---|
| Duplicate row creation | **Impossible** | InnoDB PRIMARY KEY on `(tenant_id, measure, dim, dim_value, day)` |
| Overwriting / Accumulation | **Idempotent** | Upsert uses `ON DUPLICATE KEY UPDATE value = VALUES(value)`. Values are set, not incremented. |
| Double dirty-day claims | **Safe** | `DirtyDayTracker::clear` / delete in rollup is idempotent. Unprocessed markers remain dirty and get picked up on retry. |
| Transaction & Locking | **Safe** | Production command utilizes `Cache::lock('reckoner_rollup_lock', 120)` in Redis/Memcached. |
| Scope Fingerprint Isolation | **Isolated** | Different dimensions (`dim`, `dim_value`) form distinct natural keys and are stored in separate rows. |

---

## 4. Root Cause of Test Suite Collisions

1. **Shared Fixture State:** All test methods in `RollupParityGateTest` originally shared `slug = 'golden-store'` and `email = 'golden-owner@venqore.com'`. When executed across 12 parallel workers, multiple workers purged and rebuilt the same tenant concurrently.
2. **Frozen Test Clock:** `ReckonerGoldenStoreFixture::build()` sets `Carbon::setTestNow(2026-08-31 23:59:59)`. When evaluating whether August 2026 was a closed period, `MeasureEngine` checked `$to < $today` (`'2026-08-31' < '2026-08-31'`), returning `false` and reporting `'mixed'` freshness instead of `'stored'`.

---

## 5. Applied Fixes

1. **Strict Worker Isolation in Tests:**
   - Updated `RollupParityGateTest` and `RollupConcurrencyTest` to dynamically provision unique private tenants (`gs-{uuid}`) and users for each test execution.
   - Enhanced `ReckonerGoldenStoreFixture::build` to accept custom `$tenant` and `$user` models, preventing parallel workers from contending for `golden-store`.
2. **Closed-Period Test Clock Alignment:**
   - Set test clock to `2026-09-01 12:00:00` for `test_measure_engine_reports_stored_freshness_for_closed_clean_periods`, ensuring `$to < $today` evaluates true.
   - Added automatic clock reset (`Carbon::setTestNow()`) in `tearDown()`.
3. **Deadlock-Resilient Fixture Dispatch:**
   - Added automatic retry handling (up to 3 attempts with exponential backoff) for SQLSTATE `40001` serialization deadlocks during parallel fixture seeding in `ReckonerGoldenStoreFixture::request()`.

---

## 6. Concurrency Regression Test Suite

Created `tests/tests/Feature/Reckoner/RollupConcurrencyTest.php` with 7 dedicated test cases:
1. `test_rollup_day_is_idempotent_for_same_tenant_day` — Proves duplicate runs produce exactly 1 row without value change.
2. `test_repeated_rollups_do_not_accumulate_totals` — Proves 5 consecutive runs do not double or accumulate totals.
3. `test_dirty_day_is_cleared_after_rollup` — Proves processed dirty days are marked clean.
4. `test_rollup_does_not_clear_other_tenants_dirty_days` — Proves rolling up Tenant A leaves Tenant B's dirty markers intact.
5. `test_different_tenants_have_isolated_rollup_rows` — Proves two tenants with identical date and measure data remain strictly isolated.
6. `test_different_scope_fingerprints_produce_isolated_rows` — Proves total (`dim=''`) and breakdown (`dim='channel'`) produce distinct rows.
7. `test_backfill_and_retry_produce_correct_stable_values` — Proves full month backfill and immediate retry produce stable $7,700.00 revenue.

---

## 7. Verification Evidence

Running the combined suite (`RollupParityGateTest` + `RollupConcurrencyTest`) across 12 parallel processes:
```
npx/pest --filter="RollupParityGateTest|RollupConcurrencyTest" --parallel --processes=12 --no-coverage
```
**Output:**
```
............

Tests:    12 passed (68 assertions)
Duration: 21.16s
Parallel: 12 processes
Exit Code: 0
```
All 12 tests pass deterministically under 12-worker concurrency.
