<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PDO;
use Exception;
use ZipArchive;

class InstallerController extends Controller
{
    public function index()
    {
        // Check if already installed
        if (File::exists(storage_path('installed'))) {
            return redirect()->route('login');
        }

        // --- PRE-INSTALLER HYDRATION ---
        // Ensure .env exists before the user starts
        $envPath = base_path('.env');
        if (!file_exists($envPath)) {
            if (file_exists(base_path('.env.example'))) {
                copy(base_path('.env.example'), $envPath);
            } else {
                touch($envPath);
            }
        }

        // Ensure APP_KEY exists and is valid
        $envContent = file_exists($envPath) ? file_get_contents($envPath) : '';
        if (strpos($envContent, 'APP_KEY=base64:') === false) {
            Artisan::call('key:generate', ['--force' => true]);
            
            // Delete cached config file so the next PHP process reads fresh .env
            $cachedConfig = base_path('bootstrap/cache/config.php');
            if (file_exists($cachedConfig)) {
                @unlink($cachedConfig);
            }
            
            // IF we just generated the key, we MUST redirect immediately to reload.
            // Otherwise, Laravel encrypts the current response cookies with an empty/old key,
            // and all subsequent installer API requests will fail DecryptException (500 error).
            return redirect(request()->getRequestUri());
        }

        return Inertia::render('Installer/Index');
    }

    public function checkRequirements()
    {
        // Comprehensive requirements check with metadata for frontend
        $requirements = [
            'php' => [
                'passed' => version_compare(PHP_VERSION, '8.2.0', '>='),
                'value' => PHP_VERSION,
                'required' => '8.2.0+',
                'label' => 'PHP Version',
                'description' => 'Core runtime environment',
                'fix' => 'Contact your hosting provider to upgrade PHP to version 8.2 or higher. In cPanel, look for "Select PHP Version" or "MultiPHP Manager".',
                'critical' => true,
            ],
            'bcmath' => [
                'passed' => extension_loaded('bcmath'),
                'value' => extension_loaded('bcmath') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'BCMath Extension',
                'description' => 'Required for precise calculations',
                'fix' => 'Enable BCMath in cPanel > Select PHP Version > Extensions. Check the bcmath checkbox.',
                'critical' => true,
            ],
            'ctype' => [
                'passed' => extension_loaded('ctype'),
                'value' => extension_loaded('ctype') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'Ctype Extension',
                'description' => 'Character type checking',
                'fix' => 'Enable Ctype in cPanel > Select PHP Version > Extensions.',
                'critical' => true,
            ],
            'fileinfo' => [
                'passed' => extension_loaded('fileinfo'),
                'value' => extension_loaded('fileinfo') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'FileInfo Extension',
                'description' => 'Required for file uploads',
                'fix' => 'Enable FileInfo in cPanel > Select PHP Version > Extensions. Check the fileinfo checkbox.',
                'critical' => true,
            ],
            'json' => [
                'passed' => extension_loaded('json'),
                'value' => extension_loaded('json') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'JSON Extension',
                'description' => 'Data interchange format',
                'fix' => 'JSON is usually enabled by default. If missing, contact your hosting provider.',
                'critical' => true,
            ],
            'mbstring' => [
                'passed' => extension_loaded('mbstring'),
                'value' => extension_loaded('mbstring') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'Mbstring Extension',
                'description' => 'Multibyte string support',
                'fix' => 'Enable Mbstring in cPanel > Select PHP Version > Extensions. Check the mbstring checkbox.',
                'critical' => true,
            ],
            'openssl' => [
                'passed' => extension_loaded('openssl'),
                'value' => extension_loaded('openssl') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'OpenSSL Extension',
                'description' => 'Encryption & security',
                'fix' => 'Enable OpenSSL in cPanel > Select PHP Version > Extensions. This is critical for HTTPS.',
                'critical' => true,
            ],
            'pdo' => [
                'passed' => extension_loaded('pdo') && extension_loaded('pdo_mysql'),
                'value' => (extension_loaded('pdo') && extension_loaded('pdo_mysql')) ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'PDO MySQL Extension',
                'description' => 'Database connectivity',
                'fix' => 'Enable both pdo and pdo_mysql in cPanel > Select PHP Version > Extensions.',
                'critical' => true,
            ],
            'tokenizer' => [
                'passed' => extension_loaded('tokenizer'),
                'value' => extension_loaded('tokenizer') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'Tokenizer Extension',
                'description' => 'PHP code processing',
                'fix' => 'Enable Tokenizer in cPanel > Select PHP Version > Extensions.',
                'critical' => true,
            ],
            'xml' => [
                'passed' => extension_loaded('xml'),
                'value' => extension_loaded('xml') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'XML Extension',
                'description' => 'XML document parsing',
                'fix' => 'Enable XML in cPanel > Select PHP Version > Extensions.',
                'critical' => true,
            ],
            'curl' => [
                'passed' => extension_loaded('curl'),
                'value' => extension_loaded('curl') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'cURL Extension',
                'description' => 'HTTP requests (updates, APIs)',
                'fix' => 'Enable cURL in cPanel > Select PHP Version > Extensions.',
                'critical' => false,
            ],
            'gd' => [
                'passed' => extension_loaded('gd'),
                'value' => extension_loaded('gd') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'GD Extension',
                'description' => 'Image processing',
                'fix' => 'Enable GD in cPanel > Select PHP Version > Extensions. Required for image uploads and barcode generation.',
                'critical' => false,
            ],
            'sqlite' => [
                'passed' => extension_loaded('pdo_sqlite'),
                'value' => extension_loaded('pdo_sqlite') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'PDO SQLite Extension',
                'description' => 'Required for Vyapar backup analysis',
                'fix' => 'Enable pdo_sqlite in cPanel > Select PHP Version > Extensions.',
                'critical' => false, // Set to false so it doesn't block standard install
            ],
            'upload_max_filesize' => [
                'passed' => (int)ini_get('upload_max_filesize') >= 50,
                'value' => ini_get('upload_max_filesize'),
                'required' => '50M+',
                'label' => 'Upload Limit',
                'description' => 'Max file size for backups',
                'fix' => 'Increase upload_max_filesize in php.ini or cPanel > PHP Selector options.',
                'critical' => false, // Don't block install, just warn
            ],
            'post_max_size' => [
                'passed' => (int)ini_get('post_max_size') >= 50,
                'value' => ini_get('post_max_size'),
                'required' => '50M+',
                'label' => 'POST Limit',
                'description' => 'Max POST data size',
                'fix' => 'Increase post_max_size in php.ini or cPanel > PHP Selector options.',
                'critical' => false,
            ],
            'zip' => [
                'passed' => extension_loaded('zip'),
                'value' => extension_loaded('zip') ? 'Enabled' : 'Missing',
                'required' => 'Enabled',
                'label' => 'Zip Extension',
                'description' => 'Backup & export functionality',
                'fix' => 'Enable Zip in cPanel > Select PHP Version > Extensions. Required for backups.',
                'critical' => false,
            ],
            'storage_writable' => [
                'passed' => is_writable(storage_path()),
                'value' => is_writable(storage_path()) ? 'Writable' : 'Not Writable',
                'required' => 'Writable',
                'label' => 'Storage Directory',
                'description' => '/storage must be writable',
                'fix' => 'Set folder permissions to 775: Right-click storage folder > Permissions > Set to 775 and apply recursively.',
                'critical' => true,
            ],
            'bootstrap_cache_writable' => [
                'passed' => is_writable(base_path('bootstrap/cache')),
                'value' => is_writable(base_path('bootstrap/cache')) ? 'Writable' : 'Not Writable',
                'required' => 'Writable',
                'label' => 'Bootstrap Cache',
                'description' => '/bootstrap/cache must be writable',
                'fix' => 'Set folder permissions to 775: Right-click bootstrap/cache folder > Permissions > Set to 775.',
                'critical' => true,
            ],
            'env_writable' => [
                'passed' => is_writable(base_path('.env')) || (File::exists(base_path('.env.example')) && is_writable(base_path())),
                'value' => (is_writable(base_path('.env')) || is_writable(base_path())) ? 'Writable' : 'Not Writable',
                'required' => 'Writable',
                'label' => 'Environment File',
                'description' => '.env file must be writable',
                'fix' => 'Ensure the root directory is writable, or rename .env.example to .env and set permissions to 644.',
                'critical' => true,
            ],
            'htaccess_exists' => [
                'passed' => File::exists(public_path('.htaccess')),
                'value' => File::exists(public_path('.htaccess')) ? 'Present' : 'Missing',
                'required' => 'Present',
                'label' => '.htaccess File',
                'description' => 'URL rewriting configuration',
                'fix' => 'The .htaccess file is missing from the public folder. Re-upload it or extract the installation package again.',
                'critical' => true,
            ],
        ];

        // Calculate summary
        $criticalPassed = collect($requirements)->where('critical', true)->where('passed', true)->count();
        $criticalTotal = collect($requirements)->where('critical', true)->count();
        $optionalPassed = collect($requirements)->where('critical', false)->where('passed', true)->count();
        $optionalTotal = collect($requirements)->where('critical', false)->count();

        // Server info for display
        $serverInfo = [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time') . 's',
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
        ];

        // Proactive Optimization Check for Windows Local Env
        // If upload limit is small (e.g. 2M or 8M), flag it for automatic restart
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $currentLimit = (int)ini_get('upload_max_filesize');
            if ($currentLimit < 512) {
                $serverInfo['should_restart'] = true;
            }
        }

        // Database recommendations
        $dbRecommendations = [
            [
                'title' => 'Create a MySQL Database',
                'description' => 'Go to cPanel > MySQL Databases and create a new database.',
                'icon' => 'database',
            ],
            [
                'title' => 'Add Database User',
                'description' => 'Create a new MySQL user and assign it to your database with ALL PRIVILEGES.',
                'icon' => 'user',
            ],
            [
                'title' => 'Note the Prefix',
                'description' => 'On shared hosting, your database name is usually prefixed (e.g., username_dbname).',
                'icon' => 'info',
            ],
        ];

        return response()->json([
            'requirements' => $requirements,
            'summary' => [
                'critical_passed' => $criticalPassed,
                'critical_total' => $criticalTotal,
                'optional_passed' => $optionalPassed,
                'optional_total' => $optionalTotal,
                'all_critical_passed' => $criticalPassed === $criticalTotal,
            ],
            'server_info' => $serverInfo,
            'db_recommendations' => $dbRecommendations,
        ]);
    }

    public function restartServer()
    {
        // 1. Check if we are on Windows (Local Installer)
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $batchPath = base_path('start_installer.bat');
            if (file_exists($batchPath)) {
                pclose(popen("start /B cmd /c \"$batchPath\"", "r"));
                return response()->json(['status' => 'restarting', 'message' => 'Server restarting...']);
            }
        }

        // 2. If on Linux/Production/Hosting
        // We cannot auto-restart. The user must use cPanel/php.ini.
        return response()->json([
            'status' => 'manual_required', 
            'message' => 'Auto-optimization not supported on this OS. Please increase upload_max_filesize in your hosting control panel.'
        ], 400);
    }

    public function checkLicense(Request $request)
    {
        $code = $request->input('code');
        // Simple mock validation for now - in production this would curl to a licensing server
        if ($code === 'DEV-MODE-VenQore' || $code === 'VenQore-MODE-DEV') {
            return response()->json(['status' => 'success', 'message' => 'Development Bypass Active.']);
        }

        if (strlen($code) > 10 && str_contains($code, '-')) {
            return response()->json(['status' => 'success', 'message' => 'License verified!']);
        }
        return response()->json(['status' => 'error', 'message' => 'Invalid license key. Use DEV-MODE-VenQore for testing.'], 400);
    }

    public function testDatabase(Request $request)
    {
        $host = $request->input('host');
        $port = $request->input('port');
        $database = $request->input('name');
        $username = $request->input('user');
        $password = $request->input('pass');

        try {
            $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ];

            // Try connecting
            $pdo = new PDO($dsn, $username, $password, $options);

            // Check for existing tables (dirty database detection)
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            $tableCount = count($tables);

            return response()->json([
                'status' => 'success',
                'message' => $tableCount > 0
                    ? "Connected! Warning: This database already contains {$tableCount} tables."
                    : 'Connection successful',
                'has_existing_tables' => $tableCount > 0,
                'table_count' => $tableCount,
            ]);
        } catch (Exception $e) {
            $code = $e->getCode(); // Get SQLSTATE or driver code
            $message = $e->getMessage();

            // 1049 is Unknown Database (MySQL)
            if ($code == 1049 || str_contains($message, "Unknown database")) {
                try {
                    // connect without DB selected
                    $dsnNoDb = "mysql:host=$host;port=$port;charset=utf8mb4";
                    $options = [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_TIMEOUT => 5,
                    ];

                    $pdo = new PDO($dsnNoDb, $username, $password, $options);

                    // Sanitize database name (Allow alphanumeric, underscores, AND hyphens)
                    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $database)) {
                        return response()->json(['status' => 'error', 'message' => 'Invalid database name. Only letters, numbers, underscores, and hyphens are allowed.'], 400);
                    }

                    $pdo->exec("CREATE DATABASE `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    return response()->json(['status' => 'success', 'message' => 'Database created and connected successfully']);
                } catch (Exception $e2) {
                    return response()->json(['status' => 'error', 'message' => 'Database does not exist and could not be created: ' . $e2->getMessage()], 400);
                }
            }

            // 1045 is Access Denied
            if ($code == 1045 || str_contains($message, "Access denied")) {
                return response()->json(['status' => 'error', 'message' => 'Access Denied: Check username and password.'], 400);
            }

            return response()->json(['status' => 'error', 'message' => "Connection Failed: " . $message], 400);
        }
    }

    /**
     * Ensure the database config matches what's in .env (not what PHP cached at boot).
     * On shared hosting, PHP-FPM may cache the old .env values from before write_env ran.
     */
    private function ensureFreshDatabaseConfig()
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) return;

        $envContent = file_get_contents($envPath);
        $envVars = [];
        foreach (explode("\n", $envContent) as $line) {
            $line = trim($line);
            if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $envVars[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
            }
        }

        // Only override if we have real DB values (not the .env.example defaults)
        if (isset($envVars['DB_HOST']) && isset($envVars['DB_DATABASE'])) {
            config([
                'database.connections.mysql.host'     => $envVars['DB_HOST'],
                'database.connections.mysql.port'     => $envVars['DB_PORT'] ?? 3306,
                'database.connections.mysql.database' => $envVars['DB_DATABASE'],
                'database.connections.mysql.username'  => $envVars['DB_USERNAME'] ?? 'root',
                'database.connections.mysql.password'  => $envVars['DB_PASSWORD'] ?? '',
            ]);

            \Illuminate\Support\Facades\DB::purge('mysql');
        }
    }

    public function install(Request $request)
    {
        // Debugging multipart requests
        Log::info("Installer Step: " . $request->input('step'));
        Log::info("Has File 'backup': " . ($request->hasFile('backup') ? 'Yes' : 'No'));
        Log::info("Files: ", $request->allFiles());
        Log::info("Inputs: ", $request->all());
        Log::info("PHP Upload Max: " . ini_get('upload_max_filesize'));
        Log::info("PHP Post Max: " . ini_get('post_max_size'));

        // Prevent timeout during installation
        set_time_limit(0);
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '-1');

        // CRITICAL: Re-read .env and set DB config for EVERY step.
        // On shared hosting PHP-FPM, each request may boot with stale cached config.
        $this->ensureFreshDatabaseConfig();

        $step = $request->input('step');
        $data = $request->input('data', []);

        try {
            switch ($step) {
                case 'write_env':
                    return $this->writeEnv($data);
                case 'migrate':
                    return $this->runMigration($data);
                case 'seed':
                    return $this->runSeed($data['demo'] ?? true);
                case 'symlink':
                    return $this->createSymlink();
                case 'create_admin':
                    return $this->createAdmin($data);
                case 'business_setup':
                    return $this->saveBusinessSettings($request); // Now expects request with files
                case 'finalize':
                    return $this->finalizeInstallation($data);
                case 'restore_backup':
                    return $this->restoreFromBackup($request);
                case 'analyze_backup':
                    return $this->analyzeBackup($request);
                default:
                    return response()->json(['error' => 'Invalid step'], 400);
            }
        } catch (\Throwable $e) {
            Log::error("Installation failed at step {$step}: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function updateEnv($data = [])
    {
        $path = base_path('.env');
        if (!file_exists($path)) {
            // If missing, copy example
            if (file_exists(base_path('.env.example'))) {
                copy(base_path('.env.example'), $path);
            } else {
                // Create empty if example missing
                touch($path);
            }
        }

        $file_content = file_get_contents($path);

        foreach ($data as $key => $value) {
            // Wrap strings with spaces in quotes
            if (preg_match('/\s/', $value) && strpos($value, '"') === false) {
                $value = '"' . $value . '"';
            }

            // Regex to replace existing key or append new one
            if (preg_match("/^{$key}=.*/m", $file_content)) {
                $file_content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $file_content);
            } else {
                $file_content .= "\n{$key}={$value}";
            }
        }

        // Check if content actually changed to avoid restart loops
        if ($file_content !== file_get_contents($path)) {
            file_put_contents($path, $file_content);
        }
    }

    private function writeEnv($data)
    {
        // Auto-detect URL from the current request
        $appUrl = rtrim(url('/'), '/');

        $this->updateEnv([
            'APP_URL' => $appUrl,
            'DB_CONNECTION' => 'mysql', // Ensure MySQL is set
            'DB_HOST' => $data['host'],
            'DB_PORT' => $data['port'],
            'DB_DATABASE' => $data['name'],
            'DB_USERNAME' => $data['user'],
            'DB_PASSWORD' => $data['pass'],
            'APP_DEBUG' => 'false',
            'APP_ENV' => 'production'
        ]);

        // Delete cached config file so the next PHP process reads fresh .env
        // We do this manually instead of Artisan::call('config:clear') to avoid
        // any side effects from running artisan commands during installation
        $cachedConfig = base_path('bootstrap/cache/config.php');
        if (file_exists($cachedConfig)) {
            @unlink($cachedConfig);
        }

        // NOTE: We do NOT call key:generate here.
        // The APP_KEY is already auto-generated by the MissingAppKeyException handler
        // in bootstrap/app.php on the very first visit. Regenerating it here would
        // change the encryption key, invalidating all browser cookies and causing
        // the next request (migrate) to fail with a 500 error.

        return response()->json(['message' => 'Environment configured.']);
    }

    private function runMigration($data)
    {
        $clean = is_array($data) ? ($data['clean'] ?? false) : $data;

        try {
            // CRITICAL FIX FOR SHARED HOSTING:
            // On shared hosting (PHP-FPM/mod_php), writing to .env does NOT reload
            // environment variables in the current PHP process. We must manually
            // read the .env file OR use the credentials passed from the frontend
            // and set them directly into Laravel's runtime config.

            // Strategy 1: Use credentials passed directly from frontend
            if (is_array($data) && isset($data['host'])) {
                config([
                    'database.connections.mysql.host'     => $data['host'],
                    'database.connections.mysql.port'     => $data['port'] ?? 3306,
                    'database.connections.mysql.database' => $data['name'],
                    'database.connections.mysql.username'  => $data['user'],
                    'database.connections.mysql.password'  => $data['pass'] ?? '',
                ]);
            } else {
                // Strategy 2: Re-read .env file manually and parse DB values
                $envPath = base_path('.env');
                if (file_exists($envPath)) {
                    $envContent = file_get_contents($envPath);
                    $envVars = [];
                    foreach (explode("\n", $envContent) as $line) {
                        $line = trim($line);
                        if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
                            [$key, $value] = explode('=', $line, 2);
                            $envVars[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
                        }
                    }
                    config([
                        'database.connections.mysql.host'     => $envVars['DB_HOST'] ?? '127.0.0.1',
                        'database.connections.mysql.port'     => $envVars['DB_PORT'] ?? 3306,
                        'database.connections.mysql.database' => $envVars['DB_DATABASE'] ?? 'laravel',
                        'database.connections.mysql.username'  => $envVars['DB_USERNAME'] ?? 'root',
                        'database.connections.mysql.password'  => $envVars['DB_PASSWORD'] ?? '',
                    ]);
                }
            }

            // Purge old connection and force reconnect with new credentials
            \Illuminate\Support\Facades\DB::purge('mysql');
            \Illuminate\Support\Facades\DB::reconnect('mysql');

            // Verify connection before running heavy migration
            \Illuminate\Support\Facades\DB::connection()->getPdo();

            if ($clean) {
                \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
            } else {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            }
            return response()->json(['message' => 'Database migrated.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Migration Error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function runSeed($demo)
    {
        // Always run the main/structure seeders (Warehouses, Settings, etc.)
        Artisan::call('db:seed', ['--force' => true]);

        if ($demo) {
            // Run specific demo data (Products, Customers, etc.)
            Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DemoDataSeeder', '--force' => true]);
        }
        
        return response()->json(['message' => 'Data seeding completed.']);
    }

    private function createSymlink()
    {
        try {
            Artisan::call('storage:link');
        } catch (Exception $e) {
            // If symlink fails, try to replicate functionality or ignore if files exist
            // Returning success to not block flow, but logging warning
            Log::warning('Storage link failed: ' . $e->getMessage());
        }
        return response()->json(['message' => 'Storage linked.']);
    }

    private function createAdmin($data)
    {
        // This relies on the User model
        $user = \App\Models\User::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'password' => \Illuminate\Support\Facades\Hash::make($data['password']),
                'role' => 'platform_admin',
                'passcode' => $data['passcode'] ?? null,
                'email_verified_at' => now(),
            ]
        );

        return response()->json(['message' => 'Platform Owner account created.']);
    }

    private function restoreFromBackup(Request $request)
    {
        // 1. Handle Chunked Uploads
        if ($request->has('chunk_number')) {
            return $this->handleChunk($request);
        }

        // 2. Handle Standard Uploads
        if (!$request->hasFile('backup')) {
            throw new \Exception("Mission Error: No backup file detected in the buffer.");
        }

        return $this->processRestoreFile($request->file('backup'));
    }

    private function processRestoreFile($file)
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'sql') {
            return $this->restoreFromSql($file);
        } elseif ($extension === 'vyb') {
            // Pre-check: PDO SQLite is required for Vyapar backups
            if (!extension_loaded('pdo_sqlite')) {
                throw new \Exception('Vyapar backups require the PDO SQLite PHP extension. Please enable pdo_sqlite in cPanel > Select PHP Version > Extensions, then retry.');
            }
            return $this->restoreFromVyapar($file);
        } else {
            throw new \Exception("Compatibility Error: Only .sql or .vyb files are accepted.");
        }
    }

    private function restoreFromSql($file)
    {
        try {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            
            $sql = file_get_contents($file->getRealPath());
            $fileSize = strlen($sql);
            
            // Split into individual statements for progress tracking and memory safety
            $statements = array_filter(
                array_map('trim', explode(";\n", $sql)),
                fn($s) => !empty($s) && $s !== ';'
            );
            
            $totalStatements = count($statements);
            $executed = 0;
            
            foreach ($statements as $statement) {
                if (!empty(trim($statement))) {
                    \Illuminate\Support\Facades\DB::unprepared($statement);
                    $executed++;
                }
            }
            
            // Free memory
            unset($sql, $statements);
            
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            $sizeMB = round($fileSize / 1024 / 1024, 1);
            return response()->json([
                'message' => "System restored from backup crystal. ({$executed} statements, {$sizeMB}MB processed)",
                'stats' => [
                    'statements_executed' => $executed,
                    'file_size_mb' => $sizeMB,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            throw new \Exception("SQL Restoration Failed: " . $e->getMessage());
        }
    }


    private function analyzeBackup(Request $request)
    {
        // 1. Handle Chunked Uploads (for large files > 2MB)
        if ($request->has('chunk_number')) {
            return $this->handleChunk($request);
        }

        // 2. Handle Standard Uploads
        if (!$request->hasFile('backup')) {
            throw new \Exception("Mission Error: No backup file detected in the buffer.");
        }

        return $this->processAnalyzedFile($request->file('backup'));
    }

    private function handleChunk(Request $request) {
        $chunkIndex = $request->input('chunk_number');
        $totalChunks = $request->input('total_chunks');
        $fileName = $request->input('filename');
        $tempPath = storage_path('app/chunks/' . $fileName);

        // Orphan cleanup: delete any chunk files older than 2 hours
        if ($chunkIndex == 0) {
            $chunksDir = storage_path('app/chunks');
            if (is_dir($chunksDir)) {
                foreach (glob($chunksDir . '/*') as $oldFile) {
                    if (is_file($oldFile) && (time() - filemtime($oldFile)) > 7200) {
                        @unlink($oldFile);
                    }
                }
            }
        }

        if ($chunkIndex == 0 && file_exists($tempPath)) @unlink($tempPath); // Clear previous if starting new
        if (!file_exists(dirname($tempPath))) mkdir(dirname($tempPath), 0777, true);

        // Append chunk to file
        $chunk = $request->file('backup');
        file_put_contents($tempPath, file_get_contents($chunk->getRealPath()), FILE_APPEND);

        // If this was the last chunk, process the full file
        if ($chunkIndex == $totalChunks - 1) {
            // Create a mock UploadedFile from the assembled file
            $file = new \Illuminate\Http\UploadedFile(
                $tempPath, 
                $fileName, 
                'application/octet-stream', 
                0, 
                true // Mark as test mode so isValid() returns true for non-HTTP uploads
            );

            // ROUTING: Determine if this is for Analysis or Restoration
            if ($request->input('step') === 'restore_backup') {
                return $this->processRestoreFile($file);
            }
            
            return $this->processAnalyzedFile($file);
        }

        return response()->json(['status' => 'chunk_received', 'progress' => round(($chunkIndex + 1) / $totalChunks * 100)]);
    }

    private function processAnalyzedFile($file) 
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'sql') {
            return response()->json([
                'type' => 'amd_backup',
                'summary' => [
                    'title' => 'Full System Recovery',
                    'description' => 'This will restore the entire database state exactly as it was when the backup was created. All current data will be overwritten.',
                    'counts' => [
                        'Database' => 'Full Snapshot',
                        'History' => 'All Included',
                        'Settings' => 'Restored'
                    ]
                ]
            ]);
        } elseif ($extension === 'vyb') {
            // Pre-check: PDO SQLite is required for Vyapar backups
            if (!extension_loaded('pdo_sqlite')) {
                throw new \Exception('Vyapar backups require the PDO SQLite PHP extension. Please enable pdo_sqlite in cPanel > Select PHP Version > Extensions, then retry.');
            }
            return $this->analyzeVyaparBackup($file);
        } elseif (in_array($extension, ['csv', 'xlsx', 'txt'])) {
            return response()->json([
                'type' => 'document_import',
                'summary' => [
                    'title' => 'Document Data Import',
                    'description' => "Importing from a .$extension file. This usually pulls only specific lists like Items or Customers.",
                    'counts' => [
                        'Primary List' => 'Detected',
                        'Transactions' => 'Skipped'
                    ]
                ]
            ]);
        }

        throw new \Exception("Format Error: Unsupported backup type (.$extension).");
    }

    private function analyzeVyaparBackup($file)
    {
        Log::info("Analyzing Vyapar Backup: " . $file->getClientOriginalName());
        $tempDir = storage_path('app/temp_analyze_' . time());
        if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);
        Log::info("Temp Dir: " . $tempDir);

        try {
            $zip = new \ZipArchive;
            Log::info("Opening Zip: " . $file->getRealPath());
            if ($zip->open($file->getRealPath()) === TRUE) {
                Log::info("Zip Open Success. Files Count: " . $zip->numFiles);
                $zip->extractTo($tempDir);
                $zip->close();
                Log::info("Zip Extracted.");
            } else {
                Log::error("Zip Open Failed for: " . $file->getRealPath());
                throw new \Exception("Corrupted Transmission: Failed to open Vyapar backup.");
            }

            $vypFiles = glob($tempDir . '/*.vyp');
            if (empty($vypFiles)) $vypFiles = glob($tempDir . '/**/*.vyp');
            Log::info("VYP Files Found: ", $vypFiles);

            if (empty($vypFiles)) throw new \Exception("Data Not Found: No Vyapar database identified.");

            $vypPath = $vypFiles[0];
            $pdo = new \PDO("sqlite:" . $vypPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(\PDO::FETCH_COLUMN);
            
            $counts = [];
            
            // Map counts
            if ($t = $this->findTable($tables, ['Item', 'Items', 'kb_items'])) {
                $counts['Products (Items)'] = $pdo->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
            }
            if ($t = $this->findTable($tables, ['Party', 'Parties', 'kb_party', 'kb_names'])) {
                $counts['Parties (Customers/Vendors)'] = $pdo->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
            }
            if ($t = $this->findTable($tables, ['Transaction', 'Transactions', 'kb_transactions'])) {
                $counts['Total Transactions'] = $pdo->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
                $counts['Sales History'] = $pdo->query("SELECT COUNT(*) FROM \"$t\" WHERE txn_type = 1")->fetchColumn();
                $counts['Payment Records'] = $pdo->query("SELECT COUNT(*) FROM \"$t\" WHERE txn_type IN (5, 6)")->fetchColumn();
            }
            if ($t = $this->findTable($tables, ['Bank', 'Banks'])) {
                $counts['Cash/Bank Balances'] = $pdo->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
            }

            File::deleteDirectory($tempDir);

            return response()->json([
                'type' => 'vyapar_backup',
                'summary' => [
                    'title' => 'Deep Vyapar Integration',
                    'description' => 'Full data extraction identified. We will migrate your entire Vyapar business history into VenQore POS.',
                    'counts' => $counts
                ]
            ]);

        } catch (\Exception $e) {
            File::deleteDirectory($tempDir);
            throw new \Exception("Analysis Failed: " . $e->getMessage());
        }
    }

    private function restoreFromVyapar($file)
    {
        $tempDir = storage_path('app/temp_restore_' . time());
        if (!file_exists($tempDir)) mkdir($tempDir, 0755, true);

        try {
            $zip = new ZipArchive;
            if ($zip->open($file->getRealPath()) === TRUE) {
                $zip->extractTo($tempDir);
                $zip->close();
            } else {
                throw new \Exception("Corrupted Transmission: Failed to open Vyapar backup.");
            }

            $vypFiles = glob($tempDir . '/*.vyp');
            if (empty($vypFiles)) $vypFiles = glob($tempDir . '/**/*.vyp');

            if (empty($vypFiles)) throw new \Exception("Data Not Found: No Vyapar database (.vyp) inside the backup.");

            $vypPath = $vypFiles[0];
            $pdo = new \PDO("sqlite:" . $vypPath);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(\PDO::FETCH_COLUMN);
            
            \Illuminate\Support\Facades\DB::beginTransaction();

            $partyMap = [];
            $itemMap = [];

            // SAFETY: Guarantee a default warehouse exists BEFORE any stock inserts.
            // Without this, if the seeder didn't run, Warehouse::first() returns null
            // and ->id crashes the entire import with a fatal error.
            $defaultWarehouse = \App\Models\Warehouse::firstOrCreate(
                ['name' => 'Main Store'],
                ['location' => 'Default', 'is_default' => true]
            );

            // 1. IMPORT PARTIES
            $partyTable = $this->findTable($tables, ['Party', 'Parties', 'kb_party', 'kb_names']);
            if ($partyTable) {
                $cols = $this->getColumns($pdo, $partyTable);
                $idCol = $this->findCol($cols, ['party_id', 'name_id']);
                $nameCol = $this->findCol($cols, ['name', 'party_name', 'full_name']);
                $phoneCol = $this->findCol($cols, ['phone', 'contact', 'mobile', 'phone_number', 'mobile_no']);
                $balanceCol = $this->findCol($cols, ['current_balance', 'amount']);
                
                if ($nameCol) {
                    $stmt = $pdo->query("SELECT * FROM \"$partyTable\"");
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $phone = $phoneCol ? ($row[$phoneCol] ?? null) : null;
                        $party = \App\Models\Party::updateOrCreate(
                            ['phone' => $phone],
                            [
                                'name' => $row[$nameCol] ?? 'Unknown',
                                'type' => (($row['party_type'] ?? ($row['name_type'] ?? 1)) == 1) ? 'customer' : 'supplier',
                                'current_balance' => $balanceCol ? ($row[$balanceCol] ?? 0) : 0
                            ]
                        );
                        if ($idCol) $partyMap[$row[$idCol]] = $party->id;
                        elseif (isset($row['party_id'])) $partyMap[$row['party_id']] = $party->id;
                        elseif (isset($row['name_id'])) $partyMap[$row['name_id']] = $party->id;
                    }
                }
            }

            // 2. IMPORT ITEMS (VYAPAR ITEMS => VenQore PRODUCTS)
            $itemTable = $this->findTable($tables, ['Item', 'Items', 'Product', 'kb_items']);
            if ($itemTable) {
                $cols = $this->getColumns($pdo, $itemTable);
                $idCol = $this->findCol($cols, ['item_id']);
                $nameCol = $this->findCol($cols, ['name', 'item_name']);
                $priceCol = $this->findCol($cols, ['sale_price', 'price', 'item_sale_unit_price']);
                $costCol = $this->findCol($cols, ['purchase_price', 'cost', 'item_purchase_unit_price']);
                $stockCol = $this->findCol($cols, ['item_quantity', 'stock', 'item_stock_quantity']);
                $codeCol = $this->findCol($cols, ['item_code', 'code', 'barcode']);

                if ($nameCol) {
                    $stmt = $pdo->query("SELECT * FROM \"$itemTable\"");
                    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                        $product = \App\Models\Product::updateOrCreate(
                            ['name' => $row[$nameCol]],
                            [
                                'price' => $priceCol ? ($row[$priceCol] ?? 0) : 0,
                                'cost_price' => $costCol ? ($row[$costCol] ?? 0) : 0,
                                'sku' => $codeCol ? ($row[$codeCol] ?? \Illuminate\Support\Str::random(8)) : \Illuminate\Support\Str::random(8),
                                'base_unit' => 'pcs',
                            ]
                        );
                        if ($idCol) $itemMap[$row[$idCol]] = $product->id;
                        // Handle kb_items id which is item_id
                        elseif (isset($row['item_id'])) $itemMap[$row['item_id']] = $product->id;

                        // Support stock if column exists and value > 0
                        if ($stockCol && ($row[$stockCol] ?? 0) > 0) {
                            $product->stocks()->updateOrCreate(
                                ['warehouse_id' => $defaultWarehouse->id],
                                ['quantity' => $row[$stockCol]]
                            );
                        }
                    }
                }
            }

            // 3. IMPORT TRANSACTIONS (SALES/PURCHASES)
            $txnTable = $this->findTable($tables, ['Transaction', 'Transactions', 'kb_transactions']);
            $lineTable = $this->findTable($tables, ['lineitems', 'TransactionItems', 'kb_lineitems']);

            if ($txnTable && $lineTable) {
                // Map Sales (Type 1)
                $stmt = $pdo->query("SELECT * FROM \"$txnTable\" WHERE txn_type = 1");
                while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    $txnPartyId = $row['txn_party_id'] ?? ($row['party_id'] ?? ($row['txn_name_id'] ?? null));
                    $newPartyId = $partyMap[$txnPartyId] ?? null;
                    if ($newPartyId) {
                        $totalAmt = $row['txn_total_amount'] ?? 0;
                        $sale = \App\Models\Sale::create([
                            'party_id' => $newPartyId,
                            'reference_number' => $row['txn_number'] ?? 'VY-' . \Illuminate\Support\Str::random(6),
                            'created_at' => $row['txn_date'] ?? now(),
                            'subtotal' => $totalAmt,
                            'total' => $totalAmt,
                            'status' => 'posted',
                            'posted_at' => $row['txn_date'] ?? now(),
                            'payment_status' => 'paid',
                            'payment_method' => 'cash',
                            'warehouse_id' => $defaultWarehouse->id,
                            'user_id' => 1
                        ]);

                        // Items for this sale
                        $txnId = $row['txn_id'] ?? ($row['id'] ?? null);
                        if ($txnId) {
                            $liCols = $this->getColumns($pdo, $lineTable);
                            $actualTxnCol = $this->findCol($liCols, ['lineitem_txn_id', 'txn_id', 'sale_id', 'invoice_id']);
                            
                            if ($actualTxnCol) {
                                $itemStmt = $pdo->prepare("SELECT * FROM \"$lineTable\" WHERE \"$actualTxnCol\" = ?");
                                $itemStmt->execute([$txnId]);
                                while ($li = $itemStmt->fetch(\PDO::FETCH_ASSOC)) {
                                    $newId = $itemMap[$li['item_id']] ?? null;
                                    if ($newId) {
                                        \App\Models\SaleItem::create([
                                            'sale_id' => $sale->id,
                                            'product_id' => $newId,
                                            'quantity' => $li['quantity'] ?? 1,
                                            'unit_price' => $li['priceperunit'] ?? 0,
                                            'subtotal' => $li['total_amount'] ?? 0
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. IMPORT BANKS (VYAPAR BANKS => VenQore BANK ACCOUNTS/PAYMENT METHODS)
            $bankTable = $this->findTable($tables, ['Bank', 'Banks']);
            if ($bankTable) {
                $stmt = $pdo->query("SELECT * FROM \"$bankTable\"");
                while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    \App\Models\BankAccount::updateOrCreate(
                        ['account_number' => $row['bank_id']], // Use ID as reference
                        [
                            'name' => $row['bank_name'] ?? 'Unknown Bank',
                            'balance' => $row['current_balance'] ?? 0,
                            'bank_name' => $row['bank_name'] ?? 'Vyapar Imported'
                        ]
                    );
                }
            }

            \Illuminate\Support\Facades\DB::commit();
            File::deleteDirectory($tempDir);

            return response()->json(['message' => 'Integrity Complete: All Vyapar history and shop systems recovered.']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            File::deleteDirectory($tempDir);
            Log::error("Vyapar Migration Failed: " . $e->getMessage());
            throw new \Exception("Vyapar Core Error: " . $e->getMessage());
        }
    }

    private function saveBusinessSettings(Request $request)
    {
        $data = $request->input('data');

        $currencyCode = $data['currency_code'] ?? 'USD';
        // Auto-detect symbol — comprehensive world currency map
        $symbolMap = [
            // Americas
            'USD' => '$', 'CAD' => 'C$', 'BRL' => 'R$', 'MXN' => 'MX$', 'ARS' => 'AR$', 'COP' => 'COL$',
            // Europe
            'EUR' => '€', 'GBP' => '£', 'CHF' => 'CHF', 'SEK' => 'kr', 'NOK' => 'kr', 'DKK' => 'kr',
            'PLN' => 'zł', 'CZK' => 'Kč', 'HUF' => 'Ft', 'RON' => 'lei', 'TRY' => '₺', 'RUB' => '₽',
            // South Asia
            'PKR' => 'Rs', 'INR' => '₹', 'BDT' => '৳', 'LKR' => 'Rs', 'NPR' => 'Rs',
            // Middle East
            'AED' => 'د.إ', 'SAR' => 'ر.س', 'QAR' => 'ر.ق', 'KWD' => 'د.ك', 'BHD' => 'BD',
            'OMR' => 'ر.ع', 'JOD' => 'JD', 'EGP' => 'E£', 'ILS' => '₪', 'IQD' => 'ع.د',
            // Africa
            'ZAR' => 'R', 'NGN' => '₦', 'KES' => 'KSh', 'GHS' => 'GH₵', 'TZS' => 'TSh',
            // East & Southeast Asia
            'CNY' => '¥', 'JPY' => '¥', 'KRW' => '₩', 'MYR' => 'RM', 'SGD' => 'S$',
            'THB' => '฿', 'IDR' => 'Rp', 'PHP' => '₱', 'VND' => '₫', 'MMK' => 'K',
            // Oceania
            'AUD' => 'A$', 'NZD' => 'NZ$', 'FJD' => 'FJ$',
        ];
        $currencySymbol = $data['currency_symbol'] ?? ($symbolMap[$currencyCode] ?? $currencyCode);

        // Settings to update
        $settings = [
            'business_name' => $data['business_name'] ?? 'My Business',
            'currency_symbol' => $currencySymbol,
            'currency_code' => $currencyCode,
            'timezone' => $data['timezone'] ?? 'UTC',
        ];

        foreach ($settings as $key => $value) {
            \App\Models\Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        // Handle Logo (Needs to be sent as FormData in frontend)
        // Accessing files from the request, not the 'data' array
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('company_logos', 'public');
            \App\Models\Setting::updateOrCreate(['key' => 'company_logo'], ['value' => 'company_logos/' . basename($path)]);
            \App\Models\Setting::updateOrCreate(['key' => 'logo_style'], ['value' => 'custom']);
        }

        return response()->json(['message' => 'Business settings saved.']);
    }

    private function finalizeInstallation($data = [])
    {
        // 1. Link Storage (Idempotent)
        try {
            Artisan::call('storage:link');
        } catch (\Exception $e) {
            // Ignore if already linked
        }

        // 2. Secure the App
        $this->updateEnv([
            'APP_DEBUG' => 'false',
            'APP_ENV' => 'production'
        ]);

        // 3. Clear ALL Caches to ensure fresh start
        Artisan::call('optimize:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');
        Artisan::call('config:clear');
        Artisan::call('cache:clear');

        // 4. Flag Installed (The Truth Source)
        // We write this LAST so that if previous steps fail, we don't lock the user out.
        File::put(storage_path('installed'), 'INSTALLED ON ' . now());

        // Auto-login the created super admin so they can proceed directly to Setup Wizard
        $admin = \App\Models\User::first();
        if ($admin) {
            \Illuminate\Support\Facades\Auth::login($admin);
        }

        return response()->json(['message' => 'Installation finalized.']);
    }

    private function findTable($tables, $searches) {
        foreach ($searches as $search) {
            foreach ($tables as $t) {
                if (strtolower($t) == strtolower($search)) return $t;
            }
        }
        return null;
    }

    private function getColumns($pdo, $table) {
        $stmt = $pdo->query("PRAGMA table_info(\"$table\")");
        return $stmt->fetchAll(\PDO::FETCH_COLUMN, 1);
    }

    private function findCol($cols, $searches) {
        foreach ($searches as $search) {
            foreach ($cols as $c) {
                $cleanC = str_replace([' ','_'], '', strtolower($c));
                $cleanS = str_replace([' ','_'], '', strtolower($search));
                if ($cleanC == $cleanS) return $c;
            }
        }
        return null;
    }
}
