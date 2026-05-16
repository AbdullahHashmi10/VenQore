<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $fullPath = storage_path('app/public/test.xlsx');
    file_put_contents($fullPath, 'fake');
    $data = \Maatwebsite\Excel\Facades\Excel::toArray(new class implements \Maatwebsite\Excel\Concerns\ToArray {
        public function array(array $array) {}
    }, $fullPath);
    echo "Success";
} catch (\Exception $e) {
    echo "Error is: " . $e->getMessage();
}
