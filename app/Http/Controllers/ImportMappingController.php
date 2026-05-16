<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use App\Imports\ProductsImport;
use App\Imports\PartiesImport;

class ImportMappingController extends Controller
{
    public function uploadForMapping(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt,xls',
            'type' => 'required|string'
        ]);

        $type = $request->input('type');
        $file = $request->file('file');

        // Store file temporarily in the exact directory where Laravel's Excel package can read it via raw path
        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->move(storage_path('app/temp_imports'), $fileName);
        $fullPath = storage_path('app/temp_imports/' . $fileName);

        try {
            // Read first 100 rows using a simple import object
            $data = Excel::toArray(new \stdClass(), $fullPath);
            if (!empty($data) && count($data) > 0) {
                $data = $data[0]; // First sheet
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Upload Mapping Error: ' . $e->getMessage() . ' - File: ' . $e->getFile() . ':' . $e->getLine());
            return back()->with('error', 'Could not read the file: ' . $e->getMessage());
        }

        if (count($data) < 2) {
            return back()->with('error', 'File is empty or missing data rows.');
        }

        if (isset($data[0][0]) && is_string($data[0][0]) && str_contains($data[0][0], 'VenQore ERP —')) {
            // New template format:
            // Row 0: VenQore ERP — Contacts Import Template
            // Row 1: Header names
            // Row 2: Helper descriptions
            // Row 3: 'Enter your contacts below...'
            $headers = $data[1];
            $previewData = array_slice($data, 4);
        } else {
            $headers = $data[0];
            $previewData = array_slice($data, 1);
        }
        // Clean headers
        $cleanHeaders = [];
        foreach ($headers as $index => $header) {
            $cleanHeaders[] = [
                'index' => $index,
                'name' => (string)$header ?: "Column " . ($index + 1)
            ];
        }

        /* previewData is already set above */

        // Expected fields based on type
        $expectedFields = [];
        if ($type === 'products') {
            $expectedFields = [
                ['key' => 'name', 'label' => 'Product Name', 'required' => true],
                ['key' => 'sku', 'label' => 'SKU / Barcode', 'required' => false],
                ['key' => 'category', 'label' => 'Category', 'required' => false],
                ['key' => 'brand', 'label' => 'Brand', 'required' => false],
                ['key' => 'price', 'label' => 'Selling Price', 'required' => false],
                ['key' => 'cost_price', 'label' => 'Cost Price', 'required' => false],
                ['key' => 'opening_stock', 'label' => 'Opening Stock / Qty', 'required' => false],
                ['key' => 'base_unit', 'label' => 'Base Unit (pcs, kg)', 'required' => false],
                ['key' => 'min_stock_alert', 'label' => 'Low Stock Alert Qty', 'required' => false],
            ];
        } elseif ($type === 'parties') {
            $expectedFields = [
                ['key' => 'name', 'label' => 'Contact Name', 'required' => true],
                ['key' => 'type', 'label' => 'Contact Type', 'required' => false],
                ['key' => 'phone', 'label' => 'Phone', 'required' => false],
                ['key' => 'email', 'label' => 'Email', 'required' => false],
                ['key' => 'address', 'label' => 'Address', 'required' => false],
                ['key' => 'opening_balance', 'label' => 'Opening Balance', 'required' => false],
                ['key' => 'balance_direction', 'label' => 'Balance Direction', 'required' => false],
                ['key' => 'credit_limit', 'label' => 'Credit Limit', 'required' => false],
                ['key' => 'notes', 'label' => 'Notes', 'required' => false],
            ];
        } elseif ($type === 'sales') {
            $expectedFields = [
                ['key' => 'invoice_number', 'label' => 'Invoice Number', 'required' => true],
                ['key' => 'date', 'label' => 'Date (YYYY-MM-DD)', 'required' => true],
                ['key' => 'customer_phone', 'label' => 'Customer Phone', 'required' => false],
                ['key' => 'customer_name', 'label' => 'Customer Name', 'required' => false],
                ['key' => 'product_sku', 'label' => 'Product SKU', 'required' => false],
                ['key' => 'product_name', 'label' => 'Product Name', 'required' => false],
                ['key' => 'quantity', 'label' => 'Quantity', 'required' => true],
                ['key' => 'unit_price', 'label' => 'Unit Price', 'required' => true],
                ['key' => 'total', 'label' => 'Total Amount', 'required' => false],
            ];
        } elseif ($type === 'purchases') {
            $expectedFields = [
                ['key' => 'invoice_number', 'label' => 'Bill Number', 'required' => true],
                ['key' => 'date', 'label' => 'Date (YYYY-MM-DD)', 'required' => true],
                ['key' => 'supplier_phone', 'label' => 'Supplier Phone', 'required' => false],
                ['key' => 'supplier_name', 'label' => 'Supplier Name', 'required' => false],
                ['key' => 'product_sku', 'label' => 'Product SKU', 'required' => false],
                ['key' => 'product_name', 'label' => 'Product Name', 'required' => false],
                ['key' => 'quantity', 'label' => 'Quantity', 'required' => true],
                ['key' => 'unit_price', 'label' => 'Cost Price', 'required' => true],
                ['key' => 'total', 'label' => 'Total Amount', 'required' => false],
            ];
        } elseif ($type === 'expenses') {
            $expectedFields = [
                ['key' => 'date', 'label' => 'Date (YYYY-MM-DD)', 'required' => true],
                ['key' => 'category', 'label' => 'Expense Category', 'required' => true],
                ['key' => 'amount', 'label' => 'Amount', 'required' => true],
                ['key' => 'reference', 'label' => 'Reference / Bill No', 'required' => false],
                ['key' => 'description', 'label' => 'Description / Note', 'required' => false],
            ];
        } else {
        }

        return Inertia::render('Admin/DataMapping', [
            'file_path' => 'temp_imports/' . $fileName,
            'type' => $type,
            'file_headers' => $cleanHeaders,
            'preview_data' => $previewData,
            'expected_fields' => $expectedFields
        ]);
    }

    public function processImport(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'type' => 'required|string',
            'mapping' => 'required|array',
            'overrides' => 'nullable|array',
            'ignored_rows' => 'nullable|array'
        ]);

        $fullPath = storage_path('app/' . $request->file_path);
        if (!file_exists($fullPath)) {
            return redirect()->route('admin.data')->with('error', 'Temporary file expired or not found. Please upload again.');
        }

        try {
            if ($request->type === 'products') {
                $importClass = new ProductsImport($request->mapping, $request->input('options', []));
                Excel::import($importClass, $fullPath);
                $msg = "Successfully added {$importClass->importedCount} new products, and updated {$importClass->updatedCount} existing products!";
                return redirect()->route('admin.data')->with('success', $msg);
            } elseif ($request->type === 'parties') {
                $importClass = new PartiesImport(
                    $request->mapping, 
                    false, 
                    $request->input('overrides', []), 
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                
                // [V3 SWAP] Auto-trigger opening balance migration after import
                \Illuminate\Support\Facades\Artisan::call('migrate:opening-balances');
                
                $msg = "Successfully added {$importClass->importedCount} new contacts, and updated {$importClass->updatedCount} existing contacts!";
                return redirect()->route('admin.data')->with('success', $msg);
            } elseif ($request->type === 'sales') {
                $importClass = new \App\Imports\SalesImport(
                    $request->mapping,
                    false,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                $msg = "Successfully processed {$importClass->importedCount} sales rows!";
                return redirect()->route('admin.data')->with('success', $msg);
            } elseif ($request->type === 'purchases') {
                $importClass = new \App\Imports\PurchasesImport(
                    $request->mapping,
                    false,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                $msg = "Successfully processed {$importClass->importedCount} purchase rows!";
                return redirect()->route('admin.data')->with('success', $msg);
            } elseif ($request->type === 'expenses') {
                $importClass = new \App\Imports\ExpensesImport(
                    $request->mapping,
                    false,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                $msg = "Successfully processed {$importClass->importedCount} expenses!";
                return redirect()->route('admin.data')->with('success', $msg);
            } else {
                return redirect()->route('admin.data')->with('error', 'Import type not supported.');
            }
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
             $failures = $e->failures();
             $msg = "Row " . $failures[0]->row() . ": " . $failures[0]->errors()[0];
             return redirect()->route('admin.data')->with('error', 'Validation failed: ' . $msg);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Process Import Error: ' . $e->getMessage());
            return redirect()->route('admin.data')->with('error', 'Error processing file: ' . $e->getMessage());
        }
    }

    public function validateImport(Request $request)
    {
        $request->validate([
            'file_path' => 'required|string',
            'type' => 'required|string',
            'mapping' => 'required|array',
            'overrides' => 'nullable|array',
            'ignored_rows' => 'nullable|array'
        ]);

        $fullPath = storage_path('app/' . $request->file_path);
        if (!file_exists($fullPath)) {
            return response()->json(['error' => 'File not found.'], 404);
        }

        try {
            if ($request->type === 'parties') {
                $importClass = new PartiesImport(
                    $request->mapping, 
                    true, 
                    $request->input('overrides', []), 
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);

                return response()->json([
                    'success' => true,
                    'new_count' => $importClass->importedCount,
                    'update_count' => $importClass->updatedCount,
                    'warnings' => $importClass->warnings,
                ]);
            } elseif ($request->type === 'products') {
                $importClass = new ProductsImport(
                    $request->mapping,
                    $request->input('options', []),
                    true,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);

                return response()->json([
                    'success' => true,
                    'new_count' => $importClass->importedCount,
                    'update_count' => $importClass->updatedCount,
                    'warnings' => $importClass->warnings,
                ]);
            } elseif ($request->type === 'sales') {
                $importClass = new \App\Imports\SalesImport(
                    $request->mapping,
                    true,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                return response()->json([
                    'success' => true,
                    'new_count' => $importClass->importedCount,
                    'update_count' => $importClass->updatedCount,
                    'warnings' => $importClass->warnings,
                ]);
            } elseif ($request->type === 'purchases') {
                $importClass = new \App\Imports\PurchasesImport(
                    $request->mapping,
                    true,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                return response()->json([
                    'success' => true,
                    'new_count' => $importClass->importedCount,
                    'update_count' => $importClass->updatedCount,
                    'warnings' => $importClass->warnings,
                ]);
            } elseif ($request->type === 'expenses') {
                $importClass = new \App\Imports\ExpensesImport(
                    $request->mapping,
                    true,
                    $request->input('overrides', []),
                    $request->input('ignored_rows', [])
                );
                Excel::import($importClass, $fullPath);
                return response()->json([
                    'success' => true,
                    'new_count' => $importClass->importedCount,
                    'update_count' => $importClass->updatedCount,
                    'warnings' => $importClass->warnings,
                ]);
            }

            return response()->json(['success' => true, 'warnings' => []]);
        } catch (\Exception $e) {
             \Illuminate\Support\Facades\Log::error('Validation Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
