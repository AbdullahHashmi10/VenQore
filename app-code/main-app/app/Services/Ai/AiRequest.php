<?php

namespace App\Services\Ai;

use App\Models\Tenant;
use App\Models\User;

class AiRequest
{
    public string $feature;
    public ?Tenant $tenant = null;
    public ?User $user = null;
    public mixed $input = null;
    public array $context = [];
    public ?AiSchema $schema = null;
    public array $tools = [];
    public mixed $toolExecutor = null;
    public ?string $preferredModel = null;
    public ?string $preferredProvider = null;
    public ?float $temperature = null;
    public ?int $maxOutputTokens = null;
    public ?string $prompt = null;
    public ?string $systemPrompt = null;
    public ?string $entitlementMode = null;

    public function __construct(string $feature)
    {
        $this->feature = $feature;
    }

    public static function for(string $feature): self
    {
        return new self($feature);
    }

    public function tenant(?Tenant $tenant): self
    {
        $this->tenant = $tenant;
        return $this;
    }

    public function user(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function input(mixed $input): self
    {
        $this->input = $input;
        return $this;
    }

    public function context(array $context): self
    {
        $this->context = $context;
        return $this;
    }

    public function expects(?AiSchema $schema): self
    {
        $this->schema = $schema;
        return $this;
    }

    public function tools(array $tools, ?callable $executor = null): self
    {
        $this->tools = $tools;
        $this->toolExecutor = $executor;
        return $this;
    }

    public function preferredModel(?string $model): self
    {
        $this->preferredModel = $model;
        return $this;
    }

    public function preferredProvider(?string $provider): self
    {
        $this->preferredProvider = $provider;
        return $this;
    }

    public function temperature(?float $temperature): self
    {
        $this->temperature = $temperature;
        return $this;
    }

    public function maxOutputTokens(?int $tokens): self
    {
        $this->maxOutputTokens = $tokens;
        return $this;
    }

    public function prompt(?string $prompt): self
    {
        $this->prompt = $prompt;
        return $this;
    }

    public function systemPrompt(?string $prompt): self
    {
        $this->systemPrompt = $prompt;
        return $this;
    }

    public function entitlementMode(?string $mode): self
    {
        $this->entitlementMode = $mode;
        return $this;
    }
}
