<?php

namespace App\Support;

use App\Exceptions\MoneyException;
use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Brick\Math\RoundingMode;

/**
 * Exact money arithmetic for the sale calculation contract (v2).
 *
 * Inputs are parsed into exact decimals (brick/math, already locked in
 * composer.lock via laravel/framework) and become integer MINOR units (paisa)
 * exactly once, half-up — the same rule as PHP round() and the JS twin
 * resources/js/Sell/core/money.js. No binary float decides a posted amount.
 */
final class Money
{
    public const SCALE = 2;
    public const MAX_INPUT_SCALE = 6;
    public const MAX_ABS_MINOR = 1_000_000_000_000_000; // 10^15

    /**
     * Parse a request value into an exact decimal.
     *
     * Strict (contract v2 payloads): refuses non-finite, exponent, thousands
     * separators and more than six decimals. Legacy (payloads without a
     * calculation_version): a float is first bounded to six decimals, because
     * old tills sent values like 29.999999999999996 — the adapter is explicit
     * and bounded, never a silent tolerance on the posted total.
     */
    public static function parse(mixed $value, string $label = 'amount', bool $strict = true): BigDecimal
    {
        if ($value === null || $value === '') {
            return BigDecimal::zero();
        }
        if (is_bool($value) || is_array($value) || is_object($value)) {
            throw new MoneyException("{$label} is not a number");
        }
        if (is_int($value)) {
            return BigDecimal::of($value);
        }
        if (is_float($value)) {
            if (!is_finite($value)) {
                throw new MoneyException("{$label} is not a finite number");
            }
            $str = var_export($value, true); // shortest round-trip form
            if (!$strict || str_contains(strtolower($str), 'e')) {
                $str = number_format($value, self::MAX_INPUT_SCALE, '.', '');
                if (!$strict) {
                    $str = rtrim(rtrim($str, '0'), '.');
                } elseif ((float) $str !== $value) {
                    throw new MoneyException("{$label} has too many decimal places");
                }
            }
        } else {
            $str = trim((string) $value);
        }

        if (!preg_match('/^[+-]?(\d+(\.\d*)?|\.\d+)$/', $str)) {
            throw new MoneyException("{$label} is not a plain decimal: \"{$str}\"");
        }
        $neg = $str[0] === '-';
        $body = ltrim($str, '+-');
        if (str_contains($body, '.')) {
            $body = rtrim(rtrim($body, '0'), '.');
        }
        if ($body === '' || $body[0] === '.') {
            $body = '0' . $body;
        }
        $dec = BigDecimal::of(($neg ? '-' : '') . $body);
        if ($dec->getScale() > self::MAX_INPUT_SCALE) {
            if ($strict) {
                throw new MoneyException("{$label} has more than " . self::MAX_INPUT_SCALE . ' decimal places');
            }
            $dec = $dec->toScale(self::MAX_INPUT_SCALE, RoundingMode::HALF_UP);
        }
        return $dec;
    }

    /** Exact decimal → integer minor units, half-up, once. */
    public static function toMinor(BigDecimal $d): int
    {
        $m = $d->toScale(self::SCALE, RoundingMode::HALF_UP)->getUnscaledValue();
        if ($m->abs()->isGreaterThan(self::MAX_ABS_MINOR)) {
            throw new MoneyException('amount is too large', 'overflow');
        }
        return $m->toInt();
    }

    public static function parseMinor(mixed $value, string $label = 'amount', bool $strict = true): int
    {
        return self::toMinor(self::parse($value, $label, $strict));
    }

    /** p / q rounded half away from zero (integers). */
    public static function divRound(BigInteger|int $p, BigInteger|int $q): int
    {
        $r = BigDecimal::of($p)->dividedBy(BigDecimal::of($q), 0, RoundingMode::HALF_UP)->toBigInteger();
        if ($r->abs()->isGreaterThan(self::MAX_ABS_MINOR)) {
            throw new MoneyException('amount is too large', 'overflow');
        }
        return $r->toInt();
    }

    /** "1234.50" for 123450 — what is written to DECIMAL columns and JSON. */
    public static function toString(int $minor): string
    {
        $neg = $minor < 0;
        $s = str_pad((string) abs($minor), 3, '0', STR_PAD_LEFT);
        return ($neg ? '-' : '') . substr($s, 0, -2) . '.' . substr($s, -2);
    }

    /** Minor units as a float for legacy callers that need one (exact for 2dp in range). */
    public static function toFloat(int $minor): float
    {
        return (float) self::toString($minor);
    }

    /**
     * Split $total over $weights (non-negative ints) by largest remainder.
     * Shares sum to $total; ties go to the earlier index; zero weights get 0.
     *
     * @param int[] $weights
     * @return int[]
     */
    public static function allocate(int $total, array $weights): array
    {
        $sum = array_sum($weights);
        if ($total === 0 || $sum === 0) {
            return array_map(fn () => 0, $weights);
        }
        if ($total < 0) {
            throw new MoneyException('cannot allocate a negative amount');
        }
        $T = BigInteger::of($total);
        $S = BigInteger::of($sum);
        $shares = [];
        $rems = [];
        foreach (array_values($weights) as $i => $w) {
            $prod = $T->multipliedBy($w);
            $shares[$i] = $prod->quotient($S)->toInt();
            $rems[$i] = $prod->remainder($S);
        }
        $left = $total - array_sum($shares);
        $order = array_keys($shares);
        usort($order, function ($a, $b) use ($rems) {
            $c = $rems[$b]->compareTo($rems[$a]);
            return $c !== 0 ? $c : $a <=> $b;
        });
        $weights = array_values($weights);
        for ($k = 0; $left > 0; $k = ($k + 1) % count($order)) {
            if ($weights[$order[$k]] === 0) {
                continue;
            }
            $shares[$order[$k]]++;
            $left--;
        }
        return $shares;
    }

    /** Bill-rounding increment in minor units for the round_off_total setting. */
    public static function billIncrementMinor(mixed $setting): int
    {
        if ($setting === null || $setting === '' || $setting === 'none' || $setting === false) {
            return 1;
        }
        if ($setting === '1' || $setting === '0' || $setting === true || $setting === 1 || $setting === 0) {
            return 100;
        }
        if (!is_numeric($setting)) {
            return 1;
        }
        $k = (int) $setting;
        if ($k >= self::SCALE) {
            return 1;
        }
        return 10 ** (self::SCALE - $k);
    }

    public static function roundToIncrement(int $minor, int $inc): int
    {
        return $inc <= 1 ? $minor : self::divRound($minor, $inc) * $inc;
    }
}
