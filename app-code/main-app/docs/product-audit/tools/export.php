<?php
// Read-only registry and router export. Does not generate Vena's runtime manifest.
$base = dirname(__DIR__, 3);
require $base.'/vendor/autoload.php';
$app = require $base.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$out = [
    'modules' => config('modules'),
    'guides' => config('vena_guides'),
    'qore' => config('qore'),
    'business_types' => config('business_types'),
    'builder_presets' => config('ai_builder.presets'),
    'manifest' => App\Services\Vena\ManifestBuilder::build(),
    'routes' => [],
];
foreach (Illuminate\Support\Facades\Route::getRoutes() as $route) {
    $source = null;
    $error = null;
    try {
        $uses = $route->getAction('uses');
        if ($uses instanceof Closure) {
            $ref = new ReflectionFunction($uses);
        } elseif (is_string($uses) && str_contains($uses, '@')) {
            [$class, $method] = explode('@', $uses, 2);
            $ref = new ReflectionMethod($class, $method);
        } else {
            $ref = null;
        }
        if ($ref && $ref->getFileName()) {
            $source = ['file' => str_replace('\\', '/', substr($ref->getFileName(), strlen($base) + 1)), 'start' => $ref->getStartLine(), 'end' => $ref->getEndLine()];
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
    $out['routes'][] = [
        'name' => $route->getName(), 'uri' => $route->uri(),
        'methods' => $route->methods(), 'action' => $route->getActionName(),
        'middleware' => $route->gatherMiddleware(),
        'source' => $source, 'source_error' => $error,
    ];
}
echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
