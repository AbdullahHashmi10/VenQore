<?php

namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Sale::with(['party'])->orderBy('created_at', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Invoice Number',
            'Date',
            'Customer Name',
            'Total Amount',
            'Paid Amount',
            'Due Amount',
            'Status',
            'Payment Method'
        ];
    }

    public function map($sale): array
    {
        return [
            $sale->id,
            $sale->invoice_number,
            $sale->created_at->format('Y-m-d H:i:s'),
            $sale->party ? $sale->party->name : 'Walk-in Customer',
            $sale->total_amount,
            $sale->paid_amount,
            $sale->total_amount - $sale->paid_amount,
            ucfirst($sale->payment_status),
            ucfirst($sale->payment_method ?? 'Cash')
        ];
    }
}
