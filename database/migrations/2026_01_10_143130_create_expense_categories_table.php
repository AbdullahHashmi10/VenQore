<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expense_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('group')->nullable(); // Utilities, Operational, Staff, Office, Equipment, Misc
            $table->string('icon')->nullable(); // Lucide icon name
            $table->string('color')->nullable(); // Tailwind color
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Update expenses table to use foreign key
        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignUuid('expense_category_id')->nullable()->after('category')->constrained('expense_categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['expense_category_id']);
            $table->dropColumn('expense_category_id');
        });

        Schema::dropIfExists('expense_categories');
    }
};


