<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManufacturingRule;
use App\Models\ManufacturingIngredient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManufacturingRuleController extends Controller
{
    public function index()
    {
        $rules = ManufacturingRule::with(['product', 'ingredients.ingredientProduct'])
            ->get()
            ->map(function ($rule) {
                return [
                    'id' => $rule->id,
                    'product_id' => $rule->product_id,
                    'product_name' => $rule->product->name,
                    'name' => $rule->name,
                    'description' => $rule->description,
                    'is_active' => $rule->is_active,
                    'ingredients' => $rule->ingredients->map(function ($ing) {
                        return [
                            'id' => $ing->id,
                            'ingredient_product_id' => $ing->ingredient_product_id,
                            'ingredient_name' => $ing->ingredientProduct->name,
                            'quantity_per_unit' => $ing->quantity_per_unit,
                            'unit' => $ing->unit
                        ];
                    })
                ];
            });

        return response()->json($rules);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.ingredient_product_id' => 'required|exists:products,id',
            'ingredients.*.quantity_per_unit' => 'required|numeric|min:0',
            'ingredients.*.unit' => 'required|string|in:g,kg,ml,l,pcs'
        ]);

        DB::beginTransaction();

        try {
            $rule = ManufacturingRule::create([
                'product_id' => $request->product_id,
                'name' => $request->name,
                'description' => $request->description,
                'is_active' => $request->is_active ?? true
            ]);

            foreach ($request->ingredients as $ingredient) {
                ManufacturingIngredient::create([
                    'rule_id' => $rule->id,
                    'ingredient_product_id' => $ingredient['ingredient_product_id'],
                    'quantity_per_unit' => $ingredient['quantity_per_unit'],
                    'unit' => $ingredient['unit']
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Manufacturing rule created',
                'rule' => $rule->load('ingredients')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create rule: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $rule = ManufacturingRule::findOrFail($id);

        $request->validate([
            'is_active' => 'sometimes|boolean',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string'
        ]);

        $rule->update($request->only(['is_active', 'name', 'description']));

        return response()->json([
            'success' => true,
            'message' => 'Rule updated',
            'rule' => $rule
        ]);
    }

    public function destroy($id)
    {
        $rule = ManufacturingRule::findOrFail($id);
        $rule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rule deleted'
        ]);
    }

    public function simulate(Request $request, $id)
    {
        $rule = ManufacturingRule::with(['ingredients.ingredientProduct'])->findOrFail($id);

        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'planned_qty'  => 'required|numeric|min:0.0001',
        ]);

        $warehouseId = $request->input('warehouse_id');
        $plannedQty  = (float) $request->input('planned_qty');
        
        $items = [];
        $feasible = true;
        $totalEstimatedCost = 0.00;

        foreach ($rule->ingredients as $ing) {
            $requiredQty = round($ing->quantity_per_unit * $plannedQty, 4);

            $availableQty = (float) DB::table('stocks')
                ->where('product_id', $ing->ingredient_product_id)
                ->where('warehouse_id', $warehouseId)
                ->value('quantity') ?? 0.0;

            $missingQty = max(0.0, $requiredQty - $availableQty);
            if ($missingQty > 0) {
                $feasible = false;
            }

            $costPrice = (float) $ing->ingredientProduct->cost_price;
            $estimatedCost = round($requiredQty * $costPrice, 2);
            $totalEstimatedCost += $estimatedCost;

            $items[] = [
                'ingredient_product_id' => $ing->ingredient_product_id,
                'ingredient_name'       => $ing->ingredientProduct->name,
                'sku'                   => $ing->ingredientProduct->sku,
                'required_qty'          => $requiredQty,
                'available_qty'         => $availableQty,
                'missing_qty'           => $missingQty,
                'unit_cost'             => $costPrice,
                'estimated_cost'        => $estimatedCost,
                'unit'                  => $ing->unit,
            ];
        }

        return response()->json([
            'success'              => true,
            'feasible'             => $feasible,
            'items'                => $items,
            'total_estimated_cost' => $totalEstimatedCost,
        ]);
    }
}
