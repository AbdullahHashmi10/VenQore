<?php

namespace App\Http\Controllers\WooSync;

use App\Http\Controllers\Controller;
use App\Models\WooConnection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WooHandshakeController extends Controller
{
    /**
     * POST /api/woo/handshake
     *
     * Receives the setup_token, site_url, consumer_key, and consumer_secret.
     * Validates the setup_token.
     * Stores the keys, sets status to 'active', and returns webhook credentials.
     */
    public function handshake(Request $request)
    {
        $validated = $request->validate([
            'setup_token'     => 'required|string',
            'site_url'        => 'required|url|max:255',
            'consumer_key'    => 'required|string',
            'consumer_secret' => 'required|string',
        ]);

        // Find the pending connection with this setup token
        $connection = WooConnection::where('setup_token', $validated['setup_token'])
            ->where('status', 'pending')
            ->first();

        if (!$connection) {
            Log::warning('[WooHandshake] Handshake failed: Invalid setup token or already active.', [
                'setup_token' => $validated['setup_token']
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired setup token.',
            ], 400);
        }

        // Generate webhook secret and api token for subsequent requests
        $webhookSecret = Str::random(32);
        $apiToken      = WooConnection::generateApiToken();

        // Update the connection
        $connection->update([
            'site_url'        => rtrim($validated['site_url'], '/'),
            'consumer_key'    => $validated['consumer_key'],
            'consumer_secret' => $validated['consumer_secret'],
            'webhook_secret'  => $webhookSecret,
            'api_token'       => $apiToken,
            'status'          => 'active',
            // Clear setup token so it can't be reused
            'setup_token'     => null,
        ]);

        Log::info('[WooHandshake] Handshake successful and connection activated.', [
            'connection_id' => $connection->id,
            'site_url'      => $connection->site_url,
        ]);

        // Trigger initial import asynchronously
        try {
            \App\Jobs\WooSync\InitialImportJob::dispatch($connection->id);
        } catch (\Exception $e) {
            Log::error('[WooHandshake] Failed to dispatch InitialImportJob', [
                'connection_id' => $connection->id,
                'error'         => $e->getMessage()
            ]);
        }

        return response()->json([
            'success'        => true,
            'api_token'      => $apiToken,
            'webhook_url'    => $connection->webhookUrl(),
            'webhook_secret' => $webhookSecret,
            'store_name'     => $connection->tenant->name ?? 'VenQore Store',
        ]);
    }
}
