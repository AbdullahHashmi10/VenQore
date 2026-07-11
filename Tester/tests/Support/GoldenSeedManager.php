<?php

namespace Tests\Support;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * GoldenSeedManager — the single sanctioned way test infrastructure seeds
 * the Golden Company reference dataset. (Blueprint Phase A, closes F-03/FC-5.)
 *
 * GUARANTEES
 *  1. Seeding always happens OUTSIDE any database transaction. If called at
 *     transaction level > 0 it throws — it never silently commits a test's
 *     wrapper transaction (the old ensureSeeded() hack did exactly that).
 *  2. Seeding happens at most once per dataset per database state, guarded by
 *     a checksum sentinel stored in `verification_seed_state`. The sentinel
 *     table is dropped by migrate:fresh together with the data it describes,
 *     so the checksum can never describe data that no longer exists.
 *  3. If seeded data exists but the spec/seeder checksum has changed, it FAILS
 *     LOUDLY instead of running tests against a stale dataset.
 *
 * Called from VenQoreTestCase::refreshTestDatabase() — after migrate:fresh,
 * before beginDatabaseTransaction() — for tests marked RequiresGoldenCompany.
 */
final class GoldenSeedManager
{
    public const GOLDEN_TENANT_ID = '999991';

    /** @var array<string,bool> per-process fast path, keyed by dataset */
    private static array $verified = [];

    /**
     * Datasets this manager can provision.
     * checksum_inputs are hashed together; a change in any of them
     * invalidates previously-seeded data.
     */
    private const DATASETS = [
        'golden_company' => [
            'seeder'          => 'GoldenCompanySeeder',
            'sentinel_tenant' => self::GOLDEN_TENANT_ID,
            'checksum_inputs' => [
                'verification/golden_company/spec.yaml',
                'database/seeders/GoldenCompanySeeder.php',
            ],
        ],
    ];

    public static function ensureSeeded(string $dataset = 'golden_company'): void
    {
        if (self::$verified[$dataset] ?? false) {
            return;
        }

        if (!isset(self::DATASETS[$dataset])) {
            throw new RuntimeException("GoldenSeedManager: unknown dataset '{$dataset}'.");
        }

        $config = self::DATASETS[$dataset];

        // GUARANTEE 1 — never inside a transaction. Seeded reference data must
        // survive per-test rollbacks; committing someone else's transaction to
        // achieve that is the F-03 anti-pattern this class exists to kill.
        $level = DB::connection()->transactionLevel();
        if ($level > 0) {
            throw new RuntimeException(
                "GoldenSeedManager::ensureSeeded('{$dataset}') called at transaction level {$level}. " .
                'Seeding must run before beginDatabaseTransaction(). Implement Tests\\Support\\RequiresGoldenCompany ' .
                'on the test class instead of calling seeders from setUp().'
            );
        }

        self::ensureStateTable();

        $expected = self::checksum($config['checksum_inputs']);
        $stored   = DB::table('verification_seed_state')->where('dataset', $dataset)->value('checksum');
        $dataExists = DB::table('tenants')->where('id', $config['sentinel_tenant'])->exists();

        if ($dataExists && $stored === $expected) {
            self::$verified[$dataset] = true; // already seeded & current

            return;
        }

        if ($dataExists && $stored !== $expected) {
            // GUARANTEE 3 — stale data is a hard failure, not a silent hazard.
            throw new RuntimeException(
                "GoldenSeedManager: '{$dataset}' data exists but its checksum does not match the current " .
                'spec/seeder (stored: ' . var_export($stored, true) . ', expected: ' . $expected . '). ' .
                'The spec.yaml or seeder changed while the test database still holds old data. ' .
                'Run: php artisan migrate:fresh --env=testing (against the TEST database only) and re-run.'
            );
        }

        // Seed. We are at transaction level 0, so the seeder's own transactions
        // commit normally and the dataset persists across per-test rollbacks.
        Artisan::call('db:seed', ['--class' => $config['seeder'], '--force' => true]);

        if (!DB::table('tenants')->where('id', $config['sentinel_tenant'])->exists()) {
            throw new RuntimeException(
                "GoldenSeedManager: seeder '{$config['seeder']}' completed but sentinel tenant " .
                "{$config['sentinel_tenant']} is missing — seeding failed silently. Output:\n" .
                Artisan::output()
            );
        }

        DB::table('verification_seed_state')->updateOrInsert(
            ['dataset' => $dataset],
            ['checksum' => $expected, 'seeded_at' => now()]
        );

        self::$verified[$dataset] = true;
    }

    /**
     * Reset the per-process fast path (used by tests that intentionally
     * destroy and re-verify seed state — never needed in normal runs).
     */
    public static function forgetProcessState(): void
    {
        self::$verified = [];
    }

    public static function currentChecksum(string $dataset = 'golden_company'): string
    {
        return self::checksum(self::DATASETS[$dataset]['checksum_inputs']);
    }

    private static function ensureStateTable(): void
    {
        DB::statement(
            'CREATE TABLE IF NOT EXISTS verification_seed_state (' .
            'dataset VARCHAR(64) NOT NULL PRIMARY KEY, ' .
            'checksum VARCHAR(64) NOT NULL, ' .
            'seeded_at TIMESTAMP NULL' .
            ') ENGINE=InnoDB'
        );
    }

    /** @param string[] $relativePaths */
    private static function checksum(array $relativePaths): string
    {
        $hash = hash_init('sha256');
        foreach ($relativePaths as $rel) {
            $path = base_path($rel);
            if (!file_exists($path)) {
                throw new RuntimeException("GoldenSeedManager: checksum input missing: {$rel}");
            }
            hash_update($hash, file_get_contents($path));
        }

        return hash_final($hash);
    }
}
