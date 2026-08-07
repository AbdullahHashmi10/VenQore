<?php

namespace App\Console\Commands;

use App\Models\AppSumoCode;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * ImportAppSumoCodes — Phase 7
 *
 * Bulk-imports AppSumo-issued codes from a CSV file into the database.
 *
 * Usage:
 *   php artisan appsumo:import-codes /path/to/codes.csv
 *   php artisan appsumo:import-codes /path/to/codes.csv --campaign=appsumo-launch-2025
 *
 * CSV format (one code per line, or with header):
 *   code
 *   VENQ-AB1C-D2EF
 *   VENQ-GH3I-J4KL
 *   ...
 *
 * AppSumo sends the CSV to you via their seller dashboard after each
 * campaign batch (typically daily during the campaign period).
 *
 * The command is idempotent — running it twice with the same CSV is safe
 * (duplicate codes are skipped via firstOrCreate).
 */
class ImportAppSumoCodes extends Command
{
    protected $signature = 'appsumo:import-codes
        {file : Absolute path to the CSV file}
        {--campaign=appsumo-2025 : Campaign name to tag these codes with}
        {--dry-run : Preview import without saving}';

    protected $description = 'Import AppSumo LTD codes from a CSV file into the database.';

    public function handle(): int
    {
        $filePath = $this->argument('file');
        $campaign = $this->option('campaign');
        $dryRun   = $this->option('dry-run');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return self::FAILURE;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            $this->warn('CSV file is empty.');
            return self::SUCCESS;
        }

        // Remove header row if present
        if (strtolower(trim($lines[0])) === 'code') {
            array_shift($lines);
        }

        $imported  = 0;
        $skipped   = 0;
        $invalid   = 0;

        $this->info("Processing " . count($lines) . " lines from: {$filePath}");
        if ($dryRun) {
            $this->warn('DRY RUN — nothing will be saved.');
        }

        $bar = $this->output->createProgressBar(count($lines));
        $bar->start();

        foreach ($lines as $line) {
            $code = strtoupper(trim($line));

            // Basic validation: must be 6-32 chars, alphanumeric/dashes
            if (!preg_match('/^[A-Z0-9\-]{6,32}$/', $code)) {
                $invalid++;
                $bar->advance();
                continue;
            }

            if (!$dryRun) {
                $existing = AppSumoCode::where('code', $code)->exists();

                if ($existing) {
                    $skipped++;
                } else {
                    AppSumoCode::create([
                        'code'     => $code,
                        'campaign' => $campaign,
                        'status'   => 'issued',
                    ]);
                    $imported++;
                }
            } else {
                $imported++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(['Metric', 'Count'], [
            ['Imported',  $dryRun ? "{$imported} (dry-run)" : $imported],
            ['Skipped (duplicates)', $skipped],
            ['Invalid / skipped', $invalid],
            ['Campaign', $campaign],
        ]);

        if (!$dryRun) {
            $this->info("✅ Import complete. Total issued codes: " . AppSumoCode::issued()->count());
        }

        return self::SUCCESS;
    }
}
