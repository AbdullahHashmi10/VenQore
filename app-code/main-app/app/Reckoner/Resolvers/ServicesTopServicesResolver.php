<?php

namespace App\Reckoner\Resolvers;

final class ServicesTopServicesResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'services.top_services';
    }
}
