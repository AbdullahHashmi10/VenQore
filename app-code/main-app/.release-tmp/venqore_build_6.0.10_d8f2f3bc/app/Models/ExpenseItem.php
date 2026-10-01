<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * One line of an expense voucher.
 *
 * The table has existed since the documents migration and nothing has ever
 * written to it, because there was no model and no controller that knew about
 * it. A voucher covering rent and utilities had to be entered twice.
 */
class ExpenseItem extends Model
{
    use HasUuids, HasTenant;

    protected $guarded = [];

    protected $casts = [
        'amount' => 'decimal:4',
        'tax_amount' => 'decimal:4',
    ];

    public function expense()
    {
        return $this->belongsTo(Expense::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }
}
