<?php
$files = glob(__DIR__ . '/app/Http/Controllers/*.php');
foreach ($files as $file) {
    $content = file_get_contents($file);
    $content = str_replace('app(app(\\App\\Services\\V3\\AccountingService::class)->class)', 'app(\\App\\Services\\V3\\AccountingService::class)', $content);
    $content = str_replace('app(app(\\App\\Services\\V3\\FifoService::class)->class)', 'app(\\App\\Services\\V3\\FifoService::class)', $content);
    file_put_contents($file, $content);
}
echo "Fixed messed up app bindings.\n";
