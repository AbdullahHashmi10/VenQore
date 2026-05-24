<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

/**
 * Import Mapping Redirect Verification Test
 *
 * Verifies that processImport redirect correctly resolves the tenant-scoped store.admin.data route
 * and supplies the mandatory store_slug parameter, preventing 500 crashes at the end of imports.
 *
 * Usage:
 *   php artisan test --filter=ImportMappingTest
 */
class ImportMappingTest extends VenQoreTestCase
{
    /** @test */
    public function redirect_uses_store_admin_data_with_store_slug_on_failed_expired_file(): void
    {
        $tenant = $this->createTenant('test-store-slug');
        $user = $this->createTenantUser($tenant, 'owner');

        // Request with a non-existent file path
        $response = $this->actingAs($user)
            ->withTenant($tenant)
            ->post("/s/{$tenant->slug}/admin-panel/data/process-import", [
                'file_path' => 'temp_imports/non_existent_file.xlsx',
                'type' => 'products',
                'mapping' => ['name' => 0],
            ]);

        // Assert it redirects to the tenant-scoped route instead of crashing with a 500 error
        $response->assertRedirect(route('store.admin.data', ['store_slug' => $tenant->slug]));
        $response->assertSessionHas('error', 'Temporary file expired or not found. Please upload again.');
    }
}
