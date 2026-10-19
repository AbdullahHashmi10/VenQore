<?php

namespace App\Services\Platform;

use App\Services\PlanRepository;
use Database\Seeders\PlanFeatureMatrixSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Rebuilds the core subscription plans and gives new plans a complete limit set.
 *
 * Why this exists (2026-10-11): a plan deleted from Platform HQ is a hard delete —
 * the `plans` row and every `plan_limits` row go with it. Re-running the whole
 * PlanFeatureMatrixSeeder would bring it back, but it also rewrites the limits of
 * EVERY other plan, wiping any edits made in Platform HQ. This class only ever
 * inserts what is missing and never touches an existing row.
 *
 * It also fixes plan creation: the create form only posts ~10 limit keys, so a new
 * plan used to have every other feature key missing — and PlanRepository fails
 * closed on a missing key, so tenants on that plan lost every gated feature.
 */
class PlanRestorer
{
    /** Plans the product cannot work without. Never deleted, only archived. */
    public const CORE = ['trial', 'solo', 'starter', 'core', 'scale', 'custom'];

    /** Legacy aliases. A plan row with one of these slugs is never read (normalised away). */
    public const ALIASES = ['counter' => 'solo', 'growth' => 'core', 'business' => 'scale'];

    /** Reserved slugs that cannot be used for a new plan. */
    public const RESERVED = ['counter', 'growth', 'business', 'ltd', 'ltd1', 'ltd2', 'ltd3', 'ltd_tier_1', 'ltd_tier_2', 'ltd_tier_3'];

    private const SORT = ['trial' => 0, 'solo' => 1, 'starter' => 2, 'core' => 3, 'scale' => 4, 'custom' => 5];

    /** Nearest existing plan to copy non-matrix keys from. */
    private const NEIGHBOUR = [
        'solo' => ['starter', 'core'], 'starter' => ['solo', 'core'], 'core' => ['starter', 'scale'],
        'scale' => ['core', 'custom'], 'custom' => ['scale', 'core'], 'trial' => ['core', 'scale'],
    ];

    /** Core slugs that currently have no row in `plans`. */
    public function missingCore(): array
    {
        if (!Schema::hasTable('plans')) {
            return [];
        }
        $present = DB::table('plans')->whereIn('slug', self::CORE)->pluck('slug')->all();

        return array_values(array_diff(self::CORE, $present));
    }

    /**
     * Re-create every missing core plan with its full limit set.
     *
     * @return string[] slugs that were created
     */
    public function restoreMissing(): array
    {
        $created = [];
        foreach ($this->missingCore() as $slug) {
            $this->restore($slug);
            $created[] = $slug;
        }

        return $created;
    }

    /** Re-create one core plan. No-op if it already exists. */
    public function restore(string $slug): bool
    {
        if (!in_array($slug, self::CORE, true)) {
            throw new \InvalidArgumentException("'{$slug}' is not a core plan. Core plans: " . implode(', ', self::CORE));
        }
        if (DB::table('plans')->where('slug', $slug)->exists()) {
            return false;
        }

        $cfg = config("pricing.plans.{$slug}", []);
        $websiteId = DB::table('platforms')->where('slug', 'website')->value('id')
            ?? DB::table('platforms')->value('id');

        if (!$websiteId) {
            throw new \RuntimeException('No platform row exists, so a plan cannot be attached to one.');
        }

        DB::transaction(function () use ($slug, $cfg, $websiteId) {
            $planId = DB::table('plans')->insertGetId([
                'platform_id'   => $websiteId,
                'name'          => $cfg['name'] ?? ucfirst($slug),
                'slug'          => $slug,
                'type'          => match ($slug) { 'trial' => 'trial', 'custom' => 'enterprise', default => 'subscription' },
                'price_monthly' => $cfg['price_monthly'] ?? 0,
                'price_annual'  => $cfg['price_annual'] ?? null,
                'currency'      => 'USD',
                'is_active'     => true,
                'is_visible'    => $slug !== 'trial',
                'is_featured'   => $slug === 'core',
                'is_ltd'        => false,
                'sort_order'    => self::SORT[$slug] ?? 9,
                'internal_notes' => 'Restored by PlanRestorer on ' . now()->toDateString() . '.',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            $this->writeLimits($planId, $this->defaultLimitsFor($slug));
        });

        PlanRepository::invalidatePlanCache($slug);
        PlanPricingService::flush();
        Log::info("PlanRestorer: re-created core plan '{$slug}'.");

        return true;
    }

    /**
     * The full key => value limit set a plan with this slug should start from.
     * Matrix keys come from PlanFeatureMatrixSeeder; any other key already in use
     * is copied from the nearest existing plan so nothing is left missing.
     */
    public function defaultLimitsFor(string $slug): array
    {
        $limits = [];
        foreach (PlanFeatureMatrixSeeder::getMatrix() as $key => $values) {
            $limits[$key] = PlanFeatureMatrixSeeder::resolveLimitValue($slug, $key, $values);
        }

        $neighbour = null;
        foreach (self::NEIGHBOUR[$slug] ?? ['starter'] as $candidate) {
            $neighbour = DB::table('plans')->where('slug', $candidate)->value('id');
            if ($neighbour) break;
        }
        if ($neighbour) {
            $extra = DB::table('plan_limits')->where('plan_id', $neighbour)
                ->whereNotIn('key', array_keys($limits))
                ->get(['key', 'value']);
            foreach ($extra as $row) {
                $limits[$row->key] = $row->value;
            }
        }

        return $limits;
    }

    /** Full limit set of an existing plan (by id). */
    public function limitsOfPlan(int $planId): array
    {
        return DB::table('plan_limits')->where('plan_id', $planId)->pluck('value', 'key')->all();
    }

    /** Insert/overwrite limit rows for a plan. */
    public function writeLimits(int $planId, array $limits): void
    {
        foreach ($limits as $key => $value) {
            DB::table('plan_limits')->updateOrInsert(
                ['plan_id' => $planId, 'key' => $key],
                [
                    'value'        => $value === null ? null : (string) $value,
                    'reset_period' => PlanRepository::getResetPeriod($key),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]
            );
        }
    }
}
