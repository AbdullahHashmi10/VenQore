<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasTenant;

class Brand extends Model
{
    use HasFactory, HasUuids, HasTenant;
    protected $guarded = [];

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }
}
