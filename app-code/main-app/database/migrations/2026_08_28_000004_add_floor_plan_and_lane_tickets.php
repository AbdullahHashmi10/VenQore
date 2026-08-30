<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
|==============================================================================
| The floor plan, and tickets that are not sitting at a table
|==============================================================================
|
| WHY occupancies.position_id BECOMES NULLABLE
| --------------------------------------------
| A takeaway bag and a delivery run are open bills with a cart, a server, a
| kitchen ticket and a total — everything an occupancy already models — and no
| physical place. The alternative that keeps the column NOT NULL is a fake
| "Takeaway 1..N" position per concurrent order, which puts phantom tables on
| the floor plan, breaks every capacity and covers number, and leaves the floor
| screen filtering out rows it should never have been shown. So the column
| loses its NOT NULL and a NULL position_id means exactly one thing: this bill
| belongs to a lane, not to a seat.
|
| Nothing that reads positions is affected. `Position::activeOccupancy` joins on
| position_id, so a lane ticket matches no position and cannot leak onto the
| floor; every parked-sale query filters `source_type = 'parked_sale'` and lane
| tickets carry no source_type.
|
| WHY THE GEOMETRY COLUMNS ARE HERE NOW AND READ BY NOTHING
| ---------------------------------------------------------
| pos_x / pos_y / pos_w / pos_h / shape are for a drag-and-drop floor plan that
| does not exist yet. They are five nullable columns on a table with tens of
| rows per tenant: free today, and awkward later — adding them once the builder
| ships means a schema change in the same release as the feature, on a table the
| POS reads on a fifteen-second poll from every device in the building.
|==============================================================================
*/
return new class extends Migration
{
    public function up(): void
    {
        /* doctrine/dbal ^4.4 IS in composer.json, and Laravel 12 no longer needs
           it for a column change in any case, so this is the plain Schema
           builder — no raw ALTER, no connection-specific SQL. The column keeps
           its type and its (tenant_id, position_id) index; only NOT NULL goes.
           There is no foreign key on it to drop and re-add. */
        Schema::table('occupancies', function (Blueprint $table) {
            $table->unsignedBigInteger('position_id')->nullable()->change();
        });

        Schema::table('positions', function (Blueprint $table) {
            if (!Schema::hasColumn('positions', 'pos_x')) {
                $table->decimal('pos_x', 8, 2)->nullable()->after('sort_order')
                    ->comment('Floor-plan X. Nothing reads it yet — for the drag-and-drop plan.');
            }
            if (!Schema::hasColumn('positions', 'pos_y')) {
                $table->decimal('pos_y', 8, 2)->nullable()->after('pos_x')
                    ->comment('Floor-plan Y.');
            }
            if (!Schema::hasColumn('positions', 'pos_w')) {
                $table->decimal('pos_w', 8, 2)->nullable()->after('pos_y')
                    ->comment('Floor-plan width.');
            }
            if (!Schema::hasColumn('positions', 'pos_h')) {
                $table->decimal('pos_h', 8, 2)->nullable()->after('pos_w')
                    ->comment('Floor-plan height.');
            }
            if (!Schema::hasColumn('positions', 'shape')) {
                $table->string('shape', 16)->nullable()->after('pos_h')
                    ->comment('round | square | rect | booth. Presentation only.');
            }
        });
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $columns  = ['pos_x', 'pos_y', 'pos_w', 'pos_h', 'shape'];
            $existing = array_values(array_filter($columns, fn ($c) => Schema::hasColumn('positions', $c)));
            if ($existing) {
                $table->dropColumn($existing);
            }
        });

        /* Restoring NOT NULL means the rows that only exist BECAUSE of this
           migration cannot survive it. A lane ticket has no position to point
           at — there is no value to backfill that is not a lie, and pointing it
           at some arbitrary table would put a stranger's takeaway bag on a
           seated guest's bill. So the open lane tickets are closed and removed,
           which is the same thing the old schema would have said about them:
           they were never representable. Anything already settled is gone with
           them; the sale it produced lives in `sales`, not here. */
        DB::table('occupancies')->whereNull('position_id')->delete();

        Schema::table('occupancies', function (Blueprint $table) {
            $table->unsignedBigInteger('position_id')->nullable(false)->change();
        });
    }
};
