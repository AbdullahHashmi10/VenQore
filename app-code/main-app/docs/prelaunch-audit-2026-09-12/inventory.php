<?php
// Read-only metadata capture. No tenant writes and no model calls.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['cache.default'=>'array']);
$manifest = new App\Services\AiBuilder\ModuleManifest();
$caps = new App\Services\AiBuilder\CapabilityRegistry();
$routes = [];
foreach (app('router')->getRoutes() as $route) {
    $name = $route->getName();
    if (str_starts_with($name ?? '', 'store.') || in_array('api', $route->gatherMiddleware())) {
        $always = App\Support\ModuleRouteMap::isAlwaysOn($name);
        $owners = App\Support\ModuleRouteMap::ownersOf($name);
        $routes[] = ['name'=>$name,'uri'=>$route->uri(),'methods'=>$route->methods(),'action'=>$route->getActionName(),'middleware'=>$route->gatherMiddleware(),'resolved_middleware'=>app('router')->gatherRouteMiddleware($route),'owners'=>$owners,'classification'=>$always?'always-on':($owners?'owned':'unclaimed')];
    }
}
$data=['modules'=>config('modules'),'capabilities'=>$caps->allCapabilities(),'builder'=>config('ai_builder'),'qore'=>config('qore'),'readings'=>App\Reckoner\ReckonerRegistry::all(),'reports'=>App\Support\ReportModuleMap::OWNERS,'routes'=>$routes,'catalogue'=>$manifest->catalogue(),'business_types'=>config('business_types'),'dashboard_presets'=>config('dashboard_presets')];
file_put_contents(__DIR__.'/inventory.json', json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PARTIAL_OUTPUT_ON_ERROR));
echo 'Saved metadata inventory: '.count($manifest->live()).' live / '.count(config('modules')).' total modules; '.count($data['readings']).' readings; '.count($data['capabilities']).' capabilities.'.PHP_EOL;
try {
    echo 'Database: '.Illuminate\Support\Facades\DB::connection()->getDatabaseName().'; connection '.(Illuminate\Support\Facades\DB::selectOne('SELECT 1 AS ok')->ok?'OK':'failed').PHP_EOL;
    echo 'Test database exists: '.count(Illuminate\Support\Facades\DB::select("SHOW DATABASES LIKE 'amd_pos_test'")).PHP_EOL;
} catch (Throwable $e) { echo get_class($e).': '.$e->getMessage().PHP_EOL; }
