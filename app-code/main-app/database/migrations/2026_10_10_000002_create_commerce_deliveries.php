<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Phase C: rider deliveries for online-store orders (assignment, status trail, COD cash custody). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commerce_deliveries', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->char('order_id', 36)->unique();            // one delivery record per order; reassignment edits it
            $t->char('rider_id', 36);                      // employees.id (is_rider)
            $t->enum('status', ['assigned', 'accepted', 'collected', 'out_for_delivery', 'delivered', 'failed', 'returned'])->default('assigned');
            $t->decimal('cash_expected', 20, 2)->default(0);   // COD amount the rider must collect
            $t->decimal('cash_collected', 20, 2)->nullable();
            $t->decimal('rider_fee', 12, 2)->default(0);        // earned per delivery; never netted against cash
            $t->string('fail_reason', 255)->nullable();
            $t->unsignedBigInteger('assigned_by')->nullable();
            $t->timestamp('assigned_at')->nullable();
            $t->timestamp('delivered_at')->nullable();
            $t->timestamp('cash_acknowledged_at')->nullable();
            $t->unsignedBigInteger('cash_acknowledged_by')->nullable();
            $t->unsignedInteger('version')->default(1);
            $t->timestamps();
            $t->index(['tenant_id', 'rider_id', 'status']);
            $t->foreign('order_id')->references('id')->on('commerce_orders')->cascadeOnDelete();
        });

        Schema::create('commerce_delivery_events', function (Blueprint $t) {
            $t->id();
            $t->char('delivery_id', 36);
            $t->unsignedBigInteger('tenant_id');
            $t->string('type', 40);
            $t->string('from_status', 24)->nullable();
            $t->string('to_status', 24)->nullable();
            $t->string('actor_type', 12)->default('system'); // staff | rider | system
            $t->string('actor_id', 36)->nullable();
            $t->string('note', 255)->nullable();
            $t->json('meta')->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index('delivery_id');
            $t->foreign('delivery_id')->references('id')->on('commerce_deliveries')->cascadeOnDelete();
        });

        Schema::create('commerce_rider_links', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->char('employee_id', 36);
            $t->char('token_hash', 64)->unique();   // only the hash is stored; the link is shown once
            $t->unsignedBigInteger('created_by')->nullable();
            $t->timestamp('revoked_at')->nullable();
            $t->timestamps();
            $t->index(['tenant_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commerce_rider_links');
        Schema::dropIfExists('commerce_delivery_events');
        Schema::dropIfExists('commerce_deliveries');
    }
};
