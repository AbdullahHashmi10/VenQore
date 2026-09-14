<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DatabaseHealthCheck
{
    // Methods that write financial data — must be blocked if DB is down
    private const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next)
    {
        if (!in_array($request->method(), self::WRITE_METHODS)) {
            return $next($request);
        }

        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error'   => 'database_unavailable',
                    'message' => 'Cannot post transactions — database connection lost.',
                ], 503);
            }

            return response()->view('errors.503', [
                'message' => 'Database connection lost. Transaction not posted.',
            ], 503);
        }

        return $next($request);
    }
}
