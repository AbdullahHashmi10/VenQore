<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
| QR menu hardening and extras:
|  - storefronts: pause switch, "only while staff have seated the table", "off outside opening hours"
|  - storefront_products: show on the online store / on the QR menu independently, and an optional Urdu name
|  - onsite_order_requests: the id that ties a guest's order to its lines on the table (for the guest's status page)
*/
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('storefronts')) {
            Schema::table('storefronts', function (Blueprint $table) {
                if (!Schema::hasColumn('storefronts', 'onsite_paused')) {
                    $table->boolean('onsite_paused')->default(false);
                }
                if (!Schema::hasColumn('storefronts', 'onsite_require_seated')) {
                    $table->boolean('onsite_require_seated')->default(false);
                }
                if (!Schema::hasColumn('storefronts', 'onsite_auto_hours')) {
                    $table->boolean('onsite_auto_hours')->default(false);
                }
            });
        }
        if (Schema::hasTable('storefront_products')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                if (!Schema::hasColumn('storefront_products', 'show_online')) {
                    $table->boolean('show_online')->default(true);
                }
                if (!Schema::hasColumn('storefront_products', 'show_onsite')) {
                    $table->boolean('show_onsite')->default(true);
                }
                if (!Schema::hasColumn('storefront_products', 'public_name_ur')) {
                    $table->string('public_name_ur', 190)->nullable();
                }
            });
        }
        if (Schema::hasTable('onsite_order_requests') && !Schema::hasColumn('onsite_order_requests', 'request_id')) {
            Schema::table('onsite_order_requests', function (Blueprint $table) {
                $table->char('request_id', 36)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storefronts')) {
            Schema::table('storefronts', function (Blueprint $table) {
                foreach (['onsite_paused', 'onsite_require_seated', 'onsite_auto_hours'] as $c) {
                    if (Schema::hasColumn('storefronts', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
        if (Schema::hasTable('storefront_products')) {
            Schema::table('storefront_products', function (Blueprint $table) {
                foreach (['show_online', 'show_onsite', 'public_name_ur'] as $c) {
                    if (Schema::hasColumn('storefront_products', $c)) {
                        $table->dropColumn($c);
                    }
                }
            });
        }
        if (Schema::hasTable('onsite_order_requests') && Schema::hasColumn('onsite_order_requests', 'request_id')) {
            Schema::table('onsite_order_requests', function (Blueprint $table) {
                $table->dropColumn('request_id');
            });
        }
    }
};
