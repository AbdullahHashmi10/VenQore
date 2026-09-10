<?php
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$app->make("Illuminate\Contracts\Console\Kernel")->bootstrap();

$service = app(App\Services\AiBuilder\ConversationalBuilderService::class);

// FIRST: verify detection works
$reg = app(App\Services\AiBuilder\CapabilityRegistry::class);
$probe = $reg->detectStructuredFacts("میری میڈیکل فارمیسی کی دکان ہے اور 2 برانچز ہیں۔");
echo "=== Detected Facts ===\n";
foreach ($probe['facts'] as $k => $v) {
    echo "  $k = " . json_encode($v['value']) . " (evidence: {$v['evidence']})\n";
}
echo "  detected_preset: " . ($probe['detected_preset'] ?? 'null') . "\n\n";

echo "--- TURN 1: START ---\n";
$t1 = $service->startSession("میری میڈیکل فارمیسی کی دکان ہے اور 2 برانچز ہیں۔");
echo "Assistant: " . $t1["assistant_message"] . "\n";
echo "Target Cap: " . ($t1["target_capability"] ?? "NONE") . "\n";
echo "Options: " . json_encode($t1["quick_options"] ?? [], JSON_UNESCAPED_UNICODE) . "\n";
echo "Readiness: " . ($t1["readiness_score"] ?? 0) . "\n\n";

$sessionId = $t1["session_id"];

echo "--- TURN 2: USER RESPONDS ---\n";
$t2 = $service->step($sessionId, "جی ہاں ہمارے پاس ادویات پر بیچ اور ایکسپائری ڈیٹ ہوتی ہے", "yes");
echo "Assistant: " . $t2["assistant_message"] . "\n";
echo "Target Cap: " . ($t2["target_capability"] ?? "NONE") . "\n";
echo "Options: " . json_encode($t2["quick_options"] ?? [], JSON_UNESCAPED_UNICODE) . "\n";
echo "Is Complete: " . ($t2["is_complete"] ? "YES" : "NO") . "\n";
echo "Readiness: " . ($t2["readiness_score"] ?? 0) . "\n\n";

if (!$t2["is_complete"]) {
    echo "--- TURN 3: USER RESPONDS ---\n";
    $t3 = $service->step($sessionId, "ہاں ہمارے گاہکوں کو خاتہ / ادھار کی سہولت دیتے ہیں", "yes");
    echo "Assistant: " . $t3["assistant_message"] . "\n";
    echo "Is Complete: " . ($t3["is_complete"] ? "YES" : "NO") . "\n";
    if (!empty($t3["proposal"])) {
        echo "Proposal Preset: " . ($t3["preset"] ?? "NONE") . "\n";
        echo "Modules: " . json_encode($t3["modules"] ?? []) . "\n";
    }
}
