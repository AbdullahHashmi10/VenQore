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

    /**
     * Free public invoice scanner (anonymous, image/PDF only).
     *
     * WHY THIS DOES NOT CALL AiGateway::resolve(): the extraction runs through
     * AiExtractionService -> SmartCaptureExtractionBridge (multimodal upload,
     * provider-specific transports, model substitution) which ModelResolver does
     * not implement. Rewriting that pipeline is out of scope, so the call is
     * wrapped in AiGateway::meter() instead: the gateway still owns the rate
     * limit (per hashed IP, ai_limits.features.public_tool.anon_day_limit) and
     * spend (per-IP anon_spend_cap + global anon_global_spend_cap). This
     * controller never touches AiRateLimiter / AiSpendGuard. No free text
     * reaches the model (image-only, fixed prompt), so there is no scope entry.
     *
     * Layers, cheapest first: route throttle -> upload validation (type + 5 MB)
     * -> Turnstile -> monthly email/IP quota (PublicToolBudgetGuard::checkQuota)
     * -> AiGateway::meter (per-IP daily cap, per-IP + global daily spend).
     */
    public function submitSmartCapture(
        Request $request,
        PublicToolBudgetGuard $guard,
        AiExtractionService $aiService,
        \App\Services\Ai\AiGateway $gateway
    ): JsonResponse {
        $turnstileSecret = config('services.cloudflare.turnstile_secret_key');

        $maxKb = (int) config('ai_limits.features.public_tool.max_upload_kb', 5120);
        $mimes = (array) config('ai_limits.features.public_tool.upload_mimes', ['jpg', 'jpeg', 'png', 'pdf']);

        $rules = [
            'email' => 'required|email|max:255',
            'file'  => [
                'required',
                'file',
                'mimes:' . implode(',', $mimes),
                'mimetypes:image/jpeg,image/png,application/pdf',
                'max:' . $maxKb,
            ],
            'type'  => 'nullable|string|in:invoice,purchase,expense,quotation,packing_slip,credit_note,purchase_order',
            'turnstile_token' => 'nullable|string|max:4096',
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

        // 2. Product quota (free scans per email / per IP per month). Not a rate
        //    limit or spend cap — those are the gateway's, in step 3.
        $quota = $guard->checkQuota($email, $ip);
        if (!$quota['allowed']) {
            return response()->json([
                'success'  => false,
                'error'    => $quota['message'],
                'reason'   => $quota['reason'],
                'waitlist' => true,
            ], 429);
        }

        $estimatedCost = (float) (config('ai_models.public_tool.est_cost_usd')
            ?? config('ai_limits.features.public_tool.estimated_cost', 0.0120));

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

            $metered = $gateway->meter(
                \App\Services\Ai\AiRequest::for('public_tool')
                    ->tenant(null)
                    ->entitlementMode('public_tool'),
                function () use ($aiService, $base64, $mime, $extractionType) {
                    try {
                        $data = $aiService->extract(
                            'image',
                            [['base64' => $base64, 'mime' => $mime]],
                            $extractionType,
                            null,
                            ['feature' => 'public_tool', 'entitlement_mode' => 'public_tool']
                        );
                    } catch (\Throwable $e) {
                        if ($aiService->lastRequestCount === 0) {
                            // Rejected before any upstream call (bad image, no
                            // key): model=null tells meter() nothing was spent.
                            return \App\Services\Ai\AiResult::failure('extraction_failed', $e->getMessage(), 'deterministic');
                        }
                        throw $e; // upstream was called: the estimate stands
                    }

                    // Actual cost is recorded per call by the bridge; the gateway
                    // keeps the estimate on the spend counters (costUsd 0).
                    return \App\Services\Ai\AiResult::success($data, 'model', $aiService->lastModelUsed ?? 'unknown');
                }
            );

            if (!$metered->ok) {
                if ($metered->failureCode === 'rate_limited') {
                    return response()->json([
                        'success' => false,
                        'error'   => 'You have reached the free scanner limit for today. Please try again tomorrow, or sign up for VenQore for unlimited scans.',
                        'reason'  => 'rate_limit',
                    ], 429);
                }
                if ($metered->failureCode === 'spend_capped') {
                    return response()->json([
                        'success'  => false,
                        'error'    => 'Daily free tool budget limit reached. Please join the waitlist or sign up for a free account.',
                        'reason'   => 'budget_exceeded',
                        'waitlist' => true,
                    ], 429);
                }

                throw new \RuntimeException($metered->errorMessage ?? (string) $metered->failureCode);
            }

            $extractionResult = is_array($metered->value) ? $metered->value : [];

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
