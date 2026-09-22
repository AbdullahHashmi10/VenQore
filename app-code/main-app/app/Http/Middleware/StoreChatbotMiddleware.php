<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreChatbotMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        if (!$user) {
            abort(403, 'Unauthorized.');
        }

        if ($user->isPlatformStaff() || $user->isPlatformAdmin()) {
            return $next($request);
        }

        abort(403, 'Unauthorized. The chatbot agent console is reserved strictly for Platform Administrators and Support Staff.');
    }
}
