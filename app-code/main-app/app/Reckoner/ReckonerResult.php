<?php

namespace App\Reckoner;

/**
 * The envelope every reading returns — success or failure. See §3.3.
 *
 * Error codes: not_found, forbidden, plan_locked, not_applicable,
 * invalid_period, resolver_failed, timeout.
 */
final class ReckonerResult implements \JsonSerializable
{
    private function __construct(
        public readonly string $key,
        public readonly bool $ok,
        public readonly ?ReckonerShape $shape,
        public readonly ?string $unit,
        public readonly ?int $precision,
        public readonly ?array $period,
        public readonly ?string $label,
        public readonly ?string $help,
        public readonly ?string $direction,
        public readonly mixed $data,
        public readonly array $meta,
        public readonly ?array $drill,
        public readonly ?string $errorCode,
        public readonly ?string $errorMessage,
        public readonly ?string $id = null,
    ) {
    }

    public static function success(
        string $id,
        string $key,
        ReckonerShape $shape,
        array $definition,
        ReckonerPeriod $period,
        mixed $data,
        array $meta = [],
    ): self {
        return new self(
            key: $key,
            ok: true,
            shape: $shape,
            unit: $definition['unit'] ?? null,
            precision: $definition['precision'] ?? null,
            period: [
                'key' => $period->key,
                'label' => $period->label,
                'from' => $period->start->toDateString(),
                'to' => $period->end->toDateString(),
                'compare_label' => $period->compareLabel,
            ],
            label: ReckonerLabels::resolve($key, $definition, $data),
            help: $definition['help'] ?? null,
            direction: $definition['direction'] ?? 'neutral',
            data: $data,
            meta: array_merge(['cached' => false, 'computed_at' => now()->toIso8601String()], $meta),
            drill: isset($definition['drill_route'])
                ? ['route' => $definition['drill_route'], 'params' => [
                    'from' => $period->start->toDateString(),
                    'to' => $period->end->toDateString(),
                ]]
                : null,
            errorCode: null,
            errorMessage: null,
            id: $id,
        );
    }

    public static function failure(string $id, string $key, string $code, string $message): self
    {
        return new self(
            key: $key,
            ok: false,
            shape: null,
            unit: null,
            precision: null,
            period: null,
            label: null,
            help: null,
            direction: null,
            data: null,
            meta: [],
            drill: null,
            errorCode: $code,
            errorMessage: $message,
            id: $id,
        );
    }

    public function jsonSerialize(): array
    {
        if (! $this->ok) {
            return [
                'id' => $this->id,
                'key' => $this->key,
                'ok' => false,
                'error' => [
                    'code' => $this->errorCode,
                    'message' => $this->errorMessage,
                ],
            ];
        }

        return [
            'id' => $this->id,
            'key' => $this->key,
            'ok' => true,
            'shape' => $this->shape?->value,
            'unit' => $this->unit,
            'precision' => $this->precision,
            'period' => $this->period,
            'label' => $this->label,
            'help' => $this->help,
            'direction' => $this->direction,
            'data' => $this->data,
            'meta' => $this->meta,
            'drill' => $this->drill,
        ];
    }

    public function toArray(): array
    {
        return $this->jsonSerialize();
    }
}
