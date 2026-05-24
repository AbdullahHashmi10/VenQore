<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenant = App\Models\Tenant::find(3);
app()->instance('current.tenant', $tenant);

$controller = new App\Http\Controllers\StaffInvitationController();
$response = $controller->index(request());
$props = $response->toResponse(request())->getOriginalContent()->getData()['page']['props'];

echo json_encode($props['attendance']['today'], JSON_PRETTY_PRINT);
