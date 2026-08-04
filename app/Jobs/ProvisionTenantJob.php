<?php

namespace App\Jobs;

use App\Mail\TenantWelcomeMail;
use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Database\Seeders\TenantDefaultSeeder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * ProvisionTenantJob — Definitive Plan
 *
 * The auto-provisioning engine. Triggered by LemonSqueezyWebhookController
 * on 'subscription_created' events.
 *
 * New schema (Definitive Plan):
 *  - Creates Tenant with numeric PK (auto-increment), slug (not subdomain)
 *  - Creates TenantUser record with role=owner
 *  - Creates StoreLicense record linked to user and tenant
 *  - Sets user.last_store_id for instant redirect on login
 *
 * Idempotency: checks lemon_squeezy_subscription_id before creating.
 * Retries: 3 attempts with 30-second backoff.
 */
class ProvisionTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries  = 3;
    public int $backoff = 30;

    public function __construct(private array $payload) {}

    public function handle(): void
    {
        $email          = data_get($this->payload, 'data.attributes.user_email') ?? data_get($this->payload, 'user_email') ?? data_get($this->payload, 'attributes.user_email');
        $name           = data_get($this->payload, 'data.attributes.user_name') ?? data_get($this->payload, 'user_name') ?? data_get($this->payload, 'attributes.user_name') ?? 'Valued Customer';
        $variantId      = data_get($this->payload, 'data.attributes.variant_id') ?? data_get($this->payload, 'variant_id') ?? data_get($this->payload, 'attributes.variant_id') ?? data_get($this->payload, 'meta.custom_data.variant_id') ?? data_get($this->payload, 'custom_data.variant_id') ?? data_get($this->payload, 'data.attributes.first_order_item.variant_id');
        $productName    = data_get($this->payload, 'data.attributes.product_name') ?? data_get($this->payload, 'product_name') ?? data_get($this->payload, 'attributes.product_name');
        $orderId        = data_get($this->payload, 'data.attributes.order_id') ?? data_get($this->payload, 'order_id') ?? data_get($this->payload, 'attributes.order_id');
        $customerId     = data_get($this->payload, 'data.attributes.customer_id') ?? data_get($this->payload, 'customer_id') ?? data_get($this->payload, 'attributes.customer_id');
        $subscriptionId = data_get($this->payload, 'data.attributes.subscription_id') ?? data_get($this->payload, 'subscription_id') ?? data_get($this->payload, 'attributes.subscription_id') ?? data_get($this->payload, 'data.id');

        // Lemon Squeezy's own view of the subscription. This must be honoured
        // rather than assumed: if the purchased variant has a free-trial period,
        // Lemon Squeezy opens the subscription as `on_trial` and charges $0, so
        // writing 'active' here would mark an unpaid store as paying and hide
        // its Pay Now button. See LemonSqueezyStatus for the full story.
        $lsStatus       = data_get($this->payload, 'data.attributes.status') ?? data_get($this->payload, 'status') ?? data_get($this->payload, 'attributes.status');

        $tenantId       = data_get($this->payload, 'meta.custom_data.tenant_id') ?? data_get($this->payload, 'custom_data.tenant_id');

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if ($tenant) {
                $emailMatches = $email && $tenant->users()->where('email', $email)->exists();
                $allAddonVariantIds = array_filter([
                    (string) config('services.lemon_squeezy.woocommerce_addon_id'),
                    (string) config('services.lemon_squeezy.amazon_addon_id'),
                    (string) config('services.lemon_squeezy.ebay_addon_id'),
                    (string) config('services.lemon_squeezy.tiktok_addon_id'),
                    (string) config('services.lemon_squeezy.ai_starter_addon_id'),
                    (string) config('services.lemon_squeezy.ai_lite_addon_id'),
                    (string) config('services.lemon_squeezy.ai_pro_addon_id'),
                    (string) config('services.lemon_squeezy.ai_ultimate_addon_id'),
                    (string) config('services.lemon_squeezy.ai_byok_addon_id'),
                    (string) config('services.lemon_squeezy.ai_topup_addon_id'),
                ]);

                $variantIdStr = $variantId !== null ? (string)$variantId : '';

                $isAddonOrService = !empty(data_get($this->payload, 'meta.custom_data.addon_key'))
                    || !empty(data_get($this->payload, 'custom_data.addon_key'))
                    || !empty(data_get($this->payload, 'meta.custom_data.is_onboarding_service'))
                    || !empty(data_get($this->payload, 'custom_data.is_onboarding_service'))
                    || ($variantIdStr !== '' && in_array($variantIdStr, $allAddonVariantIds, true));

                if (!$emailMatches && !$isAddonOrService) {
                    $tenant = null;
                    $tenantId = null;
                }
            } else {
                $tenantId = null;
            }
        }

        // ── Check if Onboarding Product Upload Service ──────────────────
        $isOnboarding = data_get($this->payload, 'meta.custom_data.is_onboarding_service') 
            ?? data_get($this->payload, 'custom_data.is_onboarding_service');

        if ($isOnboarding === '1' || $isOnboarding === 1) {
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
                if ($tenant) {
                    $tier = data_get($this->payload, 'meta.custom_data.tier') ?? data_get($this->payload, 'custom_data.tier');
                    $productsCount = data_get($this->payload, 'meta.custom_data.products_count') ?? data_get($this->payload, 'custom_data.products_count');
                    $variantsCount = data_get($this->payload, 'meta.custom_data.variants_count') ?? data_get($this->payload, 'custom_data.variants_count');
                    $totalPrice = data_get($this->payload, 'meta.custom_data.total_price') ?? data_get($this->payload, 'custom_data.total_price');
                    $currency = data_get($this->payload, 'meta.custom_data.currency') ?? data_get($this->payload, 'custom_data.currency') ?? 'USD';

                    $owner = $tenant->ownerMembership()->with('user')->first();
                    
                    app()->instance('current.tenant', $tenant);

                    \App\Models\SupportTicket::create([
                        'tenant_id'       => $tenant->id,
                        'submitted_by'    => $owner?->user_id,
                        'subject'         => "PRO UPLOAD JOB: " . ucfirst($tier) . " - " . $productsCount . " Products",
                        'message'         => "Onboarding Product Upload Service purchased.\n\n" .
                                             "Details:\n" .
                                             "- Selected Tier: " . ucfirst($tier) . "\n" .
                                             "- Products to upload: " . $productsCount . "\n" .
                                             "- Avg Variants per product: " . $variantsCount . "\n" .
                                             "- Total Paid: " . ($currency === 'PKR' ? 'Rs ' : '$') . $totalPrice . "\n\n" .
                                             "Please contact the client (" . ($owner?->user?->email ?? $tenant->ownerEmail()) . ") to collect files and begin import.",
                        'status'          => 'open',
                        'priority'        => 'high',
                        'requester_email' => $owner?->user?->email ?? $tenant->ownerEmail(),
                        'requester_name'  => $owner?->user?->name ?? $tenant->name,
                    ]);

                    Log::info("ProvisionTenantJob: Auto-created support ticket for Onboarding Service on tenant {$tenant->id}");
                }
            }
            return;
        }

        // ── Check if Subscription Add-on ────────────────────────────────
        $variantIdStr = $variantId !== null ? (string)$variantId : '';
        $isAddon = false;
        $addonSyncs = [];
        $aiStatus = null;
        $aiQueries = 0;
        $aiScans = 0;

        $wooAddonId    = config('services.lemon_squeezy.woocommerce_addon_id');
        $amazonAddonId = config('services.lemon_squeezy.amazon_addon_id');
        $ebayAddonId   = config('services.lemon_squeezy.ebay_addon_id');
        $tiktokAddonId = config('services.lemon_squeezy.tiktok_addon_id');

        $aiStarterId   = config('services.lemon_squeezy.ai_starter_addon_id');
        $aiLiteId      = config('services.lemon_squeezy.ai_lite_addon_id');
        $aiProId       = config('services.lemon_squeezy.ai_pro_addon_id');
        $aiUltimateId  = config('services.lemon_squeezy.ai_ultimate_addon_id');
        $aiByokId      = config('services.lemon_squeezy.ai_byok_addon_id');

        if ($wooAddonId && $variantIdStr === (string)$wooAddonId) {
            $addonSyncs[] = 'woocommerce';
            $isAddon = true;
        }
        if ($amazonAddonId && $variantIdStr === (string)$amazonAddonId) {
            $addonSyncs[] = 'amazon';
            $isAddon = true;
        }
        if ($ebayAddonId && $variantIdStr === (string)$ebayAddonId) {
            $addonSyncs[] = 'ebay';
            $isAddon = true;
        }
        if ($tiktokAddonId && $variantIdStr === (string)$tiktokAddonId) {
            $addonSyncs[] = 'tiktok';
            $isAddon = true;
        }

        if ($aiStarterId && $variantIdStr === (string)$aiStarterId) {
            $aiStatus = 'managed';
            $aiQueries = 110;
            $aiScans = 90;
            $isAddon = true;
        }
        if ($aiLiteId && $variantIdStr === (string)$aiLiteId) {
            $aiStatus = 'managed';
            // Matches Pricing.jsx AI_OPTIONS: Lite = 200 queries / 150 scans
            $aiQueries = 200;
            $aiScans = 150;
            $isAddon = true;
        }
        if ($aiProId && $variantIdStr === (string)$aiProId) {
            $aiStatus = 'managed';
            // Matches Pricing.jsx AI_OPTIONS: Pro = 420 queries / 480 scans
            $aiQueries = 420;
            $aiScans = 480;
            $isAddon = true;
        }
        if ($aiUltimateId && $variantIdStr === (string)$aiUltimateId) {
            $aiStatus = 'managed';
            // Matches Pricing.jsx AI_OPTIONS: Ultimate = 800 queries / 850 scans
            $aiQueries = 800;
            $aiScans = 850;
            $isAddon = true;
        }
        if ($aiByokId && $variantIdStr === (string)$aiByokId) {
            $aiStatus = 'byok';
            $aiQueries = 999999;
            $aiScans = 999999;
            $isAddon = true;
        }

        $aiTopupId = config('services.lemon_squeezy.ai_topup_addon_id');
        if ($aiTopupId && $variantIdStr === (string)$aiTopupId) {
            $isAddon = true;
            if ($tenantId) {
                app(\App\Services\LemonSqueezyCheckoutService::class)->incrementAiPages((int)$tenantId, 200);
            }
        }

        if ($isAddon) {
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
                if ($tenant) {
                    if (!empty($addonSyncs)) {
                        $channels = $tenant->sync_channels ?? [];
                        foreach ($addonSyncs as $ch) {
                            if (!in_array($ch, $channels)) {
                                $channels[] = $ch;
                            }
                        }
                        $tenant->update(['sync_channels' => $channels]);

                        // 2026-07-04: WooCommerce is included in NO plan (seeder = '0'
                        // everywhere) — a purchased sync add-on must ALSO grant the
                        // per-tenant override, because PlanGate reads plan limits +
                        // tenant_plan_overrides, never sync_channels. Without this row,
                        // a paying add-on customer would still 403 on every Woo route.
                        if (in_array('woocommerce', $addonSyncs)) {
                            \Illuminate\Support\Facades\DB::table('tenant_plan_overrides')->updateOrInsert(
                                ['tenant_id' => $tenant->id, 'override_key' => 'woocommerce'],
                                [
                                    'override_value' => '1',
                                    'reason'         => 'Purchased WooCommerce sync add-on (Lemon Squeezy)',
                                    'updated_at'     => now(),
                                    'created_at'     => now(),
                                ]
                            );
                        }

                        // Unlock VenSynQ Command Center for any marketplace channel add-on
                        $marketplaces = array_intersect($addonSyncs, ['amazon', 'woocommerce', 'ebay', 'tiktok']);
                        if (!empty($marketplaces)) {
                            \Illuminate\Support\Facades\DB::table('tenant_plan_overrides')->updateOrInsert(
                                ['tenant_id' => $tenant->id, 'override_key' => 'vensync_command'],
                                [
                                    'override_value' => '1',
                                    'reason'         => 'Purchased sync add-on: ' . implode(', ', $marketplaces),
                                    'updated_at'     => now(),
                                    'created_at'     => now(),
                                ]
                            );
                        }
                    }
                    if ($aiStatus !== null) {
                        $tenant->update([
                            'ai_status'        => $aiStatus,
                            'ai_queries_limit' => $aiQueries,
                            'ai_pages_limit'   => $aiScans,
                        ]);

                        // 2026-07-04: Smart Capture ships as part of the AI add-on
                        // (managed tiers or $5 BYOK unlock — Pricing.jsx), included in
                        // NO base plan. Grant the gate key the same way, or paying AI
                        // customers hit PlanGate 403 on SmartCaptureController.
                        \Illuminate\Support\Facades\DB::table('tenant_plan_overrides')->updateOrInsert(
                            ['tenant_id' => $tenant->id, 'override_key' => 'smart_capture'],
                            [
                                'override_value' => '1',
                                'reason'         => "Purchased AI add-on ({$aiStatus}) via Lemon Squeezy",
                                'updated_at'     => now(),
                                'created_at'     => now(),
                            ]
                        );
                    }

                    // Overrides are cached for 5 minutes — flush so the entitlement
                    // is live immediately after purchase.
                    \App\Services\PlanRepository::invalidateTenantCache($tenant->id);
                    Log::info("ProvisionTenantJob: Provisioned add-on for tenant {$tenant->id}");
                }
            }
            return;
        }

        $plan           = $this->resolvePlan($variantId, $productName);

        // ── Idempotency check ────────────────────────────────────────
        if ($subscriptionId && Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->exists()) {
            Log::info("ProvisionTenantJob: subscription {$subscriptionId} already provisioned — skipping.");
            return;
        }

        DB::transaction(function () use ($email, $name, $plan, $orderId, $customerId, $subscriptionId, $tenantId, $lsStatus) {
            $user = null;
            $isNewUser = false;
            $password = null;

            $tenant = null;
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }

            if ($tenant) {
                // Update existing tenant. Status comes from Lemon Squeezy, not
                // from the assumption that a completed checkout means money
                // changed hands — a trialling variant completes checkout at $0.
                $tenant->update([
                    'plan'                          => $plan,
                    'status'                        => \App\Services\LemonSqueezyStatus::toTenantStatus($lsStatus, 'active'),
                    'lemon_squeezy_customer_id'     => $customerId,
                    'lemon_squeezy_subscription_id' => $subscriptionId,
                ]);

                // Try to find the owner user
                $ownerMembership = $tenant->ownerMembership()->first();
                if ($ownerMembership) {
                    $user = $ownerMembership->user;
                }
            } else {
                // ── Create or find the global user ──────────────────────
                if ($email) {
                    $password  = Str::random(12);
                    $user      = User::firstOrCreate(
                        ['email' => $email],
                        ['name'  => $name, 'password' => bcrypt($password)]
                    );
                    $isNewUser = $user->wasRecentlyCreated;
                }

                // ── Create the store ────────────────────────────────────
                $tenant = Tenant::create([
                    'name'                          => $name . "'s Store",
                    'slug'                          => \App\Services\SubdomainGenerator::generate($name),
                    'plan'                          => $plan,
                    'status'                        => \App\Services\LemonSqueezyStatus::toTenantStatus($lsStatus, 'active'),
                    'trial_ends_at'                 => now()->addDays(14),
                    'join_code'                     => $this->generateJoinCode(),
                    'currency_code'                 => 'USD',
                    'currency_symbol'               => '$',
                    'lemon_squeezy_customer_id'     => $customerId,
                    'lemon_squeezy_subscription_id' => $subscriptionId,
                ]);

                if ($user) {
                    // ── Make user the owner via pivot ───────────────────────
                    TenantUser::create([
                        'tenant_id' => $tenant->id,
                        'user_id'   => $user->id,
                        'role'      => 'owner',
                        'status'    => 'active',
                        'joined_at' => now(),
                    ]);
                }

                // ── Seed defaults ───────────────────────────────────────
                TenantDefaultSeeder::seedFor($tenant);
            }

            if ($user && $tenant) {
                // ── Create and consume the license ──────────────────────
                StoreLicense::create([
                    'user_id'          => $user->id,
                    'tenant_id'        => $tenant->id,
                    'type'             => 'subscription',
                    'status'           => 'consumed',
                    'plan'             => $plan,
                    'source'           => 'lemon_squeezy',
                    'source_reference' => $orderId ?? $subscriptionId,
                    'consumed_at'      => now(),
                ]);

                // ── Set last_store_id for instant redirect on login ─────
                $user->update(['last_store_id' => $tenant->id]);
            }

            // ── Create R2 storage folder ────────────────────────────
            if ($tenant) {
                try {
                    Storage::disk('r2')->makeDirectory("tenants/{$tenant->id}");
                } catch (\Throwable $e) {
                    Log::warning("ProvisionTenantJob: R2 folder creation failed for tenant {$tenant->id}: " . $e->getMessage());
                }
            }

            // ── Send welcome email ──────────────────────────────────
            if ($email && $user && !$tenantId) {
                try {
                    Mail::to($email)->queue(
                        new TenantWelcomeMail($tenant, $user, $isNewUser ? $password : null)
                    );
                } catch (\Throwable $e) {
                    Log::warning("ProvisionTenantJob: welcome email failed: " . $e->getMessage());
                }
            }

            Log::info("ProvisionTenantJob: provisioned/updated tenant {$tenant->id} ('{$tenant->name}') for " . ($email ?? 'unknown') . ".");
        });
    }

    private function resolvePlan(mixed $variantId, ?string $productName = null): string
    {
        $variantIdStr = $variantId !== null ? (string)$variantId : '';

        // Starter variants (Monthly, Annual)
        $starterVariants = [
            (string) config('services.lemon_squeezy.starter_variant_id'),
            (string) config('services.lemon_squeezy.starter_annual_variant_id'),
        ];
        if (in_array($variantIdStr, array_filter($starterVariants))) {
            return 'starter';
        }

        // Growth variants (Monthly, Annual)
        $growthVariants = [
            (string) config('services.lemon_squeezy.growth_variant_id'),
            (string) config('services.lemon_squeezy.growth_annual_variant_id'),
        ];
        if (in_array($variantIdStr, array_filter($growthVariants))) {
            return 'growth';
        }

        // Business/Enterprise variants (Monthly, Annual)
        $businessVariants = [
            (string) config('services.lemon_squeezy.business_variant_id'),
            (string) config('services.lemon_squeezy.business_annual_variant_id'),
        ];
        if (in_array($variantIdStr, array_filter($businessVariants))) {
            return 'business';
        }

        // LTD variants (map directly to ltd_1, ltd_2, ltd_3)
        if (config('services.lemon_squeezy.starter_ltd_variant_id') && $variantIdStr === (string) config('services.lemon_squeezy.starter_ltd_variant_id')) {
            return 'ltd_1';
        }
        if (config('services.lemon_squeezy.growth_ltd_variant_id') && $variantIdStr === (string) config('services.lemon_squeezy.growth_ltd_variant_id')) {
            return 'ltd_2';
        }
        if (config('services.lemon_squeezy.business_ltd_variant_id') && $variantIdStr === (string) config('services.lemon_squeezy.business_ltd_variant_id')) {
            return 'ltd_3';
        }

        if ($productName) {
            $normalizedName = strtolower($productName);
            // AppSumo/LTD fallback checks:
            if (str_contains($normalizedName, 'ltd solo') || str_contains($normalizedName, 'starter engine - ltd')) {
                return 'ltd_1';
            }
            if (str_contains($normalizedName, 'ltd growth') || str_contains($normalizedName, 'growth engine - ltd')) {
                return 'ltd_2';
            }
            if (str_contains($normalizedName, 'ltd pro') || str_contains($normalizedName, 'enterprise engine - ltd')) {
                return 'ltd_3';
            }
            if (str_contains($normalizedName, 'pro')) {
                return 'business';
            }
            if (str_contains($normalizedName, 'starter')) {
                return 'starter';
            }
            if (str_contains($normalizedName, 'growth')) {
                return 'growth';
            }
            if (str_contains($normalizedName, 'enterprise') || str_contains($normalizedName, 'business')) {
                return 'business';
            }
        }

        return 'starter';
    }

    private function generateJoinCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(4));
        } while (Tenant::where('join_code', $code)->exists());
        return $code;
    }
}
