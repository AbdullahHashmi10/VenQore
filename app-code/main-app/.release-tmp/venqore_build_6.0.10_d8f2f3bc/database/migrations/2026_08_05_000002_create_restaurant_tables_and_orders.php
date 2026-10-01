<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('table_number');
            $table->string('name')->nullable();
            $table->integer('capacity')->default(4);
            $table->string('status')->default('available'); // available, occupied, reserved, cleaning
            $table->decimal('order_total', 10, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('kitchen_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('order_number');
            $table->unsignedBigInteger('table_id')->nullable();
            $table->string('table_number')->nullable();
            $table->json('items');
            $table->string('status')->default('pending'); // pending, preparing, ready, served, cancelled
            $table->integer('time_elapsed_mins')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kitchen_orders');
        Schema::dropIfExists('restaurant_tables');
    }
};
