<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiscalYear extends Model
{
    use HasUuids, HasFactory, HasTenant;

    public const STATUS_DRAFT    = 'draft';
    public const STATUS_OPEN     = 'open';
    public const STATUS_CLOSING  = 'closing';
    public const STATUS_CLOSED   = 'closed';
    public const STATUS_REOPENED = 'reopened';

    protected $guarded = ['id'];

    protected $casts = [
        'start_date'    => 'date:Y-m-d',
        'end_date'      => 'date:Y-m-d',
        'opened_at'     => 'datetime',
        'closed_at'     => 'datetime',
        'reopened_at'   => 'datetime',
        'close_version' => 'integer',
    ];

    public function retainedEarningsAccount()
    {
        return $this->belongsTo(Account::class, 'retained_earnings_account_id');
    }

    public function closeJournalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'close_journal_entry_id');
    }

    public function checks()
    {
        return $this->hasMany(FiscalYearCloseCheck::class, 'fiscal_year_id');
    }

    public function periodLocks()
    {
        return $this->hasMany(AccountingPeriodLock::class, 'fiscal_year_id');
    }

    public function events()
    {
        return $this->hasMany(FiscalYearEvent::class, 'fiscal_year_id');
    }
}
