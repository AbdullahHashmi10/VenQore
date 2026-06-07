<?php

namespace App\Traits;

use App\Models\StoreActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

/**
 * Trait HasActivityLog
 * 
 * Automatically logs create, update, and delete actions for Tier 2 models.
 */
trait HasActivityLog
{
    protected static function bootHasActivityLog()
    {
        static::created(function (Model $model) {
            static::logActivity($model, 'created');
        });

        static::updated(function (Model $model) {
            static::logActivity($model, 'updated');
        });

        static::deleted(function (Model $model) {
            static::logActivity($model, 'deleted');
        });
    }

    protected static function logActivity(Model $model, string $action)
    {
        $tenantId = $model->tenant_id ?? app('current.tenant')?->id;
        if (!$tenantId) return;

        $payload = null;
        if ($action === 'updated') {
            $payload = [
                'old' => array_intersect_key($model->getOriginal(), $model->getChanges()),
                'new' => $model->getChanges(),
            ];
            // Don't log if only timestamps changed
            if (count($payload['new']) === 1 && isset($payload['new']['updated_at'])) return;
        }

        try {
            StoreActivityLog::create([
                'tenant_id'    => $tenantId,
                'user_id'      => auth()->id(),
                'action'       => strtolower(class_basename($model)) . '.' . $action,
                'subject_type' => get_class($model),
                'subject_id'   => $model->uuid ?? $model->id,
                'payload'      => $payload,
                'ip_address'   => Request::ip(),
                'user_agent'   => Request::userAgent(),
                'is_impersonated' => session()->has('impersonating_user_id'),
            ]);
        } catch (\Exception $e) {
            // Ignore missing table during migrations/testing
        }
    }
}
