<?php

/*
|--------------------------------------------------------------------------
| Conversational invoice assistant
|--------------------------------------------------------------------------
|
| Typed or spoken request -> reviewed, editable sales-invoice draft. The
| assistant NEVER posts: the operator presses the normal Save in
| Sales/CreateInvoice, which goes through store.sales.store like any invoice.
|
| Both switches default to OFF. Turn on per environment with VQ_* variables,
| and restrict a pilot with `enabled_tenants` (empty list = every store).
*/
return [
    'enabled'       => (bool) env('VQ_INVOICE_ASSISTANT', false),
    'voice_enabled' => (bool) env('VQ_INVOICE_ASSISTANT_VOICE', false),

    // Pilot allow-list of tenant ids. Empty = all tenants (once enabled).
    'enabled_tenants' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('VQ_INVOICE_ASSISTANT_TENANTS', ''))
    ), 'strlen')),

    // Drafts live outside every financial table and expire on their own.
    'draft_ttl_minutes'   => (int) env('VQ_INVOICE_ASSISTANT_TTL', 30),
    'prune_after_hours'   => 24,   // expired/cancelled content is deleted after this
    'max_input_chars'     => 4000,
    'max_lines'           => 50,
    'max_turns'           => 10,
    'max_quantity'        => 1000000,
    'max_notes_chars'     => 500,
    'candidate_limit'     => 5,
    'request_log_limit'   => 20,

    // A handoff claimed by a browser tab but never acknowledged (tab crashed,
    // refresh mid-hydration) can be claimed again after this many seconds.
    'claim_grace_seconds' => 120,

    'speech' => [
        'max_seconds'   => 60,
        'max_bytes'     => 10 * 1024 * 1024,
        'timeout'       => 30,
        'locales'       => ['auto', 'en', 'ur'],
        // Container families accepted after BYTE inspection (not the header).
        'allowed_kinds' => ['webm', 'ogg', 'mp4', 'wav', 'mp3'],
        // Used when the provider reports no cost: duration (or the 60 s cap
        // when duration is unknown) x this rate. Deliberately conservative.
        'fallback_cost_per_minute' => 0.01,
        'openai_model'  => env('VQ_INVOICE_STT_OPENAI_MODEL', 'gpt-4o-mini-transcribe'),
        'tmp_dir'       => 'app/private/invoice-assistant-tmp',
        'tmp_ttl_minutes' => 15,
        'replay_ttl_minutes' => 10,
    ],
];
