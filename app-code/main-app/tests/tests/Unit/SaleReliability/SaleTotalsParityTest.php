<?php

namespace Tests\Unit\SaleReliability;

use App\Exceptions\MoneyException;
use App\Services\Sales\SaleTotals;
use App\Support\Money;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Calculation contract v2 — the PHP runtime against the SAME hand-computed
 * fixtures as resources/js/tests/saleTotalsParity.test.js. Exact strings, no
 * tolerance. No Laravel boot, no database.
 */
final class SaleTotalsParityTest extends TestCase
{
    public static function cases(): array
    {
        $file = dirname(__DIR__, 4) . '/resources/js/tests/fixtures/sale-totals/cases.json';
        $json = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        $out = [];
        foreach ($json['cases'] as $c) {
            $out[$c['name']] = [$c];
        }
        return $out;
    }

    #[DataProvider('cases')]
    public function test_fixture(array $case): void
    {
        if (isset($case['error'])) {
            try {
                SaleTotals::calculate($case['input']);
                $this->fail('Expected MoneyException ' . $case['error']);
            } catch (MoneyException $e) {
                $this->assertSame($case['error'], $e->errorCode, $e->getMessage());
            }
            return;
        }
        $actual = SaleTotals::serialize(SaleTotals::calculate($case['input']));
        $this->assertMatches($actual, $case['expect'], $case['name']);
    }

    private function assertMatches(array $actual, array $expected, string $where): void
    {
        foreach ($expected as $k => $v) {
            if ($k === 'lines') {
                foreach ($v as $i => $line) {
                    $this->assertMatches($actual['lines'][$i], $line, "{$where}.lines[{$i}]");
                }
                continue;
            }
            $this->assertSame($v, $actual[$k], "{$where}.{$k}");
        }
    }

    public function test_seeded_carts_conserve_every_component(): void
    {
        mt_srand(20261008);
        for ($n = 0; $n < 3000; $n++) {
            $lines = [];
            for ($i = 0, $c = mt_rand(1, 6); $i < $c; $i++) {
                $lines[] = [
                    'unit_price' => number_format(mt_rand(0, 500000) / 100, 2, '.', ''),
                    'qty' => mt_rand(0, 9) < 3 ? number_format(mt_rand(1, 5000) / 1000, 3, '.', '') : (string) mt_rand(1, 9),
                    'tax_rate' => mt_rand(0, 4) === 0 ? (string) mt_rand(0, 25) : null,
                ];
            }
            $input = [
                'lines' => $lines,
                'bill_discount' => mt_rand(0, 1) ? ['type' => 'percentage', 'value' => (string) (mt_rand(0, 1000) / 10)] : ['type' => 'fixed', 'value' => '0'],
                'tax' => ['enabled' => (bool) mt_rand(0, 1), 'inclusive' => (bool) mt_rand(0, 1), 'default_rate' => (string) [0, 5, 10, 16, 17, 18][mt_rand(0, 5)]],
                'charges' => ['delivery' => mt_rand(0, 2) ? '0' : '120', 'tip' => mt_rand(0, 4) ? '0' : '50'],
                'bill_rounding' => ['apply' => (bool) mt_rand(0, 1), 'setting' => ['0', '1', '-1', 'none'][mt_rand(0, 3)]],
            ];
            $t = SaleTotals::calculate($input);
            $w = "cart {$n}: " . json_encode($input);
            $this->assertSame($t['bill_discount'], array_sum(array_column($t['lines'], 'bill_share')), $w);
            $this->assertSame($t['tax'], array_sum(array_column($t['lines'], 'tax')), $w);
            $this->assertSame($t['components'], $t['revenue'] + $t['tax'] + $t['charges'], $w);
            $this->assertSame($t['components'], $t['invoice'] - $t['round_off'], $w);
            foreach ($t['lines'] as $l) {
                $this->assertTrue($l['bill_share'] >= 0 && $l['bill_share'] <= $l['net'], $w);
                $this->assertTrue($l['tax'] >= 0 && $l['tax'] <= $l['base'], $w);
            }
        }
    }

    public function test_legacy_adapter_bounds_float_noise_and_strict_mode_refuses_it(): void
    {
        $this->assertSame(3000, Money::parseMinor(29.999999999999996, 'discount', false));
        $this->expectException(MoneyException::class);
        Money::parseMinor(29.999999999999996, 'discount', true);
    }

    public function test_money_parse_shapes(): void
    {
        $this->assertSame(50, Money::parseMinor('.5'));
        $this->assertSame(-125, Money::parseMinor('-1.245'));
        $this->assertSame(123, Money::parseMinor(1.23));
        $this->assertSame(100001, Money::parseMinor('1000.005'));
        $this->assertSame('-0.05', Money::toString(-5));
        $this->assertSame([1, 0, 0], Money::allocate(1, [100, 100, 100]));
        $this->assertSame([0, 1, 1], Money::allocate(2, [0, 5, 5]));
    }
}
