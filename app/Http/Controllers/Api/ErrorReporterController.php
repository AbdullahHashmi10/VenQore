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

        // SEC-09 (2026-09-10): bounded storage. Route throttle limits bursts per
        // IP; this adds a global daily budget and de-duplicates identical reports
        // (same message + file + line) for 10 minutes.
        $fingerprint = sha1(($validated['message'] ?? '') . '|' . ($validated['file'] ?? '') . '|' . ($validated['line'] ?? ''));
        if (!\Illuminate\Support\Facades\Cache::add('err_report_dedupe:' . $fingerprint, 1, 600)) {
            return response()->json(['status' => 'ok', 'deduplicated' => true]);
        }
        $dayKey = 'err_report_budget:' . now()->format('Ymd');
        \Illuminate\Support\Facades\Cache::add($dayKey, 0, 86400);
        if (\Illuminate\Support\Facades\Cache::increment($dayKey) > (int) config('venqore.error_report_daily_budget', 5000)) {
            return response()->json(['status' => 'dropped'], 429);
        }

        ErrorLog::record([
            'type'        => 'frontend',
            'message'     => $validated['message'],
            'url'         => $validated['url'] ?? null,
            'stack_trace' => $validated['stack_trace'] ?? null,
            'file'        => $validated['file'] ?? null,
            'line'        => $validated['line'] ?? null,
            'user_id'     => auth()->id(),
            'tenant_id'   => app()->bound('current.tenant') ? app('current.tenant')->id : null,
            'user_agent'  => substr($request->userAgent() ?? '', 0, 500),
            'ip_address'  => $request->ip(),
        ]);

        return response()->json(['status' => 'ok']);
    }
}
