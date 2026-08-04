<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceHostedUntil
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = app()->bound('current.tenant')
            ? app('current.tenant')
            : ($request->user() ? \App\Models\Tenant::find($request->user()->last_store_id) : null);

        if ($tenant && $tenant->hosted_until) {
            $hostedUntil = is_string($tenant->hosted_until) ? \Carbon\Carbon::parse($tenant->hosted_until) : $tenant->hosted_until;
            if (now()->gt($hostedUntil)) {
                // Allow GET/HEAD requests so tenant can view store data, block mutations
                if (!in_array($request->method(), ['GET', 'HEAD'], true)) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'error'            => 'Hosting period has expired. Please renew your $9/mo continuation subscription to perform write operations.',
                            'code'             => 'HOSTING_EXPIRED',
                            'hosted_until'     => $hostedUntil->toIso8601String(),
                            'continuation_url' => url('/settings/billing/continuation'),
                        ], 403);
                    }

                    return redirect()->route('settings.billing')->with('error', 'Hosting period expired. Please renew your $9/mo continuation subscription.');
                }
            }
        }

        return $next($request);
    }
}
