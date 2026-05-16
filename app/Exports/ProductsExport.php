<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Product::query()->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'SKU',
            'Price',
            'Cost Price',
            'Base Unit',
            'Min Stock Alert',
            'Category',
            'Brand',
            'Current Stock'
        ];
    }

    public function map($product): array
    {
        return [
            $product->id,
            $product->name,
            $product->sku,
            $product->price,
            $product->cost_price,
            $product->base_unit,
            $product->min_stock_alert,
            $product->category ? $product->category->name : '',
            $product->brand ? $product->brand->name : '',
            $product->stocks->sum('quantity'),
        ];
    }
}
