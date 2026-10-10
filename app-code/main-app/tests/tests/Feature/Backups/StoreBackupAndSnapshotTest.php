<?php

namespace Tests\Feature\Backups;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Data Management → Full System: the store backup (.vq) downloads and
 * decrypts to the same shape restore reads; the server snapshot is refused
 * to a store owner with a clear message, and for the platform owner it is
 * written, listed and downloadable.
 */
class StoreBackupAndSnapshotTest extends VenQoreTestCase
{
    public function test_store_backup_downloads_and_decrypts_with_only_this_stores_rows(): void
    {
        $tenant = $this->createTenant('bk-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $other = $this->createTenant('bk2-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        // A value with a broken UTF-8 byte used to make json_encode fail → 500.
        DB::table('settings')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $tenant->id, 'key' => 'bk_bad_utf8', 'value' => "caf\xC3", 'created_at' => now(), 'updated_at' => now()]);

        $res = $this->get($this->storeUrl($tenant, '/backup/export'));
        $res->assertOk();
        $data = json_decode(Crypt::decryptString($res->streamedContent()), true);
        $this->assertIsArray($data);
        $this->assertSame($tenant->id, $data['__vq_meta']['tenant_id']);
        $this->assertNotEmpty($data['accounts']);
        foreach ($data['accounts'] as $row) {
            $this->assertEquals($tenant->id, $row['tenant_id']);
        }
        $this->assertNotEquals($other->id, $data['accounts'][0]['tenant_id']);
        $this->assertContains('bk_bad_utf8', array_column($data['settings'], 'key'));
    }

    public function test_a_store_owner_cannot_snapshot_the_whole_server_and_is_told_why(): void
    {
        $tenant = $this->createTenant('sn-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->actingAsTenantUserModel($this->createTenantUser($tenant, 'owner'), $tenant);
        Storage::fake('local');
        $res = $this->postJson($this->storeUrl($tenant, '/admin-panel/backups'));
        $res->assertStatus(403)->assertJsonFragment(['success' => false]);
        $this->assertStringContainsString('Full System Backup', $res->json('message'));
        $this->assertSame([], Storage::disk('local')->files('backups'));
    }

    public function test_the_platform_owner_snapshot_is_written_and_downloadable(): void
    {
        $tenant = $this->createTenant('sn2-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $admin = $this->createTenantUser($tenant, 'owner');
        $admin->forceFill(['is_platform_admin' => true])->save();
        $this->actingAsTenantUserModel($admin, $tenant);
        Storage::fake('local');

        $res = $this->postJson($this->storeUrl($tenant, '/admin-panel/backups'));
        $res->assertOk()->assertJsonFragment(['success' => true]);
        $file = $res->json('filename');
        $this->assertTrue(Storage::disk('local')->exists('backups/' . $file));
        $sql = Storage::disk('local')->get('backups/' . $file);
        $this->assertStringContainsString('CREATE TABLE `tenants`', $sql);
        $this->assertStringContainsString('SET FOREIGN_KEY_CHECKS=1;', $sql);

        $this->get($this->storeUrl($tenant, '/admin-panel/backups/download/' . $file))->assertOk();
    }
}
