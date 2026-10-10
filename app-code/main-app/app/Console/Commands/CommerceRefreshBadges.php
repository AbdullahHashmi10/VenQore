<?php

namespace App\Console\Commands;

use App\Services\Commerce\StorefrontBadges;
use Illuminate\Console\Command;

class CommerceRefreshBadges extends Command
{
    protected $signature = 'commerce:badges-refresh';
    protected $description = 'Recompute automatic store badges (platform overrides are never changed).';

    public function handle(StorefrontBadges $badges): int
    {
        foreach ($badges->refresh() as $key => $n) {
            $this->line(str_pad($key, 18) . $n);
        }
        return self::SUCCESS;
    }
}
