<?php

namespace App\Http\Controllers\WooSync;

use App\Http\Controllers\Controller;
use App\Jobs\WooSync\ProcessWebhookJob;
use App\Models\WooConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * WooWebhookController — Receives incoming WooCommerce product webhooks.
 *
 * Each connection has a unique UUID in the URL so we can route
 * incoming webhooks to the correct tenant without authentication.
 * Signature verification happens synchronously; processing is async via jobs.
 */
class WooWebhookController extends Controller
{
    /**
     * POST /api/woo/webhook/{uuid}
     *
     * WooCommerce expects a 200 response within 3 seconds.
     * We verify the signature here, then hand off to a queued job.
     */
    public function receive(Request $request, string $uuid)
    {
        $connection = WooConnection::where('uuid', $uuid)
            ->where('status', 'active')
            ->first();

        if (!$connection) {
            Log::warning('[WooWebhook] Received webhook for unknown/inactive connection', ['uuid' => $uuid]);
            return response()->json(['ok' => false], 404);
        }

        // Verify HMAC-SHA256 signature
        if (!$this->verifySignature($request, $connection)) {
            Log::warning('[WooWebhook] Signature verification failed', ['connection_id' => $connection->id]);
            return response()->json(['ok' => false], 401);
        }

        $topic   = $request->header('x-wc-webhook-topic');
        $payload = $request->json()->all();

        if (empty($topic) || empty($payload)) {
            return response()->json(['ok' => false], 400);
        }

        // Only handle product events
        if (!str_starts_with($topic, 'product.')) {
            return response()->json(['ok' => true, 'ignored' => true]);
        }

        Log::info('[WooWebhook] Accepted', [
            'connection_id' => $connection->id,
            'topic'         => $topic,
            'woo_id'        => $payload['id'] ?? 'unknown',
        ]);

        // Dispatch async — respond immediately
        ProcessWebhookJob::dispatch($connection->id, $topic, $payload);

        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/woo/verify/{token}
     *
     * Called by the WordPress plugin during setup to confirm the token is valid.
     * Returns the connection details so the plugin knows it's connected.
     */
    public function verify(Request $request, string $token)
    {
        // Find connection where api_token matches (we decrypt and compare)
        // Since tokens are encrypted, we must iterate (small table — acceptable)
        $connection = WooConnection::get()->first(function ($conn) use ($token) {
            return $conn->api_token === $token;
        });

        if (!$connection) {
            return response()->json(['valid' => false], 401);
        }

        return response()->json([
            'valid'         => true,
            'connection_id' => $connection->id,
            'store_name'    => $connection->tenant->name ?? 'VenQore Store',
            'webhook_url'   => $connection->webhookUrl(),
            'connected_at'  => $connection->created_at->toIso8601String(),
        ]);
    }

    /**
     * Verify the WooCommerce webhook HMAC-SHA256 signature.
     *
     * WooCommerce sends: X-WC-Webhook-Signature: base64(HMAC-SHA256(body, secret))
     */
    protected function verifySignature(Request $request, WooConnection $connection): bool
    {
        $webhookSecret = $connection->webhook_secret;

        if (!$webhookSecret) {
            // No secret configured — accept (for initial setup)
            return true;
        }

        $signature = $request->header('x-wc-webhook-signature');

        if (!$signature) {
            return false;
        }

        $body    = $request->getContent();
        $computed = base64_encode(hash_hmac('sha256', $body, $webhookSecret, true));

        return hash_equals($computed, $signature);
    }
}
