<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('commerce_notifications', function (Blueprint $t) {
            $t->timestamp('emailed_at')->nullable();
            $t->unsignedTinyInteger('email_attempts')->default(0);
            $t->string('email_error', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('commerce_notifications', function (Blueprint $t) {
            $t->dropColumn(['emailed_at', 'email_attempts', 'email_error']);
        });
    }
};
