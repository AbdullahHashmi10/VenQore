<?php

namespace App\Http\Controllers\WooSync;

use App\Http\Controllers\Controller;
use App\Jobs\WooSync\ProcessSyncQueueJob;
use App\Models\WooConnection;
use App\Models\WooProductLink;
use App\Models\WooSyncLog;
use App\Models\WooSyncQueue;
use App\Services\WooSync\SyncEngine;
use App\Services\WooSync\WooApiClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WooConnectionController extends Controller
{
    // ─── Helper: get current tenant ID (same pattern as all other controllers) ─
    private function tenantId(): int
    {
        return app('current.tenant')->id;
    }

    // ─── Helper: get store slug for redirects ──────────────────────────────────
    private function storeSlug(?string $slug = null): string
    {
        if ($slug) {
            return $slug;
        }
        return request()->route('store_slug') ?? request()->segment(2) ?? '';
    }

    /**
     * GET /s/{store_slug}/woo/connections
     */
    public function index(Request $request, $store_slug = null)
    {
        $tenantId = $this->tenantId();

        $connections = WooConnection::where('tenant_id', $tenantId)
            ->withCount(['productLinks', 'syncQueue as staged_count' => fn($q) => $q->where('status', 'staged')])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => $this->connectionSummary($c));

        return Inertia::render('WooCommerce/Connections', [
            'connections' => $connections,
            'store_slug'  => $this->storeSlug($store_slug),
        ]);
    }

    /**
     * POST /s/{store_slug}/woo/connections
     */
    public function store(Request $request, $store_slug = null)
    {
        $tenantId = $this->tenantId();
        $slug     = $this->storeSlug($store_slug);

        $validated = $request->validate([
            'name'            => 'required|string|max:100',
            'priority_source' => 'in:venqore,woocommerce,manual',
            'sync_fields'     => 'nullable|array',
            'site_url'        => 'nullable|url|max:255',
        ]);

        $uuid       = WooConnection::generateUuid();
        $setupToken = Str::random(40);

        $connection = WooConnection::create([
            'tenant_id'               => $tenantId,
            'name'                    => $validated['name'],
            'site_url'                => $validated['site_url'] ? rtrim($validated['site_url'], '/') : null,
            'uuid'                    => $uuid,
            'setup_token'             => $setupToken,
            'priority_source'         => $validated['priority_source'] ?? 'venqore',
            'auto_stage_new_products' => true,
            'sync_fields'             => $validated['sync_fields'] ?? WooConnection::defaultSyncFields(),
            'status'                  => 'pending',
        ]);

        return redirect()->route('store.woo.connections.setup', ['store_slug' => $slug, 'connection' => $connection->id])
            ->with('success', 'Connection created! Follow the steps below to finish setup.');
    }

    /**
     * GET /s/{store_slug}/woo/connections/{connection}/setup
     */
    public function setup(Request $request, $store_slug, $connection)
    {
        $tenantId   = $this->tenantId();
        $conn       = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);
        $plainToken = $conn->api_token; // decrypted by accessor

        return Inertia::render('WooCommerce/ConnectionSetup', [
            'connection'          => $this->connectionSummary($conn),
            'plain_token'         => $plainToken,
            'setup_token'         => $conn->setup_token,
            'webhook_url'         => $conn->webhookUrl(),
            'store_slug'          => $this->storeSlug($store_slug),
            'plugin_download_url' => route('store.woo.plugin.download', ['store_slug' => $this->storeSlug($store_slug), 'connection' => $conn->id]),
        ]);
    }

    /**
     * GET /s/{store_slug}/woo/connections/{connection}/status
     */
    public function statusJson(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        return response()->json([
            'status'   => $conn->status,
            'site_url' => $conn->site_url,
        ]);
    }

    /**
     * GET /s/{store_slug}/woo/connections/{connection}/sync
     */
    public function syncPage(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $filter = $request->get('filter', 'all');
        $search = $request->get('search', '');

        $linksQuery = WooProductLink::where('connection_id', $conn->id)
            ->with('product');

        if ($filter !== 'all') {
            $linksQuery->where('sync_status', $filter);
        }

        if ($search) {
            $linksQuery->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhereHas('product', fn($p) => $p->where('name', 'like', "%{$search}%"));
            });
        }

        $links = $linksQuery->orderBy('sync_status')->paginate(30);

        $stagedQueue = WooSyncQueue::where('connection_id', $conn->id)
            ->where('status', 'staged')
            ->orderByDesc('created_at')
            ->get();

        $stats = [
            'synced'    => WooProductLink::where('connection_id', $conn->id)->where('sync_status', 'synced')->count(),
            'conflicts' => WooProductLink::where('connection_id', $conn->id)->where('sync_status', 'conflict')->count(),
            'staged'    => WooProductLink::where('connection_id', $conn->id)->where('sync_status', 'staged')->count() + $stagedQueue->count(),
            'ignored'   => WooProductLink::where('connection_id', $conn->id)->where('sync_status', 'ignored')->count(),
        ];

        return Inertia::render('WooCommerce/SyncPage', [
            'connection'   => $this->connectionSummary($conn),
            'links'        => $links,
            'staged_queue' => $stagedQueue,
            'stats'        => $stats,
            'filter'       => $filter,
            'search'       => $search,
            'store_slug'   => $this->storeSlug($store_slug),
        ]);
    }

    /**
     * DELETE /s/{store_slug}/woo/connections/{connection}
     */
    public function destroy(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $slug     = $this->storeSlug($store_slug);
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        try {
            if (!empty($conn->site_url) && !empty($conn->consumer_key) && !empty($conn->consumer_secret)) {
                $client   = new WooApiClient($conn);
                $webhooks = $client->getWebhooks();
                foreach ($webhooks as $hook) {
                    if (isset($hook['delivery_url']) && str_contains($hook['delivery_url'], $conn->uuid)) {
                        $client->deleteWebhook($hook['id']);
                    }
                }
            }
        } catch (\Throwable $e) {
            // Non-critical
        }

        $conn->delete();

        return redirect()->route('store.woo.connections.index', ['store_slug' => $slug])
            ->with('success', 'Connection removed.');
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/approve
     */
    public function approveSync(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated = $request->validate([
            'queue_ids'   => 'nullable|array',
            'queue_ids.*' => 'integer',
            'approve_all' => 'boolean',
        ]);

        $query = WooSyncQueue::where('connection_id', $conn->id)->where('status', 'staged');

        if (!($validated['approve_all'] ?? false)) {
            $query->whereIn('id', $validated['queue_ids'] ?? []);
        }

        $query->update(['status' => 'approved']);

        ProcessSyncQueueJob::dispatch($conn->id)->delay(now()->addSeconds(2));

        // Failsafe: Run synchronously in case queue runner is not active on host
        try {
            $job = new ProcessSyncQueueJob($conn->id);
            $job->handle();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[WooSync] Failsafe inline sync failed: ' . $e->getMessage());
        }

        return back()->with('success', 'Items approved and queued for sync.');
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/push
     */
    public function forcePush(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated = $request->validate(['link_id' => 'required|integer']);
        $link      = WooProductLink::where('connection_id', $conn->id)->findOrFail($validated['link_id']);

        $engine  = new SyncEngine($conn);
        $success = $engine->pushToWoo($link);

        return back()->with($success ? 'success' : 'error', $success ? 'Product pushed to WooCommerce.' : 'Push failed — check logs.');
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/pull
     */
    public function forcePull(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated  = $request->validate(['link_id' => 'required|integer']);
        $link       = WooProductLink::where('connection_id', $conn->id)->findOrFail($validated['link_id']);
        $client     = new WooApiClient($conn);
        $wooProduct = $client->getProduct($link->woo_product_id);

        if (!$wooProduct) {
            return back()->with('error', 'Could not fetch product from WooCommerce.');
        }

        $queueEntry = WooSyncQueue::create([
            'connection_id'   => $conn->id,
            'direction'       => 'from_woo',
            'product_link_id' => $link->id,
            'payload'         => $wooProduct,
            'status'          => 'approved',
            'triggered_by'    => 'manual',
        ]);

        $engine  = new SyncEngine($conn);
        $success = $engine->pullFromWoo($queueEntry);
        $queueEntry->update(['status' => $success ? 'done' : 'failed']);

        return back()->with($success ? 'success' : 'error', $success ? 'Product pulled from WooCommerce.' : 'Pull failed — check logs.');
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/resolve
     */
    public function resolveConflict(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated = $request->validate([
            'link_id'    => 'required|integer',
            'resolution' => 'required|in:venqore,woocommerce',
        ]);

        $link   = WooProductLink::where('connection_id', $conn->id)->findOrFail($validated['link_id']);
        $engine = new SyncEngine($conn);
        $userId = (string) Auth::id();

        $success = $validated['resolution'] === 'venqore'
            ? $engine->resolveConflictUseVenqore($link, $userId)
            : $engine->resolveConflictUseWoo($link, $userId);

        return back()->with($success ? 'success' : 'error', $success ? 'Conflict resolved.' : 'Resolution failed — check logs.');
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/ignore
     */
    public function ignore(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated = $request->validate([
            'queue_id' => 'nullable|integer',
            'link_id'  => 'nullable|integer',
        ]);

        if ($validated['queue_id'] ?? null) {
            WooSyncQueue::where('connection_id', $connection)
                ->where('id', $validated['queue_id'])
                ->update(['status' => 'done']);
        }

        if ($validated['link_id'] ?? null) {
            WooProductLink::where('connection_id', $connection)
                ->where('id', $validated['link_id'])
                ->update(['sync_status' => 'ignored']);
        }

        return back()->with('success', 'Item ignored.');
    }

    /**
     * PUT /s/{store_slug}/woo/connections/{connection}/settings
     */
    public function updateSettings(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $validated = $request->validate([
            'name'            => 'sometimes|string|max:100',
            'priority_source' => 'sometimes|in:venqore,woocommerce,manual',
            'sync_fields'     => 'sometimes|array',
            'status'          => 'sometimes|in:active,paused',
            'site_url'        => 'sometimes|nullable|url|max:255',
        ]);

        if (isset($validated['site_url'])) {
            $validated['site_url'] = $validated['site_url'] ? rtrim($validated['site_url'], '/') : null;
        }

        $conn->update($validated);

        return back()->with('success', 'Settings updated.');
    }

    /**
     * GET /s/{store_slug}/woo/connections/{connection}/logs
     */
    public function logs(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        $logs = WooSyncLog::where('connection_id', $connection)
            ->with('productLink.product')
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($logs);
    }

    /**
     * GET /s/{store_slug}/woo/plugin/download
     */
    public function downloadPlugin(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        if (!$conn->setup_token) {
            $conn->update(['setup_token' => Str::random(40)]);
        }

        // Path to the base plugin folder
        $pluginDir = public_path('downloads/venqore-sync');

        if (!is_dir($pluginDir)) {
            abort(404, 'Plugin base files not found. Please contact support.');
        }

        // Create a temporary zip file
        $tempZip = tempnam(sys_get_temp_dir(), 'venqore_sync_') . '.zip';

        $zip = new \ZipArchive();
        if ($zip->open($tempZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create temporary zip archive.');
        }

        // Add all files from public/downloads/venqore-sync to the zip under the "venqore-sync" folder
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($pluginDir),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $name => $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = 'venqore-sync/' . substr($filePath, strlen($pluginDir) + 1);
                $relativePath = str_replace('\\', '/', $relativePath);
                $zip->addFile($filePath, $relativePath);
            }
        }

        // Generate the venqore-config.php content
        $apiUrl = url('/');
        $configContent = "<?php\n" .
            "// Auto-generated VenQore Sync configuration file\n" .
            "if (!defined('ABSPATH')) exit;\n\n" .
            "define('VENQORE_SETUP_TOKEN', '" . addslashes($conn->setup_token) . "');\n" .
            "define('VENQORE_API_URL', '" . addslashes($apiUrl) . "');\n";

        $zip->addFromString('venqore-sync/venqore-config.php', $configContent);
        $zip->close();

        // Download and delete the temp file after sending
        return response()->download($tempZip, 'venqore-sync.zip', [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    /**
     * GET /downloads/venqore-sync.zip
     * Public static plugin download route, compiled on-the-fly from the live folder.
     */
    public function downloadStaticPlugin(Request $request)
    {
        $pluginDir = public_path('downloads/venqore-sync');

        if (!is_dir($pluginDir)) {
            abort(404, 'Plugin base files not found. Please contact support.');
        }

        // Create a temporary zip file
        $tempZip = tempnam(sys_get_temp_dir(), 'venqore_sync_static_') . '.zip';

        $zip = new \ZipArchive();
        if ($zip->open($tempZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Could not create temporary zip archive.');
        }

        // Add all files from public/downloads/venqore-sync to the zip under the "venqore-sync" folder
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($pluginDir),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $name => $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = 'venqore-sync/' . substr($filePath, strlen($pluginDir) + 1);
                $relativePath = str_replace('\\', '/', $relativePath);
                $zip->addFile($filePath, $relativePath);
            }
        }

        $zip->close();

        // Download and delete the temp file after sending
        return response()->download($tempZip, 'venqore-sync.zip', [
            'Content-Type' => 'application/zip',
        ])->deleteFileAfterSend(true);
    }

    /**
     * POST /s/{store_slug}/woo/connections/{connection}/scan
     */
    public function scanCatalog(Request $request, $store_slug, $connection)
    {
        $tenantId = $this->tenantId();
        $conn     = WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

        try {
            $engine = new SyncEngine($conn);
            $stats  = $engine->runInitialImport();

            $msg = "Scan complete! Matched {$stats['matched']} products by SKU. Unmatched products have been staged in the queue.";
            return back()->with('success', $msg);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('[WooSync] Scan Catalog failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return back()->with('error', 'Scan failed: ' . $e->getMessage());
        }
    }

    /**
     * GET /api/woo/plugin/check-update
     * Public endpoint to check and return metadata for custom WordPress plugin updates.
     */
    public function checkPluginUpdate(Request $request)
    {
        $pluginFile = public_path('downloads/venqore-sync/venqore-sync.php');

        if (!file_exists($pluginFile)) {
            return response()->json(['error' => 'Plugin file not found'], 404);
        }

        $latestVersion = '1.0.0';
        $content = file_get_contents($pluginFile);
        if (preg_match("/define\(\s*'VENQORE_SYNC_VERSION'\s*,\s*'([^']+)'\s*\);/", $content, $matches)) {
            $latestVersion = $matches[1];
        }

        $response = [
            'name'         => 'VenQore Sync',
            'slug'         => 'venqore-sync',
            'plugin'       => 'venqore-sync/venqore-sync.php',
            'new_version'  => $latestVersion,
            'url'          => 'https://venqore.com',
            'package'      => url('/downloads/venqore-sync.zip'),
            'sections'     => [
                'description' => 'Bidirectional real-time synchronization between WooCommerce and VenQore POS. Instantly synchronizes products, live inventory levels, and custom pricing tier matrices.',
                'changelog'   => '<h4>1.1.0</h4><ul><li>Added WooCommerce product column auto-styling to prevent vertical squishing.</li><li>Added instant synchronous catalog push failsafe.</li><li>Implemented WordPress Native Plugin Auto-Updating.</li></ul>'
            ]
        ];

        return response()->json($response);
    }

    // ─── Private Helper ───────────────────────────────────────────────────────

    private function connectionSummary(WooConnection $c): array
    {
        return [
            'id'                      => $c->id,
            'name'                    => $c->name,
            'site_url'                => $c->site_url,
            'uuid'                    => $c->uuid,
            'priority_source'         => $c->priority_source,
            'auto_stage_new_products' => $c->auto_stage_new_products,
            'sync_fields'             => $c->sync_fields,
            'status'                  => $c->status,
            'last_synced_at'          => $c->last_synced_at?->toIso8601String(),
            'product_links_count'     => $c->product_links_count ?? null,
            'staged_count'            => $c->staged_count ?? null,
        ];
    }
}
