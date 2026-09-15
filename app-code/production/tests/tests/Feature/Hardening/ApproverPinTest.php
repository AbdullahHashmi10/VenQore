<?php

namespace Tests\Feature\Hardening;

use App\Engines\AccountingService;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * Verified approvals for fiscal year close and cash shortage (2026-09-10).
 *
 * Both endpoints used to accept any qualifying approver's id without a PIN, so
 * the logged-in user could book the action "approved" by someone who never saw
 * it. They now go through App\Support\ManagerApproval: the approver must be an
 * active member of THIS store with a qualifying role, and must supply their
 * action PIN unless they are the logged-in user.
 *
 * Also: the owner's daily pulse is never read as an arbitrary user.
 */
class ApproverPinTest extends VenQoreTestCase
{
    private const OWNER_PIN   = '111111';
    private const ADMIN_PIN   = '222222';
    private const MANAGER_PIN = '333333';
    private const CASHIER_PIN = '444444';

    private Tenant $tenant;
    private Tenant $other;
    private User $owner;
    private User $admin;
    private User $manager;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->other  = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->seedTenantDefaults($this->other);
        $this->seedTenantDefaults($this->tenant);

        $this->owner   = $this->member($this->tenant, 'owner', self::OWNER_PIN);
        $this->admin   = $this->member($this->tenant, 'admin', self::ADMIN_PIN);
        $this->manager = $this->member($this->tenant, 'manager', self::MANAGER_PIN);
        $this->cashier = $this->member($this->tenant, 'cashier', self::CASHIER_PIN);

        $this->actingAsTenantUserModel($this->owner, $this->tenant);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Fiscal year close — owner/admin only, PIN when not self
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function fiscal_close_by_another_admin_requires_that_admins_pin(): void
    {
        $this->seedProfit();
        $close = fn (array $extra) => $this->postJson($this->v3('fiscal-year/close'),
            ['fiscal_year_end' => now()->toDateString(), 'approved_by' => $this->admin->id] + $extra);

        // Missing, empty and wrong PIN — refused.
        $close([])->assertSessionHasErrors('approved_by');
        $close(['approval_pin' => ''])->assertSessionHasErrors('approved_by');
        $close(['approval_pin' => '000000'])->assertSessionHasErrors('approved_by');
        // Somebody else's PIN (the logged-in owner's) — refused.
        $close(['approval_pin' => self::OWNER_PIN])->assertSessionHasErrors('approved_by');
        $this->assertSame(0, $this->closeCount());

        // The admin's own PIN — posts, recorded as approved by the admin.
        $close(['approval_pin' => self::ADMIN_PIN])->assertSessionHasNoErrors();
        $this->assertSame(1, $this->closeCount());
        $je = $this->entry('fiscal_year_close');
        $this->assertSame((string) $this->admin->id, (string) $je->approved_by);
        $this->assertSame((string) $this->owner->id, (string) $je->user_id);
    }

    #[Test]
    public function fiscal_close_refuses_managers_cashiers_and_other_stores_admins_even_with_their_pin(): void
    {
        $this->seedProfit();
        $foreignAdmin = $this->member($this->other, 'admin', self::ADMIN_PIN);

        foreach ([[$this->manager, self::MANAGER_PIN], [$this->cashier, self::CASHIER_PIN], [$foreignAdmin, self::ADMIN_PIN]] as [$approver, $pin]) {
            $this->postJson($this->v3('fiscal-year/close'), [
                'fiscal_year_end' => now()->toDateString(), 'approved_by' => $approver->id, 'approval_pin' => $pin,
            ])->assertSessionHasErrors('approved_by');
        }

        // A manager logged in, approving their own close — still not allowed
        // (refused by the route permission or by the approval role check).
        $this->actingAsTenantUserModel($this->manager, $this->tenant);
        $response = $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => now()->toDateString(), 'approved_by' => $this->manager->id,
        ]);
        $this->assertContains($response->status(), [302, 403], 'A manager may not approve a fiscal close, not even their own.');

        $this->assertSame(0, DB::table('journal_entries')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])
            ->where('reference_type', 'fiscal_year_close')->count());
    }

    #[Test]
    public function fiscal_close_self_approval_by_the_owner_needs_no_pin(): void
    {
        $this->seedProfit();

        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => now()->toDateString(), 'approved_by' => $this->owner->id,
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, $this->closeCount());
        $this->assertSame((string) $this->owner->id, (string) $this->entry('fiscal_year_close')->approved_by);
    }

    #[Test]
    public function fiscal_close_self_approval_by_an_admin_needs_no_pin(): void
    {
        $this->seedProfit();
        $this->actingAsTenantUserModel($this->admin, $this->tenant);

        $this->postJson($this->v3('fiscal-year/close'), [
            'fiscal_year_end' => now()->toDateString(), 'approved_by' => $this->admin->id,
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, $this->closeCount());
        $this->assertSame((string) $this->admin->id, (string) $this->entry('fiscal_year_close')->approved_by);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Cash shortage — owner/admin/manager, PIN when not self
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function cash_shortage_logged_by_a_cashier_needs_the_managers_pin(): void
    {
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $shortage = fn (array $extra) => $this->post($this->v3('cash-shortages'), [
            'amount' => 75.00, 'shortage_date' => now()->toDateString(),
            'narration' => 'Till short by 75 at evening close', 'approved_by' => (string) $this->manager->id,
        ] + $extra);

        $shortage([])->assertSessionHasErrors('approved_by');
        $shortage(['approval_pin' => '000000'])->assertSessionHasErrors('approved_by');
        $shortage(['approval_pin' => self::CASHIER_PIN])->assertSessionHasErrors('approved_by');
        $this->assertSame(0, $this->shortageCount());

        $shortage(['approval_pin' => self::MANAGER_PIN])->assertSessionHasNoErrors();
        $this->assertSame(1, $this->shortageCount());
        $je = $this->entry('cash_shortage');
        $this->assertSame((string) $this->manager->id, (string) $je->approved_by);
        $this->assertSame((string) $this->cashier->id, (string) $je->user_id);
    }

    #[Test]
    public function cash_shortage_refuses_cashiers_and_other_stores_managers(): void
    {
        $foreignManager = $this->member($this->other, 'manager', self::MANAGER_PIN);
        $payload = fn (User $approver, ?string $pin) => [
            'amount' => 20.00, 'shortage_date' => now()->toDateString(),
            'narration' => 'Till short by 20 at evening close', 'approved_by' => (string) $approver->id, 'approval_pin' => $pin,
        ];

        // The cashier approving their own shortage — no PIN needed to be refused.
        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
        $this->post($this->v3('cash-shortages'), $payload($this->cashier, null))->assertSessionHasErrors('approved_by');
        $this->post($this->v3('cash-shortages'), $payload($this->cashier, self::CASHIER_PIN))->assertSessionHasErrors('approved_by');
        // A manager of ANOTHER store, with their correct PIN.
        $this->post($this->v3('cash-shortages'), $payload($foreignManager, self::MANAGER_PIN))->assertSessionHasErrors('approved_by');

        $this->assertSame(0, DB::table('journal_entries')->whereIn('tenant_id', [$this->tenant->id, $this->other->id])
            ->where('reference_type', 'cash_shortage')->count());
    }

    #[Test]
    public function cash_shortage_self_approval_by_owner_admin_or_manager_needs_no_pin(): void
    {
        foreach ([$this->owner, $this->admin, $this->manager] as $i => $approver) {
            $this->actingAsTenantUserModel($approver, $this->tenant);
            $this->post($this->v3('cash-shortages'), [
                'amount' => 10.00, 'shortage_date' => now()->toDateString(),
                'narration' => 'Counted short at shift change', 'approved_by' => (string) $approver->id,
            ])->assertSessionHasNoErrors();
            $this->assertSame($i + 1, $this->shortageCount());
        }

        $this->assertEqualsCanonicalizing(
            [(string) $this->owner->id, (string) $this->admin->id, (string) $this->manager->id],
            DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'cash_shortage')
                ->pluck('approved_by')->map(fn ($v) => (string) $v)->all()
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // Owner's daily pulse — never read as an arbitrary user
    // ═══════════════════════════════════════════════════════════════════

    #[Test]
    public function daily_pulse_skips_a_store_without_active_members(): void
    {
        $empty = Tenant::factory()->create(['plan' => 'ltd_3', 'status' => 'active', 'trial_ends_at' => null]);
        $this->seedTenantDefaults($empty);
        // Only a suspended member — nobody to read the pulse as.
        $this->member($empty, 'owner');
        DB::table('tenant_users')->where('tenant_id', $empty->id)->update(['status' => 'suspended']);

        try {
            app(\App\Services\OwnerDailyPulseService::class)->captureSnapshot($empty, now()->toDateString());
            $this->fail('A store with no active member must be skipped, not read as User::first().');
        } catch (\App\Exceptions\DailyPulseSkippedException $e) {
            $this->assertStringContainsString((string) $empty->id, $e->getMessage());
        }
        $this->assertSame(0, DB::table('daily_snapshots')->where('tenant_id', $empty->id)->count());

        // The snapshot command carries on past it (and still captures a store that has members).
        $this->artisan('owner:create-daily-snapshots', ['--tenant' => $empty->id])->assertExitCode(0);
        $this->assertSame(0, DB::table('daily_snapshots')->where('tenant_id', $empty->id)->count());

        $this->artisan('owner:create-daily-snapshots', ['--tenant' => $this->tenant->id])->assertExitCode(0);
        $this->assertSame(1, DB::table('daily_snapshots')->where('tenant_id', $this->tenant->id)->count());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function seedProfit(): void
    {
        $accounting = app(AccountingService::class);
        $accounting->getAccountByCode('3100', 'Retained Earnings', 'equity');
        $accounting->createEntry([
            'date' => now()->toDateString(), 'reference_type' => 'manual', 'reference' => 'FY-PIN',
            'description' => 'Cash sale',
        ], [
            ['account_code' => '1000', 'debit' => 400.00, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => 400.00],
        ]);
    }

    private function closeCount(): int
    {
        return DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'fiscal_year_close')->count();
    }

    private function shortageCount(): int
    {
        return DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'cash_shortage')->count();
    }

    private function entry(string $type): object
    {
        return DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', $type)->first();
    }

    private function v3(string $path): string
    {
        return "/s/{$this->tenant->slug}/v3/{$path}";
    }

    private function member(Tenant $tenant, string $role, ?string $pin = null): User
    {
        $user = User::factory()->create(['last_store_id' => $tenant->id]);
        TenantUser::create([
            'tenant_id' => $tenant->id, 'user_id' => $user->id, 'role' => $role, 'status' => 'active',
            'display_name' => $user->name, 'joined_at' => now(),
            'security_pin' => $pin ? Hash::make($pin) : null,
        ]);
        return $user;
    }
}
