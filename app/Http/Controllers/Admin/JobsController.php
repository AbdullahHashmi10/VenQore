<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

/**
 * JobsController — Queue & Worker Diagnostics
 *
 * Provides a JSON metrics endpoint consumed by the platform JobsView panel.
 * Uses the standard Laravel `jobs` / `failed_jobs` tables so it works
 * whether or not Horizon is actively running.
 *
 * Routes (platform. prefix):
 *   GET  /VenQore/jobs/metrics  → platform.jobs.metrics (JSON)
 *   POST /VenQore/jobs/failed/{id}/retry → platform.jobs.retry
 *   DELETE /VenQore/jobs/failed/{id}     → platform.jobs.delete-failed
 *   POST /VenQore/jobs/failed/flush      → platform.jobs.flush-failed
 */
class JobsController extends Controller
{
    /**
     * Return live queue metrics as JSON.
     */
    public function metrics(): JsonResponse
    {
        // Pending jobs per queue
        $pending = DB::table('jobs')
            ->selectRaw('queue, COUNT(*) as count')
            ->groupBy('queue')
            ->orderByDesc('count')
            ->get();

        $totalPending = $pending->sum('count');

        // Failed jobs
        $failedRaw = DB::table('failed_jobs')
            ->latest('failed_at')
            ->limit(50)
            ->get()
            ->map(fn ($row) => [
                'id'         => $row->id,
                'uuid'       => $row->uuid ?? null,
                'queue'      => $row->queue,
                'connection' => $row->connection,
                'failed_at'  => $row->failed_at,
                'payload'    => $this->safeDecodePayload($row->payload),
                'exception'  => $this->truncate($row->exception, 500),
            ]);

        $totalFailed = DB::table('failed_jobs')->count();

        // Horizon stats (graceful — Horizon may not be running)
        $horizonStatus  = 'not_running';
        $horizonWorkers = 0;
        $processedRate  = null;

        try {
            if (class_exists(\Laravel\Horizon\Contracts\MasterSupervisorRepository::class)) {
                $masters = app(\Laravel\Horizon\Contracts\MasterSupervisorRepository::class)->all();
                if (count($masters) > 0) {
                    $horizonStatus = $masters[0]->status ?? 'running';
                    foreach ($masters as $master) {
                        $horizonWorkers += (int) ($master->workerCount ?? 0);
                    }
                }
            }
        } catch (\Throwable) { /* Horizon not configured or Redis unavailable */ }

        return response()->json([
            'pending'         => $pending,
            'total_pending'   => $totalPending,
            'failed'          => $failedRaw,
            'total_failed'    => $totalFailed,
            'horizon_status'  => $horizonStatus,
            'horizon_workers' => $horizonWorkers,
            'processed_rate'  => $processedRate,
        ]);
    }

    /**
     * Retry a specific failed job.
     */
    public function retryFailed(Request $request, string $id): JsonResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => [$id]]);
            return response()->json(['success' => true, 'message' => "Job {$id} queued for retry."]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Delete a specific failed job.
     */
    public function deleteFailed(Request $request, string $id): JsonResponse
    {
        DB::table('failed_jobs')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Flush ALL failed jobs.
     */
    public function flushFailed(): JsonResponse
    {
        try {
            Artisan::call('queue:flush');
            return response()->json(['success' => true, 'message' => 'All failed jobs have been flushed.']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    private function safeDecodePayload(string $payload): array
    {
        try {
            $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
            return [
                'displayName' => $decoded['displayName'] ?? $decoded['job'] ?? 'Unknown Job',
                'attempts'    => $decoded['attempts'] ?? 0,
            ];
        } catch (\Throwable) {
            return ['displayName' => 'Unknown Job', 'attempts' => 0];
        }
    }

    private function truncate(string $text, int $length): string
    {
        return mb_strlen($text) > $length ? mb_substr($text, 0, $length) . '…' : $text;
    }
}
