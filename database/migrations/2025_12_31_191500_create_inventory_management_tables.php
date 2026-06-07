<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('location')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // Insert default warehouse
        // Insert default warehouse
        DB::table('warehouses')->insert([
            'id' => Str::uuid()->toString(),
            'name' => 'Main Store',
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('stocks', function (Blueprint $table) {
            $table->foreignUuid('warehouse_id')->nullable()->after('product_id')->constrained()->nullOnDelete();
        });

        // Assign existing stocks to default warehouse
        $defaultWarehouse = DB::table('warehouses')->where('is_default', true)->first();
        if ($defaultWarehouse) {
            DB::table('stocks')->update(['warehouse_id' => $defaultWarehouse->id]);
        }

        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('quantity', 10, 4); // Positive for addition, negative for deduction
            $table->string('type'); // purchase, sale, adjustment, transfer, return
            $table->string('reference_id')->nullable(); // Invoice ID, PO ID
            $table->text('description')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::table('stocks', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropColumn('warehouse_id');
        });
        Schema::dropIfExists('warehouses');
    }
};


