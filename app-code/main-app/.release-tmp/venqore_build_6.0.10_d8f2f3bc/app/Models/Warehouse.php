<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTenant;

class Warehouse extends Model
{
    use HasUuids, HasTenant, SoftDeletes;
    protected $fillable = ['tenant_id', 'name', 'location', 'is_active', 'is_default', 'contact_person', 'phone'];

    public function stocks()
    {
        return $this->hasMany(Stock::class);
    }
}
