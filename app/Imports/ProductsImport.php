<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Category;
use App\Models\Brand;
use Maatwebsite\Excel\Row;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Support\Str;

/**
 * Premium Products Importer
 * Targeted at the first sheet of the VenQore ERP template.
 */
class ProductsImport implements WithMultipleSheets
{
    protected array $mapping;
    protected array $options;
    public int $importedCount = 0;
    public int $updatedCount = 0;
    public array $warnings = [];
    protected bool $dryRun = false;
    protected array $overrides = [];
    protected array $ignoredRows = [];

    public function __construct(array $mapping = [], array $options = [], bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
    {
        $this->mapping = $mapping;
        $this->options = $options;
        $this->dryRun = $dryRun;
        $this->overrides = $overrides;
        $this->ignoredRows = $ignoredRows;
    }

    public function sheets(): array
    {
        return [
            0 => new ProductsDataSheetImport($this->mapping, $this, $this->options, $this->dryRun, $this->overrides, $this->ignoredRows)
        ];
    }
}

/**
 * Handles the actual row-by-row logic for the first sheet.
 */
class ProductsDataSheetImport implements OnEachRow
{
    protected array $mapping;
    protected ?ProductsImport $parent;
    protected array $options;
    protected bool $dryRun = false;
    protected array $overrides = [];
    protected array $ignoredRows = [];
    protected array $seenSkus = [];  // sku => row_index
    protected array $seenNames = []; // name => row_index
    protected array $seenData = [];  // row_index => data

    public function __construct(array $mapping = [], ?ProductsImport $parent = null, array $options = [], bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
    {
        $this->parent = $parent;
        $this->options = $options;
        $this->dryRun = $dryRun;
        $this->overrides = $overrides;
        $this->ignoredRows = $ignoredRows;
        
        if (empty($mapping)) {
            $this->mapping = [
                'name'         => 0,
                'sku'          => 1,
                'price'        => 2,
                'cost_price'   => 3,
                'base_unit'    => 4,
                'alert_qty'    => 5,
                'category'     => 6,
                'brand'        => 7,
                'opening_stock'=> 8,
            ];
        } else {
            $this->mapping = $mapping;
        }
    }

    public function onRow(Row $row)
    {
        $index = $row->getIndex();
        if ($index <= 3) return;
        if (in_array($index, $this->ignoredRows)) return;

        $numericArray = $row->toArray();

        if (isset($numericArray[0]) && is_string($numericArray[0])) {
            $firstCell = $numericArray[0];
            if (
                str_contains($firstCell, 'VenQore ERP —') ||
                str_contains($firstCell, 'Enter your') ||
                str_contains($firstCell, 'Product Name') ||
                str_contains($firstCell, '* Required') ||
                str_contains($firstCell, 'Milky Bread')
            ) {
                return;
            }
        }

        $data = [];
        foreach ($this->mapping as $expectedKey => $columnIndex) {
            $data[$expectedKey] = ($columnIndex !== null && isset($numericArray[$columnIndex])) ? $numericArray[$columnIndex] : null;
        }

        if (isset($this->overrides[$index])) {
            $data = array_merge($data, $this->overrides[$index]);
        }

        if (empty($data['name'])) return;

        $sku = trim((string)($data['sku'] ?? ''));
        $name = trim($data['name']);

        // --- Duplicates Logic ---
        $existing = null;
        $reason = null;
        $firstRowIndex = null;

        $lowerName = strtolower($name);
        if (!empty($sku) && isset($this->seenSkus[$sku])) {
            $existing = true;
            $firstRowIndex = $this->seenSkus[$sku];
            $reason = "Duplicate SKU [$sku] (first seen in row $firstRowIndex)";
        } elseif (isset($this->seenNames[$lowerName])) {
            $existing = true;
            $firstRowIndex = $this->seenNames[$lowerName];
            $reason = "Duplicate Name [$name] (first seen in row $firstRowIndex)";
        }

        if (!empty($sku) && !isset($this->seenSkus[$sku])) $this->seenSkus[$sku] = $index;
        if (!isset($this->seenNames[$lowerName])) $this->seenNames[$lowerName] = $index;
        $this->seenData[$index] = $data;

        $dbData = null;
        if (!$existing) {
            $dbProduct = !empty($sku) ? Product::where('sku', $sku)->first() : null;
            if (!$dbProduct) $dbProduct = Product::where('name', $name)->first();
            
            if ($dbProduct) {
                $existing = true;
                $reason = "Existing product in database (ID: " . $dbProduct->id . ")";
                $dbData = [
                    'name' => $dbProduct->name,
                    'sku' => $dbProduct->sku,
                    'price' => $dbProduct->price,
                    'cost_price' => $dbProduct->cost_price,
                    'is_db' => true
                ];
            }
        }

        if ($this->dryRun) {
            if ($existing) {
                $this->parent->warnings[] = [
                    'row' => $index, 'name' => $name, 'phone' => $sku, // using phone slot for SKU
                    'reason' => $reason, 'is_db' => $dbData !== null, 'data' => $data,
                    'first_row_index' => $firstRowIndex,
                    'first_row_data' => $firstRowIndex ? ($this->seenData[$firstRowIndex] ?? null) : null,
                    'db_data' => $dbData
                ];
                if ($this->parent) $this->parent->updatedCount++;
            } else {
                if ($this->parent) $this->parent->importedCount++;
            }
            return;
        }

        // --- Final Import logic ---
        $categoryId = null;
        if (!empty($data['category'])) {
            $category = Category::firstOrCreate(['name' => trim($data['category'])]);
            $categoryId = $category->id;
        }

        $brandId = null;
        if (!empty($data['brand'])) {
            $brand = Brand::firstOrCreate(['name' => trim($data['brand'])]);
            $brandId = $brand->id;
        }

        $product = !empty($sku) ? Product::withTrashed()->where('sku', $sku)->first() : null;
        if (!$product) {
            $product = Product::withTrashed()->where('name', $name)->first();
            if ($product && !empty($sku) && strtolower(trim($product->sku)) !== strtolower($sku)) $product = null;
        }

        $productData = [
            'name' => $name, 'sku' => $sku ?: null,
            'price' => isset($data['price']) ? (float)$data['price'] : 0,
            'cost_price' => isset($data['cost_price']) ? (float)$data['cost_price'] : 0,
            'base_unit' => $data['unit'] ?? $data['base_unit'] ?? 'pcs',
            'min_stock_alert' => isset($data['alert_qty']) ? (int)$data['alert_qty'] : (isset($data['min_stock_alert']) ? (int)$data['min_stock_alert'] : 5),
            'category_id' => $categoryId, 'brand_id' => $brandId,
        ];

        if ($product) {
            if ($product->trashed()) {
                $product->restore();
            }
            $product->update($productData);
            if ($this->parent) $this->parent->updatedCount++;
        } else {
            // It definitely does not exist (even among soft-deleted ones)
            // Use updateOrCreate as a safety net to handle race conditions
            $matchKey = !empty($sku)
                ? ['sku' => $sku]
                : ['name' => $name];
            $product = Product::updateOrCreate($matchKey, $productData);
            if ($this->parent) {
                if ($product->wasRecentlyCreated) {
                    $this->parent->importedCount++;
                } else {
                    $this->parent->updatedCount++;
                }
            }
        }

        // Handle Stock
        $qty = $data['opening_stock'] ?? $data['quantity'] ?? null;
        if ($qty !== null && is_numeric($qty)) {
            $warehouse = \App\Models\Warehouse::first();
            if (!$warehouse) {
                $warehouse = \App\Models\Warehouse::create([
                    'name' => 'Main Store',
                    'is_default' => true,
                ]);
            }
            $warehouseId = $warehouse->id;
            $allowNeg = $this->options['allow_negative_stock'] ?? false;
            $batchQty = $allowNeg ? (float)$qty : max(0, (float)$qty);
            $batchCost = (float)($data['cost_price'] ?? $product->cost_price);

            Stock::updateOrCreate(['product_id' => $product->id, 'warehouse_id' => $warehouseId], ['quantity' => $batchQty]);

            \App\Models\InventoryBatch::updateOrCreate(
                ['product_id' => $product->id, 'warehouse_id' => $warehouseId, 'notes' => 'Imported opening stock'],
                ['original_qty' => $batchQty, 'initial_qty' => $batchQty, 'remaining_qty' => $batchQty, 'unit_cost' => max(0, $batchCost), 'batch_type' => 'purchase']
            );
        }
    }
}
