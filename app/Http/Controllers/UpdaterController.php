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
     * Lock file path — prevents concurrent updates
     */
    private function lockPath(): string
    {
        return storage_path('update.lock');
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

        return inertia('Updater/Index', [
            'currentVersion' => $currentVersion,
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
            'zip_extension'      => extension_loaded('zip'),
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
                if ($ageMinutes < 30) {
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

            // Acquire lock early
            File::put($this->lockPath(), json_encode([
                'started_at' => now()->toIso8601String(),
                'started_by' => Auth::user()?->email ?? 'unknown',
                'step'       => 'uploading_chunks',
                'total_chunks' => $totalChunks,
            ]));
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

        return response()->json([
            'message'  => "Package received & saved. ({$fileSizeMB} MB, {$totalChunks} chunks)",
            'complete' => true,
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
        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new Exception('Failed to open the saved update package. It may have been corrupted during transfer.');
        }

        $fileCount   = $zip->numFiles;
        $hasArtisan  = false;
        $hasComposer = false;
        for ($i = 0; $i < $fileCount; $i++) {
            $name     = $zip->getNameIndex($i);
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
            $zip->close();
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
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = str_replace('\\', '/', $zip->getNameIndex($i));
            if (basename($name) === 'artisan') {
                $dir = dirname($name);
                if ($dir !== '.' && $dir !== '') {
                    $rootFolder = $dir . '/';
                }
                break;
            }
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);

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

                $content = $zip->getFromIndex($i);
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

        // ── Count pending migrations first ────────────────────────
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

        // If no pending, skip entirely — safest option
        if ($pendingCount === 0) {
            return response()->json([
                'message' => 'Database migrations applied successfully.',
                'output'  => 'Nothing to migrate — database is already up to date.',
            ]);
        }

        // ── Run ONLY pending migrations (never fresh/reset!) ──────
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
        } catch (Exception $e) {
            Log::warning('Could not save version to settings table: ' . $e->getMessage());
        }

        // Write version file
        File::put(storage_path('app_version.txt'), $newVersion);

        // ── BRING APP BACK ONLINE ─────────────────────────────
        // We put the app in maintenance mode during extract.
        // Now all steps are done, so bring it back up.
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
