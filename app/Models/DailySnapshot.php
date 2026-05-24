<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

class DailySnapshot extends Model
{
    use HasUuids, HasTenant;

    protected $table = 'daily_snapshots';

    protected $fillable = [
        'tenant_id',
        'date',
        'sales_value',
        'purchases_value',
        'stock_value',
        'payables_value',
        'receivables_value',
        'cash_value',
        'expense_value',
        'note',
    ];

    protected $casts = [
        'date'              => 'date:Y-m-d',
        'sales_value'       => 'decimal:2',
        'purchases_value'   => 'decimal:2',
        'stock_value'       => 'decimal:2',
        'payables_value'    => 'decimal:2',
        'receivables_value' => 'decimal:2',
        'cash_value'        => 'decimal:2',
        'expense_value'     => 'decimal:2',
    ];
}
