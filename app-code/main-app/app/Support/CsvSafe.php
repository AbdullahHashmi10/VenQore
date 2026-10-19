<?php

namespace App\Support;

/**
 * Makes cell values safe for CSV/XLSX output.
 *
 * Spreadsheet apps run any text that starts with = + - @ (or a tab/CR) as a
 * formula, so a customer named "=HYPERLINK(...)" would execute when the file
 * is opened. Such text is prefixed with an apostrophe; real numbers are left alone.
 */
class CsvSafe
{
    public static function cell(mixed $v): string|int|float
    {
        if ($v === null) return '';
        if (is_bool($v)) return $v ? 'Yes' : 'No';
        if (is_int($v) || is_float($v)) return $v;
        if (is_array($v) || is_object($v)) {
            $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        $s = (string) $v;
        if ($s !== '' && !is_numeric($s) && preg_match('/^[=+\-@\t\r]/', $s)) {
            return "'" . $s;
        }
        return $s;
    }
}
