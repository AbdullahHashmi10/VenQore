<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| Kitchen ticket routing — the link back to the table that was missing
|==============================================================================
|
| WHY occupancy_id
| ----------------
| TableServiceController::sendToKitchen() fired a WorkOrder with the table's
| label stuffed into `order_number` and nothing else. Once the ticket was on the
| pass there was no way back to the table it belonged to: no "who ordered this",
| no re-fire, no bump that could tell the floor. A ticket that cannot name its
| table is a ticket someone walks the floor asking about.
|
| WHY position_code IS DENORMALISED
| ---------------------------------
| The occupancy closes when the table is settled and the position is freed and
| re-seated minutes later. A ticket still sitting on the pass must keep saying
| "T04" — the table it was cooked for — not follow the live position to whoever
| is sitting there now. So the code is COPIED at fire time and never updated.
|
| station / course / fired_at / bumped_at
| ---------------------------------------
| station  — one kitchen is the default; a bar, a grill and a cold station are
|            the same queue filtered, not three tables.
| course   — starters before mains. The kitchen decides when to fire course 2,
|            which is why it is a number on the ticket and not a sort order.
| fired_at — when the KITCHEN got it, which is not created_at once tickets can
|            be held. Every "how long has this been up" number reads this.
| bumped_at— when it left the pass. Together with fired_at it is the only
|            honest ticket-time measurement.
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('work_orders', 'occupancy_id')) {
                $table->unsignedBigInteger('occupancy_id')->nullable()->after('kind')
                    ->comment('The occupancy (open table) this ticket was fired from. NULL for counter/takeaway tickets.');
                $table->index('occupancy_id');
            }
            if (!Schema::hasColumn('work_orders', 'position_code')) {
                $table->string('position_code', 24)->nullable()->after('occupancy_id')
                    ->comment('Denormalised positions.code at fire time — the ticket still reads T04 after the table is freed.');
            }
            if (!Schema::hasColumn('work_orders', 'station')) {
                $table->string('station', 32)->nullable()->default('kitchen')->after('position_code')
                    ->comment('Which prep station the ticket routes to: kitchen | bar | grill | cold.');
            }
            if (!Schema::hasColumn('work_orders', 'course')) {
                $table->unsignedTinyInteger('course')->default(1)->after('station')
                    ->comment('Course number: 1 = starters, 2 = mains, ... The kitchen fires later courses on its own clock.');
            }
            if (!Schema::hasColumn('work_orders', 'fired_at')) {
                $table->timestamp('fired_at')->nullable()->after('time_elapsed_mins')
                    ->comment('When the kitchen received it. Not created_at — a held ticket is created long before it is fired.');
            }
            if (!Schema::hasColumn('work_orders', 'bumped_at')) {
                $table->timestamp('bumped_at')->nullable()->after('fired_at')
                    ->comment('When it left the pass. bumped_at - fired_at is the only honest ticket time.');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            if (Schema::hasColumn('work_orders', 'occupancy_id')) {
                $table->dropIndex(['occupancy_id']);
            }

            $columns = ['occupancy_id', 'position_code', 'station', 'course', 'fired_at', 'bumped_at'];
            $existing = array_filter($columns, fn ($c) => Schema::hasColumn('work_orders', $c));
            if ($existing) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};
