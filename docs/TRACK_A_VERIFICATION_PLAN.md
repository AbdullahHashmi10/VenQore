# Track A — Verification & Go-Live Implementation Plan

_What the IDE / a developer must run to turn "code-complete" into "verified".
Everything below assumes the Track A code changes are already in the working
tree (they are). L009 (engine cutover) and the human-action items are covered
separately at the end._

**Environment facts (from CLAUDE.md):**
- Production DB: `venqore_pos` — **never** refresh/wipe.
- Test DB: `amd_pos_test`.
- MySQL only. No SQLite anywhere.
- Test runner: **Pest** (`vendor/bin/pest`). Composer scripts: `composer test`.
- PHP (local): `C:\Users\PC\AppData\Roaming\Local\lightning-services\php-8.2.23+0\bin\win64\php.exe`

Run the phases **in order**. Do not skip Phase 0 — two files truncated during
authoring were repaired, so a fresh integrity pass is the first thing to prove.

---

## Phase 0 — Integrity & dependency install (do first)

```bash
# 0.1 Confirm the working tree is what you expect
git status
git diff --stat

# 0.2 Validate the JSON that was hand-repaired
php -r "json_decode(file_get_contents('composer.json'),true); echo json_last_error()===0?'composer.json OK\n':'composer.json BAD\n';"

# 0.3 Syntax-lint every changed PHP file (catches truncation / parse errors)
git diff --name-only --diff-filter=ACM | grep '\.php$' | xargs -I{} php -l "{}"

# 0.4 Pull the new dependency (Sentry) added to composer.json
composer update sentry/sentry-laravel --with-dependencies
#   (or `composer install` if composer.lock was already regenerated elsewhere)
```

**Gate:** zero `php -l` errors, composer.json valid, `composer install` clean.
If any file reports a parse error, it likely truncated — restore it from git and
re-apply that one change before continuing.

---

## Phase 1 — Migrations on the TEST database first

Three new migrations were added and must apply cleanly on a **fresh** schema
(this is what proves L038 / L032 / the sales-order alignment don't just work on
the drifted prod DB):

- `2026_07_11_000000_add_idempotency_key_to_sales_table.php` (L038)
- `2026_07_11_000100_add_terminal_pairing.php` (L032)
- `2026_07_11_000001_align_sales_order_items_quantity_columns.php`

```bash
# 1.1 Rebuild the TEST database from scratch — this is the real fresh-install test
php artisan migrate:fresh --seed --database=mysql --env=testing
#   (ensure .env.testing / phpunit points DB_DATABASE=amd_pos_test)

# 1.2 Confirm the new columns/tables exist
php artisan tinker --execute="echo Schema::hasColumn('sales','idempotency_key')?'sales.idempotency_key OK\n':'MISSING\n';"
php artisan tinker --execute="echo Schema::hasTable('terminal_pairing_tokens')?'terminal_pairing_tokens OK\n':'MISSING\n';"
php artisan tinker --execute="echo Schema::hasColumn('terminals','paired_at')?'terminals.paired_at OK\n':'MISSING\n';"
```

**Gate:** `migrate:fresh` completes with no error and all three checks print OK.

---

## Phase 2 — Run the L005 schema-diff (find any remaining drift)

This is the highest-leverage diagnostic. It migrates into a throwaway DB and
diffs it against production structure.

```bash
# 2.1 Dry, read-only against production structure
php artisan schema:diff --live=venqore_pos --json=storage/app/schema-diff.json

# 2.2 Read the report. Any "only in live" column = code may write to a column a
#     fresh install won't have. Any "missing in live" = a migration prod never got.
```

**Gate:** report is empty, OR every listed drift is understood and ticketed.
This directly re-validates L013–L017 on the real schemas.

---

## Phase 3 — Full test suite on TEST DB

```bash
# 3.1 Whole suite
composer test

# 3.2 If you want the CI-equivalent run (parallel + junit)
composer test:ci

# 3.3 Targeted checks for what changed this cycle
vendor/bin/pest --filter=PaymentAllocation
vendor/bin/pest --filter=PartialReturn
vendor/bin/pest Tester/tests/Feature/Module03   # terminal / heartbeat
vendor/bin/pest Tester/tests/Feature/Module10   # WooCommerce
vendor/bin/pest Tester/tests/Feature/Guardrails # mass-assignment / route guards
```

**Gate:** green suite. Note: the mass-assignment guardrail (L034/L035) and the
`$fillable` changes are the most likely to surface a real issue — if a test now
fails with "field silently dropped," a column I whitelisted is wrong; compare
the failing model's `$fillable` against its migration and add the missing key.

---

## Phase 4 — Manual smoke of the behaviour-changing fixes

These changed runtime behaviour and deserve a hand check even with green tests:

1. **L025 tenant scoping** — log in as two different tenants; confirm staff
   invites, Woo connections, coupons, and PK verifications only show each
   tenant's own data. Then confirm the *cross-tenant* flows still work:
   accepting a staff invite by token/email, and the Woo webhook (unauthenticated
   lookup by UUID).
2. **L032 terminal pairing** — generate a pairing token in-app
   (`POST s/{slug}/terminal-pairing-tokens`), pair a NEW terminal with it
   (should succeed + set `paired_at`), then try to pair another new terminal
   WITHOUT a token (should get `403 PAIRING_REQUIRED`). Confirm an
   already-paired terminal keeps heart-beating with no token.
3. **L038 idempotency** — POST the same sale twice with an identical
   `Idempotency-Key` header; second call must return the same sale, not a
   duplicate.
4. **L030 logo upload** — try uploading a non-image to settings; must be
   rejected.
5. **L027/L031 rate limits** — hammer the PIN/login endpoints; confirm 429 after
   the threshold and that normal login still works.

---

## Phase 5 — Production migration (only after 0–4 are green)

```bash
# 5.1 BACK UP PRODUCTION FIRST (see Phase 6 — do the restore drill before this)
php artisan vq:backup

# 5.2 Apply only the new migrations to prod (never migrate:fresh on venqore_pos)
php artisan migrate --force

# 5.3 Post-migrate sanity
php artisan schema:diff --live=venqore_pos   # should now be clean
php artisan optimize:clear
```

**Gate:** backup exists and was restore-tested; `migrate` applied the 3 new
migrations only; schema:diff clean.

---

## Phase 6 — Human-action items (cannot be done in code)

These "done in code" items need a person to finish the loop:

| Item | Action |
|------|--------|
| **L020/L040 (Sentry)** | Create a Sentry project, put its DSN in `SENTRY_LARAVEL_DSN` in prod `.env`, trigger a test exception, confirm it appears with `tenant_id`/user tags. |
| **L019 (backups)** | On the actual prod box, run `php artisan schedule:list` and confirm `vq:backup` + `backup:verify` appear. Then do a **real restore drill** into a scratch DB and document it in `docs/RUNBOOK.md`. Confirm backups are copied offsite (S3/Drive), not just local disk. |
| **L021/L040 (alerting)** | Point `emailOutputOnFailure` at a monitored inbox, or wire the scheduler to the Sentry/Healthchecks project. Simulate a job failure; confirm the alert fires. |
| **L001 (duplicate dirs)** | Remove the tracked duplicate snapshots in a dedicated commit: `git rm -r --cached VenQore_Local _VERIFICATION_BASELINE_2026-07-10 && git commit -m "chore(L001): drop duplicate codebase snapshots"`. Reconcile the stray root `tests/` dir vs `Tester/tests/`. |
| **L023 (deploy gate)** | Push a deliberately failing test to a branch → confirm deploy does NOT run; then a green push → confirm it does. |

---

## Phase 7 — L009 (the one remaining Track A code item)

Deliberately deferred. Do NOT attempt as a single change. Sequence:

1. Read `docs/ENGINE_PARITY_L008.md` — it lists the exact gaps.
2. Port into V3 `SaleService`, one at a time, each behind a test:
   global/order discount (proportional apportionment + tax-on-reduced-base),
   delivery charge, extra charge, settings round-off (+ persist `round_off`),
   and reconcile the line-discount input model (fixed vs percentage).
3. Add shadow mode: run legacy + V3 on the same sale, log both results, assert
   equality of `net_sales`, `total_tax`, `round_off`, `total`.
4. Flip the per-tenant flag only when the shadow diff is zero across a real
   traffic sample. Keep legacy readable for historical records.

Estimated 40–80h per the master plan. This is the last Track A item; everything
else above is verification of already-written code.

---

## One-page quick sequence

```
Phase 0  git diff + php -l + composer install        → tree is sane
Phase 1  migrate:fresh on amd_pos_test               → new migrations apply clean
Phase 2  php artisan schema:diff                      → no unexplained drift
Phase 3  composer test                               → suite green
Phase 4  manual smoke (L025/L032/L038/L030/L027)     → behaviour correct
Phase 5  vq:backup → migrate --force on venqore_pos  → prod schema updated
Phase 6  Sentry DSN, restore drill, alert test, dir cleanup
Phase 7  L009 engine cutover (separate project)
```
