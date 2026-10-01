<?php

namespace App\Reckoner\Resolvers;

final class PosLiveFeedResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'pos.live_feed';
    }
}
