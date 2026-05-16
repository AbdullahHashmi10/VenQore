# 🛡️ VenQore POS — Installer Deep Audit & Hardening Plan
**Created:** 2026-02-21  
**Purpose:** Track every installer problem (past, present, future) in one place. Nothing slips through.

---

## 📊 Master Status Table

| # | Problem | Category | Severity | Status | Fix Location |
|---|---------|----------|----------|--------|--------------|
| 1 | PHP < 8.2 White Screen of Death | Pre-Flight | 🔴 Critical | ✅ DONE | `index.php` (root) |
| 2 | Upload limit blocks large backups (2MB/8MB default) | File Upload | 🔴 Critical | ✅ DONE | `InstallerController@handleChunk` + `Index.jsx` chunked upload |
| 3 | "Base table not found" crash before install | Middleware | 🔴 Critical | ✅ DONE | `HandleInertiaRequests` schema guard |
| 4 | Timeout / Memory kill on big migrations | Server Limits | 🔴 Critical | ✅ DONE | `InstallerController@install` → `set_time_limit(0)`, `memory_limit=-1` |
| 5 | Localhost Windows server bottleneck | Local Dev | 🟡 Medium | ✅ DONE | `start_installer.bat` (2GB limits) |
| 6 | Database auto-creation if missing | Database | 🟡 Medium | ✅ DONE | `InstallerController@testDatabase` → `CREATE DATABASE` fallback |
| 7 | `.env` missing on fresh upload | Environment | 🔴 Critical | ✅ DONE | `updateEnv()` copies `.env.example` → `.env` if missing |
| 8 | APP_KEY not generated | Security | 🔴 Critical | ✅ DONE | `writeEnv()` → `key:generate --force` if placeholder/empty |
| 9 | Session driver crash on shared hosting | Session | 🟡 Medium | ✅ DONE | `.env.example` defaults to `SESSION_DRIVER=cookie` |
| 10 | MySQL Strict Mode breaking migrations | Database | 🟡 Medium | ✅ DONE | `config/database.php` → `strict => false` |
| 11 | Vyapar `.vyb` zip extraction failure | Backup Restore | 🟡 Medium | ✅ DONE | `ZipArchive` + temp dir + cleanup |
| 12 | Vyapar SQLite schema auto-detection | Backup Restore | 🟡 Medium | ✅ DONE | `findTable()` / `findCol()` fuzzy matching |
| 13 | Chunked upload reassembly for huge backups | File Upload | 🟡 Medium | ✅ DONE | `handleChunk()` sequential assembly in `storage/app/chunks/` |
| 14 | Pre-restoration analysis preview | UX | 🟢 Low | ✅ DONE | `analyzeBackup()` → shows counts before overwriting |
| 15 | `.htaccess` missing check | Pre-Flight | 🟡 Medium | ✅ DONE | `checkRequirements()` → `htaccess_exists` |
| 16 | Storage/Bootstrap not writable | Permissions | 🔴 Critical | ✅ DONE | `checkRequirements()` → `storage_writable`, `bootstrap_cache_writable` |
| 17 | `.env` not writable | Permissions | 🔴 Critical | ✅ DONE | `checkRequirements()` → `env_writable` |
| 18 | Actionable fix instructions for each failure | UX | 🟢 Low | ✅ DONE | Every requirement has a `fix` string with cPanel steps |
| 19 | `symlink()` disabled on strict hosting | File Serving | 🔴 Critical | ✅ DONE | `/storage/{path}` fallback route in `web.php` line 42 |
| 20 | Dirty database collision (tables already exist) | Database | 🟡 Medium | ✅ DONE | `testDatabase()` now runs `SHOW TABLES` and returns `has_existing_tables` flag |
| 21 | Chunked upload network interruption (orphan chunks) | File Upload | 🟡 Medium | ✅ DONE | 3-retry exponential backoff + 2hr orphan cleanup |
| 22 | Vyapar restore `warehouse_id` foreign key crash | Backup Restore | 🔴 Critical | ✅ DONE | `Warehouse::firstOrCreate()` before any stock inserts |
| 23 | Sale status mismatch (legacy `completed` vs new `posted`) | Backup Restore | 🟡 Medium | ✅ DONE | Now uses `status => 'posted'` with `posted_at` timestamp |
| 24 | No progress indicator for SQL restore | UX | 🟢 Low | ✅ DONE | Statement-by-statement execution with count + size in response |
| 25 | Installer re-accessible after completion | Security | 🟡 Medium | ✅ DONE | Inline middleware on `/api/installer` group returns 403 if `storage/installed` exists |
| 26 | No rollback on partial install failure | Error Recovery | 🟡 Medium | ✅ DONE | `completedStepsRef` tracks done steps; retry skips them and resumes from failure |
| 27 | Missing `pdo_sqlite` blocks Vyapar without clear error | Backup Restore | 🟡 Medium | ✅ DONE | Pre-check in `processRestoreFile()` and `processAnalyzedFile()` with clear cPanel instructions |
| 28 | Currency symbol not covering all regions | Business Setup | 🟢 Low | ✅ DONE | 45+ currencies mapped (Americas, Europe, South Asia, Middle East, Africa, East/SE Asia, Oceania) |
| 29 | Logo upload during install uses `store()` before symlink | File Serving | 🟡 Medium | ✅ DONE | Covered by fallback `/storage/{path}` route — serves files even without symlink |
| 30 | Caches not fully cleared after env write | Environment | 🟢 Low | ✅ DONE | `finalize` runs `optimize:clear`, `view:clear`, `route:clear`, `config:clear`, `cache:clear` |

---

## 📋 Detailed Breakdown of Remaining Items

### 🔴 #19 — Symlink Fallback Route (CRITICAL)
**The Problem:**  
Many cheap shared hosts (Starter Hostinger, GoDaddy Economy, Bluehost Basic) disable the PHP `symlink()` function. When `Artisan::call('storage:link')` fails, the installer catches the exception silently and marks it as "done." But every image uploaded afterwards (logos, product photos) returns a 404 because `public/storage/` doesn't exist.

**The Fix Plan:**
1. Add a fallback route in `routes/web.php`:
   ```php
   Route::get('/file/{path}', [FileController::class, 'serve'])->where('path', '.*');
   ```
2. The controller reads from `storage/app/public/{path}` and streams it.
3. Update all frontend `<img>` tags to use `/file/...` URLs instead of `/storage/...` when symlink is absent.
4. Add a `symlink_works` flag in settings so the system knows which URL pattern to use.

**Priority:** 🔴 Must fix before any production deployment.

---

### 🟡 #20 — Dirty Database Warning
**The Problem:**  
If the user points the installer at a database that already has tables (from a previous failed install, or an unrelated app), running `migrate:fresh` or `db:seed` can throw duplicate key or foreign key errors that freeze the installer with a cryptic SQL error.

**The Fix Plan:**
1. In `testDatabase()`, after successful PDO connection, run `SHOW TABLES`.
2. If count > 0, return a warning flag: `'has_existing_tables' => true, 'table_count' => $count`.
3. Frontend shows a confirmation dialog: *"This database contains X tables. Do you want to wipe it clean, or use a different database?"*
4. If user confirms wipe, the migrate step uses `migrate:fresh --force`.

**Priority:** 🟡 Important for re-installs and hosted environments.

---

### 🟡 #21 — Chunked Upload Retry + Orphan Cleanup
**The Problem:**  
If network drops during chunk 45 of 100, the partial file sits in `storage/app/chunks/` forever. The frontend shows "uploading..." indefinitely with no recovery option.

**The Fix Plan:**
1. Frontend: Add retry logic (3 attempts per chunk with exponential backoff).
2. Frontend: If all 3 retries fail, show "Network Error — Resume Upload?" button.
3. Backend: Add a scheduled cleanup that deletes any file in `storage/app/chunks/` older than 2 hours.
4. Backend: Track chunk upload sessions with a unique `upload_id` to prevent cross-session contamination.

**Priority:** 🟡 Important for users with unreliable internet.

---

### 🔴 #22 — Vyapar Warehouse Foreign Key Safety
**The Problem:**  
In `restoreFromVyapar()`, stock is inserted with:
```php
'warehouse_id' => \App\Models\Warehouse::first()->id ?? 1
```
If the `WarehouseSeeder` didn't run yet (or was skipped), `Warehouse::first()` returns `null`. Calling `->id` on `null` throws a fatal error, aborting the entire Vyapar import and losing all progress.

**The Fix Plan:**
1. Before the stock insert loop, guarantee a warehouse exists:
   ```php
   $defaultWarehouse = Warehouse::firstOrCreate(
       ['name' => 'Main Store'],
       ['location' => 'Default', 'is_default' => true]
   );
   ```
2. Use `$defaultWarehouse->id` everywhere instead of `Warehouse::first()->id`.

**Priority:** 🔴 Will crash 100% of the time if seeder is skipped.

---

### 🟡 #23 — Sale Status Alignment
**The Problem:**  
The Vyapar restore creates sales with `'status' => 'completed'`. But after the Phase 1.2 architecture overhaul, the canonical status is `'posted'` (with `posted_at` timestamp). Imported Vyapar sales won't appear in any revenue query that uses `scopePosted()`.

**The Fix Plan:**
1. Change Vyapar sale creation to use `'status' => 'posted', 'posted_at' => $row['txn_date'] ?? now()`.

**Priority:** 🟡 Affects revenue accuracy for Vyapar migrators.

---

### 🟡 #25 — Installer Route Protection After Completion
**The Problem:**  
The `index()` method checks `storage/installed` and redirects to login. But the API routes (`/installer/check-requirements`, `/installer/test-database`, `/installer/install`) have NO middleware protection. After installation, anyone can POST to `/installer/install` with `step=migrate&data[clean]=true` and **wipe the entire production database**.

**The Fix Plan:**
1. Add a middleware check on all installer API routes:
   ```php
   if (File::exists(storage_path('installed'))) {
       return response()->json(['error' => 'Already installed'], 403);
   }
   ```
2. Apply this to the route group in `routes/web.php`.

**Priority:** 🟡 Security vulnerability. Must fix before public release.

---

### 🟡 #26 — Install Rollback on Partial Failure
**The Problem:**  
The installer runs 6-7 sequential steps (write_env → migrate → seed → symlink → create_admin → business_setup → finalize). If step 4 fails, steps 1-3 are already committed. The user sees an error but the database is half-populated. Re-running the installer may cause duplicate data.

**The Fix Plan:**
1. Track completed steps in a `storage/install_progress.json` file.
2. On retry, skip already-completed steps.
3. On the frontend, show which steps passed and which failed, with a "Retry Failed Step" button.

**Priority:** 🟡 Improves reliability for flaky hosting environments.

---

### ⚠️ #27 — PDO SQLite Requirement Clarity
**The Problem:**  
`pdo_sqlite` is listed as `critical => false` in requirements. A user can pass the requirements check without it. But if they then try to upload a Vyapar `.vyb` backup, the restore crashes with `could not find driver`.

**The Fix Plan:**
1. When user selects a `.vyb` file for upload, the frontend should first call a quick API check: "Is `pdo_sqlite` available?"
2. If not, show a clear message: *"Vyapar backup requires PDO SQLite extension. Please enable it in cPanel > PHP Extensions."*
3. Do NOT attempt the upload/extraction if the extension is missing.

**Priority:** ⚠️ Only affects Vyapar migrators, but the error is confusing.

---

## ✅ Victory Checklist (Zero-Ticket Installer Target)

- [x] PHP version pre-flight trap
- [x] Upload limit bypass (chunked)
- [x] Middleware crash prevention
- [x] Timeout/Memory protection
- [x] Auto-create database
- [x] Auto-generate APP_KEY
- [x] Cookie session default
- [x] MySQL strict mode off
- [x] Vyapar backup analysis
- [x] Vyapar data migration
- [x] Permissions check with fix instructions
- [x] .htaccess existence check
- [x] Full cache clear on finalize
- [x] Symlink fallback file serving
- [x] Dirty database warning
- [x] Chunk upload retry + cleanup
- [x] Warehouse safety in Vyapar restore
- [x] Sale status alignment (`posted`)
- [x] Installer route lock after completion
- [x] Partial failure rollback/resume
- [x] PDO SQLite pre-check for Vyapar
- [x] Logo upload before symlink fix
- [x] SQL restore progress indicator
- [x] Extended currency symbol map

---

## 📈 Current Score: **30 / 30 items complete (100%)** 🎉
## 🎯 Target: **30 / 30 (Zero-Ticket Installer) — ACHIEVED**

---

*This document is the single source of truth for installer health. Update it after every fix.*
