<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

class Expense extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'date' => 'date',
        'tax_amount' => 'decimal:2',
    ];

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function purchase()
    {
        return $this->belongsTo(Invoice::class, 'purchase_id');
    }
}
