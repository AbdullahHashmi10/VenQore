<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PruneScanImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:prune-scan-images {--days=90 : The retention period in days}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune document scan images older than retention period (default 90 days) while preserving extracted transaction data.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $cutoff = Carbon::now()->subDays($days);

        $this->info("Pruning scan images older than {$days} days (before {$cutoff->toDateTimeString()})...");

        // 1. Prune stored files in smartcapture storage
        $prunedFilesCount = 0;
        $directories = ['smart_capture', 'scans', 'temp_scans', 'documents/scans'];

        foreach ($directories as $dir) {
            if (Storage::disk('local')->exists($dir)) {
                $files = Storage::disk('local')->files($dir);
                foreach ($files as $file) {
                    $lastModified = Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file));
                    if ($lastModified->lt($cutoff)) {
                        Storage::disk('local')->delete($file);
                        $prunedFilesCount++;
                    }
                }
            }
        }

        // 2. Clear payload/base64 columns in raw AI events older than cutoff date if stored
        $prunedDbRows = 0;
        if (DB::getSchemaBuilder()->hasTable('ai_usage_events') && DB::getSchemaBuilder()->hasColumn('ai_usage_events', 'raw_payload')) {
            $prunedDbRows = DB::table('ai_usage_events')
                ->where('created_at', '<', $cutoff)
                ->whereNotNull('raw_payload')
                ->update(['raw_payload' => null]);
        }

        $msg = "PruneScanImages: Successfully deleted {$prunedFilesCount} image files and cleared raw payload from {$prunedDbRows} log records older than {$days} days.";
        $this->info($msg);
        Log::info($msg);

        return 0;
    }
}
