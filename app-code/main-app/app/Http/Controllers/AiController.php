<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

class AiController extends Controller
{
    public function query(Request $request)
    {
        if (!$request->input('query')) {
            return response()->json(['error' => 'Query cannot be empty'], 400);
        }

        $userQuery = $request->input('query');
        Log::info("AI Assistant Query: {$userQuery}");

        try {
            $this->checkAccess();
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        }

        // Local SQL intent matching (T1-10) — 0 LLM cost for standard reports
        $lowerQuery = mb_strtolower(trim($userQuery));
        $intents = config('ai_intents.intents', []);

        foreach ($intents as $key => $intent) {
            foreach ($intent['phrases'] as $phrase) {
                if (str_contains($lowerQuery, $phrase)) {
                    $reportData = $this->resolveSqlIntentReport($key);
                    return response()->json([
                        'answer' => $reportData['summary'],
                        'intent' => $key,
                        'data'   => $reportData['records'],
                        'source' => 'sql_intent_router',
                    ]);
                }
            }
        }

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $user   = auth()->user();

        // ── AI monetization gate ─────────────────────────────────────────────
        $tools        = $this->getToolDefinitions();
        $toolExecutor = fn (string $name, array $args) => $this->executeFunction($name, $args);

        $systemPrompt = 'You are a helpful POS assistant. Today: ' . Carbon::today()->format('Y-m-d') . '. '
            . 'When the user asks about data, call the appropriate tool. Respond clearly and concisely.';

        $aiRequest = AiRequest::for('query')
            ->tenant($tenant)
            ->user($user)
            ->input($userQuery)
            ->systemPrompt($systemPrompt)
            ->tools($tools, $toolExecutor);

        /** @var AiGateway $gateway */
        $gateway = app(AiGateway::class);
        $result  = $gateway->resolve($aiRequest);

        if (!$result->ok) {
            $code = $result->failureCode ?? 'error';

            if ($code === 'rate_limited') {
                return response()->json([
                    'error' => 'AI Assistant is experiencing high traffic. Please wait a few seconds and try again.',
                ], 429);
            }

            if (in_array($code, ['not_allowed', 'spend_capped', 'plan_locked'], true)) {
                return response()->json([
                    'success' => false,
                    'code'    => 'ai_locked',
                    'reason'  => $code,
                    'message' => $result->errorMessage ?? 'AI Assistant is not available.',
                ], 402);
            }

            if ($code === 'no_key') {
                return response()->json([
                    'error' => 'API Key missing. Please configure your AI settings.',
                ], 400);
            }

            return response()->json([
                'error' => $result->errorMessage ?? 'AI request failed.',
            ], 500);
        }

        return response()->json(['answer' => $result->value, 'type' => 'ai_response']);
    }

    private function checkAccess()
    {
        $user = auth()->user();

        // 1. Check Global AI Enable Switch
        $enabled = Setting::where('key', 'ai_enabled')->value('value');
        if ($enabled === '0' && $user->role !== 'platform_admin') {
            throw new \Exception("AI Assistant is currently disabled by administrator.");
        }

        // 2. Check Role Restrictions
        $restrictedRolesJson = Setting::where('key', 'ai_restricted_roles')->value('value');
        $restrictedRoles = json_decode($restrictedRolesJson, true) ?? [];

        if (in_array($user->role, $restrictedRoles)) {
            throw new \Exception("Your role ({$user->role}) is not authorized to use the AI Assistant.");
        }

        // 3. Optional: Check Usage Limits (Stub for future implementation)
        // $limit = Setting::where('key', 'ai_usage_limit')->value('value');
        // $used = ... check usage count ...
        // if ($used >= $limit) throw ...
    }

    /**
     * Test AI connection — delegates to AiGateway (which delegates to the provider).
     * Replaces the old inline Gemini/OpenAI HTTP blocks.
     */
    public function testConnection(Request $request)
    {
        $apiKey   = $request->input('api_key');
        $provider = $request->input('provider', 'gemini');
        $model    = $request->input('model', 'gemini-2.5-flash-lite');

        /** @var AiGateway $gateway */
        $gateway = app(AiGateway::class);
        $result  = $gateway->testConnection($provider, $apiKey, $model);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    // ==========================================
    // SHARED LOGIC
    // ==========================================

    private function checkAuthPermission($permission)
    {
        $user = auth()->user();
        if (!$user)
            throw new \Exception("Unauthorized");
        if ($user->role === 'platform_admin')
            return;

        $perms = $user->permissions ?? [];
        if (!is_array($perms))
            $perms = [];

        if (!in_array($permission, $perms)) {
            throw new \Exception("Access Denied: You need the '{$permission}' permission to perform this action.");
        }
    }

    // ==========================================
    // OMNISEARCH TOOL EXECUTOR
    // All 8 data tools below delegate to Reckoner::read() — no ad-hoc SQL.
    // ==========================================

    private function executeFunction($name, $args)
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $user   = auth()->user();
        $reckoner = app(Reckoner::class);

        if ($name === 'get_sales_summary') {
            $this->checkAuthPermission('sales_view');
            $startDate = $args['start_date'];
            $endDate   = $args['end_date'];

            if (!empty($args['product_name'])) {
                // Per-product is not a Reckoner reading yet — keep FinancialReportingService path.
                $prod = Product::where('name', 'like', '%' . $args['product_name'] . '%')->first();
                if (!$prod) {
                    return json_encode(['error' => "Product '{$args['product_name']}' not found."]);
                }
                $frs  = app(\App\Services\FinancialReportingService::class);
                $row  = $frs->getGrossProfitByProduct($startDate, $endDate)
                           ->firstWhere('product_id', $prod->id);
                $total = $row ? (float) $row['net_revenue'] : 0.0;
                $count = Sale::query()
                    ->whereIn('status', ['posted', 'partially_returned', 'returned'])
                    ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->whereHas('items', fn ($q) => $q->where('product_id', $prod->id))
                    ->count();
                return json_encode(['total_amount' => $total, 'transaction_count' => $count]);
            }

            // Reckoner: sales.revenue for the custom date range.
            $rReq  = new ReckonerRequest('sales.revenue', 'custom', ['from' => $startDate, 'to' => $endDate]);
            $rResult = $reckoner->read($rReq, $user, $tenant);
            $revenue = $rResult->ok ? (float) ($rResult->payload['value'] ?? 0) : 0.0;

            $count = Sale::query()
                ->whereIn('status', ['posted', 'partially_returned', 'returned'])
                ->whereBetween('posted_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->count();

            return json_encode(['total_amount' => $revenue, 'transaction_count' => $count]);
        }

        if ($name === 'get_stock_level') {
            $this->checkAuthPermission('pos');
            $product = Product::where('name', 'like', '%' . $args['product_name'] . '%')->first();
            if (!$product) {
                return json_encode(['error' => 'Product not found']);
            }
            // FIFO truth — same basis as the Inventory Valuation report (SUM of stock batches).
            $stock = (float) \App\Models\Stock::where('product_id', $product->id)->sum('quantity');
            return json_encode([
                'product' => $product->name,
                'stock'   => $stock,
                'unit'    => $product->unit,
            ]);
        }

        if ($name === 'get_profit_summary') {
            $this->checkAuthPermission('finance');
            $startDate = $args['start_date'];
            $endDate   = $args['end_date'];
            $custom    = ['from' => $startDate, 'to' => $endDate];

            // Reckoner: finance.net_profit, finance.gross_profit, finance.expenses_total
            $requests = [
                new ReckonerRequest('finance.net_profit', 'custom', $custom),
                new ReckonerRequest('sales.revenue', 'custom', $custom),
                new ReckonerRequest('finance.expenses_total', 'custom', $custom),
                new ReckonerRequest('sales.gross_margin_pct', 'custom', $custom),
            ];
            $results = $reckoner->readMany($requests, $user, $tenant);

            $profitResult  = array_values($results)[0] ?? null;
            $revenueResult = array_values($results)[1] ?? null;
            $expenseResult = array_values($results)[2] ?? null;
            $marginResult  = array_values($results)[3] ?? null;

            $profit  = $profitResult?->ok  ? (float) ($profitResult->payload['value']  ?? 0) : 0.0;
            $revenue = $revenueResult?->ok ? (float) ($revenueResult->payload['value'] ?? 0) : 0.0;
            $cost    = $expenseResult?->ok ? (float) ($expenseResult->payload['value'] ?? 0) : 0.0;
            $margin  = $marginResult?->ok  ? (float) ($marginResult->payload['value']  ?? 0) : ($revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0);

            return json_encode([
                'revenue'           => $revenue,
                'cost'              => $cost,
                'profit'            => $profit,
                'margin_percentage' => $margin,
            ]);
        }

        if ($name === 'get_expense_summary') {
            $this->checkAuthPermission('finance');
            $startDate = $args['start_date'];
            $endDate   = $args['end_date'];
            $custom    = ['from' => $startDate, 'to' => $endDate];

            // Reckoner headline: finance.expenses_total (operating expenses, journal-authoritative).
            $rReq   = new ReckonerRequest('finance.expenses_total', 'custom', $custom);
            $rResult = $reckoner->read($rReq, $user, $tenant);
            $operatingExpenses = $rResult->ok ? (float) ($rResult->payload['value'] ?? 0) : 0.0;

            // Reckoner breakdown: finance.expenses_by_category (list shape).
            $catReq    = new ReckonerRequest('finance.expenses_by_category', 'custom', $custom);
            $catResult = $reckoner->read($catReq, $user, $tenant);
            $byCategory = $catResult->ok ? ($catResult->payload['value'] ?? []) : [];

            // Category filter applied client-side (Reckoner returns the full breakdown).
            if (!empty($args['category'])) {
                $filter = mb_strtolower($args['category']);
                $byCategory = array_values(array_filter($byCategory, function ($item) use ($filter) {
                    return str_contains(mb_strtolower($item['category'] ?? $item['name'] ?? ''), $filter);
                }));
            }

            return json_encode([
                'total_expenses'     => $operatingExpenses,
                'operating_expenses' => $operatingExpenses,
                'by_category'        => $byCategory,
            ]);
        }

        if ($name === 'get_top_products') {
            $this->checkAuthPermission('reports');
            $limit     = (int) ($args['limit'] ?? 5);
            $startDate = $args['start_date'];
            $endDate   = $args['end_date'];
            $custom    = ['from' => $startDate, 'to' => $endDate];

            // Reckoner: sales.top_products (list shape).
            $rReq    = new ReckonerRequest('sales.top_products', 'custom', $custom);
            $rResult = $reckoner->read($rReq, $user, $tenant);

            $rows = $rResult->ok ? ($rResult->payload['value'] ?? []) : [];
            $top  = array_slice($rows, 0, $limit);

            return json_encode(['top_products' => $top]);
        }

        if ($name === 'get_purchase_summary') {
            $this->checkAuthPermission('purchases');
            $startDate = $args['start_date'];
            $endDate   = $args['end_date'];
            $custom    = ['from' => $startDate, 'to' => $endDate];

            // Reckoner: purchasing.spend + purchasing.count
            $requests = [
                new ReckonerRequest('purchasing.spend', 'custom', $custom),
                new ReckonerRequest('purchasing.count', 'custom', $custom),
            ];
            $results = $reckoner->readMany($requests, $user, $tenant);

            $spendResult = array_values($results)[0] ?? null;
            $countResult = array_values($results)[1] ?? null;

            $total = $spendResult?->ok ? (float) ($spendResult->payload['value'] ?? 0) : 0.0;
            $count = $countResult?->ok ? (int) ($countResult->payload['value'] ?? 0)   : 0;

            return json_encode(['total_purchases' => $total, 'purchase_count' => $count]);
        }

        if ($name === 'get_party_balance') {
            $this->checkAuthPermission('customers');
            $party = Party::where('name', 'like', '%' . $args['party_name'] . '%')->first();
            if (!$party) {
                return json_encode(['error' => 'Party not found']);
            }

            $balance = \App\Queries\PartyBalanceQuery::partyNetBalance($party->id, $party->tenant_id, $party->type);
            return json_encode(['party_name' => $party->name, 'balance' => $balance, 'type' => $party->type ?? 'customer']);
        }

        // Cash Reconciliation Helper — analyzes transactions to find discrepancies.
        // (No Reckoner reading for discrepancy analysis — structural query only.)
        if ($name === 'analyze_cash_discrepancy') {
            $this->checkAuthPermission('finance');

            $discrepancy = (float) ($args['discrepancy_amount'] ?? 0);
            $isShort = ($args['is_short'] ?? true);
            $days = 7;
            $startDate = Carbon::now()->subDays($days)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $cashAccount  = \App\Models\Account::where('code', '1000')->first();
            $systemBalance = $cashAccount ? (float) $cashAccount->balance : 0;

            $recentSales = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_method', 'cash')
                ->select('id', 'total', 'created_at')
                ->get();

            $recentPurchases = \App\Models\Purchase::where('workflow_status', '!=', 'cancelled')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select('id', 'total', 'created_at', 'notes')
                ->get();

            $recentExpenses = Expense::whereBetween('date', [$startDate, $endDate])
                ->select('id', 'amount', 'category', 'description', 'date')
                ->get();

            $fundTransactions = \App\Models\FundTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('id', 'type', 'amount', 'reason', 'created_at')
                ->get();

            $suggestions = [];

            if ($isShort) {
                $suggestions[] = [
                    'category' => 'Unrecorded Cash Expense',
                    'hint' => 'Did you pay for something with cash (supplies, food, transport) without recording it?',
                    'recent_expenses_count' => $recentExpenses->count(),
                    'recent_expense_total' => $recentExpenses->sum('amount'),
                ];
                $suggestions[] = [
                    'category' => 'Delivery/Tip Payment',
                    'hint' => 'Did you give cash tip or delivery fee to anyone?',
                    'check' => 'Check if any deliveries were made without logging cash paid to driver.',
                ];
                $suggestions[] = [
                    'category' => 'Charity/Donation',
                    'hint' => 'Did you give small charity or donation that wasn\'t recorded?',
                    'common_amounts' => [100, 200, 500],
                ];
                $suggestions[] = [
                    'category' => 'Change Given Incorrectly',
                    'hint' => 'Did you accidentally give extra change to a customer?',
                    'check' => 'Review cash sales from today.',
                ];
                $suggestions[] = [
                    'category' => 'Petty Cash Purchase',
                    'hint' => 'Was cash taken for a small business purchase?',
                    'recent_purchases_count' => $recentPurchases->count(),
                ];
            } else {
                $suggestions[] = [
                    'category' => 'Unrecorded Cash Sale',
                    'hint' => 'Did someone pay cash for a sale that wasn\'t entered in POS?',
                    'recent_sales_count' => $recentSales->count(),
                ];
                $suggestions[] = [
                    'category' => 'Refund Not Given',
                    'hint' => 'Was a refund supposed to be given but customer didn\'t collect?',
                    'check' => 'Check for any pending refunds.',
                ];
                $suggestions[] = [
                    'category' => 'Prepayment/Advance',
                    'hint' => 'Did a customer give advance payment that wasn\'t recorded?',
                    'check' => 'Check if any customer made advance booking.',
                ];
            }

            return json_encode([
                'system_balance' => $systemBalance,
                'discrepancy'    => $discrepancy,
                'type'           => $isShort ? 'short' : 'over',
                'analysis_period' => "{$days} days",
                'suggestions'    => $suggestions,
                'recent_activity' => [
                    'cash_sales'        => $recentSales->count(),
                    'cash_sales_total'  => $recentSales->sum('net_sales'),
                    'purchases'         => $recentPurchases->count(),
                    'expenses'          => $recentExpenses->count(),
                    'fund_transactions' => $fundTransactions->count(),
                ],
                'recommendation' => $isShort
                    ? "You are short Rs {$discrepancy}. Check the suggestions above. If you can't find the source, use 'Adjust Balance' in Fund Management to correct it."
                    : "You have Rs {$discrepancy} extra. This might be an unrecorded sale. If you can't identify it, adjust the balance.",
            ]);
        }

        return json_encode(['error' => 'Unknown function']);
    }

    /**
     * Unified tool definition list (provider-agnostic — AiGateway formats for each provider).
     * Gemini uses `function_declarations` directly; OpenAI wraps each in `{'type':'function','function':{...}}`.
     * AiGateway / providers handle this translation.
     */
    private function getToolDefinitions(): array
    {
        return [
            [
                'name'        => 'get_sales_summary',
                'description' => 'Get sales total and count for date range',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'start_date'   => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date'     => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'product_name' => ['type' => 'string', 'description' => 'Optional product filter'],
                    ],
                    'required' => ['start_date', 'end_date'],
                ],
            ],
            [
                'name'        => 'get_stock_level',
                'description' => 'Get stock quantity for a product',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'product_name' => ['type' => 'string'],
                    ],
                    'required' => ['product_name'],
                ],
            ],
            [
                'name'        => 'get_profit_summary',
                'description' => 'Get profit, revenue, cost and margin for date range',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date'   => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                    ],
                    'required' => ['start_date', 'end_date'],
                ],
            ],
            [
                'name'        => 'get_expense_summary',
                'description' => 'Get expense total and breakdown by category',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date'   => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'category'   => ['type' => 'string', 'description' => 'Optional category filter'],
                    ],
                    'required' => ['start_date', 'end_date'],
                ],
            ],
            [
                'name'        => 'get_top_products',
                'description' => 'Get best selling products by revenue',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date'   => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'limit'      => ['type' => 'integer', 'description' => 'Number of products to return, default 5'],
                    ],
                    'required' => ['start_date', 'end_date'],
                ],
            ],
            [
                'name'        => 'get_purchase_summary',
                'description' => 'Get purchase total and count for date range',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date'   => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                    ],
                    'required' => ['start_date', 'end_date'],
                ],
            ],
            [
                'name'        => 'get_party_balance',
                'description' => 'Get balance owed by or to a customer/supplier',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'party_name' => ['type' => 'string'],
                    ],
                    'required' => ['party_name'],
                ],
            ],
            [
                'name'        => 'analyze_cash_discrepancy',
                'description' => 'Help user find why their physical cash doesn\'t match the system balance. Analyzes recent transactions to suggest possible causes.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'discrepancy_amount' => ['type' => 'number', 'description' => 'The difference between physical count and system balance'],
                        'is_short'           => ['type' => 'boolean', 'description' => 'True if physical cash is LESS than system (short), false if MORE (over)'],
                    ],
                    'required' => ['discrepancy_amount', 'is_short'],
                ],
            ],
        ];
    }

    public function recommendations(Request $request)
    {
        $productId = $request->query('product_id');
        $limit     = $request->query('limit', 5);

        $tenantId = app('current.tenant')->id;

        $recommendations = DB::table('sale_items as a')
            ->join('sale_items as b', function ($join) use ($tenantId) {
                $join->on('a.sale_id', '=', 'b.sale_id')
                     ->where('b.tenant_id', '=', $tenantId);
            })
            ->join('products as p', function ($join) use ($tenantId) {
                $join->on('b.product_id', '=', 'p.id')
                     ->where('p.tenant_id', '=', $tenantId);
            })
            ->where('a.product_id', $productId)
            ->where('b.product_id', '<>', $productId)
            ->where('a.tenant_id', $tenantId)
            ->select('b.product_id', 'p.name', DB::raw('COUNT(*) as correlation_count'))
            ->groupBy('b.product_id', 'p.name')
            ->orderByDesc('correlation_count')
            ->limit($limit)
            ->get();

        return response()->json(['status' => 'success', 'data' => $recommendations]);
    }

    public function smartReorder(Request $request)
    {
        $leadTime = (int) $request->query('lead_time', 7);
        $tenantId = app('current.tenant')->id;

        $products = DB::table('products as p')
            ->leftJoin('stocks as s', function ($join) use ($tenantId) {
                $join->on('p.id', '=', 's.product_id')
                     ->where('s.tenant_id', '=', $tenantId);
            })
            ->leftJoin('sale_items as si', function ($join) use ($tenantId) {
                $join->on('p.id', '=', 'si.product_id')
                     ->where('si.created_at', '>=', now()->subDays(30))
                     ->where('si.tenant_id', '=', $tenantId);
            })
            ->where('p.tenant_id', $tenantId)
            ->select('p.id', 'p.name', DB::raw('COALESCE(SUM(s.quantity), 0) as current_stock'), DB::raw('COALESCE(SUM(si.quantity), 0) / 30.0 as avg_daily_sales'))
            ->groupBy('p.id', 'p.name')
            ->get()
            ->map(function ($p) use ($leadTime) {
                $p->reorder_threshold = round($p->avg_daily_sales * $leadTime, 2);
                $p->should_reorder    = $p->current_stock <= $p->reorder_threshold;
                return $p;
            })
            ->filter(fn ($p) => $p->should_reorder)
            ->values();

        return response()->json(['status' => 'success', 'data' => $products]);
    }

    public function cashFlowForecast(Request $request)
    {
        $daysToProject = (int) $request->query('days', 30);
        $daysToProject = max(1, min(90, $daysToProject));
        $tenantId      = app('current.tenant')->id;

        $movements = DB::table('journal_items as ji')
            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('je.tenant_id', $tenantId)
            ->whereIn('a.code', ['1000', '1010'])
            ->where('je.date', '>=', now()->subDays(30)->toDateString())
            ->select('je.date', DB::raw('SUM(ji.debit - ji.credit) as daily_net'))
            ->groupBy('je.date')
            ->get();

        $totalNet    = $movements->sum('daily_net');
        $avgDailyNet = round($totalNet / 30.0, 2);

        $currentCash = DB::table('journal_items as ji')
            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
            ->where('ji.tenant_id', $tenantId)
            ->whereIn('a.code', ['1000', '1010'])
            ->sum(DB::raw('ji.debit - ji.credit')) ?? 0.0;
        $currentCash = (float) $currentCash;

        $forecast = [];
        for ($i = 1; $i <= $daysToProject; $i++) {
            $forecast[] = [
                'date'                  => now()->addDays($i)->toDateString(),
                'projected_net_change'  => round($avgDailyNet * $i, 2),
                'projected_balance'     => round($currentCash + ($avgDailyNet * $i), 2),
            ];
        }

        return response()->json([
            'status'          => 'success',
            'current_balance' => round($currentCash, 2),
            'avg_daily_net'   => $avgDailyNet,
            'forecast'        => $forecast,
        ]);
    }

    /**
     * Resolves local SQL queries for predefined AI reporting intents (T1-10).
     * These are zero-LLM-cost shortcuts for common phrased questions.
     * Uses Reckoner for receivables/payables instead of inline journal SQL.
     */
    private function resolveSqlIntentReport(string $intent): array
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        $user   = auth()->user();

        return match ($intent) {
            'sales_today' => [
                'summary' => 'Today\'s Sales: ' . Sale::whereDate('created_at', today())->count() . ' transactions totaling PKR ' . number_format((float) Sale::whereDate('created_at', today())->sum('total'), 2),
                'records' => Sale::whereDate('created_at', today())->take(10)->get(['id', 'reference_number', 'total', 'created_at'])->toArray(),
            ],
            'low_stock' => [
                'summary' => 'Low Stock Items: ' . Product::whereColumn('stock_quantity', '<=', 'alert_quantity')->count() . ' products requiring reorder.',
                'records' => Product::whereColumn('stock_quantity', '<=', 'alert_quantity')->take(10)->get(['id', 'name', 'stock_quantity', 'alert_quantity'])->toArray(),
            ],
            'receivables' => (function () use ($tenant, $user) {
                if (!$tenant || !$user) {
                    return ['summary' => 'No store context.', 'records' => []];
                }
                $reckoner = app(Reckoner::class);
                $rReq = new ReckonerRequest('finance.receivables', 'today');
                $rResult = $reckoner->read($rReq, $user, $tenant);
                $sum = $rResult->ok ? (float) ($rResult->payload['value'] ?? 0) : 0.0;
                return [
                    'summary' => 'Pending Customer Receivables: PKR ' . number_format($sum, 2),
                    'records' => [],
                ];
            })(),
            'payables' => (function () use ($tenant, $user) {
                if (!$tenant || !$user) {
                    return ['summary' => 'No store context.', 'records' => []];
                }
                $reckoner = app(Reckoner::class);
                $rReq = new ReckonerRequest('finance.payables', 'today');
                $rResult = $reckoner->read($rReq, $user, $tenant);
                $sum = $rResult->ok ? (float) ($rResult->payload['value'] ?? 0) : 0.0;
                return [
                    'summary' => 'Pending Supplier Payables: PKR ' . number_format($sum, 2),
                    'records' => [],
                ];
            })(),
            'top_sellers' => [
                'summary' => 'Top Selling Products by Quantity Sold',
                'records' => \App\Models\SaleItem::select('product_id', DB::raw('SUM(quantity) as total_qty'))
                    ->groupBy('product_id')
                    ->orderByDesc('total_qty')
                    ->take(5)
                    ->get()
                    ->toArray(),
            ],
            default => [
                'summary' => 'Report data retrieved',
                'records' => [],
            ],
        };
    }
}
