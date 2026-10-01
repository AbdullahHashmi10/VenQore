<?php

namespace App\Services\Ai;

final class AiResult
{
    public bool    $ok = false;
    public mixed   $value = null;         // parsed + schema-validated payload or string
    public string  $source = 'model';     // 'deterministic'|'memory'|'cache'|'model'
    public ?string $model = null;         // null when no upstream call occurred
    public ?string $provider = null;
    public float   $confidence = 1.0;     // 0.0–1.0
    public float   $costUsd = 0.0;
    public int     $latencyMs = 0;
    public bool    $learnable = false;    // safe to feed the learning store
    public ?string $failureCode = null;   // 'spend_capped'|'rate_limited'|'no_key'|'locked'|...
    public ?string $errorMessage = null;
    public array   $raw = [];             // raw candidate/message
    public int     $promptTokens = 0;
    public int     $outputTokens = 0;
    public ?array  $toolCalls = null;
    public ?string $keyMode = null;

    public static function success(
        mixed $value,
        string $source = 'model',
        ?string $model = null,
        ?string $provider = null,
        float $confidence = 1.0,
        float $costUsd = 0.0,
        int $latencyMs = 0,
        bool $learnable = false,
        array $raw = [],
        int $promptTokens = 0,
        int $outputTokens = 0,
        ?array $toolCalls = null
    ): self {
        $res = new self();
        $res->ok           = true;
        $res->value        = $value;
        $res->source       = $source;
        $res->model        = $model;
        $res->provider     = $provider;
        $res->confidence   = $confidence;
        $res->costUsd      = $costUsd;
        $res->latencyMs    = $latencyMs;
        $res->learnable    = $learnable;
        $res->raw          = $raw;
        $res->promptTokens = $promptTokens;
        $res->outputTokens = $outputTokens;
        $res->toolCalls    = $toolCalls;

        return $res;
    }

    public static function failure(string $failureCode, ?string $errorMessage = null, ?string $source = 'model'): self
    {
        $res = new self();
        $res->ok           = false;
        $res->failureCode  = $failureCode;
        $res->errorMessage = $errorMessage;
        $res->source       = $source ?? 'model';

        return $res;
    }
}
