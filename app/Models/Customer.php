<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Customer extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $guarded = [];

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
