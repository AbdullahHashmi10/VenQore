<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Default AI Provider (fallback when a store has no own key)
    |--------------------------------------------------------------------------
    | Supported providers: gemini, openai, anthropic, deepseek.
    */
    'provider'   => env('SMART_CAPTURE_PROVIDER', 'gemini'),
    'gemini_key' => env('GEMINI_API_KEY'),
    'api_key'    => env('SMART_CAPTURE_API_KEY'), // generic platform key for the provider above
    'model'      => env('SMART_CAPTURE_MODEL', 'gemini-2.5-flash'),

    /*
    |--------------------------------------------------------------------------
    | Default models per provider (used when no model override is set)
    |--------------------------------------------------------------------------
    */
    'default_models' => [
        'gemini'    => 'gemini-2.5-flash',
        'openai'    => 'gpt-4o-mini',
        'anthropic' => 'claude-sonnet-4-5',
        'deepseek'  => 'deepseek-chat',
    ],

    /*
    |--------------------------------------------------------------------------
    | Fallback models tried in order when the primary model fails (per provider)
    |--------------------------------------------------------------------------
    */
    'fallback_models' => [
        'gemini'    => ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
        'openai'    => ['gpt-4o-mini', 'gpt-4o'],
        'anthropic' => ['claude-sonnet-4-5', 'claude-haiku-4-5'],
        'deepseek'  => ['deepseek-chat'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Capability matrix — which input types each provider supports
    |--------------------------------------------------------------------------
    */
    'capabilities' => [
        'gemini'    => ['image' => true,  'audio' => true,  'text' => true],
        'openai'    => ['image' => true,  'audio' => true,  'text' => true], // audio via Whisper transcription
        'anthropic' => ['image' => true,  'audio' => false, 'text' => true],
        'deepseek'  => ['image' => false, 'audio' => false, 'text' => true],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Size Limits (MB) & file count
    |--------------------------------------------------------------------------
    */
    'max_image_mb' => env('SMART_CAPTURE_MAX_IMAGE_MB', 10),
    'max_audio_mb' => env('SMART_CAPTURE_MAX_AUDIO_MB', 25),
    'max_files'    => env('SMART_CAPTURE_MAX_FILES', 5),

    /*
    |--------------------------------------------------------------------------
    | Catalog context cap — max products sent to the model for matching
    |--------------------------------------------------------------------------
    */
    'catalog_limit' => env('SMART_CAPTURE_CATALOG_LIMIT', 800),

    /*
    |--------------------------------------------------------------------------
    | Confidence Thresholds (Percentage)
    |--------------------------------------------------------------------------
    */
    'confidence_high' => env('SMART_CAPTURE_CONFIDENCE_HIGH', 90),
    'confidence_low'  => env('SMART_CAPTURE_CONFIDENCE_LOW', 60),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting Settings (requests per minute per user)
    |--------------------------------------------------------------------------
    */
    'rate_limit' => env('SMART_CAPTURE_RATE_LIMIT', 20),
];
