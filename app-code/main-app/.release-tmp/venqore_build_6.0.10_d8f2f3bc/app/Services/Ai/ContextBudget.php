<?php

namespace App\Services\Ai;

class ContextBudget
{
    protected string $feature;
    protected int $maxTokens = 3000;
    protected array $blocks = [];
    protected array $droppedBlocks = [];

    public function __construct(string $feature)
    {
        $this->feature = $feature;
        $this->maxTokens = (int) config("ai_models.{$feature}.context_budget", 3000);
    }

    public static function for(string $feature): self
    {
        return new self($feature);
    }

    public function maxTokens(int $tokens): self
    {
        $this->maxTokens = $tokens;
        return $this;
    }

    public function block(string $name, mixed $items, int $weight = 1, ?callable $format = null, bool $when = true): self
    {
        if (!$when || empty($items)) {
            return $this;
        }

        $formatted = [];
        if (is_iterable($items)) {
            foreach ($items as $item) {
                $formatted[] = $format ? $format($item) : $item;
            }
        } else {
            $formatted = $format ? $format($items) : $items;
        }

        $this->blocks[$name] = [
            'name'      => $name,
            'weight'    => $weight,
            'content'   => $formatted,
        ];

        return $this;
    }

    /**
     * Build the pruned context array fitting within token budget.
     * Drops blocks lowest weight first.
     */
    public function build(): array
    {
        $this->droppedBlocks = [];
        $activeBlocks = $this->blocks;

        // Check overall token estimate
        while (!empty($activeBlocks)) {
            $estimatedTokens = $this->estimateTokens($activeBlocks);
            if ($estimatedTokens <= $this->maxTokens) {
                break;
            }

            // Find block with lowest weight
            $lowestKey = null;
            $lowestWeight = PHP_INT_MAX;
            foreach ($activeBlocks as $key => $b) {
                if ($b['weight'] < $lowestWeight) {
                    $lowestWeight = $b['weight'];
                    $lowestKey = $key;
                }
            }

            if ($lowestKey !== null) {
                $this->droppedBlocks[] = $lowestKey;
                unset($activeBlocks[$lowestKey]);
            } else {
                break;
            }
        }

        $result = [];
        foreach ($activeBlocks as $key => $b) {
            $result[$key] = $b['content'];
        }

        return $result;
    }

    public function estimateTokens(mixed $data): int
    {
        $json = is_string($data) ? $data : json_encode($data);
        return (int) ceil(strlen((string) $json) / 3.8);
    }

    public function hadDrops(): bool
    {
        return !empty($this->droppedBlocks);
    }

    public function droppedBlocks(): array
    {
        return $this->droppedBlocks;
    }

    public function recommendedConfidence(): float
    {
        return $this->hadDrops() ? 0.85 : 1.0;
    }
}
