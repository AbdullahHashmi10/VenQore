<?php

/*
 * Web Push (VAPID) for browsers and the installed web app.
 *
 * Generate a key pair once per environment with `php artisan webpush:keys`, put the three lines in
 * .env, and keep the private key out of the repository. With no keys set, push is simply off: nothing
 * else in the app depends on it and sending is a silent no-op.
 */
return [
    'public_key'  => env('WEBPUSH_VAPID_PUBLIC_KEY'),
    'private_key' => env('WEBPUSH_VAPID_PRIVATE_KEY'),
    'subject'     => env('WEBPUSH_VAPID_SUBJECT', 'mailto:support@venqore.com'),
    // Seconds a push service keeps an undelivered message (a phone that is off).
    'ttl'         => (int) env('WEBPUSH_TTL', 600),
];
