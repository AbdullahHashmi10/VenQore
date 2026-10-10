<?php

namespace App\Console\Commands;

use App\Services\Vena\ManifestBuilder;
use App\Services\Vena\VenaKnowledge;
use Illuminate\Console\Command;

/**
 * Generates the VenQore system manifest — the machine-readable map of what this
 * system can do, for Vena to answer "where is X / how do I Y" without reading code.
 *
 * ── Two rules this file exists to enforce ───────────────────────────────────
 *
 * 1. GENERATED, NEVER HAND-EDITED. Every hand-maintained second copy of a truth
 *    in this codebase has drifted. The manifest is a build artifact built by
 *    App\Services\Vena\ManifestBuilder from the real registries (modules, routes,
 *    Reckoner, dashboard cards) plus the procedures in config/vena_guides.php.
 *    If it is wrong, fix the registry, not the manifest.
 *
 * 2. RETRIEVED, NEVER PROMPT-STUFFED. Vena (App\Services\Vena\VenaKnowledge)
 *    searches these entries and pulls the few it needs. Never send the whole
 *    manifest to a model.
 *
 * Vena does NOT depend on this file being present: VenaKnowledge builds the same
 * entries in memory (cached per deploy) when it is missing or old. Running this
 * command writes the JSON for tooling/CI and clears Vena's cached index.
 *
 * Usage:
 *   php artisan venqore:manifest              # write storage/app/system-manifest.json
 *   php artisan venqore:manifest --check      # exit 1 if the written file is stale (CI)
 *   php artisan venqore:manifest --pretty     # human-readable output
 */
class GenerateSystemManifest extends Command
{
    protected $signature = 'venqore:manifest
                            {--check : Exit non-zero if the on-disk manifest is stale}
                            {--pretty : Pretty-print the JSON}';

    protected $description = 'Generate the system manifest Vena uses to answer questions about the product';

    private const PATH = 'system-manifest.json';

    public function handle(): int
    {
        $built = ManifestBuilder::build();
        $entries = $built['entries'];

        foreach ($built['counts'] as $label => $count) {
            $this->line(sprintf('  %-9s %d entries', $label, $count));
        }
        foreach ($built['warnings'] as $warning) {
            $this->warn("  {$warning}");
        }

        // Content hash excludes generated_at so an unchanged system produces a
        // stable hash — that is what makes --check meaningful.
        $payload = [
            'schema_version' => 2,
            'entry_count'    => count($entries),
            'content_hash'   => hash('sha256', json_encode($entries)),
            'entries'        => $entries,
        ];

        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            | ($this->option('pretty') ? JSON_PRETTY_PRINT : 0);

        $json = json_encode($payload, $flags);
        $disk = storage_path('app/' . self::PATH);

        if ($this->option('check')) {
            if (! file_exists($disk)) {
                $this->error('Manifest missing. Run: php artisan venqore:manifest');
                return self::FAILURE;
            }
            $existing = json_decode((string) file_get_contents($disk), true);
            if (($existing['content_hash'] ?? null) !== $payload['content_hash']) {
                $this->error('Manifest is STALE — the registries changed since it was generated.');
                $this->line('Run: php artisan venqore:manifest');
                return self::FAILURE;
            }
            $this->info("Manifest is current ({$payload['entry_count']} entries).");
            return self::SUCCESS;
        }

        // generated_at is written to disk but deliberately not hashed.
        $payload['generated_at'] = now()->toIso8601String();
        file_put_contents($disk, json_encode($payload, $flags));

        // Vena's runtime index is keyed to the source files; clear the in-process
        // copy so a long-lived worker (Octane/queue) picks the new build up.
        VenaKnowledge::flush();

        $this->info("Wrote {$payload['entry_count']} entries to storage/app/" . self::PATH);
        return self::SUCCESS;
    }
}
