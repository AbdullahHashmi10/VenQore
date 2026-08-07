<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // ── Phase 3.3: Cloudflare R2 ──────────────────────────────────────
        // S3-compatible object storage. Free egress (unlike AWS S3).
        // Activate: set FILESYSTEM_DISK=r2 in production .env.
        //
        // Setup:
        //   1. Create R2 bucket in Cloudflare dashboard
        //   2. Create API token with R2 permissions
        //   3. Fill in CLOUDFLARE_R2_* env vars
        //   4. Set custom domain: CLOUDFLARE_R2_URL=https://assets.venqore.com
        //   5. Set FILESYSTEM_DISK=r2
        //
        // Files are stored at: tenants/{tenant_id}/{context}/{filename}
        // Served via: https://assets.venqore.com/tenants/{id}/products/thumb.jpg
        'r2' => [
            'driver'                  => env('CLOUDFLARE_R2_ACCESS_KEY_ID') ? 's3' : 'local',  // R2 is S3-compatible
            'root'                    => storage_path('app/r2'),
            'key'                     => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
            'secret'                  => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
            'region'                  => 'auto',
            'bucket'                  => env('CLOUDFLARE_R2_BUCKET', 'venqore-assets'),
            'url'                     => env('CLOUDFLARE_R2_URL', 'https://assets.venqore.com'),
            'endpoint'                => env('CLOUDFLARE_R2_ENDPOINT'),
            'use_path_style_endpoint' => true,   // Required for R2
            'visibility'              => 'public',
            'throw'                   => false,
            'report'                  => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
