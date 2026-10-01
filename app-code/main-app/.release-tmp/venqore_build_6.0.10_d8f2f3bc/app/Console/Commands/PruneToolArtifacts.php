<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * tools:prune-artifacts — deletes generated tool artifacts older than 24h.
 *
 * Generated files (bulk barcode ZIPs, PDF sheets, etc.) live at
 * storage/app/tools/{uuid}.{ext} and are served only via a signed,
 * expiring URL (see ToolsHubController::download). Nothing in the tools
 * program should ever persist a user's uploaded input — this command only
 * cleans up files WE generated as output.
 *
 * Scheduled daily in routes/console.php.
 * See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §4.6.
 */
class PruneToolArtifacts extends Command
{
    protected $signature = 'tools:prune-artifacts';
    protected $description = 'Delete generated /tools artifacts older than 24 hours from storage/app/tools.';

    public function handle(): int
    {
        $disk = Storage::disk('local');

        if (!$disk->exists('tools')) {
            $this->info('No tools artifact directory yet — nothing to prune.');
            return self::SUCCESS;
        }

        $cutoff = now()->subDay();
        $deleted = 0;

        foreach ($disk->files('tools') as $file) {
            $modifiedAt = $disk->lastModified($file);
            if ($modifiedAt !== false && $modifiedAt < $cutoff->timestamp) {
                $disk->delete($file);
                $deleted++;
            }
        }

        $this->info("Pruned {$deleted} expired tool artifact(s).");

        return self::SUCCESS;
    }
}
