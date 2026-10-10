<?php

use App\Support\MapCoords;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Marketplace: where cities and shops are, so shoppers can find shops near them and see them on a map. */
return new class extends Migration
{
    private const CITIES = [
        'okara' => [30.8081, 73.4458], 'lahore' => [31.5204, 74.3587], 'karachi' => [24.8607, 67.0011],
        'islamabad' => [33.6844, 73.0479], 'faisalabad' => [31.4504, 73.1350], 'multan' => [30.1575, 71.5249],
    ];

    public function up(): void
    {
        Schema::table('commerce_cities', function (Blueprint $t) {
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 10, 7)->nullable();
        });
        Schema::table('storefronts', function (Blueprint $t) {
            $t->decimal('latitude', 10, 7)->nullable();
            $t->decimal('longitude', 10, 7)->nullable();
            $t->index(['city_id', 'latitude', 'longitude'], 'storefronts_geo');
        });

        foreach (self::CITIES as $slug => [$lat, $lng]) {
            DB::table('commerce_cities')->where('slug', $slug)->update(['latitude' => $lat, 'longitude' => $lng]);
        }
        // Shops that already pasted a map link: take the point from it.
        DB::table('storefronts')->whereNotNull('map_url')->whereNull('latitude')->orderBy('id')->each(function ($s) {
            if ($c = MapCoords::fromUrl($s->map_url)) {
                DB::table('storefronts')->where('id', $s->id)->update(['latitude' => $c[0], 'longitude' => $c[1]]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('storefronts', function (Blueprint $t) {
            $t->dropIndex('storefronts_geo');
            $t->dropColumn(['latitude', 'longitude']);
        });
        Schema::table('commerce_cities', fn (Blueprint $t) => $t->dropColumn(['latitude', 'longitude']));
    }
};
