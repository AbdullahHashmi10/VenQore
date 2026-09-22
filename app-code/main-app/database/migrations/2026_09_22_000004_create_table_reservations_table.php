<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table reservations and walk-in waitlist queue.
     *
     * WHY ONE TABLE FOR RESERVATIONS AND WAITLIST
     * -------------------------------------------
     * A waitlist entry is simply a reservation whose time is "now" and whose
     * status is 'waiting'. Splitting them into separate tables would require
     * two separate lookups for the host stand on every floor refresh.
     */
    public function up(): void
    {
        if (!Schema::hasTable('table_reservations')) {
            Schema::create('table_reservations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->string('customer_name', 120);
                $table->string('phone', 40)->nullable()->index();
                $table->integer('party_size')->default(2);
                $table->dateTime('reserved_at')->index();
                $table->unsignedBigInteger('position_id')->nullable()->index();
                $table->string('status', 32)->default('booked')->index(); // booked, waiting, seated, cancelled, no_show
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'reserved_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('table_reservations');
    }
};
