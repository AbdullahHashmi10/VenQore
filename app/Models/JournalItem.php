<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class JournalItem extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $fillable = [
        'tenant_id',
        'journal_entry_id',
        'account_id',
        'debit',
        'credit',
        'description',
    ];

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
