<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

class Account extends Model
{
    use HasFactory, HasUuids, HasTenant, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'parent_id',
        'balance',
        'depreciation_rate',
        'is_active',
    ];

    public function parent()
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    public function journalItems()
    {
        return $this->hasMany(JournalItem::class);
    }
}
