<?php

namespace App\Services\Dashboard;

use App\Reckoner\ReckonerShape;

final class CardClass
{
    public static function forShape(string|ReckonerShape $shape): string
    {
        $value = $shape instanceof ReckonerShape ? $shape : ReckonerShape::tryFrom(strtolower($shape));

        return match ($value) {
            ReckonerShape::SCALAR => 'kpi',
            ReckonerShape::STATUS => 'status',
            ReckonerShape::GAUGE => 'gauge',
            ReckonerShape::SERIES, ReckonerShape::MULTI_SERIES => 'trend',
            ReckonerShape::BREAKDOWN, ReckonerShape::FUNNEL => 'breakdown',
            ReckonerShape::RANKING => 'ranking',
            ReckonerShape::TABLE => 'ledger',
            ReckonerShape::FEED => 'feed',
            default => throw new \InvalidArgumentException('Unsupported dashboard reading shape: '.($value?->value ?? $shape)),
        };
    }
}
