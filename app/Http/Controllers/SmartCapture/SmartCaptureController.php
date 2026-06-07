<?php

namespace App\Http\Controllers\SmartCapture;

use App\Http\Controllers\Controller;
use App\Services\PlanGate;
use App\Services\SmartCapture\GeminiExtractionService;
use App\Services\SmartCapture\FuzzyMatchService;
use App\Services\SmartCapture\IntentResolverService;
use App\Services\SmartCapture\TransactionBuilderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SmartCaptureController extends Controller
{
    public function __construct(
        private GeminiExtractionService $extractionService,
        private FuzzyMatchService       $fuzzyMatchService,
        private IntentResolverService   $intentResolverService,
        private TransactionBuilderService $transactionBuilderService
    ) {}

    /**
     * Parse uploaded file or base64 and match items against catalog.
     */
    public function extract(Request $request)
    {
        // ── Plan Gate: SmartCapture is a paid AI add-on ───────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('smart_capture');
        }

        $request->validate([
            'type'           => 'required|in:image,audio',
            'base64'         => 'required|string',
            'mime_type'      => 'required|string',
            'target_type'    => 'nullable|string|in:purchase,sale,expense,return,proposal,pre_invoice,pre_purchase,recurring_invoice,purchase_return',
            'custom_command' => 'nullable|string',
        ]);

        $type = $request->input('type');
        $base64 = $request->input('base64');
        $mimeType = $request->input('mime_type');
        $targetType = $request->input('target_type');
        $customCommand = $request->input('custom_command');

        try {
            // 1. Call Gemini to parse invoice/audio details
            $existingProducts = [];
            $tenant = app('current.tenant');
            if ($tenant) {
                $existingProducts = \App\Models\Product::get(['name', 'sku'])->map(function ($p) {
                    return ['name' => $p->name, 'sku' => $p->sku];
                })->toArray();
            }

            if ($type === 'image') {
                $rawResult = $this->extractionService->extractFromImage($base64, $mimeType, $targetType, $customCommand, $existingProducts);
            } else {
                $rawResult = $this->extractionService->extractFromAudio($base64, $mimeType, $targetType, $customCommand, $existingProducts);
            }

            // 2. Resolve Action Intent
            $resolvedAction = $this->intentResolverService->resolve($rawResult['action'] ?? 'sale');

            // 3. Fuzzy match each extracted product name
            $matchedItems = [];
            $items = $rawResult['items'] ?? [];

            foreach ($items as $item) {
                $itemName = $item['name'] ?? '';
                $qty = (float) ($item['qty'] ?? 1);
                $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : null;

                if (empty($itemName)) {
                    continue;
                }

                $matches = $this->fuzzyMatchService->matchProduct($itemName);

                // Use the best candidate if available
                $bestMatch = $matches[0] ?? null;
                $confidence = $bestMatch['confidence'] ?? 0;
                $productId = $bestMatch['product']->id ?? null;
                
                $matchedItems[] = [
                    'raw_name'   => $itemName,
                    'qty'        => $qty,
                    'unit_price' => $unitPrice ?? ($bestMatch['product']->price ?? null),
                    'confidence' => $confidence,
                    'product_id' => $productId,
                    'candidates' => array_map(function ($m) {
                        return [
                            'id'         => $m['product']->id,
                            'name'       => $m['product']->name,
                            'sku'        => $m['product']->sku,
                            'sale_price' => $m['product']->price,
                            'cost_price' => $m['product']->cost_price,
                            'confidence' => $m['confidence'],
                        ];
                    }, $matches)
                ];
            }

            return response()->json([
                'success' => true,
                'action'  => $resolvedAction,
                'party'   => $rawResult['party'] ?? null,
                'items'   => $matchedItems
            ]);

        } catch (\Exception $e) {
            Log::error("SmartCapture extraction action failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse request: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Process confirmed line items and write transaction.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'action'         => 'required|in:purchase,sale,expense,return,invoice,proposal,pre_invoice,pre_purchase,recurring_invoice,purchase_return',
            'party'          => 'nullable|string',
            'payment_method' => 'required|in:cash,credit,bank',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|string',
            'items.*.qty'        => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.name'       => 'nullable|string', // used in operating expenses description
        ]);

        try {
            $result = $this->transactionBuilderService->confirm($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Transaction successfully posted!',
                'data'    => $result
            ]);

        } catch (\Exception $e) {
            Log::error("SmartCapture confirmation failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to record transaction: ' . $e->getMessage()
            ], 422);
        }
    }
}
