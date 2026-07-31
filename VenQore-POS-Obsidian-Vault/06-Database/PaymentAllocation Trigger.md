---
tags: [database, trigger, critical]
---

# PaymentAllocation Trigger — Critical Reference

Part of [[VenQore POS - Home]] · [[Core Tables - Sales & Purchases]] · [[V3 Accounting Engine]]

> [!danger] This is the only MySQL trigger in the entire schema
> File: `database/migrations/2026_03_06_171402_add_allocations_trigger.php`. No other `CREATE TRIGGER` statements exist anywhere else in the migrations directory.

This is the concrete mechanism behind `CLAUDE.md`'s **"PurchaseService Safety"** rule: *"If you ever route or wire up the legacy PurchaseService in routes/controllers, ensure that the double-entry payment allocation logic remains fully covered and correct (it must link PaymentAllocation to a valid JournalEntry ID, not a Payment ID, so the MySQL trigger passes)."*

## What It Validates
`payment_allocations.payment_journal_entry_id` must resolve to a real `journal_entries.id` (via a JOIN through `journal_items.journal_entry_id`) — **not** a `payments.id`.

## Trigger 1: `chk_allocation_insert` (BEFORE INSERT)
```sql
CREATE TRIGGER chk_allocation_insert BEFORE INSERT ON payment_allocations
FOR EACH ROW
BEGIN
    DECLARE v_payment_total DECIMAL(20,4);
    DECLARE v_allocated_total_payment DECIMAL(20,4);
    DECLARE v_sale_total DECIMAL(20,4);
    DECLARE v_allocated_total_sale DECIMAL(20,4);

    SELECT MAX(debit + credit) INTO v_payment_total
    FROM journal_items
    WHERE journal_entry_id = NEW.payment_journal_entry_id;

    SELECT IFNULL(SUM(allocated_amount), 0) INTO v_allocated_total_payment
    FROM payment_allocations
    WHERE payment_journal_entry_id = NEW.payment_journal_entry_id
      AND status != 'reversed';

    IF (v_allocated_total_payment + NEW.allocated_amount) > v_payment_total THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed - Payment exceeded';
    END IF;

    IF NEW.sale_id IS NOT NULL THEN
        SELECT invoice_total INTO v_sale_total FROM sales WHERE id = NEW.sale_id;

        SELECT IFNULL(SUM(allocated_amount), 0) INTO v_allocated_total_sale
        FROM payment_allocations
        WHERE sale_id = NEW.sale_id AND status != 'reversed';

        IF (v_allocated_total_sale + NEW.allocated_amount) > v_sale_total THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed - Sale exceeded';
        END IF;
    END IF;
END
```

## Trigger 2: `chk_allocation_update` (BEFORE UPDATE)
```sql
CREATE TRIGGER chk_allocation_update BEFORE UPDATE ON payment_allocations
FOR EACH ROW
BEGIN
    DECLARE v_payment_total DECIMAL(20,4);
    DECLARE v_allocated_total DECIMAL(20,4);

    IF NEW.status != 'reversed' THEN
        SELECT MAX(debit + credit) INTO v_payment_total
        FROM journal_items
        WHERE journal_entry_id = NEW.payment_journal_entry_id;

        SELECT IFNULL(SUM(allocated_amount), 0) INTO v_allocated_total
        FROM payment_allocations
        WHERE payment_journal_entry_id = NEW.payment_journal_entry_id
          AND id != NEW.id AND status != 'reversed';

        IF (v_allocated_total + NEW.allocated_amount) > v_payment_total THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed';
        END IF;
    END IF;
END
```

Both are dropped in `down()` via `DROP TRIGGER IF EXISTS`.

## Practical Failure Mode
There is **no FK constraint** on `payment_allocations.payment_journal_entry_id` — it's just an indexed `char(36)`. So passing a `payments.id` instead of a `journal_entries.id`:
- Does **not** raise a foreign-key error.
- The trigger's `SUM(debit+credit)` lookup against `journal_items.journal_entry_id` returns `NULL`/0.
- This causes the over-allocation check to fail silently (any positive `allocated_amount` exceeds a NULL/0 total) — or in some paths, may silently allow unlimited allocation depending on comparison semantics.
- Either way it **breaks bill-wise payment tracking silently** rather than via a clean, loud FK violation.

This is exactly the failure mode `CLAUDE.md` warns about when wiring up the legacy `PurchaseService`. See `recordPurchasePayment()` in [[Purchase Lifecycle - V3 PurchaseService]] for the correct pattern (resolve the JournalEntry ID first).

## Related
- [[V3 Accounting Engine]]
- [[Purchase Lifecycle - V3 PurchaseService]]
- [[Code Conventions]]
