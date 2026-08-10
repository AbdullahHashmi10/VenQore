<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;

/**
 * One saved arrangement of dashboard cards, per user, per store, per dashboard.
 *
 * The `layout` payload is intentionally the smallest thing that answers "what
 * should I see and where": a widget id, a grid position, a size. It never
 * carries the widget's data. Two reasons — a stale cached figure in a layout
 * blob is a wrong number shown confidently, and a layout row survives plan
 * downgrades and permission changes, so anything cached in it would outlive the
 * user's right to see it.
 */
class DashboardLayout extends Model
{
    use HasTenant;

    protected $guarded = [];

    protected $casts = [
        'layout' => 'array',
    ];

    public const DEFAULT_KEY = 'workspace';

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
