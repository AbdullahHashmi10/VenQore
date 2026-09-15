<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;

/**
 * The manifest is a build artifact. This test is the thing that stops it from
 * rotting into a second, lying copy of the registries — the failure mode that
 * produced the dead config/ai_models.php and the 108-vs-25 V6 catalog.
 *
 * If this fails, do NOT edit the manifest. Run:  php artisan venqore:manifest
 */
class SystemManifestTest extends VenQoreTestCase
{
    public function test_manifest_is_not_stale(): void
    {
        $exit = Artisan::call('venqore:manifest', ['--check' => true]);

        $this->assertSame(
            0,
            $exit,
            "The system manifest is stale or missing.\n"
            . "Registries changed without regenerating it.\n"
            . "Fix: php artisan venqore:manifest\n\n"
            . Artisan::output()
        );
    }

    public function test_every_manifest_reading_actually_computes(): void
    {
        Artisan::call('venqore:manifest');
        $manifest = json_decode((string) file_get_contents(storage_path('app/system-manifest.json')), true);

        $bad = [];
        foreach ($manifest['entries'] as $entry) {
            if ($entry['type'] !== 'reading') {
                continue;
            }
            if (! \App\Reckoner\ReckonerRegistry::exists($entry['id'])) {
                $bad[] = $entry['id'];
            }
        }

        $this->assertEmpty(
            $bad,
            'Manifest advertises readings the Reckoner cannot compute: ' . implode(', ', $bad)
        );
    }

    public function test_entries_are_retrieval_sized_not_prompt_dumps(): void
    {
        Artisan::call('venqore:manifest');
        $manifest = json_decode((string) file_get_contents(storage_path('app/system-manifest.json')), true);

        // Entries are meant to be retrieved a few at a time. An oversized entry
        // means someone started inlining data that belongs behind a Reckoner call.
        $oversized = [];
        foreach ($manifest['entries'] as $entry) {
            if (strlen($entry['text']) > 600) {
                $oversized[] = $entry['id'] . ' (' . strlen($entry['text']) . ' chars)';
            }
        }

        $this->assertEmpty(
            $oversized,
            "Manifest entries must stay small enough to retrieve individually:\n"
            . implode("\n", $oversized)
        );
    }

    public function test_manifest_contains_no_tenant_data(): void
    {
        Artisan::call('venqore:manifest');
        $raw = (string) file_get_contents(storage_path('app/system-manifest.json'));

        // The manifest describes CAPABILITIES, never a tenant's numbers. If a
        // figure or a customer name ever lands here it would be served to every
        // tenant that queries it.
        foreach (['tenant_id', 'PKR ', 'customer_name', 'party_id'] as $forbidden) {
            $this->assertStringNotContainsString(
                $forbidden,
                $raw,
                "Manifest must not contain tenant data — found '{$forbidden}'."
            );
        }
    }
}
