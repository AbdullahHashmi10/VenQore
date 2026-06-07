<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\PhpExecutableFinder;

/**
 * SmokeTestController — Pillar 3: Live Test Runner
 *
 * Spawns the production smoke test suite as a background process,
 * then returns a job_id the browser polls every 800ms to read output
 * as it streams in. Completely avoids SSE complexity — pure polling
 * against a temp log file works on every hosting setup.
 *
 * Flow:
 *   POST /VenQore/smoke-tests/run       → spawns process, returns job_id
 *   GET  /VenQore/smoke-tests/{job_id}  → returns lines read so far + done flag
 *   DELETE /VenQore/smoke-tests/{job_id}→ cleanup temp log file
 *
 * Path resolution strategy (works on Windows dev + Linux production):
 *   PhpExecutableFinder → finds the real PHP CLI executable (avoids CGI/lsphp issues)
 *   base_path()  → Laravel's absolute project root (resolves on any OS)
 *   Forward slashes in all paths (PHP on Windows accepts them too)
 */
class SmokeTestController extends Controller
{
    private string $phpBin;
    private string $vendorBin;
    private string $config;
    private string $rootPath;

    public function __construct()
    {
        // Find the actual PHP CLI executable. If we use PHP_BINARY on a web server, 
        // it might return php-fpm or lsphp (CGI), which will output the #! shebang 
        // in vendor/bin/pest and cause namespace errors.
        $finder = new PhpExecutableFinder();
        $this->phpBin    = $finder->find() ?: 'php';

        // base_path() resolves to the project root on any OS, with the OS-correct separator.
        // We normalise to forward slashes — PHP accepts them on Windows too.
        $this->vendorBin = str_replace('\\', '/', base_path('vendor/bin/pest'));
        $this->config    = str_replace('\\', '/', base_path('Tester/phpunit.xml'));
        $this->rootPath  = str_replace('\\', '/', base_path());
    }

    /**
     * Spawn the smoke test process and return a polling job_id.
     */
    public function run(): JsonResponse
    {
        $jobId   = Str::uuid()->toString();
        $outFile = storage_path("logs/smoke-{$jobId}.log");

        // Write sentinel immediately so the poller knows the job exists
        file_put_contents($outFile, "STARTED\n");

        $cmd = [
            $this->phpBin,
            $this->vendorBin,
            '--configuration=' . $this->config,
            '--testsuite=Smoke',
            '--colors=never',       // strip ANSI codes — not needed in terminal widget
            '--no-coverage',
        ];

        $process = new Process($cmd, $this->rootPath);
        $process->setTimeout(180); // 3 min max

        // Start and stream output to the log file in real-time
        $process->start(function ($type, $buffer) use ($outFile) {
            file_put_contents($outFile, $buffer, FILE_APPEND);
        });

        // Store job metadata in cache for the poller
        Cache::put("smoke_job_{$jobId}", [
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

            $state            = Cache::get("smoke_job_{$jobId}", []);
            $state['done']    = true;
            $state['passed']  = ($exitCode === 0);
            $state['exitCode']= $exitCode;
            Cache::put("smoke_job_{$jobId}", $state, 600);

            // Write terminator line so the frontend knows the run is over
            file_put_contents($outFile, "\nEXIT_CODE:{$exitCode}\n", FILE_APPEND);
        });

        return response()->json(['job_id' => $jobId]);
    }

    /**
     * Poll endpoint — returns all output lines captured so far plus done/passed state.
     */
    public function status(string $jobId): JsonResponse
    {
        $state = Cache::get("smoke_job_{$jobId}");

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
    public function cleanup(string $jobId): JsonResponse
    {
        $state = Cache::get("smoke_job_{$jobId}");

        if ($state && isset($state['outFile']) && file_exists($state['outFile'])) {
            @unlink($state['outFile']);
        }

        Cache::forget("smoke_job_{$jobId}");

        return response()->json(['ok' => true]);
    }
}
