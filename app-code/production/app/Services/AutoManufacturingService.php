<?php

namespace App\Services;

use App\Models\ManufacturingRule;
use App\Models\ManufacturingLog;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoManufacturingService
{
    /**
     * Process auto-manufacturing for a completed sale
     */
    public function processSale(Sale $sale): array
    {
        $notifications = [];

        foreach ($sale->items as $saleItem) {
            $product = $saleItem->product;

            // Check if this product has manufacturing rules
            $rule = ManufacturingRule::where('product_id', $product->id)
                ->where('is_active', true)
                ->with('ingredients.ingredientProduct')
                ->first();

            if (!$rule || !$rule->canManufacture()) {
                continue;
            }

            // Process manufacturing
            $result = $this->manufacture($rule, $saleItem->quantity, $sale);

            if ($result['success']) {
                $notifications[] = $result['notification'];
            }
        }

        return $notifications;
    }

    /**
     * Execute manufacturing: deduct ingredients from stock
     */
    /**
     * Manufacture a specific product by ID if needed
     */
    public function manufactureByProductId(string $productId, float $quantity, Sale $sale): array
    {
        $rule = $this->getProductRules($productId);
        if (!$rule || !$rule->canManufacture()) {
            return ['success' => false, 'message' => 'No active manufacturing rule found'];
        }

        return $this->manufacture($rule, $quantity, $sale);
    }

    /**
     * Execute manufacturing: deduct ingredients from stock AND add to parent stock
     */
    protected function manufacture(ManufacturingRule $rule, float $quantity, Sale $sale): array
    {
        // DB Transaction is handled by caller (SaleController) usually, but we can nest it.
        // Since SaleController wraps everything in transaction, we are safe.

        try {
            $deductions = [];
            $insufficientStock = [];

            // Check stock availability first
            foreach ($rule->ingredients as $ingredient) {
                $requiredQty = $ingredient->getRequiredQuantity($quantity);

                if (!$ingredient->hasEnoughStock($requiredQty)) {
                    $insufficientStock[] = [
                        'product' => $ingredient->ingredientProduct->name,
                        'required' => $requiredQty,
                        'available' => \App\Models\Stock::where('product_id', $ingredient->ingredientProduct->id)->where('warehouse_id', $sale->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1))->sum('quantity'),
                        'unit' => $ingredient->unit
                    ];
                }
            }

            // If insufficient stock, log warning and return failure
            if (!empty($insufficientStock)) {
                Log::warning('Insufficient stock for auto-manufacturing', [
                    'rule' => $rule->name,
                    'sale_id' => $sale->id,
                    'insufficient' => $insufficientStock
                ]);

                return [
                    'success' => false,
                    'notification' => $this->buildInsufficientStockNotification($rule, $insufficientStock)
                ];
            }

            // Deduct ingredients AND calculate total manufacturing cost
            $totalManufacturingCost = 0;

            foreach ($rule->ingredients as $ingredient) {
                $requiredQty = $ingredient->getRequiredQuantity($quantity);
                $product = $ingredient->ingredientProduct;

                // Calculate cost contribution from this ingredient
                $ingredientCostPerUnit = $product->cost_price ?? 0;
                $ingredientTotalCost = $ingredientCostPerUnit * $requiredQty;
                $totalManufacturingCost += $ingredientTotalCost;

                // Update stock
                $stock = \App\Models\Stock::where('product_id', $product->id)
                    ->where('warehouse_id', $sale->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1))
                    ->first();

                $currentStock = 0;
                if ($stock) {
                    $stock->decrement('quantity', $requiredQty);
                    $currentStock = $stock->quantity; // After decrement
                } else {
                    \App\Models\Stock::create([
                        'product_id' => $product->id,
                        'warehouse_id' => $sale->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1),
                        'quantity' => -$requiredQty
                    ]);
                    $currentStock = -$requiredQty;
                }

                $deductions[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $requiredQty,
                    'unit' => $ingredient->unit,
                    'cost_per_unit' => $ingredientCostPerUnit,
                    'total_cost' => $ingredientTotalCost,
                    'from_stock' => $currentStock + $requiredQty,
                    'to_stock' => $currentStock
                ];
            }

            // INCREMENT Parent Product Stock (The "Assembly" part)
            $parentStock = \App\Models\Stock::where('product_id', $rule->product_id)
                ->where('warehouse_id', $sale->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1))
                ->first();

            if ($parentStock) {
                $parentStock->increment('quantity', $quantity);
            } else {
                \App\Models\Stock::create([
                    'product_id' => $rule->product_id,
                    'warehouse_id' => $sale->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1),
                    'quantity' => $quantity
                ]);
            }

            // Create manufacturing log with cost data
            $notification = $this->buildSuccessNotification($rule, $quantity, $deductions, $totalManufacturingCost);

            ManufacturingLog::create([
                'rule_id' => $rule->id,
                'sale_id' => $sale->id,
                'user_id' => $sale->user_id,
                'quantity_produced' => $quantity,
                'deductions' => $deductions,
                'notification_message' => $notification,
                'manufactured_at' => now()
            ]);

            return [
                'success' => true,
                'notification' => $notification,
                'deductions' => $deductions,
                'manufacturing_cost' => $totalManufacturingCost, // NEW: Actual cost from ingredients
                'cost_per_unit' => $quantity > 0 ? ($totalManufacturingCost / $quantity) : 0 // Cost per manufactured item
            ];

        } catch (\Exception $e) {
            Log::error('Auto-manufacturing failed', [
                'rule' => $rule->name,
                'sale_id' => $sale->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'notification' => "⚠️ Auto-manufacturing failed for {$rule->product->name}"
            ];
        }
    }

    /**
     * Build success notification message with cost information
     */
    protected function buildSuccessNotification(ManufacturingRule $rule, float $quantity, array $deductions, float $totalCost = 0): string
    {
        $ingredientsList = collect($deductions)->map(function ($item) {
            return "{$item['quantity']}{$item['unit']} {$item['product_name']}";
        })->join(' + ');

        $costInfo = $totalCost > 0 ? " (Cost: Rs " . number_format($totalCost, 2) . ")" : "";

        return "✅ Auto-deducted: {$ingredientsList} → {$quantity} {$rule->product->name}{$costInfo}";
    }

    /**
     * Build insufficient stock notification
     */
    protected function buildInsufficientStockNotification(ManufacturingRule $rule, array $insufficient): string
    {
        $list = collect($insufficient)->map(function ($item) {
            return "{$item['product']} (need: {$item['required']}{$item['unit']}, have: {$item['available']}{$item['unit']})";
        })->join(', ');

        return "⚠️ Insufficient stock for {$rule->product->name}: {$list}";
    }

    /**
     * Get manufacturing rules for a product
     */
    public function getProductRules(string $productId): ?ManufacturingRule
    {
        return ManufacturingRule::where('product_id', $productId)
            ->where('is_active', true)
            ->with('ingredients.ingredientProduct')
            ->first();
    }

    /**
     * Check if product has manufacturing rules
     */
    public function hasManufacturingRules(string $productId): bool
    {
        return ManufacturingRule::where('product_id', $productId)
            ->where('is_active', true)
            ->exists();
    }
}
