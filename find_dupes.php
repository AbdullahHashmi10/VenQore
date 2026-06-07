<?php
$routes = Route::getRoutes()->getRoutes();
foreach ($routes as $route) {
    if ($route->getName() === 'store.admin.data') {
        echo $route->uri() . "\n";
    }
}
