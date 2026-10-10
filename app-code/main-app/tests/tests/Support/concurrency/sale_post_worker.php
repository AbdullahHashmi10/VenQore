<?php

/**
 * Sale posting worker — spawned in parallel by SaleConcurrencyRaceTest.
 *
 * Each worker is its own OS process with its OWN database connection. It
 * boots the app, signs in as the cashier, waits for a shared start time (so
 * all workers hit the database together), then posts ONE sale through the
 * real HTTP kernel: POST /s/{store}/pos/sales — middleware, shift check,
 * SaleController::store, the unique (store, key) index, everything.
 *
 * Prints one JSON line: {"status": <http status>, "sale_id": ..., "code": ...}.
 *
 * Usage: php sale_post_worker.php <userId> <storeSlug> <startAtMicrotime> <payloadJsonFile>
 */

$root = dirname(__DIR__, 4); // tests/tests/Support/concurrency → project root
require $root . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require $root . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

[$script, $userId, $slug, $startAt, $payloadFile] = array_pad($argv, 5, null);

try {
    $payload = file_get_contents($payloadFile);
    $user = \App\Models\User::findOrFail((int) $userId);
    \Illuminate\Support\Facades\Auth::guard('web')->login($user);

    // Line up with the other workers.
    while (microtime(true) < (float) $startAt) {
        usleep(500);
    }

    $request = \Illuminate\Http\Request::create("/s/{$slug}/pos/sales", 'POST', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT'  => 'application/json',
        'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
    ], $payload);
    $request->setUserResolver(fn () => $user);

    $started = microtime(true);
    $response = $kernel->handle($request);
    $finished = microtime(true);
    $body = json_decode($response->getContent(), true) ?: [];
    echo json_encode(['started' => $started, 'finished' => $finished, 'status' => $response->getStatusCode(), 'sale_id' => $body['sale_id'] ?? null,
        'code' => $body['code'] ?? null, 'message' => isset($body['sale_id']) ? null : mb_substr((string) ($body['message'] ?? $response->getContent()), 0, 300)]);
    $kernel->terminate($request, $response);
} catch (\Throwable $e) {
    echo json_encode(['status' => 0, 'error' => get_class($e) . ': ' . $e->getMessage()]);
}
