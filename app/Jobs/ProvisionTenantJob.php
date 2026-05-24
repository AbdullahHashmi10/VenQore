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
        $email          = $this->payload['user_email'];
        $name           = $this->payload['user_name'];
        $plan           = $this->resolvePlan($this->payload['variant_id']);
        $orderId        = $this->payload['order_id'];
        $customerId     = $this->payload['customer_id'];
        $subscriptionId = $this->payload['subscription_id'];

        // ── Idempotency check ────────────────────────────────────────
        if (Tenant::where('lemon_squeezy_subscription_id', $subscriptionId)->exists()) {
            Log::info("ProvisionTenantJob: subscription {$subscriptionId} already provisioned — skipping.");
            return;
        }

        DB::transaction(function () use ($email, $name, $plan, $orderId, $customerId, $subscriptionId) {
            // ── Create or find the global user ──────────────────────
            $password  = Str::random(12);
            $user      = User::firstOrCreate(
                ['email' => $email],
                ['name'  => $name, 'password' => bcrypt($password)]
            );
            $isNewUser = $user->wasRecentlyCreated;

            // ── Create the store ────────────────────────────────────
            $tenant = Tenant::create([
                'name'                          => $name . "'s Store",
                'slug'                          => \App\Services\SubdomainGenerator::generate($name),
                'plan'                          => $plan,
                'status'                        => 'trial',
                'trial_ends_at'                 => now()->addDays(14),
                'join_code'                     => $this->generateJoinCode(),
                'currency_code'                 => 'USD',
                'currency_symbol'               => '$',
                'lemon_squeezy_customer_id'     => $customerId,
                'lemon_squeezy_subscription_id' => $subscriptionId,
            ]);

            // ── Make user the owner via pivot ───────────────────────
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id'   => $user->id,
                'role'      => 'owner',
                'status'    => 'active',
                'joined_at' => now(),
            ]);

            // ── Create and consume the license ──────────────────────
            StoreLicense::create([
                'user_id'          => $user->id,
                'tenant_id'        => $tenant->id,
                'type'             => 'subscription',
                'status'           => 'consumed',
                'plan'             => $plan,
                'source'           => 'lemon_squeezy',
                'source_reference' => $orderId,
                'consumed_at'      => now(),
            ]);

            // ── Set last_store_id for instant redirect on login ─────
            $user->update(['last_store_id' => $tenant->id]);

            // ── Seed defaults ───────────────────────────────────────
            TenantDefaultSeeder::seedFor($tenant);

            // ── Create R2 storage folder ────────────────────────────
            try {
                Storage::disk('r2')->makeDirectory("tenants/{$tenant->id}");
            } catch (\Throwable $e) {
                Log::warning("ProvisionTenantJob: R2 folder creation failed for tenant {$tenant->id}: " . $e->getMessage());
            }

            // ── Send welcome email ──────────────────────────────────
            Mail::to($email)->queue(
                new TenantWelcomeMail($tenant, $user, $isNewUser ? $password : null)
            );

            Log::info("ProvisionTenantJob: provisioned tenant {$tenant->id} ('{$tenant->name}') for {$email}.");
        });
    }

    private function resolvePlan(string $variantId): string
    {
        return match($variantId) {
            config('services.lemon_squeezy.starter_variant')  => 'starter',
            config('services.lemon_squeezy.growth_variant')   => 'growth',
            config('services.lemon_squeezy.business_variant') => 'business',
            default                                            => 'starter',
        };
    }

    private function generateJoinCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(4));
        } while (Tenant::where('join_code', $code)->exists());
        return $code;
    }
}
