<?php

use App\Reckoner\ReckonerRegistry;
use App\Reckoner\ReckonerShape;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('dashboard_cards')) {
            return;
        }

        $rankings = [];
        $breakdowns = [];
        foreach (ReckonerRegistry::all() as $key => $definition) {
            if ($definition['shape'] === ReckonerShape::RANKING) {
                $rankings[] = $key;
            } elseif ($definition['shape'] === ReckonerShape::BREAKDOWN) {
                $breakdowns[] = $key;
            }
        }

        if ($rankings !== []) {
            DB::table('dashboard_cards')->whereIn('reading_key', $rankings)
                ->whereIn('chart', ['bar', 'funnel'])->update(['chart' => 'list']);
        }
        if ($breakdowns !== []) {
            DB::table('dashboard_cards')->whereIn('reading_key', $breakdowns)
                ->where('chart', 'bar')->update(['chart' => 'pie']);
        }
    }

    public function down(): void
    {
        // The old chart choice is not recoverable without inventing data.
    }
};
