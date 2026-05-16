<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:200'],
            'monthly_salary'   => ['required', 'numeric', 'min:0.01'],
            'hire_date'        => ['required', 'date'],
            'commission_rate'  => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::table('employees')->where('employees.tenant_id', app('current.tenant')->id)->insert([
            'id'              => Str::uuid()->toString(),
            'name'            => $validated['name'],
            'monthly_salary'  => $validated['monthly_salary'],
            'hire_date'       => $validated['hire_date'],
            'commission_rate' => $validated['commission_rate'] ?? 0,
            'status'          => 'active',
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        return redirect()->back()->with('success', 'Employee created.');
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:200'],
            'monthly_salary'  => ['required', 'numeric', 'min:0.01'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $employee = DB::table('employees')->where('employees.tenant_id', app('current.tenant')->id)->where('id', $id)->firstOrFail();

        if ($employee->status === 'terminated') {
            return back()->withErrors([
                'employee' => 'Cannot update a terminated employee.',
            ]);
        }

        DB::table('employees')->where('employees.tenant_id', app('current.tenant')->id)->where('id', $id)->update([
            'name'            => $validated['name'],
            'monthly_salary'  => $validated['monthly_salary'],
            'commission_rate' => $validated['commission_rate'] ?? 0,
            'updated_at'      => now(),
        ]);

        return redirect()->back()->with('success', 'Employee updated.');
    }
}
