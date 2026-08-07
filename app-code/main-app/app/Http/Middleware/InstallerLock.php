<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class InstallerLock
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        if (File::exists(storage_path('installed'))) {
            return response()->json(['error' => 'System is already installed. Installer access denied.'], 403);
        }
        return $next($request);
    }
}
