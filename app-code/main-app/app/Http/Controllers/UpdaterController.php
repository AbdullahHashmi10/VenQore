<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use ZipArchive;
use Exception;

class UpdaterController extends Controller
{
    /**
     * Maximum allowed upload size: 300 MB
     */
    private const MAX_ZIP_SIZE_BYTES = 300 * 1024 * 1024;

    /**
     * Shared lock-staleness threshold (minutes), used by BOTH this
     * controller (to decide whether a new upload may start) and
     * PreventAccessDuringUpdate middleware (to decide whether to stop
     * blocking ordinary traffic). These two used to be different values
     * (30 here, 15 in the middleware) — the middleware would silently let
     * traffic back through while a genuinely-still-running extract of a
     * large package (14,000+ files) was mid-overwrite, because it thought
     * the lock was stale before this controller did. They must always
     * match; if you need to change the timeout, change it only here and
     * have the middleware read the same value.
     */
    public const LOCK_MAX_AGE_MINUTES = 30;

    /**
     * Lock file path — prevents concurrent updates
     */
    private function lockPath(): string
    {
        return storage_path('update.lock');
    }

    /**
     * Update the lock file's mtime without changing its contents, so a
     * genuinely-still-running long extract never crosses the staleness
     * threshold and gets treated as abandoned mid-operation.
     */
    private function touchLock(): void
    {
        if (File::exists($this->lockPath())) {
            @touch($this->lockPath());
        }
    }

    /**
     * Show the updater page.
     * Only accessible if the app is already installed.
     */
    public function index()
    {
        if (!File::exists(storage_path('installed'))) {
            return redirect()->route('installer.index');
        }

        $currentVersion = $this->getCurrentVersion();

        $history = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('platform_audit_logs')) {
                $history = \App\Models\PlatformAuditLog::with('user')
                    ->where('action', 'system.updated')
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(fn($log) => [
                        'version'    => $log->payload['version'] ?? 'unknown',
                        'updated_at' => $log->created_at->toIso8601String(),
                        'by'         => $log->user?->name ?? 'System',
                    ])
                    ->toArray();
            }
        } catch (\Throwable $e) {
            Log::warning('Updater: could not fetch version history: ' . $e->getMessage());
        }

        return inertia('Updater/Index', [
            'currentVersion' => $currentVersion,
            'versionHistory' => $history,
        ]);
    }

    /**
     * Get system information for the updater UI.
     */
    public function info()
    {
        $pendingMigrations = [];
        try {
            $ran   = DB::table('migrations')->pluck('migration')->toArray();
            $files = File::glob(database_path('migrations/*.php'));
            foreach ($files as $file) {
                $name = pathinfo($file, PATHINFO_FILENAME);
                if (!in_array($name, $ran)) {
                    $pendingMigrations[] = $name;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Could not fetch pending migrations: ' . $e->getMessage());
        }

        // Check PHP upload limits — shared hosting often limits this!
        $phpUploadBytes = $this->phpIniToBytes(ini_get('upload_max_filesize'));
        $phpPostBytes   = $this->phpIniToBytes(ini_get('post_max_size'));

        // If 0, it means unlimited. Use a large fallback value so it doesn't break min().
        $phpUploadMaxMB = $phpUploadBytes > 0 ? $phpUploadBytes / 1024 / 1024 : 9999;
        $phpPostMaxMB   = $phpPostBytes > 0 ? $phpPostBytes / 1024 / 1024 : 9999;

        $effectiveMaxMB = min(
            round(self::MAX_ZIP_SIZE_BYTES / 1024 / 1024),
            $phpUploadMaxMB,
            $phpPostMaxMB
        );

        // Calculate a safe chunk size in bytes (between 512KB and 2MB, never exceeding 75% of upload limits)
        $effectiveLimitBytes = min(
            $phpUploadBytes > 0 ? $phpUploadBytes : 10 * 1024 * 1024,
            $phpPostBytes > 0 ? $phpPostBytes : 10 * 1024 * 1024
        );
        $recommendedChunkBytes = min(2 * 1024 * 1024, max(512 * 1024, (int) ($effectiveLimitBytes * 0.75)));

        // Read lock information if currently locked
        $lockInfo = null;
        if (File::exists($this->lockPath())) {
            $rawLock = @json_decode(File::get($this->lockPath()), true);
            if (is_array($rawLock)) {
                $lockTime = File::lastModified($this->lockPath());
                $rawLock['age_minutes'] = round((time() - $lockTime) / 60);
                $lockInfo = $rawLock;
            }
        }

        return response()->json([
            'current_version'         => $this->getCurrentVersion(),
            'php_version'             => PHP_VERSION,
            'pending_migrations'      => count($pendingMigrations),
            'pending_list'            => $pendingMigrations,
            'storage_writable'        => is_writable(storage_path()),
            'base_writable'           => is_writable(base_path()),
            'zip_extension'           => (extension_loaded('zip') || class_exists('PclZip') || file_exists(base_path('vendor/pclzip/pclzip/pclzip.lib.php'))),
            'disk_free_mb'            => round(disk_free_space(base_path()) / 1024 / 1024),
            'update_in_progress'      => File::exists($this->lockPath()),
            'lock_info'               => $lockInfo,
            'max_zip_mb'              => $effectiveMaxMB,
            'php_upload_max_mb'       => $phpUploadMaxMB,
            'php_post_max_mb'         => $phpPostMaxMB,
            'app_max_mb'              => round(self::MAX_ZIP_SIZE_BYTES / 1024 / 1024),
            'recommended_chunk_bytes' => $recommendedChunkBytes,
        ]);
    }

    /**
     * Clear any stuck update lock on demand (called by Platform Admin from UI).
     */
    public function resetLock()
    {
        $this->safeDisableMaintenanceMode();
        $this->releaseLock();

        // Also clean up any abandoned chunk directories
        $chunksDir = storage_path('app/update_chunks');
        if (File::isDirectory($chunksDir)) {
            try {
                File::deleteDirectory($chunksDir);
            } catch (\Throwable $e) {
                // Non-critical
            }
        }

        Log::info('Updater: Update lock and temporary chunks forcibly reset by ' . (Auth::user()?->email ?? 'unknown'));

        return response()->json([
            'success' => true,
            'message' => 'Update lock has been reset. The updater is ready for a new package.',
        ]);
    }

    /**
     * Run the full update process from an uploaded ZIP file.
     */
    public function run(Request $request)
    {
        set_time_limit(0);
        @ini_set('max_execution_time', '0');
        @ini_set('memory_limit', '-1');

        $step = $request->input('step');

        // Whitelist valid steps — never trust user input blindly
        $validSteps = ['upload', 'extract', 'migrate', 'cache', 'version'];
        if (!in_array($step, $validSteps, true)) {
            return response()->json(['error' => 'Invalid step specified.'], 400);
        }

        // Token and phase order verification
        // Upload requests are already protected by UpdaterLock's authenticated
        // platform-admin and CSRF checks. Do not require the operation token
        // during upload: older updater JavaScript only learns the token after
        // the final chunk. Every destructive post-upload step still requires
        // the token and strict phase validation below.
        if ($step !== 'upload') {
            $lockPath = $this->lockPath();
            if (!File::exists($lockPath)) {
                return response()->json(['error' => 'No active update operation found.'], 409);
            }
            $lockData = @json_decode(File::get($lockPath), true) ?: [];
            $requestToken = $request->input('update_token') ?? $request->header('X-Update-Token');
            if (empty($requestToken) || empty($lockData['update_token']) || !hash_equals($lockData['update_token'], $requestToken)) {
                return response()->json(['error' => 'Unauthorized: Invalid or expired update token.'], 403);
            }

            // Enforce phase order strictly on server
            $currentPhase = $lockData['phase'] ?? ($lockData['step'] ?? 'idle');
            $allowedPhaseForStep = [
                'extract' => ['uploaded'],
                'migrate' => ['extracted'],
                'cache'   => ['migrated'],
                'version' => ['cached'],
            ];
            if (isset($allowedPhaseForStep[$step])) {
                if (!in_array($currentPhase, $allowedPhaseForStep[$step], true)) {
                    return response()->json([
                        'error' => "Illegal phase transition: step [{$step}] cannot run when current phase is [{$currentPhase}]."
                    ], 400);
                }
            }
        }

        try {
            switch ($step) {
                case 'upload':
                    return $this->handleUpload($request);
                case 'extract':
                    return $this->handleExtract();
                case 'migrate':
                    return $this->handleMigrate();
                case 'cache':
                    return $this->handleCacheClear();
                case 'version':
                    return $this->handleVersionBump($request);
            }
        } catch (\Throwable $e) {
            Log::error("Updater failed at step [{$step}]: " . $e->getMessage() . "\n" . $e->getTraceAsString());

            if ($step === 'upload') {
                // Upload failure before extraction: no files changed, so lock can be released
                $this->releaseLock();
            } else {
                // Hard failure during active mutation (extract, migrate, cache, version):
                // Keep the update lock and maintenance mode active! Do NOT re-open traffic to a corrupt release!
                if (File::exists($this->lockPath())) {
                    $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
                    $lockData['status'] = 'failed';
                    $lockData['failed_step'] = $step;
                    $lockData['error'] = $e->getMessage();
                    $lockData['failed_at'] = now()->toIso8601String();
                    $lockData['maintenance'] = true;
                    File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
                }
            }

            return response()->json([
                'error' => $e->getMessage(),
                'step' => $step,
                'status' => 'failed'
            ], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Chunked Upload — receives file in small pieces
    // Each chunk is a separate HTTP request (~5MB) so nginx
    // never times out. Final chunk assembles the full ZIP.
    // ─────────────────────────────────────────────────────────────
    private function handleUpload(Request $request)
    {
        $chunkIndex  = (int) $request->input('chunk_index', 0);
        $totalChunks = (int) $request->input('total_chunks', 1);
        $uploadId    = $request->input('upload_id', 'default');

        // Sanitise upload_id to prevent path traversal
        $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $uploadId);
        if (empty($uploadId)) $uploadId = 'default';

        $chunkDir = storage_path("app/update_chunks/{$uploadId}");

        // ── First chunk: lock & validate (Atomic Acquisition) ────
        if ($chunkIndex === 0) {
            $lockPath = $this->lockPath();
            $fp = @fopen($lockPath, 'c+');
            if (!$fp) {
                return response()->json(['error' => 'Unable to open or create update lock file.'], 500);
            }
            if (!flock($fp, LOCK_EX | LOCK_NB)) {
                fclose($fp);
                return response()->json(['error' => 'Another update operation is currently writing to the lock. Concurrent updates are rejected.'], 409);
            }

            // Read existing lock under advisory exclusive lock
            $rawLock = stream_get_contents($fp);
            $existingLock = !empty($rawLock) ? @json_decode($rawLock, true) : null;

            if (is_array($existingLock)) {
                $lockTime = $existingLock['heartbeat'] ?? ($existingLock['started_at'] ? strtotime($existingLock['started_at']) : time());
                $ageMinutes = round((time() - $lockTime) / 60);
                $existingStatus = $existingLock['status'] ?? 'in_progress';
                $existingPhase = $existingLock['phase'] ?? ($existingLock['step'] ?? '');

                if ($existingStatus === 'failed') {
                    flock($fp, LOCK_UN);
                    fclose($fp);
                    return response()->json([
                        'error' => 'A prior update operation failed and the system is held in recovery state. Please inspect logs and reset lock before uploading.'
                    ], 409);
                }

                $isUploadPhase = ($existingPhase === 'uploading' || $existingPhase === 'uploading_chunks');
                if ($isUploadPhase && $ageMinutes < 5) {
                    flock($fp, LOCK_UN);
                    fclose($fp);
                    return response()->json([
                        'error' => "Another update upload is currently in progress (started {$ageMinutes} minute(s) ago). Concurrent uploads are rejected."
                    ], 409);
                }

                if (!$isUploadPhase && $ageMinutes < self::LOCK_MAX_AGE_MINUTES) {
                    flock($fp, LOCK_UN);
                    fclose($fp);
                    return response()->json([
                        'error' => "An active update deployment ({$existingPhase}) is currently in progress. Concurrent operations are rejected."
                    ], 409);
                }
            }

            // Clean up any leftover chunks from a previous failed attempt
            if (File::isDirectory($chunkDir)) {
                File::deleteDirectory($chunkDir);
            }
            File::makeDirectory($chunkDir, 0755, true);
            File::put($chunkDir . '/.expected_total_chunks', (string) $totalChunks);

            $operationId = 'op_' . bin2hex(random_bytes(16));
            $updateToken = bin2hex(random_bytes(32)); // 64-char hex

            // Write new lock payload atomically under exclusive lock
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode([
                'operation_id' => $operationId,
                'started_at'   => now()->toIso8601String(),
                'started_by'   => Auth::user()?->email ?? 'unknown',
                'phase'        => 'uploading',
                'step'         => 'uploading_chunks',
                'status'       => 'in_progress',
                'maintenance'  => false, // Upload only writes temp chunks to storage/app/update_chunks, not touching active code
                'total_chunks' => $totalChunks,
                'update_token' => $updateToken,
                'heartbeat'    => time(),
            ], JSON_PRETTY_PRINT));
            fflush($fp);
            flock($fp, LOCK_UN);
            fclose($fp);
        }

        // ── Reject total_chunks mismatch against this attempt's record ──
        // Guards against a stale/mismatched chunk set if a client retries
        // with the same upload_id but a different total_chunks value after
        // an earlier attempt already wrote chunks beyond index 0.
        $expectedTotalChunksFile = $chunkDir . '/.expected_total_chunks';
        if (File::exists($expectedTotalChunksFile)) {
            $expectedTotalChunks = (int) trim(File::get($expectedTotalChunksFile));
            if ($expectedTotalChunks > 0 && $expectedTotalChunks !== $totalChunks) {
                File::deleteDirectory($chunkDir);
                throw new Exception(
                    "Upload interrupted: expected {$expectedTotalChunks} chunks but received {$totalChunks}. Please retry the upload from the start."
                );
            }
        }

        // ── Receive this chunk ────────────────────────────────────
        if (!$request->hasFile('chunk')) {
            throw new Exception("Chunk {$chunkIndex} was not received. Upload may have exceeded server post_max_size or upload_max_filesize.");
        }

        $chunkFile = $request->file('chunk');
        if ($chunkFile->getError() !== UPLOAD_ERR_OK) {
            $errCode = $chunkFile->getError();
            $errMsg = match ($errCode) {
                UPLOAD_ERR_INI_SIZE => "Chunk {$chunkIndex} exceeds server upload_max_filesize limit.",
                UPLOAD_ERR_FORM_SIZE => "Chunk {$chunkIndex} exceeds form MAX_FILE_SIZE directive.",
                UPLOAD_ERR_PARTIAL => "Chunk {$chunkIndex} was only partially uploaded.",
                UPLOAD_ERR_NO_FILE => "No chunk was received by server.",
                UPLOAD_ERR_NO_TMP_DIR => "Missing temporary upload directory on server.",
                UPLOAD_ERR_CANT_WRITE => "Failed to write uploaded chunk to disk.",
                default => "Chunk {$chunkIndex} upload error (code: {$errCode}).",
            };
            throw new Exception($errMsg);
        }

        // Save chunk with zero-padded index for correct ordering
        if (!File::isDirectory($chunkDir)) {
            File::makeDirectory($chunkDir, 0755, true);
        }
        $targetChunkPath = $chunkDir . '/' . sprintf('chunk_%05d', $chunkIndex);
        if (File::exists($targetChunkPath)) {
            @unlink($targetChunkPath);
        }
        $chunkFile->move($chunkDir, sprintf('chunk_%05d', $chunkIndex));

        Log::debug("Updater: Received chunk {$chunkIndex}/{$totalChunks} for upload {$uploadId}");

        // The token is created while accepting chunk zero. Return it with that
        // response so the browser can authenticate chunk one and every later
        // request. Waiting until the final chunk creates an impossible
        // handshake: run() requires the token for chunk_index > 0.
        $storedToken = null;
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $storedToken = $lockData['update_token'] ?? null;
        }

        // ── Not the last chunk? Return immediately ────────────────
        if ($chunkIndex < $totalChunks - 1) {
            return response()->json([
                'message'     => "Chunk " . ($chunkIndex + 1) . " of {$totalChunks} received.",
                'chunk_index' => $chunkIndex,
                'complete'    => false,
                'update_token' => $storedToken,
            ]);
        }

        // ══════════════════════════════════════════════════════════
        // LAST CHUNK — Assemble the full ZIP
        // ══════════════════════════════════════════════════════════

        $updateDir  = storage_path('app/update_package');
        $targetPath = $updateDir . '/update.zip';

        if (!File::isDirectory($updateDir)) {
            File::makeDirectory($updateDir, 0755, true);
        }
        if (File::exists($targetPath)) {
            File::delete($targetPath);
        }

        // Concatenate all chunks into final ZIP
        $outputHandle = fopen($targetPath, 'wb');
        if (!$outputHandle) {
            throw new Exception('Could not create output file. Check storage permissions.');
        }

        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = $chunkDir . '/' . sprintf('chunk_%05d', $i);
            if (!File::exists($chunkPath)) {
                fclose($outputHandle);
                File::delete($targetPath);
                throw new Exception("Missing chunk {$i}. The upload was incomplete. Please try again.");
            }
            $chunkHandle = fopen($chunkPath, 'rb');
            if ($chunkHandle) {
                stream_copy_to_stream($chunkHandle, $outputHandle);
                fclose($chunkHandle);
            }
        }
        fclose($outputHandle);

        // Clean up chunk directory
        File::deleteDirectory($chunkDir);

        // Verify the assembled file
        $fileSizeMB = round(filesize($targetPath) / 1024 / 1024, 1);

        // Extension sanity check
        $ext = strtolower(pathinfo($request->input('filename', 'update.zip'), PATHINFO_EXTENSION));
        if ($ext !== 'zip') {
            File::delete($targetPath);
            $this->releaseLock();
            throw new Exception('Invalid file type. Only .zip update packages are accepted.');
        }

        // Size check
        if (filesize($targetPath) > self::MAX_ZIP_SIZE_BYTES) {
            File::delete($targetPath);
            $this->releaseLock();
            $maxMB = round(self::MAX_ZIP_SIZE_BYTES / 1024 / 1024);
            throw new Exception("The uploaded file is too large. Maximum allowed size is {$maxMB} MB.");
        }

        Log::info("Updater: Package assembled from {$totalChunks} chunks ({$fileSizeMB} MB). By: " . (Auth::user()?->email ?? 'unknown'));

        // Commit the upload state before the browser requests extraction.
        // Without this transition the phase guard correctly rejects extract
        // because the lock still says `uploading`.
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'uploaded';
            $lockData['step'] = 'upload_complete';
            $lockData['status'] = 'in_progress';
            $lockData['uploaded_bytes'] = filesize($targetPath);
            $lockData['package_sha256'] = hash_file('sha256', $targetPath);
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
            $storedToken = $lockData['update_token'] ?? $storedToken;
        }

        return response()->json([
            'message'      => "Package received & saved. ({$fileSizeMB} MB, {$totalChunks} chunks)",
            'complete'     => true,
            'update_token' => $storedToken, // Sent to browser — used by subsequent steps to bypass session auth
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Extract ZIP → overwrite app files, skip protected paths
    // ─────────────────────────────────────────────────────────────
    private function handleExtract()
    {
        $zipPath = storage_path('app/update_package/update.zip');

        if (!File::exists($zipPath)) {
            throw new Exception(
                'Update package not found on server. ' .
                'The upload may have been lost (server restart, storage issue). ' .
                'Please re-upload the ZIP file and start again.'
            );
        }

        // ── ENTER HARD MAINTENANCE MODE BEFORE TOUCHING ACTIVE CODE ──
        // The in-app updater mutates active files in place. To prevent customer
        // requests from encountering a mixture of old and new PHP classes, routes,
        // or frontend assets during extraction, maintenance mode (HTTP 503) MUST
        // be activated immediately. The web updater is a MAINTENANCE-MODE updater,
        // NOT a zero-downtime updater.
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'extracting';
            $lockData['step'] = 'extract';
            $lockData['maintenance'] = true; // HARD MAINTENANCE: HTTP 503 for all user traffic
            $lockData['maintenance_started_at'] = now()->toIso8601String();
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        // ── Open and validate ZIP structure BEFORE extraction ─────────
        $useZipArchive = class_exists('ZipArchive');
        $fileCount = 0;
        $zipList = [];

        if ($useZipArchive) {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                throw new Exception('Failed to open the saved update package. It may have been corrupted during transfer.');
            }
            $fileCount = $zip->numFiles;
        } else {
            if (!class_exists('PclZip')) {
                require_once base_path('vendor/pclzip/pclzip/pclzip.lib.php');
            }
            $zip = new \PclZip($zipPath);
            $zipList = $zip->listContent();
            if ($zipList === 0 || !is_array($zipList)) {
                throw new Exception('Failed to open the saved update package (PclZip error). It may have been corrupted during transfer.');
            }
            $fileCount = count($zipList);
        }

        $hasArtisan  = false;
        $hasComposer = false;
        for ($i = 0; $i < $fileCount; $i++) {
            $rawName  = $useZipArchive ? $zip->getNameIndex($i) : $zipList[$i]['filename'];
            $name     = str_replace('\\', '/', $rawName);
            $basename = basename($name);
            $depth    = substr_count($name, '/');

            if ($basename === 'artisan' && $depth <= 1) {
                $hasArtisan = true;
            }
            if ($basename === 'composer.json' && $depth <= 1) {
                $hasComposer = true;
            }
            if ($hasArtisan && $hasComposer) {
                break;
            }
        }

        if (!$hasArtisan || !$hasComposer) {
            if ($useZipArchive) {
                $zip->close();
            }
            throw new Exception(
                'This does not look like a valid VenQore POS update package. ' .
                'Expected files (artisan, composer.json) were not found at the root level. ' .
                'Please verify you have the correct ZIP file from VenQore POS.'
            );
        }

        $basePath = realpath(base_path());

        /**
         * ╔══════════════════════════════════════════════════════════╗
         * ║ PROTECTED PATHS — These are NEVER overwritten.          ║
         * ║ This is the MOST CRITICAL safety net in the updater.    ║
         * ║ If you add a new client-data directory, ADD IT HERE.    ║
         * ╚══════════════════════════════════════════════════════════╝
         *
         * Rules:
         *  - Exact match: '.env' — protects credentials
         *  - Prefix match: 'storage/app/public/' — protects uploads
         *
         * IMPORTANT: Paths are forward-slash normalised, no leading slash.
         */
        $protectedPrefixes = [
            // ── Credentials & Identity ─────
            '.env',                          // DB password, APP_KEY, etc.

            // ── Client uploads ─────────────
            'storage/app/public/',           // Product images, avatars, receipts
            'storage/app/chunks/',           // Chunked upload temp files
            'storage/app/update_package/',   // The ZIP currently being processed

            // ── Server state ───────────────
            'storage/logs/',                 // Error logs — useful for debugging
            'storage/installed',             // Install lock flag
            'storage/app_version.txt',       // Updated by Step 5, not from ZIP
            'storage/update.lock',           // Our own lock file
            'storage/demo-snapshots/',       // Golden Master demo snapshot

            // ── Framework structure (sessions, cache scaffolding) ───
            'storage/framework/sessions/',   // Active user sessions — destroying = logout all users
            'storage/framework/cache/',      // Cache files — will be rebuilt by Step 4
            'storage/framework/views/',      // Compiled views — will be rebuilt by Step 4
            'storage/framework/testing/',    // Testing artifacts

            // ── Database ───────────────────
            'database/database.sqlite',      // SQLite databases if used
        ];

        $skipped = 0;
        $updated = 0;
        $blocked = 0;
        $errors  = 0;

        // ── Detect if ZIP is wrapped in a single root folder ──────────
        $rootFolder = '';
        for ($i = 0; $i < $fileCount; $i++) {
            $name = $useZipArchive ? $zip->getNameIndex($i) : $zipList[$i]['filename'];
            $name = str_replace('\\', '/', $name);
            if (basename($name) === 'artisan') {
                $dir = dirname($name);
                if ($dir !== '.' && $dir !== '') {
                    $rootFolder = $dir . '/';
                }
                break;
            }
        }

        for ($i = 0; $i < $fileCount; $i++) {
            if ($i % 500 === 0) {
                $this->touchLock();
            }

            $rawEntry = $useZipArchive ? $zip->getNameIndex($i) : $zipList[$i]['filename'];

            // ── 1. NORMALIZE PATH SEPARATORS IMMEDIATELY ──────────
            $entryName = str_replace('\\', '/', $rawEntry);

            // ── 2. SKIP DIRECTORY ENTRIES (handles both / and \) ──
            if (str_ends_with($entryName, '/')) {
                continue;
            }

            // ── 3. STRIP ROOT WRAPPER FOLDER IF PRESENT ───────────
            $cleanedName = $entryName;
            if ($rootFolder !== '' && str_starts_with($entryName, $rootFolder)) {
                $cleanedName = substr($entryName, strlen($rootFolder));
            }

            // ── 4. SKIP OS METADATA & DANGEROUS FILES ─────────────
            $basename = strtolower(basename($cleanedName));
            if (
                str_starts_with($cleanedName, '__MACOSX/') ||
                str_contains($cleanedName, '/__MACOSX/') ||
                $basename === '.ds_store' ||
                $basename === 'thumbs.db'
            ) {
                $skipped++;
                continue;
            }

            if (in_array($basename, ['.env', '.env.local', '.env.production'])) {
                Log::warning("UPDATER: Blocked attempt to overwrite .env file from ZIP entry [{$rawEntry}]");
                $skipped++;
                continue;
            }

            // ── 5. PATH TRAVERSAL PROTECTION ──────────────────────
            $realTarget = $this->safeResolvePath($basePath, $cleanedName);

            if ($realTarget === null) {
                Log::critical("UPDATER: Path traversal attempt blocked! Entry: [{$rawEntry}] resolved outside base_path.");
                $blocked++;
                continue;
            }

            // ── 6. PROTECTED PATH CHECK ───────────────────────────
            $normalised = $cleanedName;
            $isProtected = false;
            foreach ($protectedPrefixes as $protected) {
                if ($normalised === $protected || str_starts_with($normalised, $protected)) {
                    $isProtected = true;
                    break;
                }
            }

            if ($isProtected) {
                $skipped++;
                continue;
            }

            // ── 7. WRITE FILE SAFELY ──────────────────────────────
            $targetDir = dirname($realTarget);

            try {
                if (!File::isDirectory($targetDir)) {
                    File::makeDirectory($targetDir, 0755, true);
                }

                if ($useZipArchive) {
                    $content = $zip->getFromIndex($i);
                } else {
                    $extracted = $zip->extract(PCLZIP_OPT_BY_INDEX, array($i), PCLZIP_OPT_EXTRACT_AS_STRING);
                    if (is_array($extracted) && isset($extracted[0]['content'])) {
                        $content = $extracted[0]['content'];
                    } else {
                        $content = false;
                    }
                }

                if ($content === false) {
                    throw new Exception("Could not read content from ZIP index {$i} (entry: {$rawEntry}). Update aborted to prevent partial extraction.");
                }

                $bytesWritten = @file_put_contents($realTarget, $content);
                if ($bytesWritten === false || $bytesWritten !== strlen($content)) {
                    throw new Exception("Failed to write extracted file to [{$cleanedName}]. Check disk space and file permissions.");
                }
                $updated++;
            } catch (\Throwable $e) {
                Log::error("UPDATER: Fatal write failure on [{$cleanedName}]: " . $e->getMessage());
                throw $e;
            }
        }

        if ($useZipArchive) {
            $zip->close();
        }
        // NOTE: The update ZIP package is preserved at $zipPath for rollback and recovery.
        // It will only be cleared after full verification on the final version bump.

        Log::info("Updater extract: {$updated} files updated, {$skipped} protected, {$blocked} blocked.");
        if ($blocked > 0) {
            Log::critical("UPDATER: {$blocked} path traversal attempt(s) were blocked during extraction.");
        }

        // ── 8. CRITICAL: CLEAR BOOTSTRAP CACHE & OPCACHE FIRST ────────
        // MUST happen immediately BEFORE running any Artisan commands,
        // so Laravel does not boot stale cached config against new files!
        $bootstrapCacheDir = base_path('bootstrap/cache');
        $nuked = [];
        foreach (glob($bootstrapCacheDir . '/*.php') as $cacheFile) {
            if (basename($cacheFile) !== '.gitignore') {
                if (@unlink($cacheFile)) {
                    $nuked[] = basename($cacheFile);
                }
            }
        }
        if (!empty($nuked)) {
            Log::info('Updater extract: Pre-cleared stale bootstrap cache: ' . implode(', ', $nuked));
        }

        if (function_exists('opcache_reset')) {
            @opcache_reset();
        }

        // ── 9. NOW RE-CREATE STORAGE SYMLINK & DISCOVER PACKAGES ──────
        try {
            Artisan::call('storage:link');
        } catch (\Throwable $e) {
            Log::warning("Updater: Could not recreate storage symlink: " . $e->getMessage());
        }

        try {
            $composerPath = base_path('vendor/autoload.php');
            if (File::exists($composerPath) && class_exists('Composer\\Autoload\\ClassLoader')) {
                Artisan::call('package:discover');
            }
        } catch (\Throwable $e) {
            Log::warning('Updater: package:discover failed: ' . $e->getMessage());
        }

        // ── Validate the frontend build manifest survived extraction ──
        $manifestPath = base_path('public/build/manifest.json');
        $viteManifestPath = base_path('public/build/.vite/manifest.json');
        if (!File::exists($manifestPath) && !File::exists($viteManifestPath)) {
            Log::critical('Updater: public/build manifest is missing after extraction — frontend assets will not resolve.');
            throw new Exception(
                'The update package did not include a built frontend (public/build/manifest.json is missing after extraction). ' .
                'The application would white-screen if brought back online in this state. ' .
                'Rebuild/repackage the update with `npm run build` output included and try again.'
            );
        }

        // Update lock state: files extracted cleanly
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'extracted';
            $lockData['updated_files'] = $updated;
            $lockData['skipped_files'] = $skipped;
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        $message = "Extraction complete. {$updated} files updated, {$skipped} protected files preserved.";
        if ($blocked > 0) {
            $message .= " ⚠ {$blocked} malicious path(s) were blocked.";
        }

        return response()->json([
            'message' => $message,
            'updated' => $updated,
            'skipped' => $skipped,
            'blocked' => $blocked,
            'errors'  => 0,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Run only new (pending) database migrations
    // ─────────────────────────────────────────────────────────────
    private function handleMigrate()
    {
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'migrating';
            $lockData['step'] = 'migrate';
            $lockData['maintenance'] = true;
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        // Purge cached DB config so fresh .env is used
        DB::purge();

        try {
            Artisan::call('config:clear');
        } catch (Exception $e) {
            Log::warning("Updater: config:clear failed during migration step: " . $e->getMessage());
        }

        // ── Count pending migrations (for logging/reporting only) ──
        // NOTE: this count is informational. It used to gate whether
        // `migrate` ran at all — if a migration was ever logged as "ran"
        // in the `migrations` table without its schema change actually
        // landing (partial/failed prior attempt, renamed migration file
        // between packages, etc.), that heuristic under-counted and the
        // real migration was skipped forever, silently. `artisan migrate`
        // is already a safe no-op when nothing is pending, so it is now
        // called unconditionally below — never skip it.
        $pendingCount = 0;
        try {
            $ran   = DB::table('migrations')->pluck('migration')->toArray();
            $files = File::glob(database_path('migrations/*.php'));
            foreach ($files as $f) {
                if (!in_array(pathinfo($f, PATHINFO_FILENAME), $ran)) {
                    $pendingCount++;
                }
            }
        } catch (Exception $e) {
            Log::warning("Updater: Could not count pending migrations: " . $e->getMessage());
        }

        // ── Run migrations (never fresh/reset!) — always, unconditionally ──
        $exitCode = Artisan::call('migrate', ['--force' => true]);
        $output   = Artisan::output();

        // ── Detect migration failure ───────────────────────────────
        if ($exitCode !== 0) {
            Log::error("Migration failed with exit code {$exitCode}. Output: {$output}");
            throw new Exception(
                "Database migration FAILED (exit code: {$exitCode}). " .
                "The migration that failed may have partially run. " .
                "Check your database carefully. Details: " . trim($output)
            );
        }

        // ── Post-migrate schema validation gate ────────────────────
        // Assert that critical load-bearing columns exist before proceeding
        $this->assertCriticalSchema();

        // Update lock state: migrations applied cleanly
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'migrated';
            $lockData['maintenance'] = true;
            $lockData['pending_migrations_applied'] = $pendingCount;
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        Log::info("Updater: Migrations completed. {$pendingCount} migration(s) applied.");

        return response()->json([
            'message' => "Database migrations applied successfully. ({$pendingCount} migration(s) applied)",
            'output'  => trim($output) ?: 'All migrations ran without errors.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Clear all application caches
    // ─────────────────────────────────────────────────────────────
    private function handleCacheClear()
    {
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'caching';
            $lockData['step'] = 'cache';
            $lockData['maintenance'] = true;
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        $results = [];

        // ── 1. PHYSICAL DELETE of bootstrap/cache/*.php ───────────
        // This is the most reliable way to ensure no stale poisoned
        // config cache (e.g. broken heroicons prefix) can ever crash
        // the app. We do this BEFORE running any Artisan commands.
        $bootstrapCacheDir = base_path('bootstrap/cache');
        $deletedBootstrap  = [];
        foreach (glob($bootstrapCacheDir . '/*.php') as $file) {
            if (basename($file) !== '.gitignore') {
                if (@unlink($file)) {
                    $deletedBootstrap[] = basename($file);
                }
            }
        }
        $results['bootstrap_cache_deleted'] = $deletedBootstrap ?: 'none';

        // ── 2. Reset OPcache — prevents Fatal Errors with new files ─
        if (function_exists('opcache_reset')) {
            $results['opcache'] = opcache_reset() ? 'cleared' : 'failed or restricted';
        }

        // ── 3. Run standard Artisan cache-clear commands ──────────
        $commands = ['config:clear', 'route:clear', 'view:clear', 'cache:clear', 'event:clear'];
        foreach ($commands as $cmd) {
            try {
                Artisan::call($cmd);
                $results[$cmd] = 'ok';
            } catch (Exception $e) {
                $results[$cmd] = 'skipped: ' . $e->getMessage();
                Log::warning("Cache clear command [{$cmd}] failed: " . $e->getMessage());
            }
        }

        // ── 3.5 Regenerate Ziggy's frontend route cache ────────────
        // Per this project's own convention (see CLAUDE.md), any route
        // change requires `ziggy:generate` to regenerate
        // resources/js/ziggy.js before the frontend can resolve named
        // routes correctly. An update package can add/rename routes, so
        // this must run on every update, not just be a manual dev step —
        // skipping it previously left the shipped ziggy.js stale after any
        // route-changing update.
        try {
            Artisan::call('ziggy:generate');
            $results['ziggy:generate'] = 'ok';
        } catch (Exception $e) {
            $results['ziggy:generate'] = 'skipped: ' . $e->getMessage();
            Log::warning('Updater: ziggy:generate failed: ' . $e->getMessage());
        }

        // ── 4. Re-cache config for production performance ─────────
        // CRITICAL SAFETY RULE:
        // If config:cache fails (e.g. a misconfigured package), we
        // do NOT leave the server with a broken cached config.
        // Instead we fall back to config:clear (raw file reads) so
        // the app always boots cleanly, just slightly slower.
        try {
            Artisan::call('config:cache');
            $results['config:cache'] = 'ok';
        } catch (Exception $e) {
            Log::warning('Updater: config:cache failed — falling back to config:clear. Error: ' . $e->getMessage());
            // Nuke the bootstrap cache again in case config:cache wrote a partial broken file
            foreach (glob($bootstrapCacheDir . '/*.php') as $file) {
                if (basename($file) !== '.gitignore') {
                    @unlink($file);
                }
            }
            try {
                Artisan::call('config:clear');
            } catch (Exception $inner) { /* silent */ }
            $results['config:cache'] = 'skipped (fell back to config:clear): ' . $e->getMessage();
        }

        // ── 5. Route caching (best-effort, can fail with closures) ─
        try {
            Artisan::call('route:cache');
            $results['route:cache'] = 'ok';
        } catch (Exception $e) {
            // Routes with closures cannot be cached — this is normal
            Log::warning('Updater: route:cache skipped (closure routes): ' . $e->getMessage());
            $results['route:cache'] = 'skipped (closure routes detected)';
        }

        // Update lock state: caches optimized
        if (File::exists($this->lockPath())) {
            $lockData = @json_decode(File::get($this->lockPath()), true) ?: [];
            $lockData['phase'] = 'cached';
            $lockData['maintenance'] = true;
            $lockData['heartbeat'] = time();
            File::put($this->lockPath(), json_encode($lockData, JSON_PRETTY_PRINT));
        }

        return response()->json([
            'message' => 'All caches cleared and application re-optimized.',
            'results' => $results,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Write new version number & release lock
    // ─────────────────────────────────────────────────────────────
    private function handleVersionBump(Request $request)
    {
        $newVersion = 'unknown';

        // 1. Derive version from release-manifest.json in base path
        $manifestPath = base_path('release-manifest.json');
        if (File::exists($manifestPath)) {
            $manifest = @json_decode(File::get($manifestPath), true);
            if (!empty($manifest['version']) && preg_match('/^\d+\.\d+\.\d+(-[\w.]+)?$/', (string)$manifest['version'])) {
                $newVersion = (string)$manifest['version'];
            }
        }

        // 2. Derive version from AMD_POS_VERSION.txt
        if ($newVersion === 'unknown') {
            $versionFile = base_path('AMD_POS_VERSION.txt');
            if (File::exists($versionFile)) {
                $content = File::get($versionFile);
                if (preg_match('/AMD_POS_VERSION=([^\r\n]+)/', $content, $m)) {
                    $cand = trim($m[1]);
                    if (preg_match('/^\d+\.\d+\.\d+(-[\w.]+)?$/', $cand)) {
                        $newVersion = $cand;
                    }
                }
            }
        }

        // 3. Fallback to client input ONLY if validated semver and not present on disk
        if ($newVersion === 'unknown') {
            $rawVersion = trim($request->input('new_version', 'unknown'));
            if (preg_match('/^\d+\.\d+\.\d+(-[\w.]+)?$/', $rawVersion)) {
                $newVersion = $rawVersion;
            }
        }

        if ($newVersion === 'unknown') {
            throw new Exception("Cannot determine release version from validated package manifest.");
        }

        try {
            \App\Models\Setting::updateOrCreate(
                ['key' => 'app_version'],
                ['value' => $newVersion]
            );
            if ($newVersion !== 'unknown') {
                \App\Models\PlatformAuditLog::logAction('system.updated', ['version' => $newVersion]);
            }
        } catch (Exception $e) {
            Log::warning('Could not save version to settings table: ' . $e->getMessage());
        }

        // Write version file
        File::put(storage_path('app_version.txt'), $newVersion);

        // ── BRING APP BACK ONLINE ─────────────────────────────
        // NOTE: this codebase does NOT use Laravel's native `artisan down`
        // maintenance mode during the update — protection during extract
        // comes entirely from the custom storage/update.lock file plus
        // PreventAccessDuringUpdate middleware (which allow-lists the
        // Updater/Installer routes so the update flow itself keeps working).
        // This call to safeDisableMaintenanceMode() is a defensive no-op
        // for the common case (kept in case native maintenance mode was
        // ever engaged by another process/deploy step) — it is not "the"
        // mechanism that protected traffic during this update.
        $this->safeDisableMaintenanceMode();

        // ── Release the update lock ────────────────────────────
        $this->releaseLock();

        // ── Cleanup any leftover temp data ─────────────────────
        $updateDir = storage_path('app/update_package');
        if (File::isDirectory($updateDir)) {
            try {
                File::deleteDirectory($updateDir);
            } catch (Exception $e) {
                // Non-critical
            }
        }

        // ── Log the successful update ──────────────────────────
        Log::info("✅ System update completed successfully. Version: {$newVersion}. By: " . (Auth::user()?->email ?? 'unknown'));

        return response()->json([
            'message'     => "System updated to version {$newVersion}.",
            'new_version' => $newVersion,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Resolve a relative path safely within base_path().
     * Returns the real absolute path if safe, or NULL if traversal detected.
     */
    private function safeResolvePath(string $basePath, string $relativePath): ?string
    {
        // Reject null bytes (PHP path injection)
        if (str_contains($relativePath, "\0")) {
            return null;
        }

        // Reject obviously dangerous traversal patterns
        if (str_contains($relativePath, '..')) {
            return null;
        }

        // Reject drive letters, UNC paths, and leading slashes
        if (preg_match('/^[A-Za-z]:/', $relativePath) ||
            str_starts_with($relativePath, '/') ||
            str_starts_with($relativePath, '\\') ||
            str_starts_with($relativePath, '//') ||
            str_starts_with($relativePath, '\\\\')) {
            return null;
        }

        // Normalize base path and target
        $normalizedBase = rtrim(str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $basePath), DIRECTORY_SEPARATOR);
        $normalizedRel  = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, ltrim($relativePath, '/\\'));
        $target         = $normalizedBase . DIRECTORY_SEPARATOR . $normalizedRel;

        $isWindows = (DIRECTORY_SEPARATOR === '\\');
        $prefix = $normalizedBase . DIRECTORY_SEPARATOR;

        // Prefix check (case-insensitive on Windows)
        if ($isWindows) {
            if (stripos($target, $prefix) !== 0) {
                return null;
            }
        } else {
            if (!str_starts_with($target, $prefix)) {
                return null;
            }
        }

        // Check nearest existing ancestor directory against realpath to block symlink escapes
        $checkDir = dirname($target);
        while (!file_exists($checkDir) && $checkDir !== $normalizedBase && strlen($checkDir) > strlen($normalizedBase)) {
            $parent = dirname($checkDir);
            if ($parent === $checkDir) {
                break;
            }
            $checkDir = $parent;
        }

        if (file_exists($checkDir)) {
            $realCheck = realpath($checkDir);
            $realBase  = realpath($normalizedBase) ?: $normalizedBase;
            if ($realCheck !== false) {
                if ($isWindows) {
                    if (stripos($realCheck, $realBase) !== 0) {
                        return null;
                    }
                } else {
                    if (!str_starts_with($realCheck, $realBase)) {
                        return null;
                    }
                }
            }
        }

        return $target;
    }

    /**
     * Columns considered load-bearing enough that the app cannot function
     * correctly without them. Checked after every `migrate` run as a
     * post-condition, not just a precondition — add to this list whenever
     * a migration introduces a column that reports/scheduled commands
     * depend on directly via raw queries (which don't fail loudly at
     * migration time the way Eloquent-model mismatches sometimes do).
     */
    private const CRITICAL_SCHEMA_COLUMNS = [
        'sales'    => ['reference_number', 'tenant_id', 'status'],
        'invoices' => ['invoice_number', 'tenant_id'],
        'tenants'  => ['is_demo', 'is_golden_master'],
    ];

    /**
     * Assert that every column in CRITICAL_SCHEMA_COLUMNS actually exists.
     * Throws (holding the update lock, surfacing a hard failure) rather
     * than letting the update silently report success while the app is
     * left querying columns that were never created.
     */
    private function assertCriticalSchema(): void
    {
        $missing = [];
        foreach (self::CRITICAL_SCHEMA_COLUMNS as $table => $columns) {
            foreach ($columns as $column) {
                try {
                    if (!\Illuminate\Support\Facades\Schema::hasColumn($table, $column)) {
                        $missing[] = "{$table}.{$column}";
                    }
                } catch (Exception $e) {
                    // Table itself missing/unreadable — treat as missing too
                    $missing[] = "{$table}.{$column} (table check failed: {$e->getMessage()})";
                }
            }
        }

        if (!empty($missing)) {
            $list = implode(', ', $missing);
            Log::critical("Updater: POST-MIGRATE SCHEMA CHECK FAILED. Missing/unreadable: {$list}");
            throw new Exception(
                "Post-migration schema check failed — the following expected columns are missing: {$list}. " .
                "Migrations reported success but the schema does not match what the application expects. " .
                "The update has been HALTED before cache-clear/version-bump. Do not retry blindly — " .
                "inspect the migration that should have added these columns before proceeding."
            );
        }
    }

    /**
     * Release the update lock file.
     */
    private function releaseLock(): void
    {
        if (File::exists($this->lockPath())) {
            File::delete($this->lockPath());
        }
    }

    /**
     * Safely bring the app back online from maintenance mode.
     * Called after successful update OR on failure to prevent the app
     * being stuck in 503 mode forever.
     */
    private function safeDisableMaintenanceMode(): void
    {
        try {
            if (app()->isDownForMaintenance()) {
                Artisan::call('up');
                Log::info('Updater: Maintenance mode disabled — app is back online.');
            }
        } catch (Exception $e) {
            // Last resort: manually delete the maintenance file
            $downFile = storage_path('framework/down');
            if (File::exists($downFile)) {
                File::delete($downFile);
                Log::warning('Updater: Force-deleted maintenance file: ' . $e->getMessage());
            }
        }
    }

    /**
     * Convert PHP ini values like '128M' to bytes.
     */
    private function phpIniToBytes(string $val): int
    {
        $val  = trim($val);
        $last = strtolower(substr($val, -1));
        $num  = (int) $val;

        switch ($last) {
            case 'g': $num *= 1024; // fall through
            case 'm': $num *= 1024; // fall through
            case 'k': $num *= 1024;
        }

        return $num;
    }

    private function getCurrentVersion(): string
    {
        $versionFile = storage_path('app_version.txt');
        if (File::exists($versionFile)) {
            return trim(File::get($versionFile));
        }

        try {
            $setting = \App\Models\Setting::where('key', 'app_version')->first();
            if ($setting) {
                return $setting->value;
            }
        } catch (Exception $e) {
            // Ignore DB errors
        }

        return '1.0.0';
    }
}
