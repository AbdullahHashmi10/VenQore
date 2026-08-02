<?php

namespace App\Jobs;

use App\Models\EcommerceChannel;
use App\Models\Tenant;
use App\Services\VenSynQ\SyncOrchestrator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * VenSynQSyncJob — scheduled marketplace order ingestion.
 *
 * ══ T16 AUDIT: four defects fixed ═════════════════════════════════════════════
 *
 * 1. SILENT TOTAL FAILURE (critical).
 *    The job ran `EcommerceChannel::where('is_connected', true)->get()`.
 *    EcommerceChannel uses the HasTenant trait, whose global scope falls through
 *    to `whereRaw('1 = 0')` when no tenant is bound and no user is authenticated
 *    — exactly the situation inside a queue worker. The query therefore returned
 *    an empty set on every run and the job logged "No active connected channels"
 *    forever while orders piled up unsynced. Now uses withoutTenantScope() and
 *    binds each channel's tenant explicitly before touching tenant-scoped models.
 *
 * 2. UNCATCHABLE ERROR.
 *    `match ($channel->platform)` had no default arm. Any platform value outside
 *    the three hardcoded ones threw \UnhandledMatchError, which is an Error and
 *    NOT caught by `catch (\Exception)`. One unexpected row aborted the whole run
 *    and left every channel stranded in sync_status='syncing'. Resolution now
 *    goes through PlatformRegistry (catchable InvalidArgumentException) and the
 *    orchestrator catches Throwable.
 *
 * 3. NO OVERLAP PROTECTION (explicitly called out in the ticket).
 *    Nothing stopped a second copy starting while the first was mid-flight, so a
 *    slow marketplace API produced concurrent runs racing on the same channel
 *    rows. Now ShouldBeUnique with a 15-minute lock ceiling.
 *
 * 4. UNBOUNDED MEMORY.
 *    ->get() hydrated every channel across every tenant at once. Now chunked.
 */
class VenSynQSyncJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Give up after 10 minutes rather than occupying a worker indefinitely. */
    public int $timeout = 600;

    /** Marketplace APIs are flaky; retry twice before parking in failed_jobs. */
    public int $tries = 3;

    /** Exponential-ish backoff between retries, in seconds. */
    public array $backoff = [60, 300];

    /**
     * Ceiling on the uniqueness lock. If a worker is killed mid-run, the lock
     * self-releases after 15 minutes so the schedule is never permanently wedged.
     */
    public int $uniqueFor = 900;

    /**
     * One lock for the whole job — this is a platform-wide sweep, not per-tenant.
     */
    public function uniqueId(): string
    {
        return 'vensynq-sync-all';
    }

    public function handle(SyncOrchestrator $orchestrator): void
    {
        if (!config('vensynq.enabled', false)) {
            return;
        }

        Log::info('[VenSynQ] Scheduled sync started.');

        // Snapshot the ambient tenant binding so we can restore it afterwards.
        // Without this, whatever tenant happened to be processed last would leak
        // into any subsequent job handled by the same worker process.
        $previousTenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        $totalSynced = 0;
        $totalFailed = 0;
        $startedAt   = microtime(true);

        try {
            EcommerceChannel::withoutTenantScope()
                ->where('is_connected', true)
                ->orderBy('id')
                ->chunkById(50, function ($channels) use ($orchestrator, &$totalSynced, &$totalFailed) {
                    foreach ($channels as $channel) {
                        $tenant = Tenant::find($channel->tenant_id);

                        if (!$tenant) {
                            Log::warning('[VenSynQ] Channel points at a missing tenant; skipping.', [
                                'channel_id' => $channel->id,
                                'tenant_id'  => $channel->tenant_id,
                            ]);
                            continue;
                        }

                        $channelStart = microtime(true);

                        // syncChannel() never throws — it records failures on the
                        // channel row so the dashboard Error Inspector can retry.
                        $outcome = $orchestrator->syncChannel($channel, $tenant);

                        $channel->forceFill([
                            'last_sync_duration_ms' => (int) round((microtime(true) - $channelStart) * 1000),
                        ])->save();

                        $totalSynced += $outcome['new_orders'];
                        $totalFailed += $outcome['ok'] ? 0 : 1;
                    }
                });
        } catch (Throwable $e) {
            Log::error('[VenSynQ] Scheduled sync aborted.', ['error' => $e->getMessage()]);
            throw $e;
        } finally {
            // Always restore the container binding, even on the throw path.
            if ($previousTenant) {
                app()->instance('current.tenant', $previousTenant);
            } else {
                app()->forgetInstance('current.tenant');
            }
        }

        Log::info('[VenSynQ] Scheduled sync finished.', [
            'orders_imported' => $totalSynced,
            'channels_failed' => $totalFailed,
            'duration_ms'     => (int) round((microtime(true) - $startedAt) * 1000),
        ]);
    }

    /**
     * Runs when all retries are exhausted. Without this the channels stay pinned
     * at sync_status='syncing' and the dashboard shows a spinner that never ends.
     */
    public function failed(?Throwable $exception): void
    {
        Log::error('[VenSynQ] Sync job permanently failed.', [
            'error' => $exception?->getMessage(),
        ]);

        EcommerceChannel::withoutTenantScope()
            ->where('sync_status', 'syncing')
            ->update([
                'sync_status'        => 'error',
                'sync_error_message' => 'Background sync worker stopped unexpectedly. Press Retry to run it again.',
                'last_error_at'      => now(),
            ]);
    }
}
