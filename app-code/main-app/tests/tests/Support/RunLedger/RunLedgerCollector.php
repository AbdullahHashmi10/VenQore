<?php

namespace Tests\Support\RunLedger;

use PHPUnit\Event\Code\Test;
use PHPUnit\Event\Code\TestMethod;

/**
 * RunLedgerCollector — accumulates per-test outcomes during a PHPUnit run and
 * writes one append-only Run Ledger record when the run finishes.
 *
 * Blueprint §5.3 (Run Ledger): "machine-readable history … This is the dataset
 * behind trends, historical comparison, and the launch gate. Never overwritten;
 * append-only by timestamp."
 *
 * Design constraints:
 *  - MUST NEVER throw: a broken evidence writer must not fail the suite.
 *  - No Laravel dependencies: runs before/after app boot.
 */
final class RunLedgerCollector
{
    /** @var array<string, array<string,mixed>> keyed by test id */
    private static array $tests = [];
    private static ?float $runStartedAt = null;
    private static array $riskyIds = [];

    public static function runStarted(): void
    {
        self::$runStartedAt = microtime(true);
        self::$tests = [];
        self::$riskyIds = [];
    }

    public static function testPrepared(Test $test): void
    {
        $id = $test->id();
        self::$tests[$id] ??= self::describe($test);
        self::$tests[$id]['started_at'] = microtime(true);
    }

    public static function record(Test $test, string $status, ?string $message = null): void
    {
        $id = $test->id();
        self::$tests[$id] ??= self::describe($test);
        $entry = &self::$tests[$id];

        // A risky consideration must never mask a failure/error.
        $rank = ['passed' => 0, 'risky' => 1, 'incomplete' => 2, 'skipped' => 2, 'deprecation' => 1, 'failed' => 3, 'errored' => 4];
        $current = $entry['status'] ?? null;
        if ($current === null || ($rank[$status] ?? 0) >= ($rank[$current] ?? 0)) {
            $entry['status'] = $status;
        }
        if ($status === 'risky') {
            self::$riskyIds[$id] = true;
        }
        if ($message !== null && $message !== '') {
            $entry['message'] = mb_substr($message, 0, 2000);
        }
        if (isset($entry['started_at'])) {
            $entry['duration_ms'] = (int) round((microtime(true) - $entry['started_at']) * 1000);
        }
    }

    public static function write(): void
    {
        try {
            if (self::$tests === []) {
                return;
            }

            $testerDir = dirname(__DIR__, 3); // .../Tester
            $runsDir = $testerDir . DIRECTORY_SEPARATOR . 'VerificationCenter' . DIRECTORY_SEPARATOR . 'runs';
            $runId = date('Ymd_His') . '_' . getmypid();
            $dir = $runsDir . DIRECTORY_SEPARATOR . $runId;
            if (!is_dir($dir) && !@mkdir($dir, 0777, true)) {
                return;
            }

            $counts = ['passed' => 0, 'failed' => 0, 'errored' => 0, 'skipped' => 0, 'incomplete' => 0, 'risky' => 0];
            $lines = '';
            foreach (self::$tests as $id => $t) {
                $status = $t['status'] ?? 'passed';
                $counts[$status] = ($counts[$status] ?? 0) + 1;
                if (isset(self::$riskyIds[$id]) && $status !== 'risky') {
                    $counts['risky']++; // risky-but-failed etc. still counted as risky occurrences
                }
                unset($t['started_at']);
                $t['id'] = $id;
                $lines .= json_encode($t, JSON_UNESCAPED_SLASHES) . "\n";
            }
            @file_put_contents($dir . DIRECTORY_SEPARATOR . 'tests.jsonl', $lines);

            $green = ($counts['failed'] === 0 && $counts['errored'] === 0);
            $summary = [
                'run_id'        => $runId,
                'schema'        => 'venqore.run-ledger.v1',
                'started_at'    => self::$runStartedAt ? date('c', (int) self::$runStartedAt) : null,
                'finished_at'   => date('c'),
                'duration_s'    => self::$runStartedAt ? round(microtime(true) - self::$runStartedAt, 1) : null,
                'total'         => count(self::$tests),
                'counts'        => $counts,
                'green'         => $green,
                'environment'   => self::environmentFingerprint($testerDir),
                'argv'          => array_slice($_SERVER['argv'] ?? [], 0, 12),
            ];
            @file_put_contents(
                $dir . DIRECTORY_SEPARATOR . 'summary.json',
                json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );

            // Evidence artifacts: PHPUnit's own result cache + the verification claims stream.
            $cache = $testerDir . DIRECTORY_SEPARATOR . '.phpunit.result.cache';
            if (is_file($cache)) {
                @copy($cache, $dir . DIRECTORY_SEPARATOR . 'phpunit.result.cache');
            }
            $claims = dirname($testerDir) . '/storage/logs/verification_claims.jsonl';
            if (is_file($claims)) {
                @copy($claims, $dir . DIRECTORY_SEPARATOR . 'verification_claims.jsonl');
            }

            // latest.json pointer (the ONLY mutable file; every run dir is append-only).
            @file_put_contents(
                $runsDir . DIRECTORY_SEPARATOR . 'latest.json',
                json_encode(['run_id' => $runId, 'green' => $green, 'finished_at' => $summary['finished_at'], 'counts' => $counts, 'total' => $summary['total']], JSON_PRETTY_PRINT)
            );
        } catch (\Throwable) {
            // Evidence collection must never break the run.
        }
    }

    private static function describe(Test $test): array
    {
        $entry = ['class' => null, 'method' => null, 'file' => null];
        if ($test instanceof TestMethod) {
            $entry['class'] = $test->className();
            $entry['method'] = $test->methodName();
            $entry['file'] = $test->file();
        } else {
            $entry['method'] = $test->name();
        }

        return $entry;
    }

    private static function environmentFingerprint(string $testerDir): array
    {
        $root = dirname($testerDir);
        $gitSha = null;
        try {
            if (function_exists('shell_exec')) {
                $gitSha = trim((string) @shell_exec('git -C ' . escapeshellarg($root) . ' rev-parse --short HEAD 2>&1'));
                if ($gitSha === '' || str_contains($gitSha, 'fatal')) {
                    $gitSha = null;
                }
            }
        } catch (\Throwable) {
            $gitSha = null;
        }

        $seedChecksum = null;
        try {
            $h = hash_init('sha256');
            foreach (['/verification/golden_company/spec.yaml', '/database/seeders/GoldenCompanySeeder.php'] as $rel) {
                if (is_file($root . $rel)) {
                    hash_update($h, (string) file_get_contents($root . $rel));
                }
            }
            $seedChecksum = hash_final($h);
        } catch (\Throwable) {
        }

        return [
            'php'           => PHP_VERSION,
            'os'            => PHP_OS_FAMILY,
            'db_database'   => getenv('DB_DATABASE') ?: ($_ENV['DB_DATABASE'] ?? null),
            'git_sha'       => $gitSha,
            'seed_checksum' => $seedChecksum,
        ];
    }
}
