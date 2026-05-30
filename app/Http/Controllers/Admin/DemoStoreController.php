<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\DemoVisitorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DemoStoreController extends Controller
{
    private string $phpBin;
    private string $vendorBin;
    private string $config;
    private string $rootPath;

    public function __construct()
    {
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
        $demo = Tenant::where('is_demo', true)->first();

        if (!$demo) {
            return response()->json(['exists' => false]);
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
            'exists'        => true,
            'slug'          => $demo->slug,
            'status'        => $demo->status,
            'last_reset_at' => $demo->demo_reset_at?->diffForHumans() ?? 'Never',
            'live_now'      => $liveNow,
            'today'         => $totalToday,
            'this_month'    => $totalThisMonth,
            'total_all'     => $demo->demo_visit_count ?? 0,
            'visitor_chart' => $visitorChart,
            'role_breakdown'=> $roleBreakdown->map(fn($r) => [
                'role'  => $r->role,
                'total' => (int) $r->total,
            ])->values(),
            'data_counts'   => $dataCounts,
        ]);
    }

    /**
     * Quick reset — re-run seeders without full wipe (fast, ~15s).
     */
    public function reset()
    {
        $demo = Tenant::where('is_demo', true)->firstOrFail();

        Artisan::call('demo:reset');

        return back()->with('success', 'Demo store reset successfully.');
    }

    public function deploy(Request $request)
    {
        $only = $request->input('only');
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

            Artisan::call("demo:full-deploy --only={$onlyStr}");
        } else {
            Artisan::call('demo:full-deploy');
        }

        return response()->json(['message' => 'Demo deploy initiated.']);
    }

    /**
     * Spawn the page health test process and return a polling job_id.
     */
    public function runTests()
    {
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
