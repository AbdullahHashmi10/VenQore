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
        } catch (Exception $e) {
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

        return response()->json([
            'current_version'    => $this->getCurrentVersion(),
            'php_version'        => PHP_VERSION,
            'pending_migrations' => count($pendingMigrations),
            'pending_list'       => $pendingMigrations,
            'storage_writable'   => is_writable(storage_path()),
            'base_writable'      => is_writable(base_path()),
            'zip_extension'      => (extension_loaded('zip') || class_exists('PclZip') || file_exists(base_path('vendor/pclzip/pclzip/pclzip.lib.php'))),
            'disk_free_mb'       => round(disk_free_space(base_path()) / 1024 / 1024),
            'update_in_progress' => File::exists($this->lockPath()),
            'max_zip_mb'         => $effectiveMaxMB,
            'php_upload_max_mb'  => $phpUploadMaxMB,
            'php_post_max_mb'    => $phpPostMaxMB,
            'app_max_mb'         => round(self::MAX_ZIP_SIZE_BYTES / 1024 / 1024),
        ]);
    }

    /**
     * Run the full update process from an uploaded ZIP file.
     */
    public function run(Request $request)
    {
        set_time_limit(0);
        ini_set('max_execution_time', '0');
        ini_set('memory_limit', '-1');

        $step = $request->input('step');

        // Whitelist valid steps — never trust user input blindly
        $validSteps = ['upload', 'extract', 'migrate', 'cache', 'version'];
        if (!in_array($step, $validSteps, true)) {
            return response()->json(['error' => 'Invalid step specified.'], 400);
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
        } catch (Exception $e) {
            Log::error("Updater failed at step [{$step}]: " . $e->getMessage() . "\n" . $e->getTraceAsString());

            // Bring app back UP if we put it in maintenance mode
            $this->safeDisableMaintenanceMode();

            // Release lock on failure so admin can retry
            if ($step !== 'upload') {
                $this->releaseLock();
            }

            return response()->json(['error' => $e->getMessage()], 500);
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

        // ── First chunk: lock & validate ──────────────────────────
        if ($chunkIndex === 0) {
            // Prevent concurrent updates
            if (File::exists($this->lockPath())) {
                $lockTime = File::lastModified($this->lockPath());
                $ageMinutes = round((time() - $lockTime) / 60);
                if ($ageMinutes < self::LOCK_MAX_AGE_MINUTES) {
                    throw new Exception("An update is already in progress (started {$ageMinutes} minute(s) ago). Please wait.");
                }
                File::delete($this->lockPath());
                Log::info("Updater: Cleared stale update lock ({$ageMinutes} minutes old).");
            }

            // Clean up any leftover chunks from a previous failed attempt
            if (File::isDirectory($chunkDir)) {
                File::deleteDirectory($chunkDir);
            }
            File::makeDirectory($chunkDir, 0755, true);

            // Record the expected chunk count for this upload attempt, so a
            // retry that reuses the same upload_id with a DIFFERENT
            // total_chunks (e.g. browser retried with a re-split file) can
            // be detected and rejected below, instead of silently mixing
            // chunks from two different attempts.
            File::put($chunkDir . '/.expected_total_chunks', (string) $totalChunks);

            // Generate a secure one-time update token.
            // This token is stored in the lock file and returned to the
            // browser on the final chunk. Subsequent steps send it back
            // so UpdaterLock can allow them through even if the HTTP
            // session is disrupted after new PHP files are extracted.
            $updateToken = bin2hex(random_bytes(32)); // 64-char hex

            // Acquire lock early
            File::put($this->lockPath(), json_encode([
                'started_at'   => now()->toIso8601String(),
                'started_by'   => Auth::user()?->email ?? 'unknown',
                'step'         => 'uploading_chunks',
                'total_chunks' => $totalChunks,
                'update_token' => $updateToken,
            ]));
        }

        // ── Reject total_chunks mismatch against this attempt's record ──
        // Guards against a stale/mismatched chunk set if a client retries
        // with the same upload_id but a different total_chunks value after
        // an earlier attempt already wrote chunks beyond index 0.
        $expectedTotalChunksFile = $chunkDir . '/.expected_total_chunks';
        if (File::exists($expectedTotalChunksFile)) {
            $expectedTotalChunks = (int) trim(File::get($expectedTotalChunksFile));
            if ($expectedTotalChunks > 0 && $expectedTotalChunks !== $totalChunks) {
                throw new Exception(
                    "Chunk count mismatch for upload {$uploadId}: this attempt expected {$expectedTotalChunks} chunks " .
                    "but received a request for {$totalChunks}. This usually means a previous upload attempt with the " .
                    "same upload_id is still present. Please retry the upload from the start."
                );
            }
        }

        // ── Receive this chunk ────────────────────────────────────
        if (!$request->hasFile('chunk')) {
            throw new Exception("Chunk {$chunkIndex} was not received. Upload may have been interrupted.");
        }

        $chunkFile = $request->file('chunk');
        if ($chunkFile->getError() !== UPLOAD_ERR_OK) {
            throw new Exception("Chunk {$chunkIndex} upload error (code: " . $chunkFile->getError() . ").");
        }

        // Save chunk with zero-padded index for correct ordering
        if (!File::isDirectory($chunkDir)) {
            File::makeDirectory($chunkDir, 0755, true);
        }
        $chunkFile->move($chunkDir, sprintf('chunk_%05d', $chunkIndex));

        Log::debug("Updater: Received chunk {$chunkIndex}/{$totalChunks} for upload {$uploadId}");

        // ── Not the last chunk? Return immediately ────────────────
        if ($chunkIndex < $totalChunks - 1) {
            return response()->json([
                'message'     => "Chunk " . ($chunkIndex + 1) . " of {$totalChunks} received.",
                'chunk_index' => $chunkIndex,
                'complete'    => false,
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

        // Read the token back from the lock file to return it to the frontend
        $storedToken = null;
        if (File::exists($this->lockPath())) {
            $lockData = json_decode(File::get($this->lockPath()), true);
            $storedToken = $lockData['update_token'] ?? null;
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

        // ── Open and validate ZIP structure BEFORE maintenance mode ──
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
            $name     = $useZipArchive ? $zip->getNameIndex($i) : $zipList[$i]['filename'];
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
            'storage/demo-snapshots/',       // Golden Master demo snapshot — regenerated
                                              // weekly by demo:snapshot (see routes/console.php),
                                              // NOT shipped inside update packages. Previously
                                              // unprotected: an update ZIP built without this
                                              // directory would leave whatever was on disk alone
                                              // (fine), but one built WITH a stale/placeholder
                                              // copy would silently clobber the live server's
                                              // real Golden Master snapshot on every update.

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
            // Keep the update lock "fresh" while extraction is genuinely
            // still in progress — a large package (14,000+ files) can take
            // longer than LOCK_MAX_AGE_MINUTES to extract, and without this
            // the lock would look abandoned partway through, letting
            // PreventAccessDuringUpdate start allowing ordinary traffic
            // through mid-overwrite (see LOCK_MAX_AGE_MINUTES doc comment).
            if ($i % 500 === 0) {
                $this->touchLock();
            }

            $entryName = $useZipArchive ? $zip->getNameIndex($i) : $zipList[$i]['filename'];

            // Skip directory entries
            if (substr($entryName, -1) === '/') {
                continue;
            }

            // ── Normalise path separators ──────────────────────────
            $entryName = str_replace('\\', '/', $entryName);

            // ── Strip leading single root folder if present ────────
            $cleanedName = $entryName;
            if ($rootFolder !== '' && str_starts_with($entryName, $rootFolder)) {
                $cleanedName = substr($entryName, strlen($rootFolder));
            }

            // ── SKIP DANGEROUS FILE TYPES ──────────────────────────
            // Certain files should NEVER be in an update package
            $basename = strtolower(basename($cleanedName));
            if (in_array($basename, ['.env', '.env.local', '.env.production'])) {
                Log::warning("UPDATER: Blocked attempt to overwrite .env file from ZIP entry [{$entryName}]");
                $skipped++;
                continue;
            }

            // ── PATH TRAVERSAL protection ──────────────────────────
            $realTarget = $this->safeResolvePath($basePath, $cleanedName);

            if ($realTarget === null) {
                Log::critical("UPDATER: Path traversal attempt blocked! Entry: [{$entryName}] resolved outside base_path.");
                $blocked++;
                continue;
            }

            // ── Protected path check ───────────────────────────────
            $normalised = str_replace('\\', '/', $cleanedName);
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

            // ── Write file ─────────────────────────────────────────
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

                if ($content !== false) {
                    File::put($realTarget, $content);
                    $updated++;
                } else {
                    Log::warning("UPDATER: Could not read content from ZIP index {$i} (entry: {$entryName}).");
                    $errors++;
                }
            } catch (Exception $e) {
                // Log but don't crash — try to finish the rest
                Log::warning("UPDATER: Failed to write [{$cleanedName}]: " . $e->getMessage());
                $errors++;
            }
        }

        $zip->close();

        // Cleanup the uploaded zip
        File::delete($zipPath);

        // ── LOG the results ────────────────────────────────────────
        Log::info("Updater extract: {$updated} files updated, {$skipped} protected, {$blocked} blocked, {$errors} errors.");
        if ($blocked > 0) {
            Log::critical("UPDATER: {$blocked} path traversal attempt(s) were blocked during extraction.");
        }

        // ── Re-create storage symlink in case public/ was overwritten ──
        try {
            Artisan::call('storage:link');
        } catch (Exception $e) {
            Log::warning("Updater: Could not recreate storage symlink: " . $e->getMessage());
        }

        // ── Rebuild Composer autoloader so new PHP classes are found ──
        // Without this, any new Models/Controllers/Services added in the
        // update ZIP would cause "Class not found" fatal errors.
        try {
            $composerPath = base_path('vendor/autoload.php');
            if (File::exists($composerPath)) {
                // Use Artisan if available (faster)
                if (class_exists('Composer\\Autoload\\ClassLoader')) {
                    Artisan::call('package:discover');
                }
                // Force autoloader regeneration by clearing the classmap cache
                $classmapFile = base_path('vendor/composer/autoload_classmap.php');
                if (File::exists($classmapFile)) {
                    // Artisan optimize will rebuild this
                    Log::info('Updater: Autoloader will be rebuilt in cache step.');
                }
            }
        } catch (Exception $e) {
            Log::warning('Updater: Autoloader refresh failed: ' . $e->getMessage());
        }

        $message = "Extraction complete. {$updated} files updated, {$skipped} protected files preserved.";
        if ($blocked > 0) {
            $message .= " ⚠ {$blocked} malicious path(s) were blocked.";
        }
        if ($errors > 0) {
            $message .= " ⚠ {$errors} file(s) had write errors (check server logs).";
        }

        // ── CRITICAL: Clear bootstrap cache & OPcache immediately ───────
        // After 14,000+ new PHP files land on disk, the old
        // bootstrap/cache/*.php (config, routes, services) is stale.
        // If we leave it, the NEXT HTTP request (cache step) loads
        // NEW code against OLD cached config, which can break Auth and
        // cause the session role check to fail with a 403 error.
        // We nuke it here so the cache step boots with a clean slate.
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

        // Reset OPcache so PHP serves new files, not old bytecode
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }

        // ── Validate the frontend build manifest survived extraction ──
        // Update packages are expected to ship a pre-built public/build
        // (Vite manifest + compiled assets) — this Updater does not run a
        // frontend build itself. If a package is assembled without that
        // directory, or extraction somehow drops it, Inertia can silently
        // fail to resolve JS/CSS assets and every page white-screens. Fail
        // loudly here (before cache-clear/version-bump) instead of letting
        // that surface later as an unexplained blank app.
        $manifestPath = base_path('public/build/manifest.json');
        $viteManifestPath = base_path('public/build/.vite/manifest.json'); // Vite 5+ location
        if (!File::exists($manifestPath) && !File::exists($viteManifestPath)) {
            Log::critical('Updater: public/build manifest is missing after extraction — frontend assets will not resolve.');
            throw new Exception(
                'The update package did not include a built frontend (public/build/manifest.json is missing after extraction). ' .
                'The application would white-screen if brought back online in this state. ' .
                'Rebuild/repackage the update with `npm run build` output included and try again.'
            );
        }

        return response()->json([
            'message' => $message,
            'updated' => $updated,
            'skipped' => $skipped,
            'blocked' => $blocked,
            'errors'  => $errors,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Run only new (pending) database migrations
    // ─────────────────────────────────────────────────────────────
    private function handleMigrate()
    {
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

        // ── Step 3.5: Sync V3 Ledger for legacy data ──────────────
        // This ensures balances are correctly backfilled into the
        // new V3 accounting architecture.
        // Wrapped in try/catch — if it fails it must NOT abort the migrate step.
        try {
            Artisan::call('migrate:v3-ledger');
            $output .= "\n" . Artisan::output();
        } catch (Exception $e) {
            Log::warning('Updater: migrate:v3-ledger non-critical failure: ' . $e->getMessage());
            $output .= "\n[v3-ledger skipped: " . $e->getMessage() . "]";
        }

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
        // Belt-and-suspenders check: even though `migrate` just reported
        // success, assert that a small allowlist of load-bearing columns
        // genuinely exist before we let the update proceed to cache-clear
        // and version-bump. If the app went live querying a column that
        // isn't there, every page touching that query breaks — this turns
        // that into a loud, held-lock failure instead of a silent "success"
        // response that leaves the app broken behind a green checkmark.
        $this->assertCriticalSchema();

        // Auto-restore demo tenant if missing or empty (T4.1)
        //
        // Previously this called demo:restore inline and swallowed any
        // failure in a try/catch that only logged a warning — so the
        // updater could report "success" while leaving the demo store
        // completely broken. Two fixes:
        //   1. demo:restore itself now force-flags the tenant as
        //      is_golden_master (see DemoRestore::handle()), so it can
        //      never again silently create an unflagged duplicate "demo"
        //      tenant the way the old snapshot-payload-trusting version did.
        //   2. We now verify the restore actually produced a healthy,
        //      non-empty store afterward and surface a loud warning in the
        //      update report (not just the log file) if it didn't, instead
        //      of reporting a clean success either way.
        $demoWarning = null;
        try {
            $demoTenant = \App\Services\DemoStoreService::goldenMaster(createIfMissing: false);
            $needsRestore = !$demoTenant
                || $pendingCount > 0
                || !\Illuminate\Support\Facades\Schema::hasTable('sales')
                || !DB::table('sales')->where('tenant_id', $demoTenant->id)->exists();

            if ($needsRestore) {
                Log::info('Updater: Golden Master demo tenant missing, empty, or schema updated. Running demo:restore...');
                $exitCode = Artisan::call('demo:restore', ['--force' => true]);
                Log::info('Updater: demo:restore output: ' . Artisan::output());

                $demoTenant = \App\Services\DemoStoreService::goldenMaster(createIfMissing: false);
                $health = $demoTenant
                    ? \App\Services\DemoStoreService::healthCheck($demoTenant->id)
                    : ['ok' => false, 'issues' => ['No Golden Master tenant resolved after restore.']];

                if ($exitCode !== 0 || !$health['ok']) {
                    Log::warning('Updater: demo:restore failed or unhealthy. Falling back to demo:full-deploy...');
                    $exitCode = Artisan::call('demo:full-deploy');
                    Log::info('Updater: demo:full-deploy output: ' . Artisan::output());

                    // Re-take snapshot so server has updated golden master snapshot matching new schema
                    try {
                        Artisan::call('demo:snapshot');
                    } catch (\Exception $e) {
                        Log::warning('Updater: demo:snapshot failed: ' . $e->getMessage());
                    }

                    $health = $demoTenant
                        ? \App\Services\DemoStoreService::healthCheck($demoTenant->id)
                        : ['ok' => false, 'issues' => ['No Golden Master tenant resolved after full deploy.']];
                }

                if (!$health['ok']) {
                    $demoWarning = 'Demo store restore/deploy ran but did not produce a healthy store: '
                        . implode('; ', $health['issues'] ?: ['demo:restore exited with code ' . $exitCode . '.']);
                    Log::warning('Updater: ' . $demoWarning);
                }
            }
        } catch (Exception $e) {
            $demoWarning = 'Failed to restore demo store: ' . $e->getMessage();
            Log::warning('Updater: ' . $demoWarning);
        }

        Log::info("Updater: Migrations completed. {$pendingCount} migration(s) applied.");

        return response()->json([
            'message'      => "Database migrations applied successfully. ({$pendingCount} migration(s) applied)",
            'output'       => trim($output) ?: 'All migrations ran without errors.',
            'demo_warning' => $demoWarning, // null when the demo store is healthy or didn't need restoring
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Clear all application caches
    // ─────────────────────────────────────────────────────────────
    private function handleCacheClear()
    {
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
        // Sanitise version input — only allow semver format or semver with pre-release
        $rawVersion = trim($request->input('new_version', 'unknown'));
        $newVersion = preg_match('/^\d+\.\d+\.\d+(-[\w.]+)?$/', $rawVersion)
            ? $rawVersion
            : 'unknown';

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

        // Reject obviously dangerous patterns
        if (str_contains($relativePath, '..')) {
            return null;
        }

        // Reject absolute paths hidden in entry names
        if (preg_match('/^[A-Za-z]:/', $relativePath) || str_starts_with($relativePath, '/')) {
            return null;
        }

        $target = $basePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

        // For files that don't exist yet, check the parent directory
        $checkPath = $target;
        if (!file_exists($checkPath)) {
            $checkPath = dirname($checkPath);
        }

        // Ensure the resolved path is still inside base_path
        $resolvedCheck = realpath($checkPath);
        if ($resolvedCheck === false) {
            // Parent dir doesn't exist yet — safe to create
            // But do a string-based check as fallback
            $normalized = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $target);
            $base       = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $basePath);
            if (!str_starts_with($normalized, $base . DIRECTORY_SEPARATOR)) {
                return null;
            }
            return $target;
        }

        if (!str_starts_with($resolvedCheck, $basePath)) {
            return null;
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
