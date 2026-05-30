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
        $variantId      = data_get($this->payload, 'data.attributes.variant_id') ?? data_get($this->payload, 'variant_id') ?? data_get($this->payload, 'attributes.variant_id');
        $productName    = data_get($this->payload, 'data.attributes.product_name') ?? data_get($this->payload, 'product_name') ?? data_get($this->payload, 'attributes.product_name');
        $orderId        = data_get($this->payload, 'data.attributes.order_id') ?? data_get($this->payload, 'order_id') ?? data_get($this->payload, 'attributes.order_id');
        $customerId     = data_get($this->payload, 'data.attributes.customer_id') ?? data_get($this->payload, 'customer_id') ?? data_get($this->payload, 'attributes.customer_id');
        $subscriptionId = data_get($this->payload, 'data.attributes.subscription_id') ?? data_get($this->payload, 'subscription_id') ?? data_get($this->payload, 'attributes.subscription_id') ?? data_get($this->payload, 'data.id');

        $tenantId       = data_get($this->payload, 'meta.custom_data.tenant_id') ?? data_get($this->payload, 'custom_data.tenant_id');

        $plan           = $this->resolvePlan($variantId, $productName);

        // ── Idempotency check ────────────────────────────────────────
        if ($subscriptionId && Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->exists()) {
            Log::info("ProvisionTenantJob: subscription {$subscriptionId} already provisioned — skipping.");
            return;
        }

        DB::transaction(function () use ($email, $name, $plan, $orderId, $customerId, $subscriptionId, $tenantId) {
            $user = null;
            $isNewUser = false;
            $password = null;

            $tenant = null;
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }

            if ($tenant) {
                // Update existing tenant
                $tenant->update([
                    'plan'                          => $plan,
                    'status'                        => 'active',
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
                    'status'                        => 'active',
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

        if (config('services.lemon_squeezy.starter_variant_id') && $variantIdStr === (string)config('services.lemon_squeezy.starter_variant_id')) {
            return 'starter';
        }
        if (config('services.lemon_squeezy.growth_variant_id') && $variantIdStr === (string)config('services.lemon_squeezy.growth_variant_id')) {
            return 'growth';
        }
        if (config('services.lemon_squeezy.business_variant_id') && $variantIdStr === (string)config('services.lemon_squeezy.business_variant_id')) {
            return 'business';
        }

        if ($productName) {
            $normalizedName = strtolower($productName);
            if (str_contains($normalizedName, 'pro')) {
                return 'pro';
            }
            if (str_contains($normalizedName, 'starter')) {
                return 'starter';
            }
            if (str_contains($normalizedName, 'growth')) {
                return 'growth';
            }
            if (str_contains($normalizedName, 'business')) {
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
