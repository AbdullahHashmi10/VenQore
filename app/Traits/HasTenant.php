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
            // 1. If we are in a store context (TenantMiddleware applied), scope strictly.
            if (app()->bound('current.tenant')) {
                $builder->where($builder->getModel()->getTable() . '.tenant_id', app('current.tenant')->id);
                return;
            }

            // 2. If we are NOT in a store context, check user permissions.
            if (auth()->check()) {
                /** @var \App\Models\User $user */
                $user = auth()->user();

                // Platform Admins see everything at the global level.
                if ($user->isPlatformAdmin()) {
                    return;
                }

                // Regular users use their last session store.
                if ($user->last_store_id) {
                    $builder->where($builder->getModel()->getTable() . '.tenant_id', $user->last_store_id);
                    return;
                }
            }

            // 3. Fallback: Hard block to prevent data leaks.
            // This triggers in CLI (unless tenant is bound) and unauthenticated routes.
            $builder->whereRaw('1 = 0');
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
