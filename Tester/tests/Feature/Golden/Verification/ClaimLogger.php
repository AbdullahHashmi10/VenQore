<?php

namespace Tests\Feature\Golden\Verification;

class ClaimLogger
{
    private static ?string $logFile = null;

    private static function getLogFile(): string
    {
        if (self::$logFile === null) {
            self::$logFile = storage_path('logs/verification_claims.jsonl');
            // Ensure directory exists
            $dir = dirname(self::$logFile);
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }
            // Clear the log on first access per test run
            if (!defined('CLAIM_LOGGER_INITIALIZED')) {
                define('CLAIM_LOGGER_INITIALIZED', true);
                if (file_exists(self::$logFile)) {
                    unlink(self::$logFile);
                }
            }
        }
        return self::$logFile;
    }

    public static function log(VerificationClaim $claim): void
    {
        $data = json_encode($claim->toArray()) . "\n";
        file_put_contents(self::getLogFile(), $data, FILE_APPEND);
    }
}
