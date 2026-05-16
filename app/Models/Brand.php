<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Brand extends Model
{
    use HasFactory, HasUuids;
    protected $guarded = [];

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }
}
