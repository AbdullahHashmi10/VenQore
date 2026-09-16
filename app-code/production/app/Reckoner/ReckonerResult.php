<?php

namespace App\Reckoner;

/**
 * The envelope every reading returns — success, an honest empty state, a
 * lock, or a fault.  Keeping these states separate is important: an empty
 * tenant is not a broken calculation and a disabled module is not missing
 * data.  The legacy `ok` flag remains for existing callers; new consumers
 * must render `status`.
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
        public readonly string $status = 'error',
        public readonly array $sources = [],
        public readonly array $checks = [],
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
        $status = ! empty($meta['stale']) ? 'stale' : (! empty($meta['empty']) ? 'empty' : 'ok');

        return new self(
            key: $key,
            // `ok` answers whether the calculation completed. An empty
            // period still completed; it must not be rendered as an error.
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
            status: $status,
            sources: array_values($definition['streams'] ?? [$definition['source'] ?? '']),
            checks: $meta['checks'] ?? [],
        );
    }

    public static function failure(string $id, string $key, string $code, string $message): self
    {
        $status = in_array($code, ['plan_locked', 'module_locked', 'not_applicable'], true)
            ? 'locked'
            : 'error';

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
            status: $status,
            sources: [],
            checks: [],
        );
    }

    /** A resolver ran successfully but found no records in the chosen period. */
    public static function empty(
        string $id,
        string $key,
        ReckonerShape $shape,
        array $definition,
        ReckonerPeriod $period,
        array $meta = [],
    ): self {
        return self::success($id, $key, $shape, $definition, $period, ['value' => null], [
            ...$meta,
            'empty' => true,
        ]);
    }

    public function jsonSerialize(): array
    {
        $data = is_array($this->data) ? $this->data : [];
        $value = $data['value'] ?? null;

        return [
            'id' => $this->id,
            'key' => $this->key,
            'ok' => $this->ok,
            'status' => $this->status,
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
            // Normalised envelope fields. `data` is retained during the
            // migration so established chart components keep working.
            'value' => $value,
            'delta' => isset($data['change_pct']) ? [
                'value' => $data['previous'] ?? null,
                'pct' => $data['change_pct'],
                'basis' => $data['compare_label'] ?? ($this->period['compare_label'] ?? ''),
            ] : null,
            'series' => $data['series'] ?? null,
            'segments' => $data['segments'] ?? $data['slices'] ?? null,
            'rows' => isset($data['rows']) || isset($data['items'])
                ? ['truncated' => (bool) ($data['truncated'] ?? false), 'items' => $data['rows'] ?? $data['items'] ?? []]
                : null,
            'asOf' => $this->meta['computed_at'] ?? null,
            'sources' => array_values(array_filter($this->sources)),
            'checks' => $this->checks,
            'error' => $this->errorCode === null ? null : [
                'code' => $this->errorCode,
                'message' => $this->errorMessage,
            ],
        ];
    }

    public function toArray(): array
    {
        return $this->jsonSerialize();
    }
}
