<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Gemini AI Settings
    |--------------------------------------------------------------------------
    */
    'gemini_key' => env('GEMINI_API_KEY'),
    'model' => env('SMART_CAPTURE_MODEL', 'gemini-2.5-flash'),

    /*
    |--------------------------------------------------------------------------
    | File Size Limits (MB)
    |--------------------------------------------------------------------------
    */
    'max_image_mb' => env('SMART_CAPTURE_MAX_IMAGE_MB', 10),
    'max_audio_mb' => env('SMART_CAPTURE_MAX_AUDIO_MB', 25),

    /*
    |--------------------------------------------------------------------------
    | Confidence Thresholds (Percentage)
    |--------------------------------------------------------------------------
    */
    'confidence_high' => env('SMART_CAPTURE_CONFIDENCE_HIGH', 90),
    'confidence_low' => env('SMART_CAPTURE_CONFIDENCE_LOW', 60),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Settings
    |--------------------------------------------------------------------------
    */
    'rate_limit' => env('SMART_CAPTURE_RATE_LIMIT', 20),
];
