<?php

$matrixFile = realpath(__DIR__ . '/../../../extras/reckoner/RECKONER_CARD_CONTRACT_MATRIX.md');
if (!$matrixFile || !file_exists($matrixFile)) {
    $matrixFile = 'E:/AMD POS/AMD POS/extras/reckoner/RECKONER_CARD_CONTRACT_MATRIX.md';
}

$origContent = file_get_contents($matrixFile);
$cardsPath = realpath(__DIR__ . '/../resources/data/reckoner/cards.json');
$cards = json_decode(file_get_contents($cardsPath), true);

// Extract the header (lines 1 to 47 inclusive, exactly as original)
$lines = file($matrixFile);
$headerLines = array_slice($lines, 0, 47);
$header = implode('', $headerLines);

$sections = [];
foreach ($cards as $key => $card) {
    $matrix = $card['matrix'] ?? null;
    $contract = $card['contract'] ?? [];
    if (!$matrix) {
        continue;
    }

    $sec = $matrix['section'];
    if (!isset($sections[$sec])) {
        $sections[$sec] = [];
    }

    $checks = $contract['checks'] ?? [];
    $checkStr = empty($checks) ? '—' : implode(', ', $checks);

    $sections[$sec][] = [
        'num' => $matrix['num'],
        'key' => $card['key'],
        'shape' => $card['shape'],
        'today' => $matrix['today'],
        'unit_col' => $matrix['unit_col'],
        'target' => $matrix['target'],
        'tier' => $contract['tier'] ?? $card['tier'],
        'status' => $contract['status'] ?? $card['matrix_status'],
        'streams' => $matrix['streams'],
        'check' => $checkStr,
    ];
}

$out = $header;

foreach ($sections as $sec => $rows) {
    $count = count($rows);
    $out .= "## {$sec} ({$count})\n\n";
    $out .= "| # | Key · shape | Today | Unit | Target definition | Tier | Status | Streams | Check |\n";
    $out .= "|---|---|---|---|---|---|---|---|---|\n";
    foreach ($rows as $r) {
        $out .= "| {$r['num']} | `{$r['key']}` · {$r['shape']} | {$r['today']} | {$r['unit_col']} | {$r['target']} | {$r['tier']} | {$r['status']} | {$r['streams']} | {$r['check']} |\n";
    }
    $out .= "\n";
}

$origEndsWithNewline = str_ends_with($origContent, "\n");
$out = rtrim($out) . ($origEndsWithNewline ? "\n" : "");

if (isset($argv[1]) && $argv[1] === '--write') {
    file_put_contents($matrixFile, $out);
    echo "Regenerated {$matrixFile} successfully!\n";
} else {
    $tmp = sys_get_temp_dir() . '/rebuilt_matrix_' . uniqid() . '.md';
    file_put_contents($tmp, $out);
    $diff = shell_exec('git diff --no-index "' . $matrixFile . '" "' . $tmp . '"');
    unlink($tmp);
    if (empty($diff)) {
        echo "CLEAN: Regenerated matrix matches {$matrixFile} with 0 diff!\n";
        exit(0);
    } else {
        echo "DIFF DETECTED (" . strlen($diff) . " bytes):\n" . substr($diff, 0, 1000) . "\n";
        exit(1);
    }
}