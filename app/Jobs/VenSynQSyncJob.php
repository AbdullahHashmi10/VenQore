<?php

namespace App\Jobs;

use App\Models\EcommerceChannel;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SmartFulfillmentService;
use App\Services\VenSynQ\Platforms\AmazonClient;
use App\Services\VenSynQ\Platforms\TikTokClient;
use App\Services\VenSynQ\Platforms\EbayClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class VenSynQSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(
        SmartFulfillmentService $fulfillment,
        AmazonClient $amazon,
        TikTokClient $tiktok,
        EbayClient $ebay
    ): void {
        Log::info('VenSynQ: Background Sync Job Started.');

        $channels = EcommerceChannel::where('is_connected', true)->get();

        if ($channels->isEmpty()) {
            Log::info('VenSynQ: No active connected channels. Sync Job finished.');
            return;
        }

        foreach ($channels as $channel) {
            try {
                // Scope tenant container instance for multi-tenant Eloquent models
                $tenant = Tenant::find($channel->tenant_id);
                if (!$tenant) {
                    continue;
                }
                app()->instance('current.tenant', $tenant);

                // Fetch a valid user belonging to this tenant to register transactions
                $userId = User::where('tenant_id', $tenant->id)->first()?->id ?? 1;

                $channel->update(['sync_status' => 'syncing', 'sync_error_message' => null]);
                
                $client = match ($channel->platform) {
                    'amazon' => $amazon,
                    'tiktok' => $tiktok,
                    'ebay'   => $ebay,
                };

                // Fetch live orders
                $normalizedItems = $client->fetchOrders($channel->oauth_access_token ?? '');

                if (empty($normalizedItems)) {
                    $channel->update(['sync_status' => 'idle', 'last_synced_at' => now()]);
                    continue;
                }

                // Group items by platform order ID
                $groupedOrders = collect($normalizedItems)->groupBy('channel_order_id');
                $newSalesCount = 0;

                foreach ($groupedOrders as $orderId => $items) {
                    $itemsArray = $items->toArray();

                    // processDropshipSale checks for duplicate sales inside Step 0
                    $sale = $fulfillment->processDropshipSale(
                        $itemsArray,
                        $channel->id,
                        $tenant->id,
                        $userId
                    );

                    if ($sale->wasRecentlyCreated) {
                        $newSalesCount++;
                    }
                }

                $channel->update([
                    'sync_status'    => 'idle',
                    'last_synced_at' => now(),
                ]);

                Log::info("VenSynQ: Sync complete for channel {$channel->name}. Synced {$newSalesCount} new orders.");
            } catch (\Exception $e) {
                Log::error("VenSynQ: Sync failed for channel {$channel->name}: " . $e->getMessage());
                $channel->update([
                    'sync_status'        => 'error',
                    'sync_error_message' => 'Order synchronization failed: ' . $e->getMessage(),
                ]);
            }
        }

        Log::info('VenSynQ: Background Sync Job Finished.');
    }
}
