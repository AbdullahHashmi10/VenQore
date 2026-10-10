<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| One row per (store, badge) that has ever been earned or overridden.
|   auto_earned : what the nightly run decided
|   override    : the platform owner's word. 'on' shows it, 'off' hides it,
|                 null follows auto_earned. The nightly run never touches it.
*/
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefront_badges')) {
            return;
        }
        Schema::create('storefront_badges', function (Blueprint $table) {
            $table->id();
            $table->uuid('storefront_id');
            $table->string('badge', 40);
            $table->boolean('auto_earned')->default(false);
            $table->enum('override', ['on', 'off'])->nullable();
            $table->string('note', 255)->nullable();
            $table->unsignedBigInteger('set_by')->nullable();
            $table->timestamp('earned_at')->nullable();
            $table->timestamps();

            $table->unique(['storefront_id', 'badge']);
            $table->index('badge');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storefront_badges');
    }
};
