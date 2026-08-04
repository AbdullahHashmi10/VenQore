<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_product_codes', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('tenant_id')->index();
            $t->unsignedBigInteger('party_id')->index();
            $t->unsignedBigInteger('product_id')->index();
            $t->string('supplier_code', 100);
            $t->unsignedInteger('hits')->default(1);
            $t->timestamp('last_seen_at')->nullable();
            $t->timestamps();

            $t->unique(['tenant_id', 'party_id', 'supplier_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_product_codes');
    }
};
