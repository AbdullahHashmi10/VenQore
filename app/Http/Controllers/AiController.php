<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Setting;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Invoice;
use App\Models\Party;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AiController extends Controller
{
    public function query(Request $request)
    {
        if (!$request->input('query')) {
            return response()->json(['error' => 'Query cannot be empty'], 400);
        }

        try {
            $this->checkAccess();
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        }

        if (!Schema::hasTable('settings')) {
             return response()->json(['error' => 'System not installed.'], 503);
        }

        $userQuery = $request->input('query');

        $apiKey = Setting::where('key', 'openai_api_key')->value('value');
        $model = Setting::where('key', 'ai_model')->value('value') ?? 'gpt-4o';
        $provider = Setting::where('key', 'ai_provider')->value('value') ?? 'openai';

        if (!$apiKey) {
            return response()->json([
                'error' => 'API Key missing. Please configure your AI settings.'
            ], 400);
        }

        try {
            if ($provider === 'gemini') {
                return $this->handleGemini($apiKey, $model, $userQuery);
            } else {
                return $this->handleOpenAI($apiKey, $model, $userQuery);
            }
        } catch (\Exception $e) {
            Log::error($e);
            $rawBody = ($e instanceof \Illuminate\Http\Client\RequestException) ? $e->response->body() : '';
            return $this->formatAiError($e, $model, $rawBody);
        }
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

    public function testConnection(Request $request)
    {
        $apiKey = $request->input('api_key');
        $provider = $request->input('provider');
        $inputModel = $request->input('model', 'gpt-4o');

        if ($provider === 'gemini') {
            // Expanded Fallback Strategy (2026 Active Models)
            $modelsToTry = array_unique([
                $inputModel,
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite',
                'gemini-3-flash',
                'gemini-2.5-pro'
            ]);

            $firstError = null;
            $rawErrorBody = "";

            foreach ($modelsToTry as $model) {
                try {
                    $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                        'contents' => [['parts' => [['text' => "Say 'Hello'"]]]]
                    ])->throw();

                    // Success!
                    $message = "Connection verified successfully!";
                    $suggestedModel = null;

                    if ($model !== $inputModel) {
                        $message = "Connection Verified! We automatically switched to '$model' as it is compatible with your key.";
                        $suggestedModel = $model;
                    }

                    return response()->json([
                        'success' => true,
                        'message' => $message,
                        'suggested_model' => $suggestedModel
                    ]);

                } catch (\Exception $e) {
                    if (!$firstError) {
                        $firstError = $e;
                        // Capture raw response if possible for debugging
                        if ($e instanceof \Illuminate\Http\Client\RequestException) {
                            $rawErrorBody = $e->response->body();
                        }
                    }

                    // Critical auth errors - stop immediately
                    if (str_contains($e->getMessage(), '401') || str_contains($e->getMessage(), '403')) {
                        return response()->json(['success' => false, 'message' => "Access denied. Your API Key is invalid."], 400);
                    }
                }
            }

            // All failed
            // Try to auto-discover via ListModels API (The Ultimate Fallback)
            try {
                $listResponse = Http::get("https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}")->throw();
                $available = $listResponse->json()['models'] ?? [];

                // Sort by preference (flash > pro) to pick best available
                usort($available, function ($a, $b) {
                    return str_contains($a['name'], 'flash') ? -1 : 1;
                });

                foreach ($available as $m) {
                    if (in_array('generateContent', $m['supportedGenerationMethods'] ?? [])) {
                        $actualName = str_replace('models/', '', $m['name']);

                        return response()->json([
                            'success' => true,
                            'message' => "Connection Verified! We auto-discovered '{$actualName}' on your account.",
                            'suggested_model' => $actualName
                        ]);
                    }
                }
            } catch (\Exception $listErr) {
                // Ignore list error
            }

            return $this->formatAiError($firstError, $inputModel, $rawErrorBody);

        } else {
            // OpenAI check
            try {
                $response = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $inputModel,
                    'messages' => [['role' => 'user', 'content' => "Say 'Hello'"]],
                    'max_tokens' => 5
                ])->throw();

                return response()->json(['success' => true, 'message' => 'Connection verified successfully!']);
            } catch (\Exception $e) {
                return $this->formatAiError($e, $inputModel);
            }
        }
    }

    private function formatAiError($e, $model, $rawBody = '')
    {
        $msg = $e->getMessage();
        $friendly = "Connection failed.";

        // 1. Check for Billing/Payment issues (Common 403/400)
        $lowerMsg = strtolower($msg);
        $lowerBody = strtolower($rawBody);

        if (
            str_contains($lowerMsg, 'billing') || str_contains($lowerBody, 'billing') ||
            str_contains($lowerMsg, 'enable billing') || str_contains($lowerBody, 'enable billing')
        ) {
            return response()->json(['success' => false, 'message' => "⚠️ Billing Required: Please set up a payment method in your Google Cloud Console to use this model."], 400);
        }

        if (str_contains($lowerMsg, 'location') || str_contains($lowerBody, 'location')) {
            return response()->json(['success' => false, 'message' => "🌍 Location Error: Gemini API is not available in your region or your project location setting is incorrect."], 400);
        }

        // 2. Standard Errors
        if (str_contains($msg, '404')) {
            $friendly = "The selected AI Model ($model) was not found (404).";
            if ($rawBody) {
                $decoded = json_decode($rawBody, true);
                if (isset($decoded['error']['message'])) {
                    $friendly .= " Google Error: " . $decoded['error']['message'];
                }
            }
        } elseif (str_contains($msg, '401') || str_contains($msg, '403')) {
            $friendly = "Access denied (401/403). Your API Key is invalid, or the 'Generative Language API' is not enabled in your console.";
        } elseif (str_contains($msg, '429')) {
            $friendly = "Quota Exceeded (429). You have hit your usage limit. Check your Google Cloud Quotas.";
        } elseif (str_contains($msg, '400') && str_contains($msg, 'API key')) {
            $friendly = "The API Key format is incorrect. Please ensure you copied the full key.";
        } else {
            // 3. Fallback for Unknown Errors
            // "Please contact VenQore Support"
            $friendly = "System Error: " . $e->getMessage() . ". If this persists, please contact VenQore Support.";
        }
        return response()->json(['success' => false, 'message' => $friendly], 400);
    }

    // ==========================================
    // OPENAI HANDLER
    // ==========================================
    private function handleOpenAI($apiKey, $model, $userQuery)
    {
        $tools = $this->getOpenAiTools();

        // 1. Initial Call
        $response = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful POS assistant. Today: ' . Carbon::today()->format('Y-m-d') . '.'],
                ['role' => 'user', 'content' => $userQuery]
            ],
            'tools' => $tools,
            'tool_choice' => 'auto'
        ])->throw();

        $data = $response->json();
        $message = $data['choices'][0]['message'];

        if (isset($message['tool_calls'])) {
            $toolCalls = $message['tool_calls'];
            $toolOutputs = [];

            foreach ($toolCalls as $toolCall) {
                $functionName = $toolCall['function']['name'];
                $args = json_decode($toolCall['function']['arguments'], true);
                try {
                    $result = $this->executeFunction($functionName, $args);
                } catch (\Exception $e) {
                    $result = json_encode(['error' => 'Tool failed: ' . $e->getMessage()]);
                }

                $toolOutputs[] = [
                    'tool_call_id' => $toolCall['id'],
                    'role' => 'tool',
                    'name' => $functionName,
                    'content' => $result
                ];
            }

            // 2. Follow-up Call
            $finalResponse = Http::withToken($apiKey)->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                    ['role' => 'user', 'content' => $userQuery],
                    $message,
                    ...$toolOutputs
                ]
            ])->throw();

            return response()->json([
                'answer' => $finalResponse['choices'][0]['message']['content'],
                'type' => 'ai_response'
            ]);
        }

        return response()->json(['answer' => $message['content'], 'type' => 'ai_response']);
    }

    // ==========================================
    // GEMINI HANDLER
    // ==========================================
    private function handleGemini($apiKey, $preferredModel, $userQuery)
    {
        // 1. Define the fallback list (2026 Active Models)
        $modelsToTry = array_unique([
            $preferredModel,
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-3-flash',
            'gemini-2.5-pro'
        ]);

        $lastException = null;

        foreach ($modelsToTry as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";
                $tools = $this->getGeminiTools();

                // 2. Initial Call
                $payload = [
                    'contents' => [
                        ['parts' => [['text' => "You are a POS assistant. Today: " . Carbon::today()->format('Y-m-d') . ". User asks: " . $userQuery]]]
                    ],
                    'tools' => [['function_declarations' => $tools]]
                ];

                try {
                    $response = Http::post($url, $payload)->throw();
                } catch (\Exception $toolError) {
                    // Fallback: Try WITHOUT tools (if tools caused the crash)
                    if (isset($payload['tools'])) {
                        unset($payload['tools']);
                        $response = Http::post($url, $payload)->throw();
                        // If we are here, it worked without tools!
                        $data = $response->json();
                        $answer = $data['candidates'][0]['content']['parts'][0]['text'] ?? "I couldn't answer that.";
                        return response()->json([
                            'answer' => $answer . "\n\n(Note: I couldn't access live business data due to a temporary connection issue, so this is a general answer.)",
                            'type' => 'ai_response'
                        ]);
                    }
                    throw $toolError;
                }

                $data = $response->json();

                // IF WE GET HERE, THE MODEL WORKED. PROCESS RESPONSE.
                $part = $data['candidates'][0]['content']['parts'][0] ?? [];

                if (isset($part['functionCall'])) {
                    $functionCall = $part['functionCall'];
                    $functionName = $functionCall['name'];
                    $args = $functionCall['args'];

                    try {
                        $result = $this->executeFunction($functionName, $args);
                    } catch (\Exception $e) {
                        $result = json_encode(['error' => 'Tool failed: ' . $e->getMessage()]);
                    }

                    // Follow-up Call
                    $history = [
                        ['role' => 'user', 'parts' => [['text' => $userQuery]]],
                        ['role' => 'model', 'parts' => [['functionCall' => $functionCall]]],
                        ['role' => 'function', 'parts' => [['functionResponse' => ['name' => $functionName, 'response' => ['content' => $result]]]]]
                    ];

                    $finalPayload = [
                        'contents' => $history,
                        'tools' => [['function_declarations' => $tools]]
                    ];

                    $finalResponse = Http::post($url, $finalPayload)->throw();
                    $finalData = $finalResponse->json();

                    $answer = $finalData['candidates'][0]['content']['parts'][0]['text'] ?? "I processed the data but couldn't generate a summary.";
                    return response()->json(['answer' => $answer, 'type' => 'ai_response']);
                }

                $answer = $part['text'] ?? "I couldn't understand that.";
                return response()->json(['answer' => $answer, 'type' => 'ai_response']);

            } catch (\Exception $e) {
                // If 404, try the next model. If 401 (Auth), stop.
                if (str_contains($e->getMessage(), '401') || str_contains($e->getMessage(), '403')) {
                    throw $e;
                }
                $lastException = $e;
                continue; // Try next model
            }
        }

        // If all models failed
        throw $lastException;
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

    private function executeFunction($name, $args)
    {
        if ($name === 'get_sales_summary') {
            $this->checkAuthPermission('sales_view');
            $query = Sale::query()->whereBetween('created_at', [$args['start_date'], $args['end_date']]);

            if (!empty($args['product_name'])) {
                $prod = Product::where('name', 'like', '%' . $args['product_name'] . '%')->first();
                if ($prod) {
                    $query->whereHas('items', function ($q) use ($prod) {
                        $q->where('product_id', $prod->id);
                    });
                } else {
                    return json_encode(['error' => "Product '{$args['product_name']}' not found."]);
                }
            }

            $total = $query->sum('final_total');
            $count = $query->count();
            return json_encode(['total_amount' => $total, 'transaction_count' => $count]);
        }

        if ($name === 'get_stock_level') {
            $prod = Product::where('name', 'like', '%' . $args['product_name'] . '%')->first();
            return $prod
                ? json_encode(['product' => $prod->name, 'stock' => $prod->stock_quantity, 'unit' => $prod->unit])
                : json_encode(['error' => 'Product not found']);
        }

        if ($name === 'get_profit_summary') {
            $this->checkAuthPermission('finance');
            $startDate = $args['start_date'];
            $endDate = $args['end_date'];

            // Calculate revenue from sales
            $revenue = Sale::whereBetween('created_at', [$startDate, $endDate])->sum('final_total');

            // Calculate cost (assuming cost_price on products * quantity sold)
            $tid = app('current.tenant')->id;
            $cost = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.tenant_id', $tid)
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->select(DB::raw('SUM(sale_items.quantity * products.cost_price) as total_cost'))
                ->value('total_cost') ?? 0;

            $profit = $revenue - $cost;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0;

            return json_encode([
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profit,
                'margin_percentage' => $margin
            ]);
        }

        if ($name === 'get_expense_summary') {
            $this->checkAuthPermission('finance');
            $query = Expense::whereBetween('date', [$args['start_date'], $args['end_date']]);

            if (!empty($args['category'])) {
                $query->where('category', 'like', '%' . $args['category'] . '%');
            }

            $total = $query->sum('amount');
            $count = $query->count();
            $byCategory = Expense::whereBetween('date', [$args['start_date'], $args['end_date']])
                ->select('category', DB::raw('SUM(amount) as total'))
                ->groupBy('category')
                ->get();

            return json_encode([
                'total_expenses' => $total,
                'expense_count' => $count,
                'by_category' => $byCategory
            ]);
        }

        if ($name === 'get_top_products') {
            $this->checkAuthPermission('reports');
            $limit = $args['limit'] ?? 5;

            $topProducts = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.tenant_id', app('current.tenant')->id)
                ->whereBetween('sales.created_at', [$args['start_date'], $args['end_date']])
                ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_quantity'), DB::raw('SUM(sale_items.total) as total_revenue'))
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_revenue')
                ->limit($limit)
                ->get();

            return json_encode(['top_products' => $topProducts]);
        }

        if ($name === 'get_stock_level') {
            $this->checkAuthPermission('pos');
            $product = Product::where('name', 'like', '%' . $args['product_name'] . '%')->first();
            if (!$product)
                return json_encode(['error' => 'Product not found']);

            $quantity = \App\Models\Stock::where('product_id', $product->id)->sum('quantity');

            return json_encode([
                'product' => $product->name,
                'stock' => $quantity,
                'price' => $product->price
            ]);
        }

        if ($name === 'get_purchase_summary') {
            $this->checkAuthPermission('purchases');
            $total = Invoice::where('type', 'purchase')
                ->whereBetween('date', [$args['start_date'], $args['end_date']])
                ->sum('total_amount');
            $count = Invoice::where('type', 'purchase')
                ->whereBetween('date', [$args['start_date'], $args['end_date']])
                ->count();

            return json_encode(['total_purchases' => $total, 'purchase_count' => $count]);
        }

        if ($name === 'get_party_balance') {
            $this->checkAuthPermission('customers');
            $party = Party::where('name', 'like', '%' . $args['party_name'] . '%')->first();
            if (!$party) {
                return json_encode(['error' => 'Party not found']);
            }

            return json_encode(['party_name' => $party->name, 'balance' => $party->balance ?? 0, 'type' => $party->type ?? 'customer']);
        }

        // Cash Reconciliation Helper - analyzes transactions to find discrepancies
        if ($name === 'analyze_cash_discrepancy') {
            $this->checkAuthPermission('finance');

            $discrepancy = (float) ($args['discrepancy_amount'] ?? 0);
            $isShort = ($args['is_short'] ?? true); // true = physical < system, false = physical > system
            $days = 7;
            $startDate = Carbon::now()->subDays($days)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            // Get cash account
            $cashAccount = \App\Models\Account::where('code', '1000')->first();
            $systemBalance = $cashAccount ? (float) $cashAccount->balance : 0;

            // Gather recent activity
            $recentSales = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_method', 'cash')
                ->select('id', 'total', 'created_at')
                ->get();

            $recentPurchases = Invoice::where('type', 'purchase')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->select('id', 'total_amount as total', 'created_at', 'notes')
                ->get();

            $recentExpenses = Expense::whereBetween('date', [$startDate, $endDate])
                ->select('id', 'amount', 'category', 'description', 'date')
                ->get();

            $fundTransactions = \App\Models\FundTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->select('id', 'type', 'amount', 'reason', 'created_at')
                ->get();

            // Build suggestions based on discrepancy type
            $suggestions = [];

            if ($isShort) {
                // Physical cash is LESS than system - money went out but wasn't recorded
                $suggestions[] = [
                    'category' => 'Unrecorded Cash Expense',
                    'hint' => 'Did you pay for something with cash (supplies, food, transport) without recording it?',
                    'recent_expenses_count' => $recentExpenses->count(),
                    'recent_expense_total' => $recentExpenses->sum('amount')
                ];
                $suggestions[] = [
                    'category' => 'Delivery/Tip Payment',
                    'hint' => 'Did you give cash tip or delivery fee to anyone?',
                    'check' => 'Check if any deliveries were made without logging cash paid to driver.'
                ];
                $suggestions[] = [
                    'category' => 'Charity/Donation',
                    'hint' => 'Did you give small charity or donation that wasn\'t recorded?',
                    'common_amounts' => [100, 200, 500]
                ];
                $suggestions[] = [
                    'category' => 'Change Given Incorrectly',
                    'hint' => 'Did you accidentally give extra change to a customer?',
                    'check' => 'Review cash sales from today.'
                ];
                $suggestions[] = [
                    'category' => 'Petty Cash Purchase',
                    'hint' => 'Was cash taken for a small business purchase?',
                    'recent_purchases_count' => $recentPurchases->count()
                ];
            } else {
                // Physical cash is MORE than system - money came in but wasn't recorded
                $suggestions[] = [
                    'category' => 'Unrecorded Cash Sale',
                    'hint' => 'Did someone pay cash for a sale that wasn\'t entered in POS?',
                    'recent_sales_count' => $recentSales->count()
                ];
                $suggestions[] = [
                    'category' => 'Refund Not Given',
                    'hint' => 'Was a refund supposed to be given but customer didn\'t collect?',
                    'check' => 'Check for any pending refunds.'
                ];
                $suggestions[] = [
                    'category' => 'Prepayment/Advance',
                    'hint' => 'Did a customer give advance payment that wasn\'t recorded?',
                    'check' => 'Check if any customer made advance booking.'
                ];
            }

            return json_encode([
                'system_balance' => $systemBalance,
                'discrepancy' => $discrepancy,
                'type' => $isShort ? 'short' : 'over',
                'analysis_period' => "{$days} days",
                'suggestions' => $suggestions,
                'recent_activity' => [
                    'cash_sales' => $recentSales->count(),
                    'cash_sales_total' => $recentSales->sum('total'),
                    'purchases' => $recentPurchases->count(),
                    'expenses' => $recentExpenses->count(),
                    'fund_transactions' => $fundTransactions->count()
                ],
                'recommendation' => $isShort
                    ? "You are short Rs {$discrepancy}. Check the suggestions above. If you can't find the source, use 'Adjust Balance' in Fund Management to correct it."
                    : "You have Rs {$discrepancy} extra. This might be an unrecorded sale. If you can't identify it, adjust the balance."
            ]);
        }

        return json_encode(['error' => 'Unknown function']);
    }

    private function getOpenAiTools()
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_sales_summary',
                    'description' => 'Get sales total and count for date range',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'product_name' => ['type' => 'string', 'description' => 'Optional product filter']
                        ],
                        'required' => ['start_date', 'end_date']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_stock_level',
                    'description' => 'Get stock quantity for a product',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'product_name' => ['type' => 'string']
                        ],
                        'required' => ['product_name']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_profit_summary',
                    'description' => 'Get profit, revenue, cost and margin for date range',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD']
                        ],
                        'required' => ['start_date', 'end_date']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_expense_summary',
                    'description' => 'Get expense total and breakdown by category',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'category' => ['type' => 'string', 'description' => 'Optional category filter']
                        ],
                        'required' => ['start_date', 'end_date']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_top_products',
                    'description' => 'Get best selling products by revenue',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'limit' => ['type' => 'integer', 'description' => 'Number of products to return, default 5']
                        ],
                        'required' => ['start_date', 'end_date']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_purchase_summary',
                    'description' => 'Get purchase total and count for date range',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                            'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD']
                        ],
                        'required' => ['start_date', 'end_date']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_party_balance',
                    'description' => 'Get balance owed by or to a customer/supplier',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'party_name' => ['type' => 'string']
                        ],
                        'required' => ['party_name']
                    ]
                ]
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'analyze_cash_discrepancy',
                    'description' => 'Help user find why their physical cash doesn\'t match the system balance. Analyzes recent transactions to suggest possible causes.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'discrepancy_amount' => ['type' => 'number', 'description' => 'The difference between physical count and system balance'],
                            'is_short' => ['type' => 'boolean', 'description' => 'True if physical cash is LESS than system (short), false if MORE (over)']
                        ],
                        'required' => ['discrepancy_amount', 'is_short']
                    ]
                ]
            ]
        ];
    }

    private function getGeminiTools()
    {
        // Gemini uses 'function_declarations' directly
        return [
            [
                'name' => 'get_sales_summary',
                'description' => 'Get sales total and count for date range',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'product_name' => ['type' => 'string', 'description' => 'Optional product filter']
                    ],
                    'required' => ['start_date', 'end_date']
                ]
            ],
            [
                'name' => 'get_stock_level',
                'description' => 'Get stock quantity for a product',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'product_name' => ['type' => 'string']
                    ],
                    'required' => ['product_name']
                ]
            ],
            [
                'name' => 'get_profit_summary',
                'description' => 'Get profit, revenue, cost and margin for date range',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD']
                    ],
                    'required' => ['start_date', 'end_date']
                ]
            ],
            [
                'name' => 'get_expense_summary',
                'description' => 'Get expense total and breakdown by category',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'category' => ['type' => 'string', 'description' => 'Optional category filter']
                    ],
                    'required' => ['start_date', 'end_date']
                ]
            ],
            [
                'name' => 'get_top_products',
                'description' => 'Get best selling products by revenue',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'limit' => ['type' => 'integer', 'description' => 'Number of products to return, default 5']
                    ],
                    'required' => ['start_date', 'end_date']
                ]
            ],
            [
                'name' => 'get_purchase_summary',
                'description' => 'Get purchase total and count for date range',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'start_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                        'end_date' => ['type' => 'string', 'description' => 'YYYY-MM-DD']
                    ],
                    'required' => ['start_date', 'end_date']
                ]
            ],
            [
                'name' => 'get_party_balance',
                'description' => 'Get balance owed by or to a customer/supplier',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'party_name' => ['type' => 'string']
                    ],
                    'required' => ['party_name']
                ]
            ],
            [
                'name' => 'analyze_cash_discrepancy',
                'description' => 'Help user find why their physical cash doesn\'t match the system balance. Analyzes recent transactions to suggest possible causes.',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'discrepancy_amount' => ['type' => 'number', 'description' => 'The difference between physical count and system balance'],
                        'is_short' => ['type' => 'boolean', 'description' => 'True if physical cash is LESS than system (short), false if MORE (over)']
                    ],
                    'required' => ['discrepancy_amount', 'is_short']
                ]
            ]
        ];
    }
}
