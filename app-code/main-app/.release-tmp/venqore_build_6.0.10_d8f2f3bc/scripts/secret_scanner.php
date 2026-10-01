<?php

$patterns = [
    'private_key'        => '/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/',
    'aws_access_key'     => '/\bAKIA[0-9A-Z]{16}\b/',
    'aws_secret_key'     => '/\baws_secret_access_key\s*=\s*["\']?[0-9a-zA-Z\/+]{40}["\']?/',
    'github_token'       => '/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/',
    'stripe_secret'      => '/\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/',
    'generic_secret'     => '/\b(?:api_key|api_secret|app_secret|client_secret|db_password)\s*[:=]\s*["\'][A-Za-z0-9\-_+=]{16,}["\']/',
    'bearer_token'       => '/\bBearer\s+[A-Za-z0-9\-\._~\+\/]+=*/i',
    'absolute_user_path' => '/[A-Z]:\\\\Users\\\\[^\\\\\/\s]+/',
];

$paths = ['app', 'config', 'database', 'resources', 'routes', 'tests'];
$findings = [];
$scannedCount = 0;

foreach ($paths as $p) {
    $dir = __DIR__ . '/../' . $p;
    if (!is_dir($dir)) continue;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isDir()) continue;
        $path = str_replace('\\', '/', $file->getRealPath());
        if (
            str_contains($path, '/storage/') ||
            str_contains($path, '/node_modules/') ||
            str_contains($path, '/.git/') ||
            str_contains($path, '/tests/reports/') ||
            str_contains($path, '/tests/logs/')
        ) {
            continue;
        }

        $scannedCount++;
        $content = file_get_contents($path);
        
        foreach ($patterns as $name => $pattern) {
            if (preg_match($pattern, $content, $matches)) {
                // Ignore safe patterns in test mocks or dummy strings
                $matchedStr = $matches[0];
                if (
                    str_contains($path, '/tests/') &&
                    (str_contains($matchedStr, 'dummy') || str_contains($matchedStr, 'test') || str_contains($matchedStr, 'fake') || str_contains($matchedStr, 'secret123') || str_contains($matchedStr, 'password'))
                ) {
                    continue;
                }
                $findings[] = [
                    'file'    => $path,
                    'type'    => $name,
                ];
            }
        }
    }
}

echo "SCANNED_FILES: {$scannedCount}\n";
echo "SECRET_FINDINGS_COUNT: " . count($findings) . "\n";
if (!empty($findings)) {
    echo "FINDINGS:\n";
    foreach ($findings as $f) {
        echo "  - {$f['file']} ({$f['type']})\n";
    }
} else {
    echo "SECRET SCAN RESULT: CLEAN (No secrets or credentials found)\n";
}
