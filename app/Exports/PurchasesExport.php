<?php

namespace App\Exports;

use App\Models\Purchase;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PurchasesExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Purchase::with(['party'])->orderBy('created_at', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Invoice Number',
            'Date',
            'Supplier Name',
            'Total Amount',
            'Paid Amount',
            'Due Amount',
            'Status'
        ];
    }

    public function map($purchase): array
    {
        return [
            $purchase->id,
            $purchase->invoice_number,
            $purchase->created_at->format('Y-m-d H:i:s'),
            $purchase->party ? $purchase->party->name : 'Unknown Supplier',
            $purchase->total_amount,
            $purchase->paid_amount,
            $purchase->total_amount - $purchase->paid_amount,
            ucfirst($purchase->status)
        ];
    }
}
