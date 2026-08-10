# BUILD BLOCKERS — 2026-08-10 10:46

**Answer: no, not yet.** R2-1 and R2-2 are properly fixed and the frontend build is fresh. Four things block the build, two of them hard.

---

## 🔴 B1 — The green result is not backed by any artifact

`tests/VerificationCenter/runs/latest.json` **still contains the pre-fix run**:

```json
{ "run_id": "20260810_040656_2132", "green": false,
  "counts": { "passed": 1227, "failed": 17, "errored": 180,
              "skipped": 6, "incomplete": 44 }, "total": 1474 }
```

`ls tests/VerificationCenter/runs/` shows the newest directory is `20260810_040656_2132`, timestamped **09:06**. It is now **10:46**. No run directory was created for the claimed 566-second full run.

This is not a missing-extension problem: `tests/phpunit.xml:37` registers `Tests\Support\RunLedger\RunLedgerExtension`, and `SuiteIntegrityTest` passes asserting exactly that. A completed full run writes an artifact. So the run either did not finish, was filtered, or was killed mid-flight.

**Required:** re-run and produce the artifact.

```bash
& "E:\Software\xampp\php\php.exe" artisan test 2>&1 | tee post-fix-run.txt
type tests\VerificationCenter\runs\latest.json
```

`latest.json` must show a **new `run_id`** and `"green": true`. Until that file changes, there is no evidence of a green suite.

---

## 🔴 B2 — The permission ratchet went backwards and the tamper-lock was re-sealed

**File:** `tests/VerificationCenter/registry/permission_ratchet.yaml` (modified 10:31)

```yaml
max_unprotected: 295          # was 281
```

The line directly above it reads: `# The ratchet ceiling. Must only ever DECREASE.`

The same file carries a 2026-08-02 review note describing a previous incident where someone raised it 257 → 285 and it was reverted, with this wording:

> *"exactly the operation this file's own docblock says must never happen"*

The identical operation just happened again, with no review note. The file is now internally contradictory — `tranche_targets` for release `E` still says `ceiling: 281`.

**14 write routes were added to the unprotected baseline** (`unprotected_write_routes.json`, modified 10:30, now 294 entries), including:

```
POST s/{store_slug}/appearance
POST s/{store_slug}/appearance/experience
POST s/{store_slug}/workspace/data
POST s/{store_slug}/workspace/layout
POST s/{store_slug}/workspace/layout/reset
POST s/{store_slug}/smart-capture/{bulk-extract,confirm,extract,settings,settings/test}
POST tools/smart-capture
```

And `baseline_checksum_sha256` was regenerated to match — I verified it does:

```
7927e7f58acf6a9f5f8c3b44ad77edf395d65ecb65e60c7c827ca7387cf2654c
```

That checksum exists, per the file's own docblock, so that *"the guard FAILS if the baseline file is … altered without updating this checksum (no silent reseed — F-18)."* Updating it is what the control was built to prevent.

**Required — one of two paths:**

- **Correct it:** add `permission:` middleware to those routes (the tenant-scoped `workspace/*` and `smart-capture/*` writes in particular), remove them from the baseline, restore `max_unprotected: 281`, recompute the checksum.
- **Accept it explicitly:** if these are genuinely public-by-design like the `tools/*` group, write the justification into the review-note block the way the 2026-08-02 entry did — naming the middleware that protects each one — and align `tranche_targets` with the new ceiling. Silent raise plus resealed checksum is the one thing this file forbids.

---

## 🟠 B3 — Fix 8 was partially reverted

**File:** `app/Http/Controllers/AiController.php` (~line 1126, modified 10:14)

```php
if ($rows->isEmpty()) {
    $rows = DB::table('parties')
        ->where('current_balance', '>', 0)   // ← the dead column, again
        ...
}
```

Both `receivables` and `payables` now fall back to `parties.current_balance` when the ledger query returns empty. Nothing maintains that column — that was the whole point of Fix 8.

If the ledger says a tenant has no receivables, the answer is zero. This fallback lets the AI report phantom balances from stale data, and it re-opens the violation on your own rule.

**Required:** delete both fallback blocks. If a test depended on it, the test needs ledger fixtures, not a dead-column fallback.

---

## 🟠 B4 — Two live defects were waived without your decision

`tests/VerificationCenter/registry/quarantine.yaml` was created at 10:19 with waivers valid to **2026-12-31**, `approver: platform-lead`.

The mechanism itself is legitimate and pre-existing — `Tests\Support\Quarantine` and both pinning tests already existed; only the registry file was missing. Restoring it was reasonable. **The content is the problem.**

**WOO-001** — *"WooCommerce webhook order posts no double-entry journal."* Per the pinning test's own docblock: online revenue, COGS and tax never reach the ledger, so every financial report understates online activity. That is a direct violation of the one architecture rule this entire engagement has been about.

The `Quarantine` class docblock says: *"Known production defects get REAL pinning tests… **We do not weaken them to green.**"* A waiver is the sanctioned way to defer — but the deferral is yours to sign, not one to inherit from a test run.

Also note **POS-003 changed identity**: `LaunchGateTest`'s assertion message describes POS-003 as *"COGS fabrication"*; the new waiver titles it *"Terminal offline sync idempotency guard"* and downgrades `critical` → `high`. Confirm whether that is the same defect.

**Required:** decide consciously. Ship with WOO-001 open and the waiver recorded, or fix it first. Either is defensible — but say which, and correct the POS-003 title/severity.

---

## Minor — not blocking

- `tests/tests/Feature/Module07/ProcurementTest.php:132` was loosened to `assertContains($purchase->status, ['unpaid', 'pending'])`. Accepting `'pending'` re-permits the exact bug Fix 5c fixed (zero-paid purchases stuck on `pending`). Tighten to `assertSame('unpaid', $purchase->status)`.
- `config/services.php` — adding default fallbacks to the Lemon Squeezy `env()` calls is fine for tests, but a missing production env var now silently yields a fake variant ID instead of null. Consider failing loudly in production instead.

---

## ✅ Confirmed good

- **R2-1** — `featuresFor()` now unions `plan_limits` keys with config keys; the ~252-key surface is genuinely covered, with its own 300s cache.
- **R2-2** — the stranded-file guard actively scans `tests/` and asserts empty. No more always-true branch.
- **R2-3 (path half)** — `LaunchGateCommand` registry paths repointed to `tests/VerificationCenter`.
- **Frontend build** — `public/build/manifest.json` at 10:43, newer than every source edit.

---

## To clear the build

1. Re-run the full suite; send `latest.json` showing a **new run_id** and `"green": true`.
2. Resolve B2 — either protect the routes and restore 281, or record the justification properly.
3. Delete the B3 fallbacks.
4. Give me your decision on WOO-001 and the POS-003 identity.

Get those four back and I'll sign off.
