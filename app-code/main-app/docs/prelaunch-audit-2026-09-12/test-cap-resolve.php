<?php
require __DIR__ . '/../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$reg = new App\Services\AiBuilder\CapabilityRegistry();
$liveRegistry = array_keys(array_filter(config('modules', []), fn ($m) => ($m['status'] ?? null) === 'live'));

echo "Live modules count: " . count($liveRegistry) . "\n";

foreach ($reg->allCapabilities() as $key => $cap) {
    $implied = (array) ($cap['implies_modules'] ?? []);
    $valid = array_intersect($implied, $liveRegistry);
    $dropped = array_diff($implied, $liveRegistry);
    echo "Capability: {$key}\n";
    echo "  Implies: " . json_encode($implied) . "\n";
    if ($dropped !== []) {
        echo "  DROPPED (Phantom/Mismatch): " . json_encode(array_values($dropped)) . "\n";
    }
    echo "  Valid: " . json_encode(array_values($valid)) . "\n";
}
