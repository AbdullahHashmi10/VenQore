<?php

namespace App\Support;

use App\Services\PlanRepository;

/**
 * The ONE list of subscription plans the product talks about.
 *
 * Canonical slugs (config/pricing.php, the pricing page, the builder, Billing):
 *     solo → starter → core → scale → custom
 *
 * Legacy slugs still found in old rows / env names and ALWAYS normalised on
 * read (PlanRepository::normalizePlanSlug):
 *     counter → solo · growth → core · business → scale
 *
 * Rule: never write a legacy slug to the database, and never compare a plan
 * slug without passing it through canonical() first. The frontend mirror is
 * resources/js/lib/plans.js — keep the two in step.
 */
final class PlanCatalog
{
    /** Tier order, lowest first. 'trial' ranks below every paid tier. */
    public const ORDER = ['solo', 'starter', 'core', 'scale', 'custom'];

    /** Tiers a visitor can pick themselves (custom is sales-led). */
    public const SELF_SERVE = ['solo', 'starter', 'core', 'scale'];

    public const LABELS = [
        'trial'   => 'Free Trial',
        'solo'    => 'Solo',
        'starter' => 'Starter',
        'core'    => 'Core',
        'scale'   => 'Scale',
        'custom'  => 'Custom',
        'ltd_1'   => 'Lifetime Tier 1',
        'ltd_2'   => 'Lifetime Tier 2',
        'ltd_3'   => 'Lifetime Tier 3',
        'ltd'     => 'Lifetime Deal',
    ];

    /** Lifetime tiers map onto the subscription tier they mirror. */
    private const LTD_EQUIVALENT = ['ltd_1' => 'starter', 'ltd_2' => 'core', 'ltd_3' => 'scale'];

    /**
     * Env / services.lemon_squeezy keys were named before the V11 rename and
     * are left as-is (renaming them would mean editing every server's .env).
     */
    private const LEGACY_CONFIG_KEY = ['solo' => 'counter', 'core' => 'growth', 'scale' => 'business'];

    public static function canonical(?string $slug): string
    {
        $slug = (string) $slug;

        return $slug === '' ? '' : PlanRepository::normalizePlanSlug($slug);
    }

    /** 0 for trial/unknown, 1..n for paid tiers. LTD tiers rank as their equivalent. */
    public static function rank(?string $slug): int
    {
        $slug = self::canonical($slug);
        $slug = self::LTD_EQUIVALENT[$slug] ?? $slug;
        $i = array_search($slug, self::ORDER, true);

        return $i === false ? 0 : $i + 1;
    }

    /** Next self-serve tier up, or null when already at the top. */
    public static function next(?string $slug): ?string
    {
        $slug = self::canonical($slug);
        $slug = self::LTD_EQUIVALENT[$slug] ?? $slug;

        if (!in_array($slug, self::SELF_SERVE, true)) {
            return in_array($slug, ['custom'], true) ? null : 'starter';
        }
        $i = array_search($slug, self::SELF_SERVE, true);

        return self::SELF_SERVE[$i + 1] ?? null;
    }

    public static function label(?string $slug): string
    {
        $slug = self::canonical($slug);

        return self::LABELS[$slug] ?? ucfirst(str_replace('_', ' ', $slug));
    }

    public static function isSelfServe(?string $slug): bool
    {
        return in_array(self::canonical($slug), self::SELF_SERVE, true);
    }

    /** Monthly USD list price from config/pricing.php (0 for trial/unknown). */
    public static function monthlyUsd(?string $slug): float
    {
        $slug = self::canonical($slug);

        return (float) (config("pricing.plans.{$slug}.price_monthly") ?? 0);
    }

    /** The pre-rename key used by services.lemon_squeezy.* env settings. */
    public static function legacyConfigKey(string $slug): string
    {
        $slug = self::canonical($slug);

        return self::LEGACY_CONFIG_KEY[$slug] ?? $slug;
    }
}
