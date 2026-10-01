<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasTenant;

class Party extends Model
{
    use HasUuids, HasTenant, SoftDeletes, HasFactory;

    protected $fillable = [
        'tenant_id', 'name', 'phone', 'email', 'type', 'category', 'sub_category',
        'address', 'notes', 'opening_balance', 'opening_balance_type',
        'current_balance', 'credit_limit', 'payment_terms', 'default_discount',
    ];

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
