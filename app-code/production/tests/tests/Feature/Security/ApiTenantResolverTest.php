<?php

namespace Tests\Feature\Security;

use App\Http\Middleware\ApiTenantResolver;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ApiTenantResolverTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_does_not_bind_a_tenant_for_a_suspended_member(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['last_store_id' => $tenant->id]);
        TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'cashier',
            'status' => 'suspended',
        ]);

        app()->forgetInstance('current.tenant');
        app()->forgetInstance('current.membership');

        $request = Request::create('/api/reckoner/catalogue');
        $request->setUserResolver(fn () => $user);

        app(ApiTenantResolver::class)->handle($request, fn () => response('ok'));

        $this->assertFalse(app()->bound('current.tenant'));
        $this->assertFalse(app()->bound('current.membership'));
    }

    #[Test]
    public function it_binds_a_tenant_only_after_active_membership_is_proven(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->create(['last_store_id' => $tenant->id]);
        $membership = TenantUser::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'role' => 'cashier',
            'status' => 'active',
        ]);

        app()->forgetInstance('current.tenant');
        app()->forgetInstance('current.membership');

        $request = Request::create('/api/reckoner/catalogue');
        $request->setUserResolver(fn () => $user);

        app(ApiTenantResolver::class)->handle($request, fn () => response('ok'));

        $this->assertTrue(app()->bound('current.tenant'));
        $this->assertTrue(app()->bound('current.membership'));
        $this->assertTrue(app('current.tenant')->is($tenant));
        $this->assertTrue(app('current.membership')->is($membership));
    }
}
