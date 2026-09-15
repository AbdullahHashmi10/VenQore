<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignUuid('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('hsn_code')->nullable();
            $table->boolean('is_weighted')->default(false);
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->string('woocommerce_id')->nullable();
            $table->integer('alert_quantity')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['brand_id']);
            $table->dropColumn([
                'category_id',
                'brand_id',
                'hsn_code',
                'is_weighted',
                'description',
                'image_path',
                'woocommerce_id',
                'alert_quantity'
            ]);
        });
    }
};


