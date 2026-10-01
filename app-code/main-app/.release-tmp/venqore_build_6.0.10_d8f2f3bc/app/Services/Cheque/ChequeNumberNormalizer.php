<?php

namespace App\Services\Cheque;

class ChequeNumberNormalizer
{
    /**
     * Normalize a cheque serial number for uniqueness comparison and matching.
     * Removes all whitespace, dashes, and non-alphanumeric characters,
     * uppercasing the result.
     */
    public static function normalize(string $serial): string
    {
        $cleaned = preg_replace('/[^A-Za-z0-9]/', '', $serial);
        return strtoupper(trim($cleaned ?? ''));
    }

    /**
     * Normalize a drawer bank name for comparison and matching.
     * Collapses whitespace, removes punctuation, uppercasing the result.
     */
    public static function normalizeBank(?string $bank): string
    {
        if ($bank === null) {
            return '';
        }
        $cleaned = preg_replace('/[^A-Za-z0-9]/', '', $bank);
        return strtoupper(trim($cleaned ?? ''));
    }

    /**
     * Format a display serial number using optional prefix and zero-padding.
     * E.g. prefix 'PK', serial 105, padding 6 -> 'PK-000105'
     */
    public static function formatDisplay(int|string $numericSerial, ?string $prefix = null, int $padding = 6): string
    {
        $padded = str_pad((string) $numericSerial, $padding, '0', STR_PAD_LEFT);
        if (!empty($prefix)) {
            $cleanPrefix = rtrim(strtoupper(trim($prefix)), '-_');
            return "{$cleanPrefix}-{$padded}";
        }
        return $padded;
    }

    /**
     * Extract the pure integer numeric component from a serial string.
     */
    public static function extractNumeric(string $serial): int
    {
        preg_match('/\d+/', $serial, $matches);
        return isset($matches[0]) ? (int) $matches[0] : 0;
    }

    /**
     * Compute duplicate fingerprint for an incoming cheque.
     * Identity: tenantId | normalized_drawer_bank | normalized_cheque_number
     * When override is authorized, incorporates override marker/key so DB uniqueness constraint remains valid.
     */
    public static function fingerprint(
        int|string $tenantId,
        string $chequeNumber,
        ?string $drawerBank = null,
        bool $isOverride = false,
        ?string $overrideKey = null
    ): string {
        $normNumber = self::normalize($chequeNumber);
        $normBank   = self::normalizeBank($drawerBank);

        if ($isOverride) {
            $key = $overrideKey ?: (string) \Illuminate\Support\Str::uuid();
            return hash('sha256', "{$tenantId}|{$normBank}|{$normNumber}|OVERRIDE|{$key}");
        }

        return hash('sha256', "{$tenantId}|{$normBank}|{$normNumber}");
    }
}
