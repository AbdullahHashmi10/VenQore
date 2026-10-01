<?php

namespace App\Exports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ExpensesExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Expense::with(['category', 'user'])->orderBy('created_at', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Date',
            'Reference',
            'Category',
            'Amount',
            'Description',
            'Created By'
        ];
    }

    public function map($expense): array
    {
        return [
            $expense->id,
            $expense->date ?? $expense->created_at->format('Y-m-d'),
            $expense->reference_no,
            $expense->category ? $expense->category->name : 'Uncategorized',
            $expense->amount,
            $expense->description,
            $expense->user ? $expense->user->name : 'System'
        ];
    }
}
