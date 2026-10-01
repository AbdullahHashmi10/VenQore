<?php

namespace App\Reckoner\Resolvers;

final class StaffSalesByStaffResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'staff.sales_by_staff';
    }
}
