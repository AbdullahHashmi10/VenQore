<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('credit_limit', 15, 2)->default(0)->after('is_tax_exempt');
            $table->date('date_of_birth')->nullable()->after('credit_limit');
            $table->date('anniversary_date')->nullable()->after('date_of_birth');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['credit_limit', 'date_of_birth', 'anniversary_date']);
        });
    }
};
