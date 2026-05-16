<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class RecycleBinController extends Controller
{
    public function index()
    {
        $deletedProducts = Product::onlyTrashed()
            ->with(['category', 'brand'])
            ->latest('deleted_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'product',
                    'title' => $item->name,
                    'description' => $item->sku ? "SKU: {$item->sku}" : 'No SKU',
                    'deleted_at' => $item->deleted_at->toDateTimeString()
                ];
            });

        $deletedSales = \App\Models\Sale::onlyTrashed()
            ->with(['party', 'items'])
            ->latest('deleted_at')
            ->get()
            ->map(function ($item) {
                $isReturn = $item->status === 'returned';
                return [
                    'id' => $item->id,
                    'type' => 'sale',
                    'title' => ($isReturn ? "Return Invoice #" : "Invoice #") . $item->reference_number,
                    'description' => "Customer: " . ($item->party->name ?? 'Walk-in') . " - Total: " . number_format(abs($item->total)),
                    'deleted_at' => $item->deleted_at->toDateTimeString()
                ];
            });

        $deletedPreSales = \App\Models\SalesOrder::onlyTrashed()
            ->with(['customer', 'items'])
            ->latest('deleted_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'pre_sale',
                    'title' => "Pre-Sale #" . $item->order_number,
                    'description' => "Customer: " . ($item->customer_name ?? 'Walk-in') . " - Total: " . number_format($item->total_amount),
                    'deleted_at' => $item->deleted_at->toDateTimeString()
                ];
            });

        $deletedProposals = \App\Models\Proposal::onlyTrashed()
            ->with(['customer', 'items'])
            ->latest('deleted_at')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'proposal',
                    'title' => "Proposal #" . $item->proposal_number,
                    'description' => "Customer: " . ($item->customer->name ?? 'Walk-in') . " - Total: " . number_format($item->total_amount),
                    'deleted_at' => $item->deleted_at->toDateTimeString()
                ];
            });

        $debugItem = [
            'id' => 'debug-1',
            'type' => 'product',
            'title' => 'System Check (Test Item)',
            'description' => 'If you see this, the Recycle Bin is working!',
            'deleted_at' => now()->toDateTimeString()
        ];

        $items = collect()
            ->concat($deletedProducts)
            ->concat($deletedSales)
            ->concat($deletedPreSales)
            ->concat($deletedProposals)
            ->push($debugItem)
            ->sortByDesc('deleted_at')
            ->values();

        return Inertia::render('RecycleBin', [
            'items' => $items,
            'mode' => 'admin'
        ]);
    }

    public function restore(Request $request, $id)
    {
        $type = $request->input('type');

        if ($type === 'product') {
            $product = Product::withTrashed()->findOrFail($id);
            $product->restore();
            
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'restore',
                'description' => "Restored product: {$product->name}",
                'subject_type' => Product::class,
                'subject_id' => $product->id,
            ]);
        } elseif ($type === 'sale') {
            $sale = \App\Models\Sale::withTrashed()->with('items')->findOrFail($id);
            
            $sale->restore();

            if ($sale->items) {
                foreach ($sale->items()->withTrashed()->get() as $item) {
                    $item->restore();

                    // Standard Sales deduct stock. Returns add stock.
                    // We must re-apply whatever the operation originally did.
                    $modifier = ($sale->status === 'returned') ? 1 : -1;
                    $qtyToAdjust = abs($item->quantity) * $modifier;

                    if ($item->product_variant_id) {
                        \App\Models\ProductVariant::find($item->product_variant_id)?->increment('stock', $qtyToAdjust);
                    } elseif ($item->product_id) {
                        \App\Models\Stock::where('product_id', $item->product_id)->first()?->increment('quantity', $qtyToAdjust);
                    }
                }
            }
            $sale->payments()->withTrashed()->restore();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'restore',
                'description' => "Restored Sale/Return: {$sale->reference_number}",
                'subject_type' => \App\Models\Sale::class,
                'subject_id' => $sale->id,
            ]);
        } elseif ($type === 'pre_sale') {
            $order = \App\Models\SalesOrder::withTrashed()->findOrFail($id);
            $order->restore();

            if ($order->items) {
                $order->items()->withTrashed()->restore();
            }

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'restore',
                'description' => "Restored Pre-Sale: {$order->order_number}",
                'subject_type' => \App\Models\SalesOrder::class,
                'subject_id' => $order->id,
            ]);

        } elseif ($type === 'proposal') {
            $proposal = \App\Models\Proposal::withTrashed()->findOrFail($id);
            $proposal->restore();

            if ($proposal->items) {
                $proposal->items()->withTrashed()->restore();
            }

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'restore',
                'description' => "Restored Proposal: {$proposal->proposal_number}",
                'subject_type' => \App\Models\Proposal::class,
                'subject_id' => $proposal->id,
            ]);
        }

        return redirect()->back()->with('success', ucfirst(str_replace('_', ' ', $type)) . ' restored successfully.');
    }

    public function forceDelete(Request $request, $id)
    {
        $type = $request->input('type');

        if ($type === 'product') {
            $product = Product::withTrashed()->findOrFail($id);

            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }

            $name = $product->name;
            $product->forceDelete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'force_delete',
                'description' => "Permanently deleted product: {$name}",
                'subject_type' => Product::class,
                'subject_id' => $id,
            ]);

        } elseif ($type === 'sale') {
            $sale = \App\Models\Sale::withTrashed()->findOrFail($id);
            $ref = $sale->reference_number;
            
            $sale->items()->withTrashed()->forceDelete();
            $sale->payments()->withTrashed()->forceDelete();
            $sale->forceDelete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'force_delete',
                'description' => "Permanently deleted Sale/Return: {$ref}",
                'subject_type' => \App\Models\Sale::class,
                'subject_id' => $id,
            ]);
        } elseif ($type === 'pre_sale') {
            $order = \App\Models\SalesOrder::withTrashed()->findOrFail($id);
            $ref = $order->order_number;
            
            $order->items()->withTrashed()->forceDelete();
            $order->forceDelete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'force_delete',
                'description' => "Permanently deleted Pre-Sale: {$ref}",
                'subject_type' => \App\Models\SalesOrder::class,
                'subject_id' => $id,
            ]);
        } elseif ($type === 'proposal') {
            $proposal = \App\Models\Proposal::withTrashed()->findOrFail($id);
            $ref = $proposal->proposal_number;
            
            $proposal->items()->withTrashed()->forceDelete();
            $proposal->forceDelete();

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'force_delete',
                'description' => "Permanently deleted Proposal: {$ref}",
                'subject_type' => \App\Models\Proposal::class,
                'subject_id' => $id,
            ]);
        }

        return redirect()->back()->with('success', ucfirst(str_replace('_', ' ', $type)) . ' permanently deleted.');
    }
}
