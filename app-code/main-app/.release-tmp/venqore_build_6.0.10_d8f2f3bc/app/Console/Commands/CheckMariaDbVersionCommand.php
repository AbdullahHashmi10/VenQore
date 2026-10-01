<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckMariaDbVersionCommand extends Command
{
    protected $signature = 'venqore:audit-database';
    protected $description = 'Audit running MariaDB / MySQL version, collation safety, and SKIP LOCKED support';

    public function handle(): int
    {
        $this->info("Running VenQore Database Infrastructure Audit...");

        try {
            $versionResult = DB::selectOne("SELECT VERSION() as version");
            $version = $versionResult ? $versionResult->version : 'Unknown';

            $isMariaDb = str_contains(strtolower($version), 'mariadb');
            preg_match('/(\d+\.\d+\.\d+)/', $version, $matches);
            $numericVersion = $matches[1] ?? '0.0.0';

            $isVersionSupported = false;
            if ($isMariaDb) {
                // MariaDB 10.11+ LTS recommended (10.5 reached EOL June 2025)
                $isVersionSupported = version_compare($numericVersion, '10.5.0', '>=');
            } else {
                // MySQL 8.0+
                $isVersionSupported = version_compare($numericVersion, '8.0.0', '>=');
            }

            // Collation Audit
            $collationResult = DB::selectOne("SELECT @@collation_database as collation");
            $collation = $collationResult ? $collationResult->collation : 'Unknown';

            // SKIP LOCKED Audit capability
            $supportsSkipLocked = version_compare($numericVersion, '10.6.0', '>=') || (! $isMariaDb && version_compare($numericVersion, '8.0.0', '>='));

            $this->table(
                ['Audit Metric', 'Value', 'Status'],
                [
                    ['Database Engine', $isMariaDb ? 'MariaDB' : 'MySQL', 'INFO'],
                    ['Server Version', $version, $isVersionSupported ? 'PASS' : 'WARN (EOL)'],
                    ['Database Collation', $collation, str_contains(strtolower($collation), 'utf8') ? 'PASS' : 'WARN'],
                    ['SKIP LOCKED Support', $supportsSkipLocked ? 'Supported' : 'Fallback Mode', 'INFO'],
                ]
            );

            $this->info("Database audit completed successfully.");
            return 0;
        } catch (\Throwable $e) {
            $this->error("Database audit failed: " . $e->getMessage());
            return 1;
        }
    }
}
