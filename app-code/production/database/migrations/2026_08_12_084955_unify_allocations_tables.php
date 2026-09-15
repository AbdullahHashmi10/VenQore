<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // 1. Drop old triggers on payment_allocations
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_insert;");
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_update;");
        }

        // 2. Drop obsolete transaction_allocations table
        Schema::dropIfExists('transaction_allocations');

        // 3. Rename payment_allocations to allocations
        if (Schema::hasTable('payment_allocations') && !Schema::hasTable('allocations')) {
            Schema::rename('payment_allocations', 'allocations');
        }

        // 4. Create new triggers on allocations
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::unprepared("
                CREATE TRIGGER chk_allocation_insert BEFORE INSERT ON allocations
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
                    FROM allocations
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
                        FROM allocations
                        WHERE sale_id = NEW.sale_id
                          AND status != 'reversed';

                        IF (v_allocated_total_sale + NEW.allocated_amount) > v_sale_total THEN
                            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Over-allocation not allowed - Sale exceeded';
                        END IF;
                    END IF;
                END
            ");

            DB::unprepared("
                CREATE TRIGGER chk_allocation_update BEFORE UPDATE ON allocations
                FOR EACH ROW
                BEGIN
                    DECLARE v_payment_total DECIMAL(20,4);
                    DECLARE v_allocated_total DECIMAL(20,4);

                    IF NEW.status != 'reversed' THEN
                        SELECT MAX(debit + credit) INTO v_payment_total
                        FROM journal_items
                        WHERE journal_entry_id = NEW.payment_journal_entry_id;

                        SELECT IFNULL(SUM(allocated_amount), 0) INTO v_allocated_total
                        FROM allocations
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        // 1. Drop triggers on allocations
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_insert;");
            DB::unprepared("DROP TRIGGER IF EXISTS chk_allocation_update;");
        }

        // 2. Rename allocations back to payment_allocations
        if (Schema::hasTable('allocations') && !Schema::hasTable('payment_allocations')) {
            Schema::rename('allocations', 'payment_allocations');
        }

        // 3. Recreate old triggers on payment_allocations
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::unprepared("
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

        // 4. Recreate transaction_allocations table
        Schema::create('transaction_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('payment_transaction_id');
            $table->unsignedBigInteger('invoice_transaction_id');
            $table->decimal('amount', 20, 4);
            $table->timestamps();
        });
    }
};
