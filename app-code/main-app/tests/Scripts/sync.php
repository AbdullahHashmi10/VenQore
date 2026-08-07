<?php

/**
 * FinalTester/Scripts/sync.php — refresh FinalTester/tests from the source suites.
 *
 * WHY THIS EXISTS
 * ---------------
 * FinalTester/tests is a COPY of the live suites. A copy that is edited in one
 * place and read in another rots within days, and a rotten test hub is worse
 * than no hub at all because it reports confident green results about code
 * that no longer exists.
 *
 * The fix is to treat FinalTester/tests as a materialised view rather than a
 * fork: every BAT launcher runs this script first, so the copy is never more
 * than a few seconds old. Nothing is ever edited inside FinalTester/tests
 * directly — you edit the source, and the next run picks it up.
 *
 * SOURCES (in precedence order — later wins on conflict)
 * -----------------------------------------------------
 *   1. Tester/tests/   — the live suite (composer maps Tests\ here)
 *   2. tests/          — legacy copy; ONLY files that do not exist in (1) are
 *                        pulled across, so genuinely orphaned tests get
 *                        rescued without the stale duplicates overwriting the
 *                        current versions.
 *
 * SAFETY
 * ------
 * This script only ever writes inside FinalTester/tests. It never writes to,
 * deletes from, or renames anything in Tester/ or tests/. Run it as often as
 * you like.
 *
 * USAGE
 * -----
 *   php FinalTester/Scripts/sync.php
 *   php FinalTester/Scripts/sync.php --quiet
 *   php FinalTester/Scripts/sync.php --dry-run
 */

declare(strict_types=1);

$root        = dirname(__DIR__, 2);
$finalTests  = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'tests';
$primary     = $root . DIRECTORY_SEPARATOR . 'Tester' . DIRECTORY_SEPARATOR . 'tests';
$legacy      = $root . DIRECTORY_SEPARATOR . 'tests';

$quiet  = in_array('--quiet', $argv, true);
$dryRun = in_array('--dry-run', $argv, true);

$say = static function (string $line) use ($quiet): void {
    if (! $quiet) {
        echo $line . PHP_EOL;
    }
};

if (! is_dir($primary)) {
    $say("  [INFO] Primary source suite not found at {$primary}. Skipping sync.");
    exit(0);
}

$say('');
$say('  FinalTester sync');
$say('  ' . str_repeat('-', 60));
$say('  primary source : Tester/tests');
$say('  legacy source  : tests/            (orphan rescue only)');
$say('  destination    : FinalTester/tests');
if ($dryRun) {
    $say('  MODE           : DRY RUN (nothing will be written)');
}
$say('');

/**
 * Files FinalTester owns outright. sync must never overwrite these with a
 * source-tree version, because they contain FinalTester-specific additions.
 */
$finalTesterOwned = [
    // Rewritten for FinalTester. The upstream Tester/tests/Pest.php relies on
    // living in a DIFFERENT tree from the tests it configures; copying it here
    // makes its duplicate path variants all match at once and makes its
    // directory registrations collide with the seven files that declare their
    // own uses(). Both produce a hard abort. Never overwrite this.
    'Pest.php',

    // NOTE: 'Routes/FullRouteSweepTest.php' USED to be listed here as
    // FinalTester-owned. It has been given a proper source at
    // Tester/tests/Routes/FullRouteSweepTest.php and now syncs like every other
    // test. Owning it here meant the Phase-B registry generator (which scans
    // Tester/tests) could never see it, so RegistryDriftTest reported it as
    // permanent, unfixable drift on every single run. A test with no source is
    // also uneditable in the normal workflow: edits to it would be silently
    // discarded on the next sync.
    // FinalTester-specific dashboard support code (not a test, and not a copy
    // of anything upstream) — the ##venqore[...] live metrics stream the run
    // output at the top of this session relies on. Must survive the pass-3
    // zombie prune below.
    'Support/Live/LiveMetrics.php',
    'Support/Live/LiveMetricsExtension.php',
];

/** Recursively list every file under $dir, relative to $dir. */
$listFiles = static function (string $dir) use (&$listFiles): array {
    $out = [];

    if (! is_dir($dir)) {
        return $out;
    }

    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($it as $file) {
        if ($file->isFile()) {
            $rel = substr($file->getPathname(), strlen($dir) + 1);
            $out[str_replace('\\', '/', $rel)] = $file->getPathname();
        }
    }

    ksort($out);

    return $out;
};

$copied   = 0;
$skipped  = 0;
$rescued  = 0;
$owned    = 0;
$unchanged = 0;

$copy = static function (string $from, string $to) use ($dryRun): void {
    if ($dryRun) {
        return;
    }

    $dir = dirname($to);

    if (! is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    copy($from, $to);
};

// ---------------------------------------------------------------------------
// Pass 1 — primary suite. Authoritative for everything it contains.
// ---------------------------------------------------------------------------
$primaryFiles = $listFiles($primary);

foreach ($primaryFiles as $rel => $src) {
    $dest = $finalTests . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);

    if (in_array($rel, $finalTesterOwned, true)) {
        $owned++;
        continue;
    }

    if (is_file($dest) && filesize($dest) === filesize($src) && md5_file($dest) === md5_file($src)) {
        $unchanged++;
        continue;
    }

    $copy($src, $dest);
    $copied++;
}

$say("  primary suite  : {$copied} updated, {$unchanged} already current, {$owned} FinalTester-owned (left alone)");

// ---------------------------------------------------------------------------
// Pass 2 — legacy suite. Rescue orphans only.
// ---------------------------------------------------------------------------
$legacyFiles = $listFiles($legacy);
$rescuedList = [];

foreach ($legacyFiles as $rel => $src) {
    // Present in the live suite -> the live version already won in pass 1.
    if (isset($primaryFiles[$rel])) {
        $skipped++;
        continue;
    }

    // Only rescue actual tests, not stray fixtures or caches.
    if (! str_ends_with($rel, 'Test.php')) {
        $skipped++;
        continue;
    }

    $dest = $finalTests . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $rel);

    if (is_file($dest) && md5_file($dest) === md5_file($src)) {
        $unchanged++;
        continue;
    }

    $copy($src, $dest);
    $rescued++;
    $rescuedList[] = $rel;
}

$say("  legacy rescue  : {$rescued} orphaned test file(s) pulled in, {$skipped} already covered");

foreach ($rescuedList as $rel) {
    $say("                     + {$rel}");
}

// ---------------------------------------------------------------------------
// Pass 3 — prune zombies. A file under FinalTester/tests with NO source in
// either Tester/tests or tests/, and not explicitly FinalTester-owned, is a
// leftover from a deleted or renamed source test. It can never be updated by
// this script again (nothing feeds it), it silently pads the pass count, and
// if it references application code, it can drift out of sync with reality
// forever. This was audit finding C1 (2026-08-02) — 7 such files existed,
// including one (SitemapIndexAndLastModifiedTest.php) that drove a production
// SitemapController rewrite for a test that had no source of truth anywhere.
// ---------------------------------------------------------------------------
$finalTestFiles = $listFiles($finalTests);
$pruned = [];

foreach ($finalTestFiles as $rel => $path) {
    if (in_array($rel, $finalTesterOwned, true)) {
        continue;
    }

    $hasSource = isset($primaryFiles[$rel]) || isset($legacyFiles[$rel]);

    if (! $hasSource) {
        if (! $dryRun) {
            unlink($path);
        }
        $pruned[] = $rel;
    }
}

if (! empty($pruned)) {
    $say('  pruned zombies : ' . count($pruned) . ' file(s) with no source removed' . ($dryRun ? ' (dry run — not actually deleted)' : ''));
    foreach ($pruned as $rel) {
        $say("                     - {$rel}");
    }
} else {
    $say('  pruned zombies : none');
}

$total = count($listFiles($finalTests));

$say('');
$say("  FinalTester/tests now holds {$total} files.");
$say('');

// Machine-readable receipt for the dashboard.
if (! $dryRun) {
    // Sync VerificationCenter registry if present
    $srcRegistry = $root . DIRECTORY_SEPARATOR . 'Tester' . DIRECTORY_SEPARATOR . 'VerificationCenter' . DIRECTORY_SEPARATOR . 'registry' . DIRECTORY_SEPARATOR . 'suites.yaml';
    $destRegistry = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'VerificationCenter' . DIRECTORY_SEPARATOR . 'registry' . DIRECTORY_SEPARATOR . 'suites.yaml';
    if (is_file($srcRegistry)) {
        $dir = dirname($destRegistry);
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        copy($srcRegistry, $destRegistry);
    }

    // Sync the permission ratchet registry too. PermissionBypassGuardTest resolves
    // this path relative to ITS OWN location (dirname(__DIR__, 3) from
    // Guardrails/PermissionBypassGuardTest.php), which lands at
    // <tree>/VerificationCenter/registry/permission_ratchet.yaml. Before this fix
    // that file only ever existed under Tester/ — running the guard test from
    // FinalTester resolved a path that didn't exist, and the test's own
    // `if (is_file($ratchetPath) && ...)` guard silently SKIPPED both the baseline
    // checksum check and the ratchet ceiling check. Copying it here closes that gap.
    $srcRatchet = $root . DIRECTORY_SEPARATOR . 'Tester' . DIRECTORY_SEPARATOR . 'VerificationCenter' . DIRECTORY_SEPARATOR . 'registry' . DIRECTORY_SEPARATOR . 'permission_ratchet.yaml';
    $destRatchet = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'VerificationCenter' . DIRECTORY_SEPARATOR . 'registry' . DIRECTORY_SEPARATOR . 'permission_ratchet.yaml';
    if (is_file($srcRatchet)) {
        $dir = dirname($destRatchet);
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        copy($srcRatchet, $destRatchet);
    }

    $reports = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'reports';

    if (! is_dir($reports)) {
        mkdir($reports, 0775, true);
    }

    file_put_contents(
        $reports . DIRECTORY_SEPARATOR . 'sync.json',
        json_encode([
            'synced_at'      => date('c'),
            'files_total'    => $total,
            'updated'        => $copied,
            'unchanged'      => $unchanged,
            'rescued'        => $rescued,
            'rescued_files'  => $rescuedList,
            'finaltester_owned' => $finalTesterOwned,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    );
}

exit(0);
