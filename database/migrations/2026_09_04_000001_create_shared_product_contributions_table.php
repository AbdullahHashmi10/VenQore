<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shared_product_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shared_product_id')->constrained('shared_products')->onDelete('cascade');
            $table->string('tenant_hash', 64);
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['shared_product_id', 'tenant_hash'], 'sp_contrib_prod_tenant_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shared_product_contributions');
    }
};
