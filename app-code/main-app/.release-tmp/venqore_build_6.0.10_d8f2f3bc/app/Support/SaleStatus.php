<?php

namespace App\Support;

final class SaleStatus
{
    public const DRAFT = 'draft';
    public const POSTED = 'posted';
    public const PARTIALLY_RETURNED = 'partially_returned';
    public const RETURNED = 'returned';
    public const CANCELLED = 'cancelled';

    public const REVENUE_RECOGNISED = [
        self::POSTED,
        self::PARTIALLY_RETURNED,
        self::RETURNED,
    ];
}
