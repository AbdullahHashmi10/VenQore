<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Expense;
use App\Models\ExpenseCategory;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        try {
            $expenses = Expense::whereNull('expense_category_id')->whereNotNull('category')->get();
            foreach ($expenses as $expense) {
                $categoryName = trim($expense->category);
                $category = ExpenseCategory::where('name', 'like', $categoryName)->first();
                if ($category) {
                    $expense->expense_category_id = $category->id;
                    $expense->save();
                }
            }
        } catch (\Exception $e) {
            // Safe fallback: ignore migration data sync errors if any model dependencies fail
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // No reverse action required for a data alignment migration
    }
};
