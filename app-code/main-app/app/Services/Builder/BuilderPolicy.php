<?php

namespace App\Services\Builder;

/**
 * Read-only bundle of every policy table the builder engine uses
 * (config/builder/*.php + config/modules.php + config/business_types.php).
 *
 * Services take a BuilderPolicy instead of calling config() themselves, so the
 * whole engine runs in a plain PHP test with no framework booted:
 *   BuilderPolicy::fromArrays([...]).
 */
class BuilderPolicy
{
    /** Bump when a table changes meaning; carried on every API response (§10). */
    public const VERSION = '2026-10-14.1';

    public function __construct(
        public readonly array $facts,
        public readonly array $questions,
        public readonly array $workflows,
        public readonly array $modulePolicy,
        public readonly array $typeHints,
        public readonly array $summary,
        public readonly array $capabilities,
        public readonly array $modules,
    ) {
    }

    public static function fromConfig(): self
    {
        return new self(
            (array) config('builder.facts'),
            (array) config('builder.questions'),
            (array) config('builder.workflows'),
            (array) config('builder.module_policy'),
            (array) config('builder.type_hints'),
            (array) config('builder.summary'),
            (array) config('builder.capabilities'),
            (array) config('modules'),
        );
    }

    /** For tests: load the same files straight from disk. */
    public static function fromDirectory(string $configDir): self
    {
        $r = fn (string $f) => require $configDir . '/' . $f . '.php';

        return new self(
            $r('builder/facts'), $r('builder/questions'), $r('builder/workflows'),
            $r('builder/module_policy'), $r('builder/type_hints'), $r('builder/summary'),
            $r('builder/capabilities'), $r('modules'),
        );
    }

    public function panels(): array
    {
        return (array) ($this->questions['questions'] ?? []);
    }

    public function panel(string $id): ?array
    {
        return $this->panels()[$id] ?? null;
    }

    /** A fact key is valid when it is in the schema or in a dynamic family. */
    public function validFact(string $key): bool
    {
        if (isset($this->facts['facts'][$key])) {
            return true;
        }
        foreach ((array) ($this->facts['dynamic_prefixes'] ?? []) as $p) {
            if (str_starts_with($key, $p) && strlen($key) > strlen($p)) {
                return true;
            }
        }

        return false;
    }

    public function factType(string $key): string
    {
        return $this->facts['facts'][$key]['type'] ?? (str_starts_with($key, 'gap.') ? 'string' : 'bool');
    }

    public function moduleLabel(string $key): string
    {
        return (string) ($this->modules[$key]['label'] ?? $key);
    }
}
