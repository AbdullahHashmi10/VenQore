<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::unprepared("
                DROP TRIGGER IF EXISTS chk_allocation_insert;
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

                    -- Also check if sale is over-allocated
                    IF NEW.sale_id IS NOT NULL THEN
                        SELECT invoice_total INTO v_sale_total
                        FROM sales WHERE id = NEW.sale_id;

                        SELECT IFNULL(SUM(allocated_amount), 0) INTO v_allocated_total_sale
                        FROM payment_allocations
                        WHERE sale_id = NEW.sale_id
                          AND status != 'reversed';

                        IF (v_allocated_total_sale + NEW.allocated_amount) > v_sale_total THEN
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed - Sale exceeded';
                        END IF;
                    END IF;
                END
            ");

            DB::unprepared("
                DROP TRIGGER IF EXISTS chk_allocation_update;
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
                          AND id != NEW.id
                          AND status != 'reversed';

                        IF (v_allocated_total + NEW.allocated_amount) > v_payment_total THEN
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed';
                        END IF;
                    END IF;
                END
            ");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_insert;");
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_update;");
        }
    }
};
