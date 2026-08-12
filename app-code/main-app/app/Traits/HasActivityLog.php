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

        $actionName = strtolower(class_basename($model)) . '.' . $action;

        try {
            StoreActivityLog::create([
                'tenant_id'    => $tenantId,
                'user_id'      => auth()->id(),
                'action'       => $actionName,
                // `description` is NOT NULL on a fresh install (see the
                // create_activity_logs_table migration). It was never written here,
                // so every insert threw and was swallowed, leaving fresh installs
                // with no audit trail at all. Populate it rather than relying on
                // the column having drifted to nullable in one long-lived database.
                'description'  => $actionName,
                'subject_type' => get_class($model),
                'subject_id'   => $model->uuid ?? $model->id,
                'payload'      => $payload,
                'ip_address'   => Request::ip(),
                'user_agent'   => Request::userAgent(),
                'is_impersonated' => session()->has('impersonating_user_id'),
            ]);
        } catch (\Throwable $e) {
            // Never crash the caller for an audit-trail failure, but make the
            // failure loud. A silent catch here is what hid R3 for months: the
            // writes were failing on every fresh install and nothing surfaced it.
            \Illuminate\Support\Facades\Log::error('HasActivityLog failed to write audit entry: ' . $e->getMessage(), [
                'model'     => get_class($model),
                'action'    => $action,
                'tenant_id' => $tenantId,
                'exception' => $e::class,
            ]);

            // In non-production the mismatch should be impossible to ignore.
            if (app()->environment('local', 'testing')) {
                throw $e;
            }
        }
    }
}
