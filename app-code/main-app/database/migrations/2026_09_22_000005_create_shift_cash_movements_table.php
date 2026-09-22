<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('register_shifts')) {
            Schema::table('register_shifts', function (Blueprint $table) {
                if (!Schema::hasColumn('register_shifts', 'notes')) {
                    $table->text('notes')->nullable()->after('variance');
                }
                if (!Schema::hasColumn('register_shifts', 'denominations')) {
                    $table->json('denominations')->nullable()->after('notes');
                }
            });
        }

        if (!Schema::hasTable('shift_cash_movements')) {
            Schema::create('shift_cash_movements', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('tenant_id')->index();
                $table->unsignedBigInteger('register_shift_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('type', 16); // 'in', 'out'
                $table->decimal('amount', 15, 2)->default(0.00);
                $table->string('reason', 255)->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'register_shift_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_cash_movements');

        if (Schema::hasTable('register_shifts')) {
            Schema::table('register_shifts', function (Blueprint $table) {
                if (Schema::hasColumn('register_shifts', 'notes')) {
                    $table->dropColumn('notes');
                }
                if (Schema::hasColumn('register_shifts', 'denominations')) {
                    $table->dropColumn('denominations');
                }
            });
        }
    }
};
