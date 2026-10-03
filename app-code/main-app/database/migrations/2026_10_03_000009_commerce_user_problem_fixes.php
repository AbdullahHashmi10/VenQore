<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Several valid status links per order (a retried checkout must not kill the first link).
        Schema::create('commerce_order_tokens', function (Blueprint $t) {
            $t->id();
            $t->char('order_id', 36)->index();
            $t->char('token_hash', 64)->unique();
            $t->timestamp('created_at')->nullable();
        });
        DB::statement("insert into commerce_order_tokens (order_id, token_hash, created_at) select id, status_token_hash, now() from commerce_orders where status_token_hash is not null");

        // Old shop links keep working after the slug changes.
        Schema::create('storefront_slug_history', function (Blueprint $t) {
            $t->id();
            $t->char('storefront_id', 36)->index();
            $t->string('slug', 60)->unique();
            $t->timestamp('created_at')->nullable();
        });

        // Numbers a merchant has blocked from ordering.
        Schema::create('commerce_blocked_phones', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('tenant_id')->index();
            $t->string('phone', 20);
            $t->string('reason', 120)->nullable();
            $t->timestamp('created_at')->nullable();
            $t->unique(['tenant_id', 'phone']);
        });

        Schema::table('commerce_orders', function (Blueprint $t) {
            $t->timestamp('stale_notified_at')->nullable();
            $t->boolean('promo_released')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('commerce_orders', fn (Blueprint $t) => $t->dropColumn(['stale_notified_at', 'promo_released']));
        Schema::dropIfExists('commerce_blocked_phones');
        Schema::dropIfExists('storefront_slug_history');
        Schema::dropIfExists('commerce_order_tokens');
    }
};
