<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\DeployDemoStoreJob;
use App\Models\Tenant;
use App\Models\DemoVisitorLog;
use App\Services\DemoStoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DemoStoreController extends Controller
{
    private string $phpBin;
    private string $vendorBin;
    private string $config;
    private string $rootPath;

    public function __construct()
    {
        // Only used by runTests() below, which spawns `pest` as a
        // subprocess. That command is gated on file_exists($this->vendorBin)
        // before it ever runs, since `vendor/bin/pest` is a dev-only
        // dependency and won't exist on a --no-dev production install —
        // this is a diagnostic/dev tool, not part of the demo store
        // deploy/reset path (which no longer spawns subprocesses at all;
        // see DeployDemoStoreJob).
        $finder = new \Symfony\Component\Process\PhpExecutableFinder();
        $this->phpBin    = $finder->find() ?: 'php';
        $this->vendorBin = str_replace('\\', '/', base_path('vendor/bin/pest'));
        $this->config    = str_replace('\\', '/', base_path('Tester/phpunit.xml'));
        $this->rootPath  = str_replace('\\', '/', base_path());
    }

    /**
     * Return demo store status + analytics as JSON (used by the SuperAdmin tab).
     */
    public function status()
    {
        // Must resolve to the Golden Master specifically, not any live
        // visitor's ephemeral demo clone (see DemoSessionService).
        $demo = Tenant::where('is_golden_master', true)->first();

        if (!$demo) {
            return response()->json(['exists' => false, 'queue_worker_ok' => $this->queueWorkerLooksAlive()]);
        }

        // Visitor stats
        $last30 = DemoVisitorLog::lastDays(30);
        $roleBreakdown = DemoVisitorLog::roleBreakdown(30);

        // Build a full 30-day array (fill zeros for missing days)
        $visitorChart = collect(range(29, 0))->map(function ($daysAgo) use ($last30) {
            $date = now()->subDays($daysAgo)->toDateString();
            $found = $last30->firstWhere('log_date', $date);
            return [
                'date'  => now()->subDays($daysAgo)->format('M d'),
                'total' => $found ? (int) $found->total : 0,
            ];
        })->values();

        $totalThisMonth = DemoVisitorLog::where('log_date', '>=', now()->startOfMonth()->toDateString())
            ->sum('visit_count');

        $totalToday = DemoVisitorLog::where('log_date', now()->toDateString())
            ->sum('visit_count');

        $liveNow = max(0, (int) Cache::get('demo_visit_live', 0));

        // Count demo data
        $dataCounts = $this->getDataCounts($demo->id);

        return response()->json([
            'exists'          => true,
            'slug'            => $demo->slug,
            'status'          => $demo->status,
            'last_reset_at'   => $demo->demo_reset_at?->diffForHumans() ?? 'Never',
            'live_now'        => $liveNow,
            'today'           => $totalToday,
            'this_month'      => $totalThisMonth,
            'total_all'       => $demo->demo_visit_count ?? 0,
            'visitor_chart'   => $visitorChart,
            'role_breakdown'  => $roleBreakdown->map(fn($r) => [
                'role'  => $r->role,
                'total' => (int) $r->total,
            ])->values(),
            'data_counts'     => $dataCounts,
            'queue_worker_ok' => $this->queueWorkerLooksAlive(),
            'pest_available'  => file_exists($this->vendorBin),
        ]);
    }

    /**
     * Quick reset — restore from the Golden Master snapshot (fast, ~seconds).
     * Dispatched via queue rather than run synchronously so a slow restore
     * (or the full-deploy fallback when no snapshot exists yet) can't tie
     * up the web request.
     */
    public function reset(Request $request)
    {
        // Self-heals instead of firstOrFail()'ing — previously this line
        // alone made Reset unusable on a fresh server, because it 404'd
        // before demo:reset ever got a chance to create the tenant.
        DemoStoreService::goldenMaster();

        $jobId = \Illuminate\Support\Str::uuid()->toString();
        $this->initJobLog($jobId);

        $this->dispatchDeployJob($jobId, mode: 'restore');

        if ($request->wantsJson() || $request->inertia()) {
            return response()->json(['job_id' => $jobId]);
        }

        return back()->with('success', 'Demo store reset initiated.');
    }

    public function deploy(Request $request)
    {
        // Ensure the tenant row exists before we even queue the job, so the
        // dashboard's "No Demo Store Found" empty state has something to
        // resolve to as soon as the job starts.
        DemoStoreService::goldenMaster();

        $only = $request->input('only');
        $onlyStr = '';
        if ($only) {
            $modules = array_map('trim', explode(',', $only));
            $expanded = [];
            foreach ($modules as $module) {
                if ($module === 'parties') {
                    $expanded[] = 'customers';
                    $expanded[] = 'suppliers';
                } elseif ($module === 'products') {
                    $expanded[] = 'warehouse';
                    $expanded[] = 'categories';
                    $expanded[] = 'products';
                } elseif ($module === 'purchases') {
                    $expanded[] = 'warehouse';
                    $expanded[] = 'categories';
                    $expanded[] = 'products';
                    $expanded[] = 'suppliers';
                    $expanded[] = 'purchases';
                } elseif ($module === 'sales') {
                    $expanded[] = 'warehouse';
                    $expanded[] = 'categories';
                    $expanded[] = 'products';
                    $expanded[] = 'customers';
                    $expanded[] = 'sales';
                } elseif ($module === 'expenses') {
                    $expanded[] = 'expenses';
                } else {
                    $expanded[] = $module;
                }
            }
            $expanded = array_unique($expanded);
            $onlyStr = implode(',', $expanded);
        }

        $jobId = \Illuminate\Support\Str::uuid()->toString();
        $this->initJobLog($jobId);

        $this->dispatchDeployJob($jobId, mode: 'full-deploy', onlyStr: $onlyStr ?: null);

        return response()->json(['job_id' => $jobId]);
    }

    /**
     * Write the sentinel log file + cache entry the frontend poller
     * expects to see immediately, before the job has necessarily run.
     */
    private function initJobLog(string $jobId): void
    {
        $outFile = storage_path("logs/demodeploy-{$jobId}.log");
        file_put_contents($outFile, "STARTED\n");

        Cache::put("demodeploy_job_{$jobId}", [
            'outFile' => $outFile,
            'started' => now()->toISOString(),
            'done'    => false,
            'passed'  => null,
        ], 600); // 10 min TTL
    }

    /**
     * Dispatch the deploy/restore job onto the queue. Previously this
     * spawned a `Symfony\Process` CLI subprocess directly from the web
     * request, which depends on `proc_open` being enabled for the
     * PHP-FPM/web SAPI — disabled on most shared/managed hosting — and
     * blocked the web worker for up to 5 minutes waiting on it. The queue
     * has no such dependency, but it does require a worker
     * (`php artisan queue:work` / Horizon) to actually be running.
     *
     * Since we can't guarantee a worker is configured on every deployment
     * target yet, this includes a safety net: if nothing has picked the
     * job off the queue within a few seconds, run it synchronously inline
     * instead (dispatchSync) so the dashboard button still works — just
     * without the non-blocking benefit — rather than hanging forever with
     * "STARTED" and nothing else.
     */
    private function dispatchDeployJob(string $jobId, string $mode, ?string $onlyStr = null): void
    {
        DeployDemoStoreJob::dispatch($jobId, $onlyStr, $mode);

        if (!$this->queueWorkerLooksAlive()) {
            // No evidence a worker is running — don't leave the user
            // staring at "STARTED" forever. Run inline as a fallback.
            // This blocks this request, same as the old subprocess did,
            // but only as a degraded fallback, not the default path, and
            // it can't fail due to proc_open/PhpExecutableFinder issues.
            \Illuminate\Support\Facades\Log::warning(
                "DemoStoreController: no live queue worker detected — running job {$jobId} inline as a fallback."
            );
            (new DeployDemoStoreJob($jobId, $onlyStr, $mode))->handle();
        }
    }

    /**
     * Heuristic check for whether a queue worker is actually processing
     * jobs: QueueHeartbeatJob is dispatched every minute by the scheduler
     * (routes/console.php) and, when a worker picks it up, refreshes the
     * `queue_worker_last_heartbeat_ok` cache key for ~3 minutes. If no
     * worker has run recently, this key expires and we fall back to
     * running jobs inline. See deploy/venqore-queue-worker.supervisor.conf
     * for how to actually set up a worker on the server.
     */
    private function queueWorkerLooksAlive(): bool
    {
        return (bool) Cache::get('queue_worker_last_heartbeat_ok', false);
    }

    /**
     * Poll endpoint for demo deploy logs.
     */
    public function deployStatus(string $jobId)
    {
        $state = Cache::get("demodeploy_job_{$jobId}");

        if (!$state) {
            return response()->json(['error' => 'Job not found or expired.'], 404);
        }

        $outFile = $state['outFile'];
        $lines   = [];

        if (file_exists($outFile)) {
            $lines = file($outFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        }

        return response()->json([
            'done'    => (bool) $state['done'],
            'passed'  => $state['passed'],
            'lines'   => $lines,
            'started' => $state['started'],
        ]);
    }

    /**
     * Cleanup log file for deploy.
     */
    public function deployCleanup(string $jobId)
    {
        $state = Cache::get("demodeploy_job_{$jobId}");

        if ($state && isset($state['outFile']) && file_exists($state['outFile'])) {
            @unlink($state['outFile']);
        }

        Cache::forget("demodeploy_job_{$jobId}");

        return response()->json(['ok' => true]);
    }

    /**
     * Spawn the page health test process and return a polling job_id.
     */
    public function runTests()
    {
        // Gate instead of spawning a process that can't possibly run.
        // vendor/bin/pest is a dev-only dependency — a production install
        // built with `composer install --no-dev` won't have it, so this
        // used to silently write "STARTED" to the log file and then hang
        // forever (the subprocess would throw immediately, but nothing
        // surfaced that to the frontend beyond a stuck "Running..." state).
        if (!file_exists($this->vendorBin)) {
            return response()->json([
                'error'     => 'Page Health tests are unavailable on this server: vendor/bin/pest was not found. ' .
                               'This usually means the app was deployed with `composer install --no-dev`, which is correct for production. ' .
                               'Run this from a dev/staging environment with dev dependencies installed instead.',
                'available' => false,
            ], 501);
        }

        $jobId   = \Illuminate\Support\Str::uuid()->toString();
        $outFile = storage_path("logs/pagehealth-{$jobId}.log");

        // Write sentinel immediately so the poller knows the job exists
        file_put_contents($outFile, "STARTED\n");

        $cmd = [
            $this->phpBin,
            $this->vendorBin,
            '--configuration=' . $this->config,
            str_replace('\\', '/', base_path('Tester/tests/Feature/DemoStore/PageHealthTest.php')),
            '--colors=never',       // strip ANSI codes — not needed in terminal widget
            '--no-coverage',
        ];

        $process = new \Symfony\Component\Process\Process($cmd, $this->rootPath);
        $process->setTimeout(180); // 3 min max

        // Start and stream output to the log file in real-time
        $process->start(function ($type, $buffer) use ($outFile) {
            file_put_contents($outFile, $buffer, FILE_APPEND);
        });

        // Store job metadata in cache for the poller
        Cache::put("pagehealth_job_{$jobId}", [
            'outFile' => $outFile,
            'started' => now()->toISOString(),
            'done'    => false,
            'passed'  => null,
        ], 600); // 10 min TTL

        // Register a shutdown function so the process finishes even after
        // the HTTP response is sent back to the browser
        register_shutdown_function(function () use ($process, $jobId, $outFile) {
            $process->wait();
            $exitCode = $process->getExitCode();

            $state            = Cache::get("pagehealth_job_{$jobId}", []);
            $state['done']    = true;
            $state['passed']  = ($exitCode === 0);
            $state['exitCode']= $exitCode;
            Cache::put("pagehealth_job_{$jobId}", $state, 600);

            // Write terminator line so the frontend knows the run is over
            file_put_contents($outFile, "\nEXIT_CODE:{$exitCode}\n", FILE_APPEND);
        });

        return response()->json(['job_id' => $jobId]);
    }

    /**
     * Poll endpoint — returns all output lines captured so far plus done/passed state.
     */
    public function testStatus(string $jobId)
    {
        $state = Cache::get("pagehealth_job_{$jobId}");

        if (!$state) {
            return response()->json(['error' => 'Job not found or expired.'], 404);
        }

        $outFile = $state['outFile'];
        $lines   = [];

        if (file_exists($outFile)) {
            $lines = file($outFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        }

        return response()->json([
            'done'    => (bool) $state['done'],
            'passed'  => $state['passed'],
            'lines'   => $lines,
            'started' => $state['started'],
        ]);
    }

    /**
     * Cleanup — delete the temp log file after the frontend is done with it.
     */
    public function testCleanup(string $jobId)
    {
        $state = Cache::get("pagehealth_job_{$jobId}");

        if ($state && isset($state['outFile']) && file_exists($state['outFile'])) {
            @unlink($state['outFile']);
        }

        Cache::forget("pagehealth_job_{$jobId}");

        return response()->json(['ok' => true]);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private function getDataCounts(int $tenantId): array
    {
        $tables = [
            'products'    => 'Products',
            'sales'       => 'Sales',
            'purchases'   => 'Purchases',
            'expenses'    => 'Expenses',
            'parties'     => 'Customers & Suppliers',
            'proposals'   => 'Proposals',
        ];

        $counts = [];
        foreach ($tables as $table => $label) {
            try {
                $query = DB::table($table)->where('tenant_id', $tenantId);
                if (Schema::hasColumn($table, 'deleted_at')) {
                    $query->whereNull('deleted_at');
                }
                $counts[$table] = $query->count();
            } catch (\Exception $e) {
                $counts[$table] = 0;
            }
        }

        return $counts;
    }
}
