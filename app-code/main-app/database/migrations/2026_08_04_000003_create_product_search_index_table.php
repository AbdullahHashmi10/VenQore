<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_search_index', function (Blueprint $t) {
            $t->unsignedBigInteger('tenant_id');
            $t->unsignedBigInteger('product_id');
            $t->string('name_norm', 191);
            $t->string('name_soundex', 32);
            $t->string('name_metaphone', 64);
            $t->string('sku_norm', 100)->nullable();
            $t->string('barcode', 64)->nullable();
            $t->text('tokens');
            
            $t->primary(['tenant_id', 'product_id']);
            $t->index(['tenant_id', 'name_norm']);
            $t->index(['tenant_id', 'name_soundex']);
            $t->index(['tenant_id', 'name_metaphone']);
            $t->index(['tenant_id', 'barcode']);
            $t->index(['tenant_id', 'sku_norm']);
        });

        DB::statement('ALTER TABLE product_search_index ADD FULLTEXT KEY ft_tokens (tokens)');
    }

    public function down(): void
    {
        Schema::dropIfExists('product_search_index');
    }
};
