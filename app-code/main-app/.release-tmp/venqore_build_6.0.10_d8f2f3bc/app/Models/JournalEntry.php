<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class JournalEntry extends Model
{
    use HasUuids, HasFactory, HasTenant;

    protected $guarded = ['id'];

    protected $casts = [
        'date'        => 'date',
        'is_reversed' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(JournalItem::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
