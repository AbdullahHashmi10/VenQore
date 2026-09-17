<?php

namespace App\Reckoner\Resolvers;

final class LoyaltyGiftCardBalanceResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'loyalty.gift_card_balance';
    }
}
