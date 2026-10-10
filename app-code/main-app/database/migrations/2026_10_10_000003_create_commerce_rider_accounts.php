<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Rider sign-in: a store member (user) linked to a rider employee. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commerce_rider_accounts', function (Blueprint $t) {
            $t->char('id', 36)->primary();
            $t->unsignedBigInteger('tenant_id');
            $t->unsignedBigInteger('user_id');
            $t->char('employee_id', 36);
            $t->unsignedBigInteger('linked_by')->nullable();
            $t->timestamps();
            $t->unique(['tenant_id', 'user_id']);
            $t->unique('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commerce_rider_accounts');
    }
};
