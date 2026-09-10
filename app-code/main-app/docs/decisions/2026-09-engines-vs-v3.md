# Engines vs `Services\V3` decision

**Status:** Proposed — owner approval required before namespace or deletion work  
**Date:** 2026-09-10

## Evidence

- Production code consistently resolves financial behavior from `App\Engines`.
- The test suite is not wholly aligned: `LedgerAccountingIntegrationTest` and
  `RegressionFixesTest` still exercise `App\Services\V3` wrappers.
- Most `App\Services\V3` classes are empty subclasses of their corresponding
  engine. They add a second public name without a separate contract.
- `App\Services\V3\PurchaseService` is materially different. It adapts legacy
  purchase input (`supplier_id` to `party_id`) before delegating to
  `App\Engines\PurchaseService`; deleting it as if it were an empty wrapper
  would remove behavior.

## Recommendation

Adopt **`App\Engines` as the public financial-engine API**. This matches the
current production call graph and avoids migrating a broad, working accounting
surface solely to preserve versioned aliases.

After owner approval:

1. Repoint the remaining V3-only tests to `App\Engines` where they are testing
   engine behavior.
2. Delete only V3 wrappers proven to be empty and unused.
3. Rename the non-empty purchase wrapper to `PurchaseInputAdapter`, preserve its
   input normalization, and use it only at legacy-input boundaries.
4. Update `CLAUDE.md` in the same change so it names one canonical API and the
   adapter exception explicitly.

## Why implementation is deferred

The launch plan explicitly identifies the intended public namespace as an owner
decision. Repository evidence supports the recommendation but cannot establish
whether external or unreleased integrations depend on the V3 class names.
No V3 class has therefore been deleted or renamed in this remediation batch.
