<?php

namespace App\Services\Builder;

/**
 * Evaluates the condition DSL used by questions.php, workflows.php and
 * summary.php (see the header of config/builder/questions.php).
 *
 * mode 'confirmed'  only what the owner said      (question gating, summary)
 * mode 'effective'  plus disclosed template facts  (composition)
 */
class Condition
{
    public function __construct(
        private FactStore $facts,
        private BuilderPolicy $policy,
        private ?string $typeKey = null,
        private string $mode = 'confirmed',
    ) {
    }

    public function test(mixed $cond): bool
    {
        if ($cond === null || $cond === [] || $cond === true) {
            return true;
        }
        if (is_string($cond)) {
            return $this->leaf($cond);
        }
        if (isset($cond['any'])) {
            foreach ($cond['any'] as $c) {
                if ($this->test($c)) {
                    return true;
                }
            }

            return false;
        }
        if (isset($cond['all'])) {
            foreach ($cond['all'] as $c) {
                if (! $this->test($c)) {
                    return false;
                }
            }

            return true;
        }
        if (array_key_exists('not', $cond)) {
            return ! $this->test($cond['not']);
        }

        // A bare list is treated as "all".
        foreach ($cond as $c) {
            if (! $this->test($c)) {
                return false;
            }
        }

        return true;
    }

    private function leaf(string $s): bool
    {
        $eff = $this->mode === 'effective';

        if (str_starts_with($s, '!')) {
            return ! $this->leaf(substr($s, 1));
        }
        if (str_starts_with($s, 'd.')) {
            return $this->facts->derived($s, $eff);
        }
        if ($s === 'no_type') {
            return $this->typeKey === null;
        }
        if (str_starts_with($s, 'sector:')) {
            $sector = $this->typeKey ? ($this->policy->typeHints[$this->typeKey]['sector'] ?? null) : null;

            return $sector === substr($s, 7);
        }
        if (str_starts_with($s, 'cap:')) {
            return (bool) ($this->policy->capabilities['flags'][substr($s, 4)] ?? false);
        }
        if (str_starts_with($s, 'unknown:')) {
            return ! $this->facts->known(substr($s, 8));
        }
        if (str_starts_with($s, 'neg:')) {
            return $this->facts->isNegative(substr($s, 4));
        }
        if (str_contains($s, '=')) {
            [$k, $v] = explode('=', $s, 2);
            $val = $eff ? $this->facts->effectiveValue($k) : $this->facts->value($k);

            return $val === $v;
        }

        return $eff ? $this->facts->effectiveTrue($s) : $this->facts->isTrue($s);
    }
}
