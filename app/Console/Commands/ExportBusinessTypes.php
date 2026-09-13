<?php

namespace App\Console\Commands;

use App\Support\BusinessTypes;
use Illuminate\Console\Command;

/**
 * Writes resources/js/Data/businessTypes.json from config/business_types.php,
 * so the public site's "85+" list and the builder read the same catalogue.
 * BusinessTypeCatalogueTest fails if the JSON is stale.
 */
class ExportBusinessTypes extends Command
{
    protected $signature = 'vq:business-types:export';

    protected $description = 'Export the business-type catalogue to resources/js/Data/businessTypes.json';

    public const PATH = 'resources/js/Data/businessTypes.json';

    public function handle(): int
    {
        file_put_contents(base_path(self::PATH), self::json());
        $this->info('Wrote ' . self::PATH . ' (' . count(BusinessTypes::all()) . ' types).');

        return self::SUCCESS;
    }

    public static function json(): string
    {
        $sectors = [];
        foreach (BusinessTypes::sectors() as $key => $s) {
            $sectors[] = ['key' => $key, 'name' => $s['name'], 'short' => $s['short']];
        }

        $types = [];
        foreach (BusinessTypes::all() as $key => $t) {
            $types[] = array_filter([
                'key'    => $key,
                'sector' => $t['sector'],
                'name'   => $t['label'],
                'note'   => $t['note'] ?? null,
            ], fn ($v) => $v !== null);
        }

        return json_encode(['sectors' => $sectors, 'types' => $types], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    }
}
