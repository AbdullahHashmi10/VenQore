<?php
// Isolated metadata test: does not boot Laravel or connect to a database.
$stationTestRoot = sys_get_temp_dir().DIRECTORY_SEPARATOR.'vq-release-'.bin2hex(random_bytes(8));
mkdir($stationTestRoot.'/downloads/station', 0777, true);
function public_path($path = '') { global $stationTestRoot; return $stationTestRoot.'/'.$path; }
require __DIR__.'/../app/Support/StationRelease.php';
function expectStation($condition, $message) { if (!$condition) throw new RuntimeException($message); }
try {
    expectStation(!App\Support\StationRelease::metadata()['is_live'], 'Missing manifest must not advertise old installer');
    $file = public_path('downloads/station/VenQore-Station-Setup-3.2.0.exe');
    file_put_contents($file, 'test');
    $manifest = ['version' => '3.2.0', 'installer_url' => '/downloads/station/VenQore-Station-Setup-3.2.0.exe', 'bytes' => 4, 'sha256' => hash('sha256', 'test'), 'status' => 'pilot'];
    $pointer = public_path('downloads/station/release.json');
    file_put_contents($pointer, json_encode($manifest));
    expectStation(App\Support\StationRelease::metadata()['is_live'], 'Matching pilot should be available');
    $manifest['bytes'] = 5;
    file_put_contents($pointer, json_encode($manifest));
    expectStation(!App\Support\StationRelease::metadata()['is_live'], 'Mismatched size must be unavailable');
    $manifest['bytes'] = 4; $manifest['installer_url'] = 'https://evil.example/test.exe';
    file_put_contents($pointer, json_encode($manifest));
    expectStation(!App\Support\StationRelease::metadata()['is_live'], 'External manifest target must be rejected');
    echo "PASS: missing, matching, stale and hostile release metadata\n";
} finally {
    foreach (glob($stationTestRoot.'/downloads/station/*') as $file) unlink($file);
    rmdir($stationTestRoot.'/downloads/station'); rmdir($stationTestRoot.'/downloads'); rmdir($stationTestRoot);
}
