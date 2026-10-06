<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storefronts', function (Blueprint $table) {
            $table->boolean('onsite_ordering_enabled')->default(false)->after('catalogue_theme');
            $table->boolean('counter_qr_enabled')->default(false)->after('onsite_ordering_enabled');
        });
        Schema::table('positions', function (Blueprint $table) {
            $table->string('customer_order_token', 64)->nullable()->unique();
            $table->boolean('customer_ordering_enabled')->default(true);
        });
        foreach (DB::table('positions')->select('id')->orderBy('id')->cursor() as $position) {
            DB::table('positions')->where('id', $position->id)->update(['customer_order_token' => Str::random(40)]);
        }
        Schema::create('onsite_order_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->char('storefront_id', 36);
            $table->unsignedBigInteger('position_id')->nullable();
            $table->unsignedBigInteger('occupancy_id');
            $table->string('public_number', 24)->unique();
            $table->string('idempotency_key', 100);
            $table->string('channel', 24); // counter_qr | table_qr
            $table->string('customer_name', 120)->nullable();
            $table->unsignedSmallInteger('line_count');
            $table->decimal('total', 20, 2);
            $table->timestamps();
            $table->unique(['storefront_id', 'idempotency_key']);
            $table->index(['tenant_id', 'created_at']);
            $table->foreign('storefront_id')->references('id')->on('storefronts')->cascadeOnDelete();
            $table->foreign('position_id')->references('id')->on('positions')->nullOnDelete();
            $table->foreign('occupancy_id')->references('id')->on('occupancies')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onsite_order_requests');
        Schema::table('positions', fn (Blueprint $table) => $table->dropColumn(['customer_order_token', 'customer_ordering_enabled']));
        Schema::table('storefronts', fn (Blueprint $table) => $table->dropColumn(['onsite_ordering_enabled', 'counter_qr_enabled']));
    }
};
