<?php

use App\Reckoner\LayoutLaw;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Layout Law v2.0 geometry for dashboard cards.
 *
 * `dashboard_cards` stored a `size` from a set of twelve presets — `2x4` …
 * `8x8` — that the Layout Law supersedes. Those presets could not express a C1
 * tile or a 4x1 inline strip, and they carried no legibility floor, so a pie
 * chart could be persisted at 2x4 and render as an unreadable disc.
 *
 * Two columns replace it:
 *
 *   category  C1 Tile · C2 Strip · C3 Metric · C4 Panel · C5 Board · C6 Canvas
 *   fit       which of that category's declared fits the card is using
 *
 * `w`/`h` stay, because react-grid-layout needs them and because a stored span
 * that disagrees with its fit is exactly the kind of drift the validator has to
 * be able to catch.
 *
 * `size` is left in place, nullable, and no longer written. Dropping a column
 * in the same deploy that stops writing it means a rollback loses data; it goes
 * in a later migration once this one has been in production for a release.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_cards', function (Blueprint $table) {
            // 2 chars is exactly 'C1'..'C6'. Default C3 Metric: it is the
            // middle of the range and the only category that suits the stat
            // charts most cards use.
            $table->string('category', 2)->default('C3')->after('chart');
            $table->string('fit', 24)->nullable()->after('category');
        });

        // MariaDB 10.5 — plain ALTER, no SKIP LOCKED, no JSON_TABLE.
        Schema::table('dashboard_cards', function (Blueprint $table) {
            $table->string('size', 12)->nullable()->default(null)->change();
        });

        $this->backfill();
    }

    /**
     * Translate every existing card's preset into a legal category + fit.
     *
     * Nearest legal fit by area, tie-broken by aspect ratio — see
     * LayoutLaw::fromLegacySize(). There is no exact translation because the
     * presets were arbitrary, so the goal is that a board reloads looking like
     * the board the user built: a wide card stays wide, a tall card stays tall.
     *
     * Chunked because a tenant may have many boards and this runs inside a
     * deploy. Chunk-by-id rather than offset paging, since the rows are being
     * updated as we walk them.
     */
    private function backfill(): void
    {
        DB::table('dashboard_cards')
            ->select('id', 'chart', 'size', 'w', 'h', 'x')
            ->orderBy('id')
            ->chunkById(500, function ($cards) {
                foreach ($cards as $card) {
                    $chart = $card->chart ?: 'stat';

                    // Prefer the stored span over the preset name: a user who
                    // dragged a card to resize it has a w/h that no longer
                    // matches `size`, and the span is what they actually saw.
                    $legacy = ($card->w && $card->h)
                        ? "{$card->w}x{$card->h}"
                        : $card->size;

                    $shape = LayoutLaw::fromLegacySize($legacy, $chart);
                    $dims = LayoutLaw::dimensionsOf($shape['category'], $shape['fit']);

                    DB::table('dashboard_cards')
                        ->where('id', $card->id)
                        ->update([
                            'category' => $shape['category'],
                            'fit' => $shape['fit'],
                            'w' => $dims['w'],
                            'h' => $dims['h'],
                            'x' => max(0, min(LayoutLaw::columns() - $dims['w'], (int) $card->x)),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('dashboard_cards', function (Blueprint $table) {
            $table->dropColumn(['category', 'fit']);
        });

        // `size` was never dropped, only made nullable, so rolling back only
        // has to restore the default. Existing rows keep whatever they hold.
        Schema::table('dashboard_cards', function (Blueprint $table) {
            $table->string('size', 12)->default('small')->change();
        });
    }
};
