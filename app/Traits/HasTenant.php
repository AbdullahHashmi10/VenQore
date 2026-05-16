<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * HasTenant — Phase 1.3
 *
 * Apply this trait to every Eloquent model that has a tenant_id column.
 * It does two things automatically:
 *
 *   1. Auto-assigns tenant_id on creation from the DI container binding.
 *   2. Adds a global scope so ALL queries are automatically filtered by
 *      the current tenant — preventing any cross-tenant data leaks.
 *
 * The container key 'current.tenant' is set by TenantMiddleware on every
 * request. If no tenant is bound (e.g., CLI commands, super-admin routes),
 * the scope is NOT applied — data is globally accessible.
 *
 * Usage:
 *   use App\Traits\HasTenant;
 *   class Product extends Model {
 *       use HasTenant;
 *   }
 *
 * Escape hatch (super-admin / console only):
 *   Product::withoutTenantScope()->get()   // bypass the global scope
 */
trait HasTenant
{
    /**
     * Boot the HasTenant trait for the model.
     * Called automatically by Laravel's Model::boot().
     */
    protected static function bootHasTenant(): void
    {
        // ── Auto-assign tenant_id on model creation ──────────────────────
        static::creating(function ($model) {
            if (empty($model->tenant_id)) {
                if (app()->bound('current.tenant')) {
                    $model->tenant_id = app('current.tenant')->id;
                } elseif (auth()->check() && auth()->user()->last_store_id) {
                    $model->tenant_id = auth()->user()->last_store_id;
                }
            }
        });

        // ── Global Scope: all queries auto-scoped to current tenant ───────
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = null;

            if (app()->bound('current.tenant')) {
                $tenantId = app('current.tenant')->id;
            } elseif (auth()->check() && auth()->user()->last_store_id) {
                // Fallback for legacy routes (e.g. /growth-engine, /reports) outside /s/{slug}
                $tenantId = auth()->user()->last_store_id;
            }

            if ($tenantId) {
                $table = $builder->getModel()->getTable();
                $builder->where("{$table}.tenant_id", $tenantId);
            } else {
                // Hard block: never return data when tenant context is missing.
                // This prevents silent full-table leaks in jobs, commands, and
                // any route where tenant was not bootstrapped.
                // Use Model::withoutTenantScope() or withoutGlobalScope('tenant')
                // explicitly for intentional cross-tenant platform operations.
                $builder->whereRaw('1 = 0');
            }
        });


    }

    // ── Escape Hatch ──────────────────────────────────────────────────────

    /**
     * Query without the tenant scope.
     * USE ONLY in super-admin contexts or Artisan commands.
     * NEVER call this from a regular controller.
     *
     * @return Builder
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }

    // ── Relationship helper ───────────────────────────────────────────────

    /**
     * Return the tenant this model belongs to.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
