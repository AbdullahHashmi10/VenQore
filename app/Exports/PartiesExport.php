<?php

namespace App\Exports;

use App\Models\Party;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PartiesExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Party::all(['id', 'type', 'name', 'phone', 'email', 'current_balance', 'opening_balance']);
    }

    public function headings(): array
    {
        return [
            'ID',
            'Type',
            'Name',
            'Phone',
            'Email',
            'Current Balance',
            'Opening Balance'
        ];
    }
}
