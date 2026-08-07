<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function processSale(array $items, $partyId = null)
    {
        return DB::transaction(function () use ($items, $partyId) {
            $totalAmount = 0;

            foreach ($items as $item) {
                $product = Product::with('recipes.childProduct')->findOrFail($item['id']);
                $quantity = $item['quantity'];

                $this->deductStock($product, $quantity);

                $totalAmount += $product->price * $quantity;
            }

            return $totalAmount;
        });
    }

    public function deductStock(Product $product, $quantity)
    {
        if ($product->type === 'composite') {
            // Check if we have enough "Made" stock
            $availableStock = $product->stocks()->where('status', 'available')->sum('quantity');

            if ($availableStock >= $quantity) {
                // Deduct from existing stock
                $this->deductFromBatches($product, $quantity);
            } else {
                // Mode A: Make Now logic

                // 1. Deduct what we have in pre-made stock
                $remainingNeeded = $quantity;

                if ($availableStock > 0) {
                    $this->deductFromBatches($product, $availableStock);
                    $remainingNeeded -= $availableStock;
                }

                // 2. Deduct ingredients for the remaining needed
                // We don't create negative stock for the composite item itself in this mode,
                // we just consume the raw materials.
                // However, for tracking sales, we might want to record that we sold X amount.
                // But strictly inventory wise, the raw materials are gone.

                foreach ($product->recipes as $recipe) {
                    $ingredientQty = $recipe->quantity_required * $remainingNeeded;
                    // Recursively deduct ingredients
                    // Ensure we load recipes for the child if it is also composite (nested recipes)
                    $childProduct = $recipe->childProduct;
                    // We might need to load recipes for child if not loaded, but for now assume 1 level depth or lazy load
                    $this->deductStock($childProduct, $ingredientQty);
                }
            }
        } else {
            // Standard/Weighted Item
            $this->deductFromBatches($product, $quantity);
        }
    }

    private function deductFromBatches(Product $product, $quantity)
    {
        // FIFO: Get oldest available stock
        $stocks = $product->stocks()
            ->where('status', 'available')
            ->orderBy('created_at', 'asc')
            ->get();

        $remainingToDeduct = $quantity;

        foreach ($stocks as $stock) {
            if ($remainingToDeduct <= 0)
                break;

            if ($stock->quantity >= $remainingToDeduct) {
                $stock->decrement('quantity', $remainingToDeduct);
                $remainingToDeduct = 0;
            } else {
                $remainingToDeduct -= $stock->quantity;
                $stock->update(['quantity' => 0]);
            }
        }

        // If we still have remaining to deduct (Negative Stock), create a negative stock entry
        // This usually happens for Standard items if we sell more than we have.
        if ($remainingToDeduct > 0) {
            Stock::create([
                'product_id' => $product->id,
                'quantity' => -$remainingToDeduct,
                'status' => 'available',
            ]);
        }
    }
}
