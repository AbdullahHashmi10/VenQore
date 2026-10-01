<?php

namespace App\Reckoner\Resolvers;

final class CoreAuditTrailCountResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'core.audit_trail_count';
    }
}
