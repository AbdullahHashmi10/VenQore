<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SuperAdminSeederTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_explicitly_elevates_the_known_platform_account(): void
    {
        $this->seed(SuperAdminSeeder::class);

        $user = User::where('email', 'platform@venqore.com')->firstOrFail();

        $this->assertTrue($user->is_platform_admin);
        $this->assertSame('platform_owner', $user->platform_role);
    }
}
