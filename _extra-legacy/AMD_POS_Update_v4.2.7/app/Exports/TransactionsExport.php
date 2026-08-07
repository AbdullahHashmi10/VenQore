<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Payment::with(['party'])->orderBy('date', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Date',
            'Reference',
            'Type',
            'Party',
            'Amount',
            'Method',
            'Notes'
        ];
    }

    public function map($payment): array
    {
        return [
            $payment->id,
            $payment->date,
            $payment->reference,
            ucfirst($payment->type), // 'in' or 'out'
            $payment->party ? $payment->party->name : '-',
            $payment->amount,
            ucfirst($payment->method),
            $payment->notes
        ];
    }
}
