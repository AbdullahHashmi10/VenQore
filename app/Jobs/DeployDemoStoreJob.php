<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Runs `demo:full-deploy` (or `demo:restore` for quick resets) as a queued
 * job instead of spawning a `Symfony\Process` CLI subprocess from a web
 * request.
 *
 * The previous implementation in DemoStoreController::deploy() used
 * `new Process([...])` + `register_shutdown_function($process->wait())`.
 * That depends on `proc_open` being enabled for the PHP-FPM/web SAPI (it
 * is usually disabled on shared/managed hosting), on PhpExecutableFinder
 * correctly resolving a CLI binary (it often doesn't under FPM), and on
 * holding a web worker open for up to 5 minutes (nginx/Apache will 504
 * long before that, and disable_functions blocks proc_open outright on
 * many hosts). None of that is required here — Laravel's queue can run
 * this as an ordinary background job with no subprocess at all.
 *
 * Progress is written to the same cache-key + log-file contract the
 * existing DemoStoreTab.jsx terminal widget already polls
 * (`demodeploy_job_{jobId}` in cache, `storage/logs/demodeploy-{jobId}.log`
 * on disk), so the frontend and the deployStatus()/deployCleanup()
 * controller endpoints needed no changes.
 */
class DeployDemoStoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutes — a full 5-year reseed can be slow
    public int $tries = 1;

    public function __construct(
        public string $jobId,
        public ?string $onlyStr = null,
        public string $mode = 'full-deploy', // 'full-deploy' or 'restore'
    ) {
    }

    public function handle(): void
    {
        $outFile = storage_path("logs/demodeploy-{$this->jobId}.log");

        $write = function (string $line) use ($outFile) {
            file_put_contents($outFile, $line . "\n", FILE_APPEND);
        };

        $write('STARTED');

        $exitCode = 1;

        try {
            if ($this->mode === 'restore') {
                $exitCode = Artisan::call('demo:restore', ['--force' => true]);
            } else {
                $args = ['--no-interaction' => true];
                if ($this->onlyStr) {
                    $args['--only'] = $this->onlyStr;
                }
                $exitCode = Artisan::call('demo:full-deploy', $args);
            }

            $output = Artisan::output();
            foreach (preg_split('/\r\n|\r|\n/', $output) as $line) {
                if ($line !== '') {
                    $write($line);
                }
            }
        } catch (\Throwable $e) {
            $write('ERROR: ' . $e->getMessage());
            Log::error('DeployDemoStoreJob failed: ' . $e->getMessage(), [
                'job_id' => $this->jobId,
                'mode'   => $this->mode,
                'trace'  => $e->getTraceAsString(),
            ]);
            $exitCode = 1;
        }

        $state = Cache::get("demodeploy_job_{$this->jobId}", []);
        $state['done']     = true;
        $state['passed']   = ($exitCode === 0);
        $state['exitCode'] = $exitCode;
        Cache::put("demodeploy_job_{$this->jobId}", $state, 600);

        $write("EXIT_CODE:{$exitCode}");
    }

    public function failed(\Throwable $e): void
    {
        $outFile = storage_path("logs/demodeploy-{$this->jobId}.log");
        file_put_contents($outFile, "\nJOB FAILED: {$e->getMessage()}\nEXIT_CODE:1\n", FILE_APPEND);

        $state = Cache::get("demodeploy_job_{$this->jobId}", []);
        $state['done']     = true;
        $state['passed']   = false;
        $state['exitCode'] = 1;
        Cache::put("demodeploy_job_{$this->jobId}", $state, 600);
    }
}
