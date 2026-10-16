<?php

/*
 * Firebase Cloud Messaging (notifications to the Android app).
 *
 * Point FCM_SERVICE_ACCOUNT_PATH at the Firebase service-account JSON, stored OUTSIDE the web folder and
 * outside git. With no path set, app notifications are simply off and nothing else is affected.
 */
return [
    'service_account_path' => env('FCM_SERVICE_ACCOUNT_PATH'),
];
