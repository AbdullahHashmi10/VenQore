<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Terminal;
use App\Models\TerminalActivity;
use Illuminate\Http\Request;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Support\TerminalDeviceAuth;

class TerminalActivityController extends Controller
{
    /**
     * SEC-04 (2026-09-10): resolve and authenticate the calling terminal.
     * Returns [Terminal, null] or [null, JsonResponse]. A device_id alone is not
     * authentication: the terminal must already be PAIRED to a store and present
     * its device secret. Activity submission can never claim a terminal.
     */
    private function authenticateTerminal(Request $request): array
    {
        $deviceId = (string) $request->input('device_id', '');
        if ($deviceId === '') {
            return [null, response()->json(['error' => 'Device ID required'], 400)];
        }

        if (!config('venqore.terminal_telemetry_enabled')) {
            return [null, response()->json(['error' => 'Terminal activity tracking is disabled.', 'code' => 'TELEMETRY_DISABLED'], 503)];
        }

        $terminal = Terminal::withoutGlobalScope('tenant')->where('device_id', $deviceId)->first();
        if (!$terminal || empty($terminal->tenant_id)) {
            return [null, response()->json(['error' => 'Unauthorized device'], 401)];
        }

        if (!TerminalDeviceAuth::verify($terminal, $request)) {
            return [null, response()->json(['error' => 'Unauthorized device', 'code' => 'DEVICE_AUTH_FAILED'], 401)];
        }

        $storeSlug = $request->input('store_slug');
        if ($storeSlug) {
            $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
            if (!$tenant || (string) $tenant->id !== (string) $terminal->tenant_id) {
                return [null, response()->json(['error' => 'Terminal does not belong to this store.'], 403)];
            }
        }

        return [$terminal, null];
    }

    /**
     * Store terminal activity logs (paired + authenticated terminals only).
     */
    public function store(Request $request)
    {
        [$terminal, $error] = $this->authenticateTerminal($request);
        if ($error) {
            return $error;
        }

        $validated = $request->validate([
            'activities'                    => 'array|max:100',
            'activities.*.away_at'          => 'required|date',
            'activities.*.back_at'          => 'required|date',
            'activities.*.duration_seconds' => 'required|integer|min:0|max:86400',
        ]);

        foreach ($validated['activities'] ?? [] as $act) {
            TerminalActivity::create([
                'terminal_id'      => $terminal->id,
                'device_id'        => $terminal->device_id,
                'away_at'          => $act['away_at'],
                'back_at'          => $act['back_at'],
                'duration_seconds' => $act['duration_seconds'],
                // Screenshot paths are assigned by the server on upload only.
                'screenshot_path'  => null,
                'tenant_id'        => $terminal->tenant_id,
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Upload an encrypted screen capture (paired + authenticated terminals only).
     * The server chooses the storage path; client filenames are ignored.
     */
    public function uploadScreenshot(Request $request)
    {
        [$terminal, $error] = $this->authenticateTerminal($request);
        if ($error) {
            return $error;
        }

        // Max 10MB to prevent disk exhaustion
        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        // Recheck SEC-04: the old client encrypted with a key derived from the
        // device ID, which is not secret. Captures now travel as a PNG over TLS
        // on this authenticated call and are encrypted AT REST here with the
        // application key. Uploads in the old format are still accepted (and
        // re-encrypted) so an un-updated station does not lose its queue.
        $bytes = (string) file_get_contents($request->file('file')->getRealPath());
        $png = self::isPng($bytes) ? $bytes : self::legacyDecrypt($bytes, (string) $terminal->device_id);
        if ($png === null) {
            return response()->json(['error' => 'The screenshot must be a PNG image.'], 422);
        }

        $relative = $terminal->tenant_id . '/' . $terminal->id . '/' . Str::uuid() . '.bin';
        Storage::put('terminal_screenshots/' . $relative, Crypt::encryptString($png));

        $activity = TerminalActivity::withoutGlobalScope('tenant')
            ->where('terminal_id', $terminal->id)
            ->where('tenant_id', $terminal->tenant_id)
            ->whereNull('screenshot_path')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($activity) {
            $activity->update(['screenshot_path' => $relative]);
        }

        return response()->json([
            'success'  => true,
            'filename' => $relative,
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

        $stored = Storage::get($filePath);

        try {
            $decrypted = Crypt::decryptString($stored);
        } catch (DecryptException $e) {
            // Captures stored before at-rest encryption (old device-ID format).
            $deviceId = $activity->device_id ?: $activity->terminal?->device_id;
            $decrypted = $deviceId ? self::legacyDecrypt($stored, (string) $deviceId) : null;
        }

        if ($decrypted === null || $decrypted === false) {
            abort(500, 'The screenshot could not be decrypted.');
        }

        return response($decrypted, 200)
            ->header('Content-Type', 'image/png');
    }

    private static function isPng(string $bytes): bool
    {
        return strncmp($bytes, "\x89PNG\r\n\x1a\n", 8) === 0;
    }

    /** Old station format: 16-byte IV + AES-256-CBC(sha256(device_id)). Returns the PNG or null. */
    private static function legacyDecrypt(string $bytes, string $deviceId): ?string
    {
        if ($deviceId === '' || strlen($bytes) < 17) {
            return null;
        }
        $plain = openssl_decrypt(substr($bytes, 16), 'aes-256-cbc', hash('sha256', $deviceId, true), OPENSSL_RAW_DATA, substr($bytes, 0, 16));

        return ($plain !== false && self::isPng($plain)) ? $plain : null;
    }
}
