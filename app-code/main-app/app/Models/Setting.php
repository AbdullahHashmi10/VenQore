<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

class Setting extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];
}
