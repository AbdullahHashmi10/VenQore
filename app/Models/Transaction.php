<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Transaction extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    public function party()
    {
        return $this->belongsTo(Party::class);
    }
}
