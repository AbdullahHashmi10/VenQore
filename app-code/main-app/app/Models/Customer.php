<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Customer extends Model
{
    use HasFactory, SoftDeletes, HasUuids, HasTenant;

    protected $fillable = [
        'tenant_id',
        'party_id',
        'name',
        'email',
        'phone',
        'address',
        'pricing_tier',
        'currency_code',
        'is_tax_exempt',
        'credit_limit',
        'date_of_birth',
        'anniversary_date',
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function addresses()
    {
        return $this->hasMany(CustomerAddress::class);
    }
}
