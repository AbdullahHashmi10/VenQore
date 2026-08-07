<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateProductDescriptionsJob;
use App\Models\Product;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductDescriptionController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context.'], 403);
        }

        $tenant = app('current.tenant');

        if ($tenant->ai_descriptions_balance <= 0 && !PlanGate::check('ai_product_descriptions')) {
            return response()->json([
                'error'   => 'Insufficient AI description credits. Please purchase a description pack.',
                'balance' => $tenant->ai_descriptions_balance,
            ], 402);
        }

        $validated = $request->validate([
            'product_ids'   => 'required|array|min:1|max:20',
            'product_ids.*' => 'string',
            'target'        => 'nullable|string|in:web,woocommerce,amazon,in_store',
        ]);

        $target = $validated['target'] ?? 'web';

        GenerateProductDescriptionsJob::dispatch(
            $tenant->id,
            $validated['product_ids'],
            $target
        );

        return response()->json([
            'message' => 'AI product description generation queued.',
            'count'   => count($validated['product_ids']),
        ]);
    }

    public function apply(Request $request): JsonResponse
    {
        if (!app()->bound('current.tenant')) {
            return response()->json(['error' => 'No tenant context.'], 403);
        }

        $tenant = app('current.tenant');

        $validated = $request->validate([
            'product_id' => 'required|integer',
        ]);

        $product = Product::where('tenant_id', $tenant->id)
            ->where('id', $validated['product_id'])
            ->firstOrFail();

        if (empty($product->ai_title)) {
            return response()->json(['error' => 'No generated AI description found for this product.'], 422);
        }

        $product->update([
            'name'        => $product->ai_title,
            'description' => $product->ai_description_long ?? $product->ai_description_short,
        ]);

        return response()->json([
            'message' => 'AI description applied to product.',
            'product' => $product,
        ]);
    }
}
