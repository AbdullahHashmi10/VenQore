<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ErrorLog;
use Illuminate\Http\Request;

class ErrorReporterController extends Controller
{
    /**
     * Store a frontend error report.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'message'     => ['required', 'string', 'max:1000'],
            'url'         => ['nullable', 'string', 'max:500'],
            'stack_trace' => ['nullable', 'string', 'max:5000'],
            'file'        => ['nullable', 'string', 'max:500'],
            'line'        => ['nullable', 'integer'],
        ]);

        ErrorLog::record([
            'type'        => 'frontend',
            'message'     => $validated['message'],
            'url'         => $validated['url'],
            'stack_trace' => $validated['stack_trace'],
            'file'        => $validated['file'],
            'line'        => $validated['line'],
            'user_id'     => auth()->id(),
            'tenant_id'   => app()->bound('current.tenant') ? app('current.tenant')->id : null,
            'user_agent'  => substr($request->userAgent() ?? '', 0, 500),
            'ip_address'  => $request->ip(),
        ]);

        return response()->json(['status' => 'ok']);
    }
}
