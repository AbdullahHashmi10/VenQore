<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasTenant;

class Expense extends Model
{
    use HasUuids, HasTenant;

    protected $fillable = [
        'tenant_id', 'category', 'expense_category_id', 'amount', 'tax_amount',
        'date', 'bank_account_id', 'payment_method', 'reference', 'payee',
        'description', 'notes', 'attachment', 'is_landed_cost', 'purchase_id',
        'allocation_method',
    ];

    protected $casts = [
        'date' => 'date',
        'tax_amount' => 'decimal:4',
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
