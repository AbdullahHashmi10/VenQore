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
            // Encode active tenant context in OAuth state parameter to survive dynamic redirects
            $statePayload = encrypt([
                'tenant_id' => $tenant->id,
                'slug' => $tenant->slug
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
        // 1. Recover tenant ID and context from state parameter
        $state = $request->input('state');
        if (!$state) {
            return redirect()->route('hub')->with('error', 'Invalid Google state response.');
        }

        try {
            $decrypted = decrypt($state);
            $tenantId = $decrypted['tenant_id'] ?? null;
            $slug = $decrypted['slug'] ?? null;

            if (!$tenantId || !$slug) {
                return redirect()->route('hub')->with('error', 'Google OAuth context was lost.');
            }

            $tenant = Tenant::findOrFail($tenantId);

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
}
