# Dead Base Class — `Tests\Feature\VenQoreTestCase` (duplicate)

**Archived:** 2026-07-11 (Phase A, audit finding F-02)
**Original location:** `Tester/tests/Feature/Golden/VenQoreTestCase.php`

## The collision

This file declared `namespace Tests\Feature;` and `class VenQoreTestCase` — the
**exact same fully-qualified class name** (`Tests\Feature\VenQoreTestCase`) as the
canonical base class at `Tester/tests/Feature/VenQoreTestCase.php`.

Two files declaring one FQCN is a latent fatal error: under PHPUnit directory
discovery both files in `tests/Feature/Golden/` get included, and the second
`class VenQoreTestCase` triggers `Cannot redeclare class`. Under PSR-4 autoloading
the file was unreachable by FQCN anyway (wrong directory for its namespace), so its
richer ClaimLogger instrumentation never ran — starving the verification engines of
the expected-vs-actual claim stream (F-02).

## What was preserved before archiving

Both `ClaimLogger::log(...)` instrumentation points from this file
(`assertJournalEntry` presence claim AND `assertMoneyEquals` comparison claim) were
merged into the canonical `Tester/tests/Feature/VenQoreTestCase.php`. A method-level
diff confirmed this file had **no unique methods** beyond the canonical class.

## Rollback

Pre-migration state: `_VERIFICATION_BASELINE_2026-07-10/Tester/tests/Feature/Golden/VenQoreTestCase.php`.
