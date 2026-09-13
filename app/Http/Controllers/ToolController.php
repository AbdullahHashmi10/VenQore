<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use App\Models\JobTool;
use App\Models\Employee;
use App\Models\ServiceJob;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ToolController extends Controller
{
    /**
     * Display a listing of shop and field tools.
     */
    public function index(Request $request): Response
    {
        $tenantId = app('current.tenant')->id;

        $query = Tool::with(['holder', 'requiredByServices:id,name,sku', 'jobAssignments.job:id,number,title,status'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'due_maintenance') {
                $query->where('next_maintenance_due_at', '<=', now()->addDays(7));
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('category', 'like', "%{$term}%")
                    ->orWhere('current_location', 'like', "%{$term}%")
                    ->orWhereHas('holder', fn ($h) => $h->where('name', 'like', "%{$term}%"));
            });
        }

        $tools = $query->orderBy('name')->paginate(30)->withQueryString();

        $allTools = Tool::where('tenant_id', $tenantId)->get();
        $stats = [
            'total'           => $allTools->count(),
            'available'       => $allTools->where('status', 'available')->count(),
            'with_staff'      => $allTools->where('status', 'with_staff')->count(),
            'in_maintenance'  => $allTools->where('status', 'in_maintenance')->count(),
            'due_maintenance' => $allTools->filter(fn($t) => $t->next_maintenance_due_at && $t->next_maintenance_due_at <= now()->addDays(7))->count(),
            'lost'            => $allTools->where('status', 'lost')->count(),
        ];

        $employees = Employee::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $categories = Tool::where('tenant_id', $tenantId)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category');

        return Inertia::render('Services/Tools', [
            'tools'      => $tools,
            'filters'    => $request->only(['search', 'status']),
            'stats'      => $stats,
            'employees'  => $employees,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created tool.
     */
    public function store(Request $request): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'name'                      => 'required|string|max:150',
            'category'                  => 'nullable|string|max:80',
            'description'               => 'nullable|string|max:1000',
            'status'                    => 'required|in:available,with_staff,in_maintenance,lost,retired',
            'holder_employee_id'        => ['nullable', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'current_location'          => 'nullable|string|max:150',
            'maintenance_interval_days' => 'nullable|integer|min:1|max:3650',
            'last_maintenance_at'       => 'nullable|date',
            'purchase_cost'             => 'nullable|numeric|min:0',
            'notes'                     => 'nullable|string|max:1000',
        ]);

        $tool = new Tool($validated);
        $tool->tenant_id = $tenantId;
        $tool->recalculateNextMaintenanceDue();
        $tool->save();

        return redirect()->back()->with('success', 'Tool added to inventory successfully.');
    }

    /**
     * Update an existing tool.
     */
    public function update(Request $request, Tool $tool): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'name'                      => 'required|string|max:150',
            'category'                  => 'nullable|string|max:80',
            'description'               => 'nullable|string|max:1000',
            'status'                    => 'required|in:available,with_staff,in_maintenance,lost,retired',
            'holder_employee_id'        => ['nullable', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'current_location'          => 'nullable|string|max:150',
            'maintenance_interval_days' => 'nullable|integer|min:1|max:3650',
            'last_maintenance_at'       => 'nullable|date',
            'purchase_cost'             => 'nullable|numeric|min:0',
            'notes'                     => 'nullable|string|max:1000',
        ]);

        $tool->fill($validated);
        $tool->recalculateNextMaintenanceDue();
        $tool->save();

        return redirect()->back()->with('success', 'Tool details updated successfully.');
    }

    /**
     * Record a maintenance event on a tool.
     */
    public function logMaintenance(Request $request, Tool $tool): RedirectResponse
    {
        $validated = $request->validate([
            'maintenance_date' => 'required|date',
            'notes'            => 'nullable|string|max:1000',
            'cost'             => 'nullable|numeric|min:0',
        ]);

        $tool->last_maintenance_at = $validated['maintenance_date'];
        $tool->status = 'available';
        if (!empty($validated['notes'])) {
            $prevNotes = $tool->notes ? $tool->notes . "\n" : '';
            $tool->notes = $prevNotes . '[' . now()->format('Y-m-d') . ' Maintenance]: ' . $validated['notes'];
        }
        $tool->recalculateNextMaintenanceDue();
        $tool->save();

        return redirect()->back()->with('success', "Maintenance recorded for {$tool->name}.");
    }

    /**
     * Check out a tool to an employee or service job.
     */
    public function checkout(Request $request, Tool $tool): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'employee_id' => ['nullable', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'job_id'      => ['nullable', 'integer', Rule::exists('service_jobs', 'id')->where('tenant_id', $tenantId)],
            'location'    => 'nullable|string|max:150',
            'quantity'    => 'nullable|integer|min:1',
        ]);

        $tool->status = 'with_staff';
        $tool->holder_employee_id = $validated['employee_id'] ?? null;
        if (!empty($validated['location'])) {
            $tool->current_location = $validated['location'];
        }

        if (!empty($validated['job_id'])) {
            JobTool::updateOrCreate(
                ['job_id' => $validated['job_id'], 'tool_id' => $tool->id],
                [
                    'quantity' => $validated['quantity'] ?? 1,
                    'taken_at' => now(),
                    'returned_at' => null,
                ]
            );
        }

        $tool->save();

        return redirect()->back()->with('success', "Tool {$tool->name} checked out.");
    }

    /**
     * Check in / return a tool.
     */
    public function checkin(Request $request, Tool $tool): RedirectResponse
    {
        $tool->status = 'available';
        $tool->holder_employee_id = null;
        $tool->current_location = 'Shop / Storeroom';
        $tool->save();

        JobTool::where('tool_id', $tool->id)
            ->whereNull('returned_at')
            ->update(['returned_at' => now()]);

        return redirect()->back()->with('success', "Tool {$tool->name} checked in and available.");
    }

    /**
     * Delete / retire a tool.
     */
    public function destroy(Tool $tool): RedirectResponse
    {
        $tool->delete();
        return redirect()->back()->with('success', 'Tool removed from inventory.');
    }
}

