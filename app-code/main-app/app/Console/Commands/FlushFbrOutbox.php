<?php

namespace App\Console\Commands;

use App\Services\Fbr\FbrOutbox;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * fbr:flush-outbox — send every FBR report that is due: sales FBR could not
 * be reached for when they were rung, and reports a crashed process left
 * half-sent. Scheduled every minute; safe to run by hand and in parallel
 * (each row is claimed atomically).
 */
class FlushFbrOutbox extends Command
{
    protected $signature = 'fbr:flush-outbox {--tenant= : Only this tenant ID} {--limit=100 : Most reports to send in one run}';

    protected $description = 'Send sale reports to FBR that are waiting in the outbox.';

    public function handle(): int
    {
        if (! FbrOutbox::available()) {
            $this->warn('The fbr_outbox table does not exist yet. Run the migrations first.');
            return self::SUCCESS;
        }

        $counts = [];
        foreach (FbrOutbox::due($this->option('tenant') ? (int) $this->option('tenant') : null, (int) $this->option('limit')) as $id) {
            $status = FbrOutbox::deliver($id) ?? 'skipped';
            $counts[$status] = ($counts[$status] ?? 0) + 1;
        }

        $waiting = DB::table('fbr_outbox')->whereIn('status', ['pending', 'failed', 'sending'])->count();
        $needsPerson = DB::table('fbr_outbox')->whereIn('status', ['rejected', 'dead'])->count();
        $this->info('Sent: ' . ($counts['sent'] ?? 0) . ', will retry: ' . ($counts['failed'] ?? 0)
            . ', rejected: ' . ($counts['rejected'] ?? 0) . ', gave up: ' . ($counts['dead'] ?? 0)
            . ". Still waiting: {$waiting}. Needing a person: {$needsPerson}.");

        return self::SUCCESS;
    }
}
