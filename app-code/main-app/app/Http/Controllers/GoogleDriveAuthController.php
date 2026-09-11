<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class GoogleDriveAuthController extends Controller
{
    protected $driveService;

    public function __construct(GoogleDriveService $driveService)
    {
        $this->driveService = $driveService;
    }

    /**
     * Redirect the user to Google OAuth consent page.
     */
    public function redirectToGoogle(Request $request)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            // SEC-12 (2026-09-10): random, single-use, session-bound, expiring state.
            // The old state was an encrypted {tenant_id, slug} with no nonce, expiry
            // or actor binding, so it stayed valid after the member lost access.
            $statePayload = \Illuminate\Support\Str::random(48);
            $request->session()->put('gdrive_oauth', [
                'nonce'      => hash('sha256', $statePayload),
                'tenant_id'  => $tenant->id,
                'slug'       => $tenant->slug,
                'user_id'    => $request->user()?->id,
                'expires_at' => now()->addMinutes(10)->getTimestamp(),
            ]);

            return Socialite::driver('google')
                ->scopes(['https://www.googleapis.com/auth/drive.file'])
                ->with([
                    'access_type' => 'offline',
                    'prompt' => 'consent',
                    'state' => $statePayload
                ])
                ->redirectUrl(route('google.callback'))
                ->redirect();

        } catch (\Exception $e) {
            Log::error("Failed to generate Google Drive OAuth redirect: " . $e->getMessage());
            return back()->with('error', 'Unable to initiate Google connection: ' . $e->getMessage());
        }
    }

    /**
     * Handle the global Google OAuth callback.
     */
    public function handleGoogleCallback(Request $request)
    {
        // 1. SEC-12: verify the one-time state against THIS browser session and user.
        $state   = (string) $request->input('state', '');
        $pending = $request->session()->pull('gdrive_oauth'); // consumed whatever happens

        if ($state === '' || !is_array($pending) || !hash_equals((string) ($pending['nonce'] ?? ''), hash('sha256', $state))) {
            return redirect()->route('hub')->with('error', 'Google connection could not be verified. Please start again from Backup settings.');
        }
        if (($pending['expires_at'] ?? 0) < now()->getTimestamp()) {
            return redirect()->route('hub')->with('error', 'The Google connection request expired. Please start again.');
        }
        if (!$request->user() || (string) $request->user()->id !== (string) ($pending['user_id'] ?? '')) {
            return redirect()->route('login')->with('error', 'Please sign in with the account that started the Google connection.');
        }

        try {
            $tenantId = $pending['tenant_id'] ?? null;
            $slug     = $pending['slug'] ?? null;

            if (!$tenantId || !$slug) {
                return redirect()->route('hub')->with('error', 'Google OAuth context was lost.');
            }

            $tenant = Tenant::findOrFail($tenantId);

            // Re-check, at callback time, that this user may still manage backups here.
            if (!$this->canManageBackups($request->user(), $tenant)) {
                Log::warning('Google Drive link refused: user no longer authorised', ['tenant_id' => $tenant->id, 'user_id' => $request->user()->id]);
                return redirect()->route('hub')->with('error', 'You no longer have permission to manage backups for that store.');
            }

            // 2. Complete token exchange via Socialite
            $googleUser = Socialite::driver('google')
                ->redirectUrl(route('google.callback'))
                ->stateless()
                ->user();

            $accessToken = $googleUser->token;
            $refreshToken = $googleUser->refreshToken; // Available since we requested offline access
            $email = $googleUser->email;

            if (!$refreshToken) {
                // If refresh token is missing, check if we already have one stored
                if ($tenant->google_refresh_token) {
                    $refreshToken = $tenant->google_refresh_token;
                } else {
                    return redirect()->route('store.admin.data', ['store_slug' => $slug, 'tab' => 'backup'])
                        ->with('error', 'Failed to retrieve permanent offline access. Please disconnect and re-authenticate Google Drive.');
                }
            }

            // 3. Save tokens and configuration on tenant
            $tenant->google_access_token = $accessToken;
            $tenant->google_refresh_token = $refreshToken;
            $tenant->google_backup_email = $email;
            $tenant->google_backup_enabled = true;
            if ($tenant->onboarding_step === 'drive_sync_tour') {
                $tenant->onboarding_step = 'completed';
                $tenant->onboarding_completed = true;
            }
            $tenant->save();

            // 4. Verify/Create initial folder on Google Drive
            $folderId = $this->driveService->getOrCreateFolder($tenant, $accessToken);
            if (!$folderId) {
                Log::warning("Tenant {$tenant->id} Google connection completed, but folder setup failed.");
            }

            Log::info("Tenant {$tenant->id} ('{$tenant->slug}') successfully integrated Google Drive backups ({$email})");

            return redirect()->route('store.admin.data', ['store_slug' => $slug, 'tab' => 'drive_sync'])
                ->with('success', 'Google Drive connected successfully! Daily automatic backups are now enabled.');

        } catch (\Exception $e) {
            Log::error("Error handling Google OAuth callback: " . $e->getMessage(), ['exception' => $e]);
            return redirect()->route('hub')->with('error', 'Google authentication failed: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect Google Drive integration.
     */
    public function disconnect(Request $request)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        try {
            $tenant->google_backup_enabled = false;
            $tenant->google_backup_email = null;
            $tenant->google_access_token = null;
            $tenant->google_refresh_token = null;
            $tenant->google_backup_folder_id = null;
            $tenant->save();

            Log::info("Tenant {$tenant->id} disconnected Google Drive backups.");

            return back()->with('success', 'Google Drive integration disconnected successfully.');

        } catch (\Exception $e) {
            Log::error("Failed to disconnect Google Drive for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to disconnect: ' . $e->getMessage());
        }
    }

    /**
     * Update Google Drive backup settings.
     */
    public function updateSettings(Request $request)
    {
        $tenant = app('current.tenant');
        if (!$tenant) {
            return back()->with('error', 'No active store context found.');
        }

        $request->validate([
            'google_backup_enabled' => 'required|boolean',
            'google_backup_retention' => 'required|integer|in:7,14,30',
        ]);

        try {
            $tenant->google_backup_enabled = $request->google_backup_enabled;
            $tenant->google_backup_retention = $request->google_backup_retention;
            $tenant->save();

            return back()->with('success', 'Backup settings updated successfully.');

        } catch (\Exception $e) {
            Log::error("Failed to update Google Drive settings for store {$tenant->id}: " . $e->getMessage());
            return back()->with('error', 'Failed to save settings: ' . $e->getMessage());
        }
    }

    /**
     * SEC-12: active owner/admin-level membership with admin.data_recovery.
     */
    private function canManageBackups($user, Tenant $tenant): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }
        $membership = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();
        if (!$membership) {
            return false;
        }
        $perms = (!empty($membership->permissions) && is_array($membership->permissions))
            ? $membership->permissions
            : config('permissions.' . ($membership->role ?? 'viewer'), []);

        return in_array('admin.data_recovery', $perms, true);
    }
}
