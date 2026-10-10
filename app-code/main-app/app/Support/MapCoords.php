<?php

namespace App\Support;

/** Reads a latitude/longitude pair out of a pasted map link (Google Maps, OpenStreetMap, plain "lat,lng"). */
class MapCoords
{
    /** @return array{0: float, 1: float}|null [lat, lng] */
    public static function fromUrl(?string $url): ?array
    {
        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }
        $patterns = [
            '/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/',         // Google place data
            '/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/',             // Google @lat,lng
            '/[?&](?:q|query|ll|center|destination)=(-?\d{1,2}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i',
            '/[?&]mlat=(-?\d{1,2}\.\d+)&mlon=(-?\d{1,3}\.\d+)/', // OpenStreetMap marker
            '/#map=\d+\/(-?\d{1,2}\.\d+)\/(-?\d{1,3}\.\d+)/',     // OpenStreetMap view
        ];
        foreach ($patterns as $re) {
            if (preg_match($re, $url, $m)) {
                return self::valid((float) $m[1], (float) $m[2]);
            }
        }
        return null;
    }

    /** @return array{0: float, 1: float}|null */
    public static function valid(float $lat, float $lng): ?array
    {
        return ($lat >= -90 && $lat <= 90 && $lng >= -180 && $lng <= 180 && ! ($lat == 0 && $lng == 0)) ? [round($lat, 7), round($lng, 7)] : null;
    }

    /** Great-circle distance in km. */
    public static function km(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $r * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
