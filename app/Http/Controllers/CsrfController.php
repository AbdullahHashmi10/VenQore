<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CsrfController extends Controller
{
    /**
     * Return a fresh CSRF token for the frontend to refresh its stale meta tag.
     * This is useful for long-lived POS sessions that might encounter 419 errors.
     */
    public function refresh()
    {
        return response()->json([
            'token' => csrf_token()
        ]);
    }
}
