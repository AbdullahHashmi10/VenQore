<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One set of plan slugs everywhere (App\Support\PlanCatalog):
 *   counter → solo · growth → core · business → scale
 *
 * Every reader already normalises (PlanRepository::normalizePlanSlug), so
 * this changes no limits — it removes the legacy spellings that made screens
 * like Billing compare 'growth' against 'core' and show the wrong card.
 *
 * store_licenses.plan is deliberately NOT touched: there 'starter' / 'growth'
 * / 'business' are legacy AppSumo lifetime tiers, not subscription tiers.
 */
return new class extends Migration
{
    private const MAP = ['counter' => 'solo', 'growth' => 'core', 'business' => 'scale'];

    public function up(): void
    {
        if (!Schema::hasTable('tenants') || !Schema::hasColumn('tenants', 'plan')) {
            return;
        }

        foreach (self::MAP as $legacy => $canonical) {
            DB::table('tenants')->where('plan', $legacy)->update(['plan' => $canonical]);
        }
    }

    public function down(): void
    {
        // Irreversible by design: which rows were legacy is not recorded, and
        // the canonical slugs resolve to identical limits.
    }
};
