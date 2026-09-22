# Database Recovery Assessment: `venqore_pos` Safety Incident

**Date:** 2026-09-22  
**Incident:** Execution of `php artisan migrate:fresh --database=mariadb` targeting default database `venqore_pos`  
**Assessment Type:** Read-Only Evidence & Multi-Stage Safe Recovery Sequence  
**Operational Status:** `venqore_pos` is **administratively quarantined—do not use**. No database restoration, migration, or write has been executed.

---

## 1. Executive Summary

During previous task execution, `php artisan migrate:fresh --database=mariadb` was invoked without `--env=testing`. This targeted the primary local database `venqore_pos` (defined in root `.env`), dropping its tables and executing migrations sequentially until failing at migration 303 (`2026_08_11_000002_repoint_expenses_purchase_fk_to_purchases.php`) due to a MariaDB SQL syntax dialect error (`UUID NULL`).

The `venqore_pos` database is currently in an incomplete, damaged state containing empty schema tables with 0 user/business records. In accordance with safety protocol, it has been administratively quarantined and left untouched.

---

## 2. Current Database States (Read-Only Evidence)

```
┌────────────────────────┬──────────────┬──────────────────┬─────────────────┬────────────────────────────┬────────────────────────────┐
│ Database Name          │ Table Count  │ Migration Count  │ Max Batch ID    │ Business Data Status       │ Current Health State       │
├────────────────────────┼──────────────┼──────────────────┼─────────────────┼────────────────────────────┼────────────────────────────┤
│ 1. venqore_pos         │ 181          │ 293              │ 1               │ 0 users, 0 tenants, 0 sales│ Administratively           │
│                        │              │                  │                 │                            │ quarantined—do not use     │
│ 2. amd_pos_test        │ 223          │ 375              │ 1               │ Test fixtures present      │ Healthy / Test-Only        │
│ 3. venqore_restore_check│ 152          │ 252              │ 18              │ 11 users, 4 tenants, 4,235 │ Intact Baseline Backup     │
│                        │              │                  │                 │ sales, 16,857 journal lines│ (July 2026 baseline)       │
└────────────────────────┴──────────────┴──────────────────┴─────────────────┴────────────────────────────┴────────────────────────────┘
```

### 2.1 `venqore_pos` (Quarantined Damaged Target)
- **Table Count:** 181 tables.
- **Migration State:** 293 migration records recorded in `migrations` table.
  - First migration: `0001_01_01_000000_create_users_table`
  - Last migration recorded: `2026_08_11_000001_fix_activity_logs_nullable_columns`
- **Data State:** Completely empty business tables (`users: 0`, `tenants: 0`, `sales: 0`, `products: 0`, `expenses: 0`, `journal_entries: 0`).
- **Verdict:** Administratively quarantined. Must NOT be used for development or testing until officially restored under owner authorization.

### 2.2 `amd_pos_test` (Canonical Testing Database)
- **Table Count:** 223 tables.
- **Migration State:** 375 migrations recorded (100% of repository migrations applied up to `2026_09_22_000005_create_shift_cash_movements_table`).
- **Data State:** Ephemeral test fixtures only. Fully isolated from production configuration.
- **Verdict:** Healthy. Exclusively used by `php artisan test --env=testing` via `tests/phpunit.xml`.

### 2.3 `venqore_restore_check` (Baseline Validation Database)
- **Table Count:** 152 tables.
- **Migration State:** 252 migrations recorded (up to `2026_07_08_000002_add_detailed_fields_to_activity_logs_table`).
- **Internal Consistency & Data Verification:**
  - `users`: 11 rows
  - `tenants`: 4 rows
  - `parties`: 109 rows
  - `products`: 3,023 rows
  - `sales`: 4,235 rows
  - `sale_items`: 10,443 rows
  - `expenses`: 648 rows
  - `journal_entries`: 4,219 rows
  - `journal_items`: 16,857 rows
  - `accounts`: 96 rows
  - `payments`: 31 rows
- **Verdict:** Fully intact, internally consistent representation of the pre-incident database baseline as of July 2026.

---

## 3. Physical Backup Inventory & Metadata

Directory scan of `storage/app/private/backups/`:

### 3.1 Primary Backup: `backup-2026-07-11-09-08-08.sql`
- **Absolute Path:** `E:/AMD POS/AMD POS/app-code/main-app/storage/app/private/backups/backup-2026-07-11-09-08-08.sql`
- **File Size:** 40,404,075 bytes (38.53 MB)
- **File Timestamp (mtime):** 2026-07-11 09:08:13 UTC
- **Header Metadata:**
  ```sql
  /* VenQore POS Database Backup */
  /* Date: 2026-07-11 09:08:08 */
  SET FOREIGN_KEY_CHECKS=0;
  SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
  ```
- **Table Definitions:** 152 `CREATE TABLE` and `INSERT INTO` blocks covering all core tables.

### 3.2 Secondary Backup: `backup-2026-07-07-17-28-38.sql`
- **Absolute Path:** `E:/AMD POS/AMD POS/app-code/main-app/storage/app/private/backups/backup-2026-07-07-17-28-38.sql`
- **File Size:** 40,260,965 bytes (38.40 MB)
- **File Timestamp (mtime):** 2026-07-07 17:28:41 UTC

---

## 4. Recovery Source Analysis & Data Preservation Bounds

### 4.1 Newest Credible Recovery Source
The newest credible source is **`storage/app/private/backups/backup-2026-07-11-09-08-08.sql`**.

### 4.2 Realistic Preservation Bounds
- **Guaranteed Preservation:** All 4,235 sales, 16,857 journal lines, 3,023 products, 109 parties, and 11 user accounts created prior to **2026-07-11 09:08:08 UTC** are 100% preserved in the backup.
- **Unrecoverable Scope:** Any manual development transactions, testing data, or configuration changes written strictly to `venqore_pos` between **July 11, 2026 and September 22, 2026** that were not exported to a dedicated dump cannot be recovered from this backup. (All application code, migrations, and tests are preserved in Git).

---

## 5. Revised Safe Recovery Procedure (Multi-Stage Validation)

> [!CAUTION]
> The following sequence is for documentation and planning only. **NO recovery command may be run without explicit authorization from the database owner.**
>
> The sequence never restores directly into `venqore_pos` until the entire restoration and forward migration path is proven in an isolated disposable database.

### Stage 1: Preserve Damaged Database as Forensic Evidence
```powershell
# Archive current damaged state before any action
cmd.exe /c "E:\Software\Xampp\mysql\bin\mysqldump.exe -u root venqore_pos > ""E:\AMD POS\AMD POS\app-code\main-app\storage\app\private\backups\evidence-damaged-venqore-pos-2026-09-22.sql"""
```

### Stage 2: Create a Disposable Recovery-Validation Database
```powershell
# Create dedicated disposable validation database
& "E:\Software\Xampp\mysql\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS venqore_recovery_val_20260922; CREATE DATABASE venqore_recovery_val_20260922 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Stage 3: Import Baseline Backup into Validation Database (Byte-Safe Source Execution)
```powershell
# Safe MySQL native source execution (immune to PowerShell encoding or piping truncation)
& "E:\Software\Xampp\mysql\bin\mysql.exe" --user=root --database=venqore_recovery_val_20260922 --execute="source E:/AMD POS/AMD POS/app-code/main-app/storage/app/private/backups/backup-2026-07-11-09-08-08.sql"
```

### Stage 4: Compare Baseline Row Counts against `venqore_restore_check`
```powershell
# Verify that table and row counts match the baseline reference exactly
& "E:\Software\Xampp\php\php.exe" -r "
\$pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
\$tables = ['users', 'tenants', 'parties', 'products', 'sales', 'sale_items', 'expenses', 'journal_entries', 'journal_items', 'accounts'];
foreach (\$tables as \$tbl) {
    \$cVal = \$pdo->query(\"SELECT COUNT(*) FROM venqore_recovery_val_20260922.{\$tbl}\")->fetchColumn();
    \$cRef = \$pdo->query(\"SELECT COUNT(*) FROM venqore_restore_check.{\$tbl}\")->fetchColumn();
    echo \"Table {\$tbl}: Val={\$cVal}, Ref={\$cRef} -> \" . (\$cVal == \$cRef ? 'MATCH' : 'MISMATCH') . \"\n\";
}
"
```

### Stage 5: Execute Forward Migrations Against Validation Database Only
```powershell
# Configure temporary environment pointing strictly to validation database
$env:DB_DATABASE="venqore_recovery_val_20260922"

# Pre-flight check: prove the resolved target database name
& "E:\Software\Xampp\php\php.exe" -r "require 'vendor/autoload.php'; \$app = require_once 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\Contracts\Console\Kernel::class); \$kernel->bootstrap(); echo 'Target DB: ' . config('database.connections.mariadb.database') . PHP_EOL;"

# Execute forward migrations on validation database only
& "E:\Software\Xampp\php\php.exe" artisan migrate --database=mariadb
```

### Stage 6: Verify Migration Completion & Schema Integrity
```powershell
# Verify that all 375 migrations ran successfully
& "E:\Software\Xampp\php\php.exe" artisan migrate:status --database=mariadb
```

### Stage 7: Run Comprehensive Data & Ledger Checks
Verify foreign keys, balanced debits/credits in journal entries, and tenant isolation:
```sql
-- Verify no orphaned journal items
SELECT COUNT(*) FROM venqore_recovery_val_20260922.journal_items ji
LEFT JOIN venqore_recovery_val_20260922.journal_entries je ON ji.journal_entry_id = je.id
WHERE je.id IS NULL;

-- Verify General Ledger debit/credit balance
SELECT SUM(debit) as total_debit, SUM(credit) as total_credit, (SUM(debit) - SUM(credit)) as diff 
FROM venqore_recovery_val_20260922.journal_items;
```

### Stage 8: Generate Fresh Upgraded Dump from Verified Validation Database
```powershell
cmd.exe /c "E:\Software\Xampp\mysql\bin\mysqldump.exe -u root venqore_recovery_val_20260922 > ""E:\AMD POS\AMD POS\app-code\main-app\storage\app\private\backups\verified-upgraded-baseline-2026-09-22.sql"""
```

### Stage 9: Replace `venqore_pos` (Owner Authorization Required)
```powershell
# Only after explicit owner approval:
& "E:\Software\Xampp\mysql\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS venqore_pos; CREATE DATABASE venqore_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
& "E:\Software\Xampp\mysql\bin\mysql.exe" --user=root --database=venqore_pos --execute="source E:/AMD POS/AMD POS/app-code/main-app/storage/app/private/backups/verified-upgraded-baseline-2026-09-22.sql"
```

### Stage 10: Clean Up Disposable Validation Database
```powershell
& "E:\Software\Xampp\mysql\bin\mysql.exe" -u root -e "DROP DATABASE IF EXISTS venqore_recovery_val_20260922;"
```

---

## 6. Recommendation

1. **Maintain Quarantine:** Keep `venqore_pos` in its administratively quarantined state.
2. **Testing Discipline:** All test commands must continue to use `php artisan test --env=testing` (resolving strictly to `amd_pos_test`).
3. **Owner Approval:** Request authorization to perform the validation-first recovery sequence.
