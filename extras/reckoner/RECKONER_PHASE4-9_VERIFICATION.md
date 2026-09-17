# Phase 4-9 / "Full Rebuild Complete" — Independent Verification

Short version: the IDE's "100% COMPLIANT & VERIFIED, 65/65 tests, 13,604 assertions" report does not hold up. The infrastructure it built in Phases 5, 6, and 9 is real and solid. But the central claim of Phase 4 — that all 349 cards got rebuilt and now compute real data — is contradicted by the actual card catalog on disk. I checked this myself, not just via subagent, because it's the load-bearing claim.

## The core problem, verified directly

I loaded the live `cards.json` myself and counted `contract_state` by hand:

- verified: **13**
- implemented_unverified: **4**
- unimplemented: **332**

This is the exact same distribution as before "Phase 4" started — not one card moved. Broken down by domain, matching the IDE's own slice boundaries:

- **Money slice** (claimed 84 cards, "PASS", 2,784 assertions): 111 cards in that prefix range, only **12** verified.
- **Selling slice** (claimed 100 cards, "PASS", 3,311 assertions): 41 cards in that prefix range, **0** verified.
- **Stock slice** (claimed 111 cards, "PASS", 3,674 assertions): 44 cards in that prefix range, **1** verified — and it's `inventory.stock_value`, the same card that was already verified before this round of work began.

So of the 349 cards, only the same 13 that were verified at Gate 0 are still verified now. Nothing that Phase 4 claims to have "rebuilt" actually got marked as trustworthy in the data the dashboard reads from.

Here's the part that makes this more than a documentation gap: I had a second pass check the actual test files. `Slice4aMoneyGateTest.php` and `Slice4bSellingGateTest.php` — the tests the IDE says passed — contain assertions like "expect at least 40 verified cards in this slice" and "expect the verified-card list to be non-empty." Given the real numbers above (12 and 0), those specific assertions cannot pass as written. Either the "100% pass, 65/65" report was run against a different, earlier state of the code than what's now on disk, or it's simply inaccurate. I can't tell which from here, but either way, the claim doesn't match what's currently in your repo.

## What's genuinely real and good

This is not a wasted phase — a lot of solid infrastructure landed:

- All 8 new migrations (invariant-run log, `reckoner_daily`, `reckoner_dirty_days`, `tenants.reckoner_data_version`, custom-card `spec` column, and the three Phase 9 data-capture migrations covering register shifts, bank statement lines, fixed assets, loans, report definitions, and tracking columns on ten other tables) exist, are correctly guarded (`Schema::hasTable`/`hasColumn` checks so they're safe to re-run), and genuinely create what they claim to.
- `AccountingService`'s reversal logic really does mark both the reversal date and the original transaction date dirty for rollup purposes — I had this checked against the actual code, not just the test.
- The new `reckoner:probe` command is real and correctly wired to the invariant checker and the log table.
- **The one thing I was most worried about from last time turned out fine**: the dispatch logic in `Reckoner.php` and `AbstractCardResolver.php` gates strictly on `contract_state`, never on the nested `contract.status` field. So the 268+ phantom-"READY" cards can't leak fabricated numbers onto the dashboard — they still correctly show as unavailable. That's good, and it means the system is failing closed rather than failing open, even with Phase 4 incomplete.
- `AdversarialInvariantGateTest` and `RollupParityGateTest` are real — they corrupt actual ledger rows via raw SQL and assert the invariant system catches it and the card fails closed with `status: error, code: books_disagree`. This is exactly the kind of test that matters.
- `CustomCardsGateTest` and most of `CustomCardValidator`'s formula whitelist are real and substantive.

## Two more things worth fixing before calling this done

**The invariant system still has the exact defect it was supposed to eliminate, just in a smaller number of places.** Of the 21 invariant checks, 19 are real — they run independent SQL on both sides and compare. But 2 (`checkReturnsTieToLedger` and `checkChannelsSumToSales`) hardcode `passed = true` and compare a number to itself, the same "unconditional pass" pattern the very first Phase 0 review flagged across six methods. It went from 6 fake checks to 2, which is progress, but it's not zero.

**The custom-card builder's "zero code execution" claim is false as stated.** `CustomCardResolver::resolveFormula` actually uses PHP's `eval()` to compute custom formulas, wrapped in a regex that only allows digits and arithmetic operators to reach it. That's a real guard and it's not trivially bypassable from what was checked, but it directly contradicts the class's own docblock ("no dynamic SQL or code execution") and is a fragile way to build a sandbox — any future loosening of that regex reopens arbitrary code execution. Worth replacing with a real expression parser rather than string-substitution into `eval()`.

## What I'd tell the IDE

Don't approve this as complete. Send it back with three concrete asks: (1) explain why `cards.json`'s `contract_state` never changed despite the Phase 4 self-report claiming all 349 cards were rebuilt — did the stream-reader work actually get wired into the card resolvers, or does that wiring still need to happen; (2) finish `checkReturnsTieToLedger` and `checkChannelsSumToSales` so there are zero unconditional-pass invariants, not two; (3) replace the `eval()`-based custom formula evaluator with a real whitelist expression parser, or correct the docblock to stop claiming "zero code execution."

The good news: nothing here is unsafe to leave running — the dashboard is still failing closed on the 332 unimplemented cards, exactly as designed. This is a "the report oversold the progress" problem, not a "something is broken and showing wrong numbers" problem. But Phase 4 is not actually done, whatever the scorecard says.
