<?php

namespace App\Console\Commands;

use App\Services\InvoiceAssistant\DraftRepository;
use App\Services\InvoiceAssistant\Speech\SpeechTranscriptionService;
use Illuminate\Console\Command;

/**
 * Housekeeping for the conversational invoice assistant:
 *  - expires active drafts past their TTL,
 *  - deletes expired / cancelled / failed draft CONTENT after the retention window,
 *  - sweeps recording temp files left behind by a crashed request.
 * Touches no financial table.
 */
class PruneInvoiceAssistantDrafts extends Command
{
    protected $signature = 'invoice-assistant:prune';

    protected $description = 'Expire and delete old invoice-assistant drafts and leftover temporary recordings';

    public function handle(DraftRepository $repo): int
    {
        $drafts = $repo->prune();
        $files = SpeechTranscriptionService::sweepTemp();
        $this->info("Pruned {$drafts} draft(s); removed {$files} temporary recording(s).");

        return self::SUCCESS;
    }
}
