<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Electricity', 'group' => 'Utilities', 'icon' => 'Zap', 'color' => 'amber', 'sort_order' => 1],
            ['name' => 'Internet & Phone', 'group' => 'Utilities', 'icon' => 'Wifi', 'color' => 'indigo', 'sort_order' => 4],
            ['name' => 'Rent & Building', 'group' => 'Operational', 'icon' => 'Home', 'color' => 'slate', 'sort_order' => 5],
            ['name' => 'Salaries & Wages', 'group' => 'Staff', 'icon' => 'Users', 'color' => 'green', 'sort_order' => 6],
            ['name' => 'Marketing & Ads', 'group' => 'Miscellaneous', 'icon' => 'Megaphone', 'color' => 'purple', 'sort_order' => 7],
            ['name' => 'Office Supplies', 'group' => 'Office', 'icon' => 'Paperclip', 'color' => 'gray', 'sort_order' => 8],
            ['name' => 'Maintenance', 'group' => 'Operational', 'icon' => 'Tool', 'color' => 'rose', 'sort_order' => 9],
            ['name' => 'Miscellaneous', 'group' => 'Miscellaneous', 'icon' => 'Tag', 'color' => 'slate', 'sort_order' => 10],
            // New Categories
            ['name' => 'Transport & Travel', 'group' => 'Operational', 'icon' => 'Truck', 'color' => 'cyan', 'sort_order' => 11],
            ['name' => 'Insurance', 'group' => 'Financial', 'icon' => 'Shield', 'color' => 'teal', 'sort_order' => 12],
            ['name' => 'Taxes & Licenses', 'group' => 'Financial', 'icon' => 'FileText', 'color' => 'red', 'sort_order' => 13],
            ['name' => 'Professional Fees', 'group' => 'Operational', 'icon' => 'Briefcase', 'color' => 'indigo', 'sort_order' => 14],
            ['name' => 'Repairs', 'group' => 'Operational', 'icon' => 'Wrench', 'color' => 'orange', 'sort_order' => 15],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
            // Using firstOrCreate ensures we don't duplicate if run again
        }
    }
}
