<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| Restaurant money — service charge and tips
|==============================================================================
|
| THESE TWO ARE NOT THE SAME KIND OF MONEY, WHICH IS THE WHOLE POINT
| ------------------------------------------------------------------
| service_charge is the HOUSE's money. It is income, it is taxable turnover,
| and it belongs next to delivery_charge and extra_charge_value in the
| waterfall (see 2026_02_20_120002 for the column contract those follow).
|
| tip_amount is the STAFF's money. The business collects it and owes it on —
| it is a liability from the second it is taken, and it must never reach the
| P&L. Booking tips as revenue overstates turnover, overstates tax, and in
| most jurisdictions is exactly the thing that gets a restaurant assessed.
|
| Both are stored at 20,4 to match every other money column in this schema
| (2026_06_21_130243 standardised them).
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'service_charge')) {
                $table->decimal('service_charge', 20, 4)->default(0)->after('shipping_charges')
                    ->comment('House service charge. INCOME — posted to Other Income like delivery/extra charges.');
            }
            if (!Schema::hasColumn('sales', 'tip_amount')) {
                $table->decimal('tip_amount', 20, 4)->default(0)->after('service_charge')
                    ->comment('Gratuity held for staff. LIABILITY, never revenue — posted to Tips Payable (2150).');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $columns = ['service_charge', 'tip_amount'];
            $existing = array_filter($columns, fn ($c) => Schema::hasColumn('sales', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
