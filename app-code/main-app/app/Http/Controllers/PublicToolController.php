<?php

namespace App\Http\Controllers;

use App\Models\PublicToolRequest;
use App\Services\PublicToolBudgetGuard;
use App\Services\SmartCapture\AiExtractionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PublicToolController extends Controller
{
    public function showSmartCapture(): Response
    {
        return Inertia::render('Marketing/Tools/SmartCapture', [
            'turnstileSiteKey' => config('services.cloudflare.turnstile_site_key', ''),
            'toolGroups'       => \App\Support\ToolRegistry::groups(),
        ]);
    }

    public function submitSmartCapture(
        Request $request,
        PublicToolBudgetGuard $guard,
        AiExtractionService $aiService,
        \App\Services\Ai\AiSpendGuard $spendGuard
    ): JsonResponse {
        $turnstileSecret = config('services.cloudflare.turnstile_secret_key');
        
        $rules = [
            'email' => 'required|email|max:255',
            'file'  => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'type'  => 'required|string|in:invoice,purchase,expense,quotation,packing_slip,credit_note,purchase_order',
        ];

        $request->validate($rules);

        $email = strtolower(trim($request->input('email')));
        $ip    = $request->ip() ?? '127.0.0.1';

        // 1. Mandatory Turnstile Server-Side Verification (when secret configured)
        if (!empty($turnstileSecret)) {
            $token = $request->input('turnstile_token');
            if (empty($token)) {
                return response()->json([
                    'success' => false,
                    'error'   => 'CAPTCHA verification token required.',
                    'reason'  => 'turnstile_missing',
                ], 422);
            }

            $verifyRes = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret'   => $turnstileSecret,
                'response' => $token,
                'remoteip' => $ip,
            ]);

            if (!$verifyRes->json('success')) {
                return response()->json([
                    'success' => false,
                    'error'   => 'CAPTCHA verification failed. Please try submitting again.',
                    'reason'  => 'turnstile_failed',
                ], 422);
            }
        }

        // 2. Atomic Budget & Limit Reservation
        $rateLimiter = app(\App\Services\Ai\AiRateLimiter::class);
        $rateCheck = $rateLimiter->tryAcquire('public_tool');
        if (!$rateCheck['ok']) {
            return response()->json([
                'success' => false,
                'error'   => 'The free scanner tool is receiving high traffic right now. Please wait a moment and try again.',
                'reason'  => 'rate_limit',
            ], 429);
        }

        $estimatedCost = 0.0120;
        $check = $guard->checkAndReserve($email, $ip, $estimatedCost, 10.00);

        if (!$check['allowed']) {
            return response()->json([
                'success'  => false,
                'error'    => $check['message'],
                'reason'   => $check['reason'],
                'waitlist' => true,
            ], 429);
        }

        if (!$spendGuard->checkAndRecord('public_tool', $estimatedCost, 10.00)) {
            return response()->json([
                'success' => false,
                'error'   => 'The free scanner tool daily spend budget has been reached for today. Please try again tomorrow.',
                'reason'  => 'spend_cap_exceeded',
            ], 429);
        }

        // 3. Real AI Extraction Service Call (Phase 1 engine) — NO FAKE FALLBACKS
        $extractedItems = [];
        $vendorName     = 'Scanned Invoice';
        $invoiceNo      = 'INV-PUBLIC-' . rand(1000, 9999);
        $subtotal       = 0.00;

        $type = $request->input('type', 'purchase');
        $extractionType = match($type) {
            'invoice'        => 'sale',
            'purchase'       => 'purchase',
            'expense'        => 'expense',
            'quotation'      => 'proposal',
            'packing_slip'   => 'sale',
            'credit_note'    => 'return',
            'purchase_order' => 'pre_purchase',
            default          => 'purchase',
        };

        try {
            $file   = $request->file('file');
            $base64 = base64_encode(file_get_contents($file->getRealPath()));
            $mime   = $file->getMimeType();

            $extractionResult = $aiService->extract(
                'image',
                [['base64' => $base64, 'mime' => $mime]],
                $extractionType,
                null,
                ['feature' => 'public_tool']
            );

            $actualCost = (float) ($extractionResult['cost_usd'] ?? $estimatedCost);
            $spendGuard->reconcile('public_tool', $estimatedCost, $actualCost);

            if (!empty($extractionResult['items'])) {
                foreach ($extractionResult['items'] as $item) {
                    $qty   = (float) ($item['qty'] ?? 1);
                    $price = (float) ($item['unit_price'] ?? $item['price'] ?? 0);
                    $tot   = (float) ($item['total'] ?? ($qty * $price));

                    $extractedItems[] = [
                        'item_name'  => $item['name'] ?? $item['description'] ?? 'Extracted Product',
                        'qty'        => $qty,
                        'unit_price' => $price,
                        'total'      => $tot,
                    ];
                    $subtotal += $tot;
                }
            }
            if (!empty($extractionResult['party'])) {
                $vendorName = $extractionResult['party'];
            } elseif (!empty($extractionResult['vendor_name'])) {
                $vendorName = $extractionResult['vendor_name'];
            }

            if (!empty($extractionResult['reference'])) {
                $invoiceNo = $extractionResult['reference'];
            } elseif (!empty($extractionResult['invoice_number'])) {
                $invoiceNo = $extractionResult['invoice_number'];
            }
        } catch (\Throwable $e) {
            Log::error('Public tool AI extraction failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error'   => 'Invoice extraction failed. Please provide a clear, readable image or PDF document.',
            ], 422);
        }

        // Strict requirement: zero extracted items is an error, never serve fake data
        if (empty($extractedItems)) {
            return response()->json([
                'success' => false,
                'error'   => 'No valid invoice items could be extracted from the uploaded document.',
            ], 422);
        }

        $resultPayload = [
            'vendor_name' => $vendorName . ' (Watermarked Output)',
            'invoice_no'  => $invoiceNo,
            'date'        => now()->toDateString(),
            'subtotal'    => $subtotal,
            'items'       => $extractedItems,
            'watermark'   => 'FREE SCANNER DEMO — SIGN UP FOR VENQORE TO REMOVE WATERMARK',
        ];

        PublicToolRequest::create([
            'email'       => $email,
            'ip_address'  => $ip,
            'feature'     => 'public_tool',
            'result_json' => $resultPayload,
            'cost_usd'    => $estimatedCost,
            'created_at'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $resultPayload,
        ]);
    }
}
