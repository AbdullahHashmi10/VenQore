<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountingPeriodLock extends Model
{
    use HasUuids, HasFactory, HasTenant;

    public const TYPE_SOFT      = 'soft';
    public const TYPE_ALL_USERS = 'all_users';
    public const TYPE_HARD      = 'hard';

    protected $guarded = ['id'];

    protected $casts = [
        'locked_through_date' => 'date:Y-m-d',
        'is_active'           => 'boolean',
    ];

    public function fiscalYear()
    {
        return $this->belongsTo(FiscalYear::class, 'fiscal_year_id');
    }

    public function exceptions()
    {
        return $this->hasMany(AccountingLockException::class, 'period_lock_id');
    }
}
