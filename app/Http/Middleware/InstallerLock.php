<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

/**
 * InstallerLock — gate for the browser installer.
 *
 * SEC-07 (2026-09-10): the installer used to open to anyone whenever the
 * storage/installed marker file was missing (fresh deploy, restore, a deleted
 * file). It is now closed unless ALL of these hold:
 *   - the app is not running in production;
 *   - venqore.web_installer_enabled (VQ_WEB_INSTALLER) is true;
 *   - the storage/installed marker does not exist.
 * The diagnostics endpoint additionally only answers loopback requests.
 * Production installs use the CLI (php artisan migrate, etc.).
 */
class InstallerLock
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->environment('production') || !config('venqore.web_installer_enabled', false)) {
            abort(404);
        }

        if (File::exists(storage_path('installed'))) {
            return response()->json(['error' => 'System is already installed. Installer access denied.'], 403);
        }

        if ($request->is('api/installer/diagnose') && !in_array($request->ip(), ['127.0.0.1', '::1'], true)) {
            abort(404);
        }

        return $next($request);
    }
}
