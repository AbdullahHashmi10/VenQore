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
    ];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
