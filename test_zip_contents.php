<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$connection = 2;
$tenantId = 2;

$conn = \App\Models\WooConnection::where('tenant_id', $tenantId)->findOrFail($connection);

if (!$conn->setup_token) {
    $conn->update(['setup_token' => \Illuminate\Support\Str::random(40)]);
}

$pluginDir = public_path('downloads/venqore-sync');
$tempZip = tempnam(sys_get_temp_dir(), 'venqore_sync_') . '.zip';

$zip = new \ZipArchive();
if ($zip->open($tempZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
    echo "ERROR: Could not open temp zip\n";
    exit(1);
}

$files = new \RecursiveIteratorIterator(
    new \RecursiveDirectoryIterator($pluginDir),
    \RecursiveIteratorIterator::LEAVES_ONLY
);

foreach ($files as $name => $file) {
    if (!$file->isDir()) {
        $filePath = $file->getRealPath();
        $relativePath = 'venqore-sync/' . substr($filePath, strlen($pluginDir) + 1);
        $relativePath = str_replace('\\', '/', $relativePath);
        $zip->addFile($filePath, $relativePath);
    }
}

$apiUrl = url('/');
$configContent = "<?php\n" .
    "// Auto-generated VenQore Sync configuration file\n" .
    "if (!defined('ABSPATH')) exit;\n\n" .
    "define('VENQORE_SETUP_TOKEN', '" . addslashes($conn->setup_token) . "');\n" .
    "define('VENQORE_API_URL', '" . addslashes($apiUrl) . "');\n";

$zip->addFromString('venqore-sync/venqore-config.php', $configContent);
$zip->close();

echo "Zip generated successfully at: $tempZip\n";

// Open the zip again to inspect the files
$zipRead = new \ZipArchive();
if ($zipRead->open($tempZip) === true) {
    echo "Number of files in ZIP: " . $zipRead->numFiles . "\n";
    for ($i = 0; $i < $zipRead->numFiles; $i++) {
        $stat = $zipRead->statIndex($i);
        echo "File [$i]: " . $stat['name'] . " (Size: " . $stat['size'] . " bytes)\n";
    }
    $zipRead->close();
} else {
    echo "ERROR: Could not read generated zip\n";
}

unlink($tempZip);
