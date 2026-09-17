<?php

namespace App\Reckoner\Custom;

use App\Models\Tenant;
use App\Reckoner\Engine\Projections\BreakdownProjection;
use App\Reckoner\Engine\Projections\GaugeProjection;
use App\Reckoner\Engine\Projections\StatProjection;
use App\Reckoner\Engine\Projections\TrendProjection;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use App\Reckoner\Streams\LedgerStream;
use App\Reckoner\Streams\SalesHeadersStream;
use App\Reckoner\Streams\StockPositionsStream;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * CustomCardResolver: Resolves custom card specifications via MeasureEngine streams (§5.3, §8.3).
 *
 * Rules:
 * 1. Safe arithmetic evaluation only — no dynamic SQL or code execution.
 * 2. Strict tenant isolation on all queries.
 * 3. Division by zero guards return null.
 */
class CustomCardResolver
{
    protected LedgerStream $ledgerStream;
    protected SalesHeadersStream $salesStream;
    protected StockPositionsStream $stockStream;

    public function __construct(
        LedgerStream $ledgerStream,
        SalesHeadersStream $salesStream,
        StockPositionsStream $stockStream
    ) {
        $this->ledgerStream = $ledgerStream;
        $this->salesStream = $salesStream;
        $this->stockStream = $stockStream;
    }

    /**
     * Resolves a custom card based on its spec.
     */
    public function resolve(
        array $card,
        ReckonerPeriod $period,
        Tenant $tenant,
        array $args = [],
        ?string $requestId = null
    ): ReckonerResult {
        $spec = CustomCardValidator::validate($card['spec'] ?? []);
        $tenantId = (string) $tenant->id;
        $id = $requestId ?? ($card['id'] ?? 'custom_card');
        $key = $card['key'] ?? 'custom.card';

        $shapeName = strtolower($spec['shape'] ?? 'stat');
        $shape = ReckonerShape::fromCardShape($shapeName);

        $from = $period->start->toDateString();
        $to   = $period->end->toDateString();
        $compareFrom = $period->compareStart?->toDateString();
        $compareTo   = $period->compareEnd?->toDateString();

        $measureKey = $spec['measure'] ?? null;
        $formula    = $spec['formula'] ?? null;
        $dims       = (array) ($spec['dims'] ?? []);

        $measureData = [];
        $options = [];

        try {
            // Case 1: Single Measure
            if ($measureKey) {
                $measureData = $this->resolveSingleMeasure($measureKey, $from, $to, $dims, $tenantId, $shapeName);

                // Comparison support
                if (!empty($spec['compare']) && $compareFrom && $compareTo) {
                    $cmpData = $this->resolveSingleMeasure($measureKey, $compareFrom, $compareTo, $dims, $tenantId, 'stat');
                    $options['compare_value'] = $cmpData['value'] ?? null;
                }
            }
            // Case 2: Derived Formula
            elseif ($formula) {
                $measureData = $this->resolveFormula($formula, $from, $to, $dims, $tenantId, $shapeName);

                if (!empty($spec['compare']) && $compareFrom && $compareTo) {
                    $cmpData = $this->resolveFormula($formula, $compareFrom, $compareTo, $dims, $tenantId, 'stat');
                    $options['compare_value'] = $cmpData['value'] ?? null;
                }
            }

            // Project shape
            $projection = match ($shapeName) {
                'stat', 'scalar' => new StatProjection(),
                'trend', 'series' => new TrendProjection(),
                'breakdown' => new BreakdownProjection(),
                'gauge' => new GaugeProjection(),
                default => new StatProjection(),
            };

            $projected = $projection->project($measureData, $card, $period, $options);

            $meta = array_merge($projected['meta'] ?? [], [
                'custom'       => true,
                'freshness'    => 'live',
                'ttl'          => 60,
                'data_version' => (int) ($tenant->reckoner_data_version ?? 0),
            ]);

            return ReckonerResult::success(
                id: $id,
                key: $key,
                shape: $shape,
                definition: $card,
                period: $period,
                data: $projected['data'],
                meta: $meta
            );
        } catch (Throwable $e) {
            report($e);
            return ReckonerResult::failure(
                id: $id,
                key: $key,
                code: 'custom_resolve_failed',
                message: $e->getMessage()
            );
        }
    }

    /**
     * Resolves a single measure for a period.
     */
    protected function resolveSingleMeasure(
        string $measure,
        string $from,
        string $to,
        array $dims,
        string $tenantId,
        string $shape
    ): array {
        // Dimension breakdown: e.g. Revenue by payment method
        if ($shape === 'breakdown' && !empty($dims)) {
            $dim = $dims[0];
            return $this->resolveBreakdown($measure, $dim, $from, $to, $tenantId);
        }

        // Trend series: monthly or daily
        if ($shape === 'trend' || $shape === 'series') {
            return $this->resolveTrend($measure, $from, $to, $tenantId);
        }

        // Stat value
        $val = $this->fetchMeasureValue($measure, $from, $to, $tenantId);
        return ['value' => $val];
    }

    /**
     * Fetch scalar value of a measure.
     */
    protected function fetchMeasureValue(string $measure, string $from, string $to, string $tenantId): float
    {
        if (str_starts_with($measure, 'gl.')) {
            $flows = $this->ledgerStream->flows([$measure], ['w' => ['from' => $from, 'to' => $to]], [], $tenantId);
            return (float) ($flows['w'][$measure] ?? 0.0);
        }

        if (str_starts_with($measure, 'sales.')) {
            if ($measure === 'sales.net_revenue' || $measure === 'sales.revenue') {
                $pos = $this->salesStream->posSummary($from, $to, $tenantId);
                $inv = $this->salesStream->invoiceSummary($from, $to, $tenantId);
                return (float) ($pos['revenue'] + $inv['revenue']);
            }
            if ($measure === 'sales.gross_revenue') {
                return (float) DB::table('sales')
                    ->where('tenant_id', $tenantId)
                    ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                    ->whereIn('status', ['posted', 'completed', 'active'])
                    ->whereNull('deleted_at')
                    ->whereNull('original_sale_id')
                    ->sum('subtotal');
            }
        }

        if (str_starts_with($measure, 'stock.')) {
            if ($measure === 'stock.total_value') {
                return (float) $this->stockStream->stockValuation($to, $tenantId);
            }
            if ($measure === 'stock.units_on_hand') {
                return (float) $this->stockStream->unitsOnHand($to, $tenantId);
            }
        }

        return 0.0;
    }

    /**
     * Resolves breakdown segments for a dimension.
     */
    protected function resolveBreakdown(string $measure, string $dim, string $from, string $to, string $tenantId): array
    {
        // Example: Revenue by payment method
        if ($dim === 'payment_method') {
            $rows = DB::table('sales')
                ->where('tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(posted_at, created_at))'), [$from, $to])
                ->whereIn('status', ['posted', 'completed', 'active'])
                ->whereNull('deleted_at')
                ->whereNull('original_sale_id')
                ->select(
                    DB::raw('COALESCE(payment_method, "cash") as method'),
                    DB::raw('SUM(net_sales) as total')
                )
                ->groupBy('method')
                ->get();

            $segments = [];
            $total = 0.0;
            foreach ($rows as $r) {
                $val = round((float) $r->total, 2);
                $segments[ucfirst($r->method)] = $val;
                $total += $val;
            }

            return [
                'segments' => $segments,
                'total'    => round($total, 2),
            ];
        }

        // Example: Breakdown by location / warehouse
        if ($dim === 'location' || $dim === 'warehouse') {
            $rows = DB::table('sales as s')
                ->leftJoin('warehouses as w', 's.warehouse_id', '=', 'w.id')
                ->where('s.tenant_id', $tenantId)
                ->whereBetween(DB::raw('DATE(COALESCE(s.posted_at, s.created_at))'), [$from, $to])
                ->whereIn('s.status', ['posted', 'completed', 'active'])
                ->whereNull('s.deleted_at')
                ->whereNull('s.original_sale_id')
                ->select(
                    DB::raw('COALESCE(w.name, "Main Store") as loc_name'),
                    DB::raw('SUM(s.net_sales) as total')
                )
                ->groupBy('loc_name')
                ->get();

            $segments = [];
            $total = 0.0;
            foreach ($rows as $r) {
                $val = round((float) $r->total, 2);
                $segments[$r->loc_name] = $val;
                $total += $val;
            }

            return [
                'segments' => $segments,
                'total'    => round($total, 2),
            ];
        }

        return ['segments' => [], 'total' => 0.0];
    }

    /**
     * Resolves a trend series.
     */
    protected function resolveTrend(string $measure, string $from, string $to, string $tenantId): array
    {
        $points = [];
        $period = CarbonPeriod::create($from, $to);

        foreach ($period as $dt) {
            $d = $dt->toDateString();
            $val = $this->fetchMeasureValue($measure, $d, $d, $tenantId);
            $points[] = ['t' => $d, 'v' => $val];
        }

        return ['points' => $points];
    }

    /**
     * Evaluates a safe derived formula: e.g. (gl.sales_revenue - gl.cogs) / gl.sales_revenue * 100
     */
    protected function resolveFormula(
        string $formula,
        string $from,
        string $to,
        array $dims,
        string $tenantId,
        string $shape
    ): array {
        // Extract measure tokens
        preg_match_all('/[a-zA-Z][a-zA-Z0-9_\.]*/', $formula, $matches);
        $tokens = array_unique($matches[0] ?? []);

        $resolvedValues = [];
        foreach ($tokens as $token) {
            $resolvedValues[$token] = $this->fetchMeasureValue($token, $from, $to, $tenantId);
        }

        // Evaluate formula expression with token values replaced
        $evalExpr = $formula;
        foreach ($resolvedValues as $token => $val) {
            $evalExpr = str_replace($token, (string) $val, $evalExpr);
        }

        // Division by zero guard: check for / 0 or / 0.0
        if (preg_match('/\/\s*0(\.0+)?(\s|$|\))/', $evalExpr)) {
            return ['value' => null, 'numerator' => null, 'denominator' => 0.0];
        }

        $calculated = self::evaluateMathExpression($evalExpr);

        return ['value' => $calculated !== null ? round((float) $calculated, 2) : null];
    }

    /**
     * Safely evaluates an arithmetic expression without dynamic code execution.
     * Implements Dijkstra's Shunting-yard algorithm for infix-to-postfix conversion
     * followed by RPN stack evaluation.
     *
     * Supported operators: +, -, *, /, unary -, parentheses, integer and decimal floats.
     * Returns null on syntax error, unknown tokens, or division by zero.
     */
    public static function evaluateMathExpression(string $expr): ?float
    {
        // 1. Tokenize
        $tokens = [];
        $length = strlen($expr);
        $i = 0;

        while ($i < $length) {
            $char = $expr[$i];

            if (ctype_space($char)) {
                $i++;
                continue;
            }

            if (is_numeric($char) || $char === '.') {
                $numStr = '';
                while ($i < $length && (is_numeric($expr[$i]) || $expr[$i] === '.')) {
                    $numStr .= $expr[$i];
                    $i++;
                }
                if (!is_numeric($numStr)) {
                    return null;
                }
                $tokens[] = ['type' => 'number', 'val' => (float) $numStr];
                continue;
            }

            if (in_array($char, ['+', '-', '*', '/', '(', ')'], true)) {
                $tokens[] = ['type' => 'op', 'val' => $char];
                $i++;
                continue;
            }

            // Strictly reject any other character (no letters, dollar signs, quotes, etc.)
            return null;
        }

        if (empty($tokens)) {
            return null;
        }

        // 2. Shunting-yard: convert infix tokens to RPN
        $output = [];
        $ops = [];
        $precedence = ['+' => 1, '-' => 1, '*' => 2, '/' => 2, 'u-' => 3];
        $prevType = 'start';

        foreach ($tokens as $token) {
            if ($token['type'] === 'number') {
                $output[] = $token;
                $prevType = 'number';
            } elseif ($token['type'] === 'op') {
                $op = $token['val'];

                // Unary minus detection
                if ($op === '-' && in_array($prevType, ['start', 'op', 'lparen'], true)) {
                    $op = 'u-';
                }

                if ($op === '(') {
                    $ops[] = '(';
                    $prevType = 'lparen';
                } elseif ($op === ')') {
                    while (!empty($ops) && end($ops) !== '(') {
                        $output[] = ['type' => 'op', 'val' => array_pop($ops)];
                    }
                    if (empty($ops) || end($ops) !== '(') {
                        return null; // Mismatched parentheses
                    }
                    array_pop($ops); // Discard '('
                    $prevType = 'rparen';
                } else {
                    $prec = $precedence[$op] ?? 0;
                    while (!empty($ops)) {
                        $top = end($ops);
                        if ($top === '(') {
                            break;
                        }
                        $topPrec = $precedence[$top] ?? 0;
                        if ($topPrec >= $prec) {
                            $output[] = ['type' => 'op', 'val' => array_pop($ops)];
                        } else {
                            break;
                        }
                    }
                    $ops[] = $op;
                    $prevType = 'op';
                }
            }
        }

        while (!empty($ops)) {
            $top = array_pop($ops);
            if ($top === '(' || $top === ')') {
                return null; // Mismatched parentheses
            }
            $output[] = ['type' => 'op', 'val' => $top];
        }

        // 3. Evaluate RPN stack
        $stack = [];
        foreach ($output as $t) {
            if ($t['type'] === 'number') {
                $stack[] = $t['val'];
            } elseif ($t['type'] === 'op') {
                $op = $t['val'];
                if ($op === 'u-') {
                    if (empty($stack)) {
                        return null;
                    }
                    $a = array_pop($stack);
                    $stack[] = -$a;
                    continue;
                }

                if (count($stack) < 2) {
                    return null;
                }
                $b = array_pop($stack);
                $a = array_pop($stack);

                $res = match ($op) {
                    '+' => $a + $b,
                    '-' => $a - $b,
                    '*' => $a * $b,
                    '/' => abs($b) < 1e-12 ? null : ($a / $b),
                    default => null,
                };

                if ($res === null || is_nan($res) || is_infinite($res)) {
                    return null;
                }
                $stack[] = $res;
            }
        }

        return count($stack) === 1 ? (float) $stack[0] : null;
    }
}
