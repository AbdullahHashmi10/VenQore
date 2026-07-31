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
    | These are conservative, known-good defaults. Newer models (e.g. the
    | gemini-3.x flash family) can be selected per store from the AI Scan
    | settings drawer — the model list is discovered live from the provider
    | using the store's own key, so this list never goes stale.
    */
    'default_models' => [
        'gemini'    => env('SMART_CAPTURE_GEMINI_MODEL', 'gemini-2.5-flash'),
        'openai'    => 'gpt-4o-mini',
        'anthropic' => 'claude-sonnet-4-5',
        'deepseek'  => 'deepseek-chat',
    ],

    /*
    |--------------------------------------------------------------------------
    | Model substitution chain — MODEL-AVAILABILITY ERRORS ONLY
    |--------------------------------------------------------------------------
    | IMPORTANT: one scan must cost exactly ONE upstream API request.
    |
    | This chain is NOT a retry-on-failure list. It is consulted only when the
    | provider tells us the requested model does not exist / is not available to
    | this key (HTTP 404, or 400 "model not found"). It is never used for rate
    | limits (429), server errors (5xx), timeouts or JSON parse failures —
    | retrying those is what exhausted the free-tier quota previously.
    |
    | Set `substitute_on_missing_model` to false to disable entirely.
    */
    'substitute_on_missing_model' => env('SMART_CAPTURE_MODEL_SUBSTITUTION', true),

    'fallback_models' => [
        'gemini'    => ['gemini-2.5-flash', 'gemini-2.0-flash'],
        'openai'    => ['gpt-4o-mini'],
        'anthropic' => ['claude-sonnet-4-5'],
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
    | Generation tuning
    |--------------------------------------------------------------------------
    | max_output_tokens: 3000 was too low — a long handwritten list produced
    | truncated JSON, which failed to parse and (previously) triggered the retry
    | loop. 8192 comfortably covers a 60-line document.
    |
    | thinking_budget: Gemini 2.5+ "thinking" tokens are billed against the
    | output budget. A small budget measurably improves handwriting reading;
    | set to 0 to disable for maximum speed / lowest cost.
    */
    'max_output_tokens'      => (int) env('SMART_CAPTURE_MAX_OUTPUT_TOKENS', 8192),
    'thinking_budget_image'  => (int) env('SMART_CAPTURE_THINKING_IMAGE', 1024),
    'thinking_budget_text'   => (int) env('SMART_CAPTURE_THINKING_TEXT', 0),
    'timeout'                => (int) env('SMART_CAPTURE_TIMEOUT', 120),

    /*
    |--------------------------------------------------------------------------
    | Concurrency control
    |--------------------------------------------------------------------------
    | single_flight_seconds : max lifetime of the per-store "a scan is already
    |                          running" lock. Stops double-submits and duplicate
    |                          tabs from spending two requests on one document.
    |
    | pace_ms               : minimum spacing between two upstream calls that
    |                          share the same API key. Protects a free-tier key
    |                          (~10 requests/minute) when several staff scan at
    |                          the same moment. Set to 0 on a paid key.
    |                          6500ms ≈ 9 requests/minute.
    | pace_max_wait_ms      : how long a request may wait for its turn before
    |                          giving up with a friendly "try again" message.
    */
    'single_flight_seconds' => (int) env('SMART_CAPTURE_SINGLE_FLIGHT', 180),
    'pace_ms'               => (int) env('SMART_CAPTURE_PACE_MS', 0),
    'pace_max_wait_ms'      => (int) env('SMART_CAPTURE_PACE_MAX_WAIT_MS', 30000),

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
    | Learning memory (per-tenant alias book)
    |--------------------------------------------------------------------------
    | Every correction a user makes on the review screen is remembered against
    | this store, so the same wording resolves instantly next time.
    |
    | hint_limit    : how many of the store's strongest learned aliases are fed
    |                 back to the model as few-shot hints on the next scan.
    | min_hits_pin  : an alias seen at least this many times is auto-selected
    |                 without asking again.
    */
    'learning_enabled' => env('SMART_CAPTURE_LEARNING', true),
    'hint_limit'       => (int) env('SMART_CAPTURE_HINT_LIMIT', 60),
    'min_hits_pin'     => (int) env('SMART_CAPTURE_MIN_HITS_PIN', 1),

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
