<?php

return [
    'scan_handwritten' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash',
        'thinking' => 256,
    ],
    'scan_printed' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash-lite',
        'thinking' => 0,
    ],
    'audio' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash',
        'thinking' => 256,
    ],
    'match_fallback' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash-lite',
        'thinking' => 0,
    ],
    'query' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash-lite',
        'thinking' => 0,
    ],
    'populate' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash-lite',
        'thinking' => 0,
    ],
    'list_import' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash',
        'thinking' => 256,
    ],
    'visitor_chat' => [
        'provider'   => 'gemini',
        'model'      => 'gemini-2.5-flash-lite',
        'thinking'   => 0,
        'max_output' => 300,
    ],
    'public_tool' => [
        'provider' => 'gemini',
        'model'    => 'gemini-2.5-flash',
        'thinking' => 256,
    ],
    // ── Phase 9 (T9-6): Deprecation timeline & successor fallbacks ──────────
    'deprecation_audit' => [
        'gemini-2.5-flash' => [
            'deprecation_date' => '2026-10-16',
            'fallback_successor' => 'gemini-2.5-flash-lite',
        ],
        'gemini-2.5-flash-lite' => [
            'deprecation_date' => '2026-10-16',
            'fallback_successor' => 'gemini-1.5-flash',
        ],
    ],
];
