<?php

namespace App\Exceptions;

/**
 * Thrown by OwnerDailyPulseService::captureSnapshot() when a store has no
 * active member to read its daily pulse as. The store is skipped — its
 * figures are never read under (or sent to) a user of another store.
 */
class DailyPulseSkippedException extends \RuntimeException
{
}
