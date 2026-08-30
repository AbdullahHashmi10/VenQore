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
        'description', 'notes', 'attachment', 'is_landed_cost',
        /* Without these three the columns above are written to nothing:
           `$fillable` is a silent filter, not a validation. */
        'party_id',
        'amount_paid',
        'grand_total', 'purchase_id',
        'allocation_method', 'channel',
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
        return $this->belongsTo(Purchase::class, 'purchase_id');
    }

    /** The lines of this voucher, where it has more than one. */
    public function items()
    {
        return $this->hasMany(\App\Models\ExpenseItem::class);
    }
}
