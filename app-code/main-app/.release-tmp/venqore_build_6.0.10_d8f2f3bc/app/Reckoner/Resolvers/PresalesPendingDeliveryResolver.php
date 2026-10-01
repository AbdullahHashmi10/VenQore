<?php

namespace App\Reckoner\Resolvers;

final class PresalesPendingDeliveryResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'presales.pending_delivery';
    }
}
