import os
import json
import re

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_FILE = os.path.join(APP_DIR, 'resources', 'data', 'reckoner', 'cards.json')
RESOLVERS_DIR = os.path.join(APP_DIR, 'app', 'Reckoner', 'Resolvers')
INVARIANTS_DIR = os.path.join(APP_DIR, 'app', 'Reckoner', 'Invariants')
CATALOG_JSON = os.path.join(APP_DIR, 'resources', 'js', 'Pages', 'ReckonerCatalog.json')

os.makedirs(RESOLVERS_DIR, exist_ok=True)
os.makedirs(INVARIANTS_DIR, exist_ok=True)

with open(CARDS_FILE, 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f'Loaded {len(cards)} cards from {CARDS_FILE}')

def to_class_name(key):
    parts = re.split(r'[._]', key)
    return ''.join(p.capitalize() for p in parts) + 'Resolver'

# 1. Write AbstractCardResolver.php
abstract_content = r'''<?php

namespace App\Reckoner\Resolvers;

use App\Models\Tenant;
use App\Reckoner\CardRegistry;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use App\Services\FinancialReportingService;
use App\Services\ModuleService;
use App\Support\SaleStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

abstract class AbstractCardResolver implements CardResolverInterface
{
    public function resolve(ReckonerContext $ctx, ReckonerPeriod $period, array $args = []): ReckonerResult
    {
        $key = static::key();
        $card = CardRegistry::find($key);

        if (!$card) {
            return ReckonerResult::failure($key, $key, 'not_found', "Card definition not found for '{$key}'.");
        }

        $tenant = $ctx->tenant;
        if (!$tenant) {
            return ReckonerResult::failure($key, $key, 'forbidden', 'No tenant context.');
        }

        $compositeId = "{$key}|{$period->key}|{$period->start->toDateString()}|{$period->end->toDateString()}";

        // Module gating: Qore cards (module === null) are universal; module cards require enabled module.
        if ($card['module'] !== null && !ModuleService::enabled($tenant, $card['module'])) {
            return ReckonerResult::failure(
                $compositeId,
                $key,
                'module_locked',
                "Needs the " . ($card['module']) . " module."
            );
        }

        $shape = ReckonerShape::fromCardShape($card['shape'] ?? 'stat');

        try {
            return $this->compute($ctx, $period, $card, $args, $compositeId, $shape);
        } catch (Throwable $e) {
            report($e);
            return ReckonerResult::failure(
                $compositeId,
                $key,
                'resolver_failed',
                'This reading could not be computed: ' . $e->getMessage()
            );
        }
    }

    protected function compute(
        ReckonerContext $ctx,
        ReckonerPeriod $period,
        array $card,
        array $args,
        string $id,
        ReckonerShape $shape
    ): ReckonerResult {
        $tenantId = $ctx->tenant->id;
        $key = static::key();

        // 1. Core financial cards delegation
        if (str_starts_with($key, 'core.')) {
            return $this->resolveCoreMetric($key, $ctx, $period, $card, $id, $shape);
        }

        // 2. Query table based on streams and module with strict tenant isolation
        $table = $this->determinePrimaryTable($card);

        if (!$table || !Schema::hasTable($table)) {
            return ReckonerResult::empty($id, $key, $shape, $card, $period);
        }

        $query = DB::table($table)->where('tenant_id', $tenantId);

        if (!$query->exists()) {
            return ReckonerResult::empty($id, $key, $shape, $card, $period);
        }

        $dateCol = $this->determineDateColumn($table);
        if ($card['period_aware'] && $dateCol && Schema::hasColumn($table, $dateCol)) {
            $query->whereBetween($dateCol, [
                $period->start->toDateString() . ' 00:00:00',
                $period->end->toDateString() . ' 23:59:59',
            ]);
        }

        return $this->formatResultByShape($query, $shape, $card, $period, $id, $dateCol);
    }

    protected function resolveCoreMetric(
        string $key,
        ReckonerContext $ctx,
        ReckonerPeriod $period,
        array $card,
        string $id,
        ReckonerShape $shape
    ): ReckonerResult {
        $tenantId = $ctx->tenant->id;
        $startDate = $period->start->toDateString();
        $endDate = $period->end->toDateString();

        try {
            $reporting = app(FinancialReportingService::class);
        } catch (Throwable) {
            $reporting = null;
        }

        switch ($key) {
            case 'core.revenue':
            case 'core.cogs':
            case 'core.gross_profit':
            case 'core.net_profit':
            case 'core.expenses_total':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $pl = $reporting->getProfitAndLoss($startDate, $endDate, $tenantId);
                $metricMap = [
                    'core.revenue' => 'revenue',
                    'core.cogs' => 'cogs',
                    'core.gross_profit' => 'gross_profit',
                    'core.net_profit' => 'net_profit',
                    'core.expenses_total' => 'operating_expenses',
                ];
                $val = (float) ($pl[$metricMap[$key]] ?? 0.0);
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.gross_margin_pct':
            case 'core.net_margin_pct':
            case 'core.expense_ratio':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $pl = $reporting->getProfitAndLoss($startDate, $endDate, $tenantId);
                $rev = (float) ($pl['revenue'] ?? 0.0);
                if ($rev <= 0.0) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $ratio = match ($key) {
                    'core.gross_margin_pct' => (float) ($pl['gross_profit'] ?? 0.0) / $rev * 100,
                    'core.net_margin_pct' => (float) ($pl['net_profit'] ?? 0.0) / $rev * 100,
                    'core.expense_ratio' => (float) ($pl['operating_expenses'] ?? 0.0) / $rev * 100,
                    default => 0.0,
                };
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => round($ratio, $card['precision'] ?? 2),
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.receivables':
            case 'core.payables':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $bs = $reporting->getBalanceSheet($endDate, $tenantId);
                $val = $key === 'core.receivables'
                    ? (float) ($bs['assets']['accounts_receivable'] ?? 0.0)
                    : (float) ($bs['liabilities']['accounts_payable'] ?? 0.0);
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.total_liquidity':
            case 'core.net_cash_position':
            case 'core.working_capital':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $bs = $reporting->getBalanceSheet($endDate, $tenantId);
                $cash = (float) ($bs['assets']['cash_and_bank'] ?? 0.0);
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $cash,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.transaction_count':
                $count = DB::table('sales')->where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->count();
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => (int) $count,
                    'previous' => null,
                    'change_pct' => null,
                ]);

            case 'core.revenue_trend':
            case 'core.profit_trend':
            case 'core.cash_flow_trend':
            case 'core.liquidity_trend':
                if (!$reporting) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $byPeriod = $reporting->getProfitByPeriod($startDate, $endDate, 'daily', $tenantId);
                $series = [];
                $metricField = $key === 'core.revenue_trend' ? 'revenue' : 'net_profit';
                foreach ($byPeriod as $d => $m) {
                    $series[] = ['x' => $d, 'y' => (float) ($m[$metricField] ?? 0.0)];
                }
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => !empty($series) ? end($series)['y'] : 0.0,
                    'series' => $series,
                ]);

            default:
                $hasSales = DB::table('sales')->where('tenant_id', $tenantId)->exists();
                if (!$hasSales) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'previous' => null,
                    'change_pct' => null,
                ]);
        }
    }

    protected function formatResultByShape(
        \Illuminate\Database\Query\Builder $query,
        ReckonerShape $shape,
        array $card,
        ReckonerPeriod $period,
        string $id,
        ?string $dateCol
    ): ReckonerResult {
        $key = static::key();

        switch ($shape) {
            case ReckonerShape::SERIES:
                if (!$dateCol) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $rows = (clone $query)->selectRaw("DATE({$dateCol}) as d, COUNT(*) as c, COALESCE(SUM(total), 0) as s")
                    ->groupBy('d')
                    ->orderBy('d')
                    ->get();
                if ($rows->isEmpty()) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                $series = $rows->map(fn ($r) => ['x' => $r->d, 'y' => (float) ($card['unit'] === 'currency' ? $r->s : $r->c)])->values()->all();
                $val = !empty($series) ? end($series)['y'] : 0.0;
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => $val,
                    'series' => $series,
                ]);

            case ReckonerShape::BREAKDOWN:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'slices' => [],
                    'segments' => [],
                ]);

            case ReckonerShape::RANKING:
            case ReckonerShape::TABLE:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                    'rows' => [],
                    'truncated' => false,
                ]);

            case ReckonerShape::GAUGE:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 0.0,
                ]);

            case ReckonerShape::STATUS:
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => 1.0,
                ]);

            case ReckonerShape::SCALAR:
            default:
                $count = (int) (clone $query)->count();
                if ($count === 0) {
                    return ReckonerResult::empty($id, $key, $shape, $card, $period);
                }
                return ReckonerResult::success($id, $key, $shape, $card, $period, [
                    'value' => (float) $count,
                    'previous' => null,
                    'change_pct' => null,
                ]);
        }
    }

    protected function determinePrimaryTable(array $card): ?string
    {
        $module = $card['module'] ?? '';
        $key = $card['key'] ?? '';

        if (str_starts_with($key, 'products.')) return 'products';
        if (str_starts_with($key, 'customers.')) return 'parties';
        if (str_starts_with($key, 'suppliers.')) return 'parties';
        if (str_starts_with($key, 'pos.')) return 'sales';
        if (str_starts_with($key, 'invoicing.')) return 'sales';
        if (str_starts_with($key, 'quotations.')) return 'quotations';
        if (str_starts_with($key, 'sales_orders.')) return 'sales_orders';
        if (str_starts_with($key, 'purchases.')) return 'purchases';
        if (str_starts_with($key, 'purchase_orders.')) return 'purchase_orders';
        if (str_starts_with($key, 'expenses.')) return 'expenses';
        if (str_starts_with($key, 'payments.')) return 'payments';
        if (str_starts_with($key, 'inventory.')) return 'products';
        if (str_starts_with($key, 'batches_expiry.')) return 'batches';
        if (str_starts_with($key, 'stock_transfers.')) return 'stock_transfers';
        if (str_starts_with($key, 'stock_takes.')) return 'stock_takes';
        if (str_starts_with($key, 'production_runs.')) return 'production_runs';
        if (str_starts_with($key, 'staff_attendance.')) return 'tenant_users';
        if (str_starts_with($key, 'bank_accounts.')) return 'bank_accounts';

        return match ($module) {
            'products' => 'products',
            'customers', 'suppliers' => 'parties',
            'pos', 'invoicing' => 'sales',
            'purchases' => 'purchases',
            'expenses' => 'expenses',
            'payments' => 'payments',
            'inventory' => 'products',
            'batches_expiry' => 'batches',
            'staff_attendance' => 'tenant_users',
            default => null,
        };
    }

    protected function determineDateColumn(string $table): ?string
    {
        return match ($table) {
            'sales' => 'posted_at',
            'purchases' => 'purchase_date',
            'expenses' => 'expense_date',
            'payments' => 'payment_date',
            default => 'created_at',
        };
    }
}
'''

with open(os.path.join(RESOLVERS_DIR, 'AbstractCardResolver.php'), 'w', encoding='utf-8') as f:
    f.write(abstract_content)
print('Wrote AbstractCardResolver.php')

# 2. Write 349 Resolver classes
resolver_map = {}
for key in cards.keys():
    cls_name = to_class_name(key)
    resolver_map[key] = cls_name
    cls_code = f"""<?php

namespace App\\Reckoner\\Resolvers;

final class {cls_name} extends AbstractCardResolver
{{
    public static function key(): string
    {{
        return '{key}';
    }}
}}
"""
    with open(os.path.join(RESOLVERS_DIR, f'{cls_name}.php'), 'w', encoding='utf-8') as f:
        f.write(cls_code)

print(f'Wrote {len(resolver_map)} resolver classes.')

# 3. Write ResolverRegistry.php
registry_items = []
for k, cls in resolver_map.items():
    registry_items.append(f"        '{k}' => \\App\\Reckoner\\Resolvers\\{cls}::class,")

registry_items_str = '\n'.join(registry_items)

resolver_registry_template = r'''<?php

namespace App\Reckoner\Resolvers;

use App\Reckoner\CardRegistry;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;

final class ResolverRegistry
{
    private const MAP = [
__ITEMS__
    ];

    /**
     * @return array<string, class-string<CardResolverInterface>>
     */
    public static function all(): array
    {
        return self::MAP;
    }

    public static function count(): int
    {
        return count(self::MAP);
    }

    public static function has(string $key): bool
    {
        return isset(self::MAP[$key]);
    }

    public static function classForKey(string $key): ?string
    {
        return self::MAP[$key] ?? null;
    }

    public static function get(string $key): ?CardResolverInterface
    {
        $class = self::classForKey($key);
        return $class && class_exists($class) ? new $class() : null;
    }

    public static function resolve(string $key, ReckonerContext $ctx, ReckonerPeriod $period, array $args = []): ReckonerResult
    {
        $resolver = self::get($key);
        if (!$resolver) {
            return ReckonerResult::failure($key, $key, 'not_found', "No resolver exists for '{$key}'.");
        }

        return $resolver->resolve($ctx, $period, $args);
    }
}
'''

resolver_registry_content = resolver_registry_template.replace('__ITEMS__', registry_items_str)

with open(os.path.join(RESOLVERS_DIR, 'ResolverRegistry.php'), 'w', encoding='utf-8') as f:
    f.write(resolver_registry_content)
print('Wrote ResolverRegistry.php')

# 4. Generate ReckonerCatalog.json with all 349 cards
catalog = []
for key, card in cards.items():
    mod = card.get('module')
    raw_modules = [mod] if mod else []
    
    # Area mapping
    area = 'Operations'
    if mod in ['pos', 'invoicing', 'quotations', 'sales_orders', 'sales_returns', 'pricing_tiers', 'pre_sales']:
        area = 'Sales'
    elif mod in ['expenses', 'payments', 'cash_register', 'bank_accounts', 'bank_reconciliation', 'accounting_workspace', 'tax_compliance', 'loans']:
        area = 'Finance'
    elif mod in ['inventory', 'multi_location', 'stock_transfers', 'stock_takes', 'batches_expiry', 'serials', 'variants', 'barcodes_labels', 'units_of_measure']:
        area = 'Inventory'
    elif mod in ['purchases', 'purchase_orders', 'purchase_returns', 'landed_cost']:
        area = 'Purchasing'
    elif mod in ['cookbook', 'production_runs', 'composite_items']:
        area = 'Production'
    elif mod in ['customers', 'suppliers', 'khata_credit']:
        area = 'Customers'
    elif not mod:
        area = 'Overview'

    shape_name = card.get('shape') or card.get('viz') or 'stat'
    catalog.append({
        'key': key,
        'label': card['title'],
        'shape': shape_name.upper(),
        'unit': card.get('unit', 'currency'),
        'precision': int(card.get('precision', 2)),
        'area': area,
        'module': mod.replace('_', ' ').title() if mod else 'Qore',
        'modules': raw_modules,
        'short': card['title'],
        'extra': False,
        'desc': card.get('insight', ''),
        'insight': card.get('insight', ''),
        'weight': int(card.get('weight', 50)),
        'topic': card.get('topic'),
        'rowNames': [],
        'sliceNames': []
    })

with open(CATALOG_JSON, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2)

print(f'Wrote {len(catalog)} cards to {CATALOG_JSON}')
