<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Server Side Rendering (SSR)
    |--------------------------------------------------------------------------
    |
    | These options configure Inertia's server-side rendering engine.
    | SSR is enabled dynamically for marketing routes in HandleInertiaRequests.
    |
    */

    'ssr' => [
        'enabled' => false,
        'url' => 'http://127.0.0.1:13714',
        'bundle' => base_path('bootstrap/ssr/ssr.js'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Testing
    |--------------------------------------------------------------------------
    |
    | Configuration options for testing Inertia responses.
    |
    */

    'testing' => [
        'ensure_pages_exist' => true,
        'page_paths' => [
            resource_path('js/Pages'),
        ],
    ],

];
