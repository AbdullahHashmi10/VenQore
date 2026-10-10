<?php
/**
 * Money float lint (sale reliability plan, package F) — a RATCHET.
 *
 * In every PHP file under app/ that posts to the books (calls createEntry,
 * seals with the ZeroDrift Ledger or writes journal rows), it counts lines
 * that do money arithmetic in floating point:
 *
 *   F1  round(<arithmetic>, 2)                 rounding a float sum/product to paisa
 *   F2  (float) $money ... + - * /             float arithmetic on a money variable
 *   F3  $money += / -= (float)…                float accumulation of a money total
 *
 * Exact paisa (App\Support\Money, integer minor units) never matches. The
 * counts are held in scripts/money-float-baseline.json: a file may only go
 * DOWN. A new posting file, or a higher count, fails with the lines to fix.
 *
 *   php scripts/money-float-lint.php            check (exit 1 on a rise)
 *   php scripts/money-float-lint.php --update   lower the baseline after a cleanup
 *   php scripts/money-float-lint.php --list     print every flagged line
 */

$root = dirname(__DIR__);
$baselineFile = __DIR__ . '/money-float-baseline.json';
$update = in_array('--update', $argv, true);
$list = in_array('--list', $argv, true);

$money = '(?:amount|total|subtotal|price|cost|debit|credit|tax|paid|balance|due|discount|fee|charge|revenue|cogs|payable|receivable|refund)';
$patterns = [
    'F1' => '/\bround\(\s*[^;,]*[\+\-\*\/][^;,]*,\s*2\s*\)/i',
    'F2' => '/\(float\)\s*\$\w*' . $money . '\w*[^;]*?[\+\-\*\/]\s*[\$\(\d]/i',
    'F3' => '/\$\w*' . $money . '\w*\s*[\+\-]=\s*(?:\(float\)|round\(|floatval\()/i',
];

$files = [];
$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/app', FilesystemIterator::SKIP_DOTS));
foreach ($it as $f) {
    if ($f->getExtension() !== 'php') {
        continue;
    }
    $code = file_get_contents($f->getPathname());
    if (! preg_match('/->createEntry\s*\(|ZeroDrift::seal|journal_items\'\)\s*->\s*insert|JournalItem::create/', $code)) {
        continue;
    }
    $rel = str_replace('\\', '/', substr($f->getPathname(), strlen($root) + 1));
    $hits = [];
    foreach (explode("\n", $code) as $i => $line) {
        $trim = ltrim($line);
        if ($trim === '' || str_starts_with($trim, '//') || str_starts_with($trim, '*') || str_starts_with($trim, '/*')) {
            continue;
        }
        foreach ($patterns as $code_ => $re) {
            if (preg_match($re, $line)) {
                $hits[] = sprintf('%s:%d [%s] %s', $rel, $i + 1, $code_, trim($line));
                break;
            }
        }
    }
    $files[$rel] = $hits;
}
ksort($files);

$baseline = is_file($baselineFile) ? json_decode(file_get_contents($baselineFile), true) : [];
$current = array_map('count', $files);

if ($list) {
    foreach ($files as $hits) {
        foreach ($hits as $h) {
            echo $h, "\n";
        }
    }
}

if ($update || ! $baseline) {
    // Never raise an existing file's allowance; new files start at their count only on first creation.
    $next = [];
    foreach ($current as $rel => $n) {
        $next[$rel] = isset($baseline[$rel]) ? min($n, $baseline[$rel]) : ($baseline ? 0 : $n);
    }
    $next = array_filter($next, fn ($n) => $n > 0);
    file_put_contents($baselineFile, json_encode($next, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
    echo 'Baseline written: ' . array_sum($next) . ' allowed float-money line(s) in ' . count($next) . " file(s).\n";
    if ($baseline) {
        $rises = array_filter($current, fn ($n, $rel) => $n > ($next[$rel] ?? 0), ARRAY_FILTER_USE_BOTH);
        if ($rises) {
            echo "Not raised for: " . implode(', ', array_keys($rises)) . "\n";
            exit(1);
        }
    }
    exit(0);
}

$failed = false;
foreach ($current as $rel => $n) {
    $allowed = $baseline[$rel] ?? 0;
    if ($n > $allowed) {
        $failed = true;
        fwrite(STDERR, "Float money arithmetic rose in {$rel}: {$n} > {$allowed} allowed. Use App\\Support\\Money (integer paisa):\n");
        foreach ($files[$rel] as $h) {
            fwrite(STDERR, "  {$h}\n");
        }
    }
}
$lowered = array_filter($baseline, fn ($n, $rel) => ($current[$rel] ?? 0) < $n, ARRAY_FILTER_USE_BOTH);
echo 'Float-money lines in posting code: ' . array_sum($current) . ' (allowed ' . array_sum($baseline) . ').';
echo $lowered ? ' Some files improved: run with --update to lock it in.' : '', "\n";
exit($failed ? 1 : 0);
