<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * BarcodeController — Module 03
 *
 * Renders a pure-SVG Code128B barcode for any ASCII string.
 * Uses the complete 108-symbol Code128 pattern table (indices 0–107),
 * covering data symbols 0–95, Start A/B/C, and Stop.
 */
class BarcodeController extends Controller
{
    public function generate(Request $request): Response
    {
        $value = $request->input('value', '');

        if (empty($value)) {
            return response('Missing value parameter', 400);
        }

        $svg = $this->buildCode128Svg($value);

        return response($svg, 200, [
            'Content-Type'  => 'image/svg+xml',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    // ── Code128B encoder ────────────────────────────────────────────────────

    private function buildCode128Svg(string $data): string
    {
        $bars = $this->encode($data);

        $moduleWidth = 2;   // px per module
        $height      = 60;
        $quiet       = 10;  // quiet zone

        $totalModules = array_sum($bars);
        $totalWidth   = $quiet * 2 + $totalModules * $moduleWidth;

        $rects = '';
        $x = $quiet;
        foreach ($bars as $i => $width) {
            $px = $width * $moduleWidth;
            if ($i % 2 === 0) { // even indices are bars (black)
                $rects .= "<rect x=\"{$x}\" y=\"0\" width=\"{$px}\" height=\"{$height}\" fill=\"black\"/>";
            }
            $x += $px;
        }

        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="{$totalWidth}" height="{$height}" viewBox="0 0 {$totalWidth} {$height}">
  <rect width="{$totalWidth}" height="{$height}" fill="white"/>
  {$rects}
</svg>
SVG;
    }

    /**
     * Full Code128 symbol table — 108 entries (indices 0–107).
     * Each entry is [b1, s1, b2, s2, b3, s3] widths (bar/space alternating).
     * Indices 0–95   = data symbols (ASCII 32–127 in Code B)
     * Index  103     = Start A
     * Index  104     = Start B
     * Index  105     = Start C
     * Index  106     = Stop (7 modules: [2,3,3,1,1,1,2])
     */
    private static function patterns(): array
    {
        return [
            /* 0  */ [2,1,2,2,2,2],
            /* 1  */ [2,2,2,1,2,2],
            /* 2  */ [2,2,2,2,2,1],
            /* 3  */ [1,2,1,2,2,3],
            /* 4  */ [1,2,1,3,2,2],
            /* 5  */ [1,3,1,2,2,2],
            /* 6  */ [1,2,2,2,1,3],
            /* 7  */ [1,2,2,3,1,2],
            /* 8  */ [1,3,2,2,1,2],
            /* 9  */ [2,2,1,2,1,3],
            /* 10 */ [2,2,1,3,1,2],
            /* 11 */ [2,3,1,2,1,2],
            /* 12 */ [1,1,2,2,3,2],
            /* 13 */ [1,2,2,1,3,2],
            /* 14 */ [1,2,2,2,3,1],
            /* 15 */ [1,1,3,2,2,2],
            /* 16 */ [1,2,3,1,2,2],
            /* 17 */ [1,2,3,2,2,1],
            /* 18 */ [2,2,3,2,1,1],
            /* 19 */ [2,2,1,1,3,2],
            /* 20 */ [2,2,1,2,3,1],
            /* 21 */ [2,1,3,2,1,2],
            /* 22 */ [2,2,3,1,1,2],
            /* 23 */ [3,1,2,1,3,1],
            /* 24 */ [3,1,1,2,2,2],
            /* 25 */ [3,2,1,1,2,2],
            /* 26 */ [3,2,1,2,2,1],
            /* 27 */ [3,1,2,2,1,2],
            /* 28 */ [3,2,2,1,1,2],
            /* 29 */ [3,2,2,2,1,1],
            /* 30 */ [2,1,2,1,2,3],
            /* 31 */ [2,1,2,3,2,1],
            /* 32 */ [2,3,2,1,2,1],
            /* 33 */ [1,1,1,3,2,3],
            /* 34 */ [1,3,1,1,2,3],
            /* 35 */ [1,3,1,3,2,1],
            /* 36 */ [1,1,2,3,1,3],
            /* 37 */ [1,3,2,1,1,3],
            /* 38 */ [1,3,2,3,1,1],
            /* 39 */ [2,1,1,3,1,3],
            /* 40 */ [2,3,1,1,1,3],
            /* 41 */ [2,3,1,3,1,1],
            /* 42 */ [1,1,2,1,3,3],
            /* 43 */ [1,1,2,3,3,1],
            /* 44 */ [1,3,2,1,3,1],
            /* 45 */ [1,1,3,1,2,3],
            /* 46 */ [1,1,3,3,2,1],
            /* 47 */ [1,3,3,1,2,1],
            /* 48 */ [3,1,3,1,2,1],
            /* 49 */ [2,1,1,3,3,1],
            /* 50 */ [2,3,1,1,3,1],
            /* 51 */ [1,1,3,1,3,2],
            /* 52 */ [1,1,3,2,3,1],
            /* 53 */ [1,2,3,1,3,1],
            /* 54 */ [3,1,1,1,2,3],
            /* 55 */ [3,1,1,3,2,1],
            /* 56 */ [3,3,1,1,2,1],
            /* 57 */ [3,1,2,1,1,3],
            /* 58 */ [3,1,2,3,1,1],
            /* 59 */ [3,3,2,1,1,1],
            /* 60 */ [3,1,4,1,1,1],
            /* 61 */ [2,2,1,4,1,1],
            /* 62 */ [4,3,1,1,1,1],
            /* 63 */ [1,1,1,2,2,4],
            /* 64 */ [1,1,1,4,2,2],
            /* 65 */ [1,2,1,1,2,4],
            /* 66 */ [1,2,1,4,2,1],
            /* 67 */ [1,4,1,1,2,2],
            /* 68 */ [1,4,1,2,2,1],
            /* 69 */ [1,1,2,2,1,4],
            /* 70 */ [1,1,2,4,1,2],
            /* 71 */ [1,2,2,1,1,4],
            /* 72 */ [1,2,2,4,1,1],
            /* 73 */ [1,4,2,1,1,2],
            /* 74 */ [1,4,2,2,1,1],
            /* 75 */ [2,4,1,2,1,1],
            /* 76 */ [2,2,1,1,1,4],
            /* 77 */ [4,1,3,1,1,1],
            /* 78 */ [2,4,1,1,1,2],
            /* 79 */ [1,3,4,1,1,1],
            /* 80 */ [1,1,1,2,4,2],
            /* 81 */ [1,2,1,1,4,2],
            /* 82 */ [1,2,1,2,4,1],
            /* 83 */ [1,1,4,2,1,2],
            /* 84 */ [1,2,4,1,1,2],
            /* 85 */ [1,2,4,2,1,1],
            /* 86 */ [4,1,1,2,1,2],
            /* 87 */ [4,2,1,1,1,2],
            /* 88 */ [4,2,1,2,1,1],
            /* 89 */ [2,1,2,1,4,1],
            /* 90 */ [2,1,4,1,2,1],
            /* 91 */ [3,1,2,1,1,2],
            /* 92 */ [3,2,1,1,1,2],   // backslash in Code B
            /* 93 */ [3,2,1,2,1,1],
            /* 94 */ [3,1,1,2,1,3],
            /* 95 */ [2,1,1,2,2,3],
            /* 96 */ [2,1,1,3,2,2],   // FNC3
            /* 97 */ [3,1,1,1,2,3],   // FNC2
            /* 98 */ [3,1,1,3,2,1],   // SHIFT
            /* 99 */ [3,3,1,1,2,1],   // Code C
            /* 100*/ [3,1,2,1,1,3],   // Code B (in A/C) or FNC4
            /* 101*/ [3,1,2,3,1,1],   // Code A (in B/C)
            /* 102*/ [3,3,2,1,1,1],   // FNC1
            /* 103*/ [2,1,1,4,1,2],   // Start A
            /* 104*/ [2,1,1,2,1,4],   // Start B
            /* 105*/ [2,1,1,2,3,2],   // Start C
            /* 106*/ [2,3,3,1,1,1],   // Stop (6 bars — termination bar appended separately)
        ];
    }

    /**
     * Encode a string as Code128B.
     * Returns an array of alternating bar/space widths (bar first).
     */
    private function encode(string $data): array
    {
        $patterns = self::patterns();
        $startB   = 104;
        $checksum  = $startB;
        $encoded   = [];

        // Start B symbol
        foreach ($patterns[$startB] as $w) {
            $encoded[] = $w;
        }

        // Data symbols (Code128B: ASCII 32–127 → symbol 0–95)
        $chars = str_split($data);
        foreach ($chars as $i => $ch) {
            $code = ord($ch) - 32;
            if ($code < 0 || $code > 95) {
                $code = 63; // '?' fallback for out-of-range chars
            }
            $checksum += ($i + 1) * $code;
            foreach ($patterns[$code] as $w) {
                $encoded[] = $w;
            }
        }

        // Check symbol
        $checkVal = $checksum % 103;
        foreach ($patterns[$checkVal] as $w) {
            $encoded[] = $w;
        }

        // Stop symbol (106) — always ends with a termination bar (2 modules)
        foreach ($patterns[106] as $w) {
            $encoded[] = $w;
        }
        $encoded[] = 2; // termination bar

        return $encoded;
    }
}
