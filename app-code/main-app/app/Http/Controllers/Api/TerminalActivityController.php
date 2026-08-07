<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Terminal;
use App\Models\TerminalActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TerminalActivityController extends Controller
{
    /**
     * Store terminal activity logs.
     */
    public function store(Request $request)
    {
        $deviceId = $request->input('device_id');
        $terminalId = $request->input('terminal_id');
        $storeSlug = $request->input('store_slug');
        $activities = $request->input('activities', []);

        if (!$deviceId) {
            return response()->json(['error' => 'Device ID required'], 400);
        }

        // Resolve Tenant by storeSlug if supplied
        $tenant = null;
        if ($storeSlug) {
            $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
        }

        // Locate terminal using withoutGlobalScope to bypass the unauthenticated block
        $terminal = null;
        if ($terminalId && Str::isUuid($terminalId)) {
            $terminal = Terminal::withoutGlobalScope('tenant')->find($terminalId);
        }
        if (!$terminal) {
            $terminal = Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        }
        if (!$terminal && $terminalId) {
            // Find by legacy ID name for fallback
            $terminal = Terminal::withoutGlobalScope('tenant')->where('name', 'Terminal ' . $terminalId)->first();
        }

        // Update terminal device ID mapping if not set
        if ($terminal) {
            if (!$terminal->device_id) {
                $terminal->update(['device_id' => $deviceId]);
            }

            // SECURITY (tenant isolation): this endpoint is unauthenticated, so
            // the caller-supplied store_slug must NEVER be able to move a
            // terminal that already belongs to a tenant into a different one —
            // that is a cross-tenant hijack. Only allow an initial claim when
            // the terminal has no owner yet; refuse conflicting ownership.
            // Regression guard: Tester/tests/Feature/Guardrails/TerminalOwnershipGuardTest.php
            if ($tenant) {
                if (empty($terminal->tenant_id)) {
                    $terminal->update(['tenant_id' => $tenant->id]);
                } elseif ((string) $terminal->tenant_id !== (string) $tenant->id) {
                    return response()->json(['error' => 'Terminal does not belong to this store.'], 403);
                }
            }
        }

        $tenantId = $tenant ? $tenant->id : ($terminal ? $terminal->tenant_id : null);

        foreach ($activities as $act) {
            TerminalActivity::create([
                'terminal_id' => $terminal ? $terminal->id : null,
                'device_id' => $deviceId,
                'away_at' => $act['away_at'],
                'back_at' => $act['back_at'],
                'duration_seconds' => $act['duration_seconds'],
                'screenshot_path' => $act['screenshot_filename'] ?? null,
                'tenant_id' => $tenantId,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Upload an encrypted screen capture.
     */
    public function uploadScreenshot(Request $request)
    {
        $deviceId = $request->input('device_id');
        if (!$deviceId) {
            return response()->json(['error' => 'Device ID required'], 400);
        }

        // Authenticate the device (L028)
        $terminal = \App\Models\Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        if (!$terminal) {
            return response()->json(['error' => 'Unauthorized device'], 401);
        }

        // Validate the upload file size (max 10MB) to prevent disk exhaustion DoS
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        
        // Sanitize the filename to prevent directory traversal attacks
        $filename = basename($file->getClientOriginalName());
        
        // Sanity check extension
        if (!Str::endsWith($filename, '.bin')) {
            $filename .= '.bin';
        }
        
        $path = $file->storeAs('terminal_screenshots', $filename);

        // Associate screenshot with the most recent activity log for this device that doesn't have a path yet
        // Bypass global tenant scope since this is a global public API upload call
        $activity = TerminalActivity::withoutGlobalScope('tenant')
            ->where('device_id', $deviceId)
            ->whereNull('screenshot_path')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($activity) {
            $activity->update(['screenshot_path' => $filename]);
        }

        return response()->json([
            'success' => true,
            'filename' => $filename,
            'path' => $path
        ]);
    }

    /**
     * Decrypt and view an encrypted screenshot (Admin access only).
     */
    public function viewScreenshot($id)
    {
        $activity = TerminalActivity::findOrFail($id);
        
        if (!$activity->screenshot_path) {
            abort(404, 'Screenshot not found for this activity');
        }

        $filePath = 'terminal_screenshots/' . $activity->screenshot_path;
        if (!Storage::exists($filePath)) {
            abort(404, 'Screenshot file does not exist on server storage');
        }

        // Get key based on the activity's device_id or fallback
        $deviceId = $activity->device_id;
        if (!$deviceId) {
            // Check terminal device id
            $deviceId = $activity->terminal?->device_id;
        }

        if (!$deviceId) {
            abort(400, 'Unable to decrypt screenshot: Missing Device ID');
        }

        $encryptedData = Storage::get($filePath);
        if (strlen($encryptedData) < 17) {
            abort(500, 'Invalid or corrupted screenshot data');
        }

        // Decrypt using AES-256-CBC
        $iv = substr($encryptedData, 0, 16);
        $ciphertext = substr($encryptedData, 16);
        $key = hash('sha256', $deviceId, true);
        $decrypted = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($decrypted === false) {
            abort(500, 'Decryption failed. Check key validity.');
        }

        return response($decrypted, 200)
            ->header('Content-Type', 'image/png');
    }
}
