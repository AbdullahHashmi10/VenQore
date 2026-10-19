<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * DemoVisitorScoped — makes the one shared demo store FEEL like each visitor's
 * own copy, for the models people poke at first (sales, customers, products).
 *
 *  - Sample data (demo_session = NULL) is shared and read-only to delete.
 *  - A record a visitor creates is tagged with their demo_visitor_id and is
 *    visible only to them. Nightly demo:restore removes the lot.
 *  - Nothing here runs outside the demo tenant; real stores are untouched.
 *
 * Needs a nullable `demo_session` column on the model's table.
 */
trait DemoVisitorScoped
{
    protected static function bootDemoVisitorScoped(): void
    {
        static::creating(function ($model) {
            if (static::inDemoStore() && ($visitor = static::demoVisitorId())) {
                $model->demo_session = $visitor;
            }
        });

        static::addGlobalScope('demo_visitor', function (Builder $builder) {
            if (! static::inDemoStore()) {
                return;
            }
            $table = $builder->getModel()->getTable();
            $visitor = static::demoVisitorId();
            $builder->where(function ($q) use ($table, $visitor) {
                $q->whereNull("{$table}.demo_session");
                if ($visitor) {
                    $q->orWhere("{$table}.demo_session", $visitor);
                }
            });
        });

        static::deleting(function ($model) {
            // Covers soft and force deletes. Visitors may delete what they made.
            if (static::inDemoStore() && $model->demo_session === null) {
                $message = 'Sample records are shared by every demo visitor, so they cannot be deleted. Add your own and delete those instead.';
                $request = request();
                if ($request->wantsJson() || $request->header('X-Inertia')) {
                    throw new HttpResponseException(response()->json(['demo' => true, 'message' => $message], 403));
                }
                throw new HttpResponseException(redirect()->back()->with('error', $message));
            }
        });
    }

    protected static function inDemoStore(): bool
    {
        // Only inside a visitor's web request (it has a session). Artisan commands that
        // bind the demo tenant — demo:full-deploy, demo:restore — are not visitors and
        // must be free to create and wipe sample data.
        if (! app()->bound('current.tenant') || ! (bool) (app('current.tenant')->is_demo ?? false)) {
            return false;
        }
        $request = app()->bound('request') ? app('request') : null;

        return $request !== null && $request->hasSession();
    }

    protected static function demoVisitorId(): ?string
    {
        $request = app()->bound('request') ? app('request') : null;
        if (! $request || ! $request->hasSession()) {
            return null;
        }
        $id = $request->session()->get('demo_visitor_id');

        return is_string($id) && $id !== '' ? $id : null;
    }
}
