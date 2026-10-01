<?php

namespace App\Http\Controllers;

use App\Engines\ServiceEngine;
use App\Models\Party;
use App\Models\ServiceJob;
use App\Models\Employee;
use App\Models\Tool;
use App\Models\JobTool;
use App\Models\Product;
use App\Models\JobEvent;
use App\Models\JobAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ServiceJobController extends Controller
{
    public function __construct(private ServiceEngine $engine)
    {
    }

    /**
     * A tenant's service jobs — search, filter by status, latest first.
     */
    public function index(Request $request): Response
    {
        $tenantId = app('current.tenant')->id;

        $query = ServiceJob::with(['party', 'assignments.employee', 'lines.product'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('number', 'like', "%{$term}%")
                    ->orWhere('title', 'like', "%{$term}%")
                    ->orWhereHas('party', fn ($p) => $p->where('name', 'like', "%{$term}%"));
            });
        }

        $jobs = $query->latest()->paginate(25)->withQueryString();

        $stats = [
            'open'      => ServiceJob::where('tenant_id', $tenantId)->whereNotIn('status', ['completed', 'invoiced', 'cancelled'])->count(),
            'completed' => ServiceJob::where('tenant_id', $tenantId)->where('status', 'completed')->count(),
            'invoiced'  => ServiceJob::where('tenant_id', $tenantId)->where('status', 'invoiced')->count(),
        ];

        return Inertia::render('Services/ServiceJobs', [
            'jobs'    => $jobs,
            'filters' => $request->only(['search', 'status']),
            'stats'   => $stats,
        ]);
    }

    /**
     * Real visual calendar / scheduling view of service jobs by technician lane and time.
     */
    public function calendar(Request $request): Response
    {
        $tenantId = app('current.tenant')->id;

        $query = ServiceJob::with(['party', 'assignments.employee', 'lines.product', 'tools.tool'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('employee_id')) {
            $query->whereHas('assignments', fn($a) => $a->where('employee_id', $request->employee_id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Return all active and scheduled jobs for the calendar
        $jobs = $query->whereNotIn('status', ['cancelled'])
            ->orderBy('scheduled_start_at')
            ->orderBy('scheduled_for')
            ->get();

        $employees = Employee::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $services = Product::where('tenant_id', $tenantId)->where('type', 'service')->get(['id', 'name', 'price', 'default_duration', 'skill_tag']);

        return Inertia::render('Services/ServiceCalendar', [
            'jobs'      => $jobs,
            'employees' => $employees,
            'services'  => $services,
            'filters'   => $request->only(['employee_id', 'status']),
        ]);
    }

    /**
     * New job form. Customers, catalog services, tools, and employees.
     */
    public function create(): Response
    {
        $tenantId = app('current.tenant')->id;

        $parties = Party::where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'address']);

        $services = Product::where('tenant_id', $tenantId)
            ->where('type', 'service')
            ->with(['modifierGroups.modifiers', 'requiredTools'])
            ->get();

        $employees = Employee::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $tools = Tool::where('tenant_id', $tenantId)->get(['id', 'name', 'category', 'status']);

        return Inertia::render('Services/CreateServiceJob', [
            'parties'   => $parties,
            'services'  => $services,
            'employees' => $employees,
            'tools'     => $tools,
        ]);
    }

    /**
     * Create the job.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'party_id'             => 'required|string|exists:parties,id',
            'title'                => 'required|string|max:180',
            'description'          => 'nullable|string',
            'site_address'         => 'nullable|string',
            'priority'             => 'nullable|in:low,normal,high,urgent',
            'scheduled_for'        => 'nullable|date',
            'scheduled_start_at'   => 'nullable|date',
            'scheduled_end_at'     => 'nullable|date|after_or_equal:scheduled_start_at',
            'estimated_total'      => 'nullable|numeric|min:0',
            'technician_id'        => 'nullable|string|exists:employees,id',
            'lines'                => 'nullable|array',
            'lines.*.kind'         => 'required_with:lines|in:service,part,ad_hoc',
            'lines.*.product_id'   => 'nullable|string',
            'lines.*.description'  => 'required_with:lines|string|max:255',
            'lines.*.quantity'     => 'required_with:lines|numeric|min:0.0001',
            'lines.*.unit_price'   => 'required_with:lines|numeric|min:0',
            'tools'                => 'nullable|array',
            'tools.*.id'           => 'required_with:tools|integer|exists:tools,id',
            'tools.*.quantity'     => 'nullable|integer|min:1',
        ]);

        $validated['tenant_id']  = app('current.tenant')->id;
        $validated['created_by'] = auth()->id();

        $job = $this->engine->createJob($validated);

        if (!empty($validated['scheduled_start_at']) || !empty($validated['scheduled_end_at'])) {
            $job->update([
                'scheduled_start_at' => $validated['scheduled_start_at'] ?? null,
                'scheduled_end_at'   => $validated['scheduled_end_at'] ?? null,
            ]);
        }

        if (!empty($validated['technician_id'])) {
            $this->engine->assignTechnician($job, $validated['technician_id'], 'primary');
        }

        if (!empty($validated['tools']) && is_array($validated['tools'])) {
            foreach ($validated['tools'] as $toolItem) {
                JobTool::create([
                    'job_id'   => $job->id,
                    'tool_id'  => $toolItem['id'],
                    'quantity' => $toolItem['quantity'] ?? 1,
                    'taken_at' => now(),
                ]);
                Tool::where('id', $toolItem['id'])->update(['status' => 'with_staff']);
            }
        }

        return redirect()
            ->route('store.service-jobs.show', ['store_slug' => app('current.tenant')->slug, 'serviceJob' => $job->id])
            ->with('success', "Job {$job->number} created.");
    }

    /**
     * Quick Booking creation from POS / Document Editor.
     */
    public function quickBook(Request $request): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'party_id'             => 'required|string|exists:parties,id',
            'title'                => 'required|string|max:180',
            'service_product_id'   => 'nullable|string|exists:products,id',
            'scheduled_start_at'   => 'nullable|date',
            'scheduled_end_at'     => 'nullable|date',
            'site_address'         => 'nullable|string',
            'priority'             => 'nullable|in:low,normal,high,urgent',
            'estimated_total'      => 'nullable|numeric|min:0',
            'technician_id'        => 'nullable|string|exists:employees,id',
            'notes'                => 'nullable|string',
        ]);

        $lines = [];
        if (!empty($validated['service_product_id'])) {
            $product = Product::find($validated['service_product_id']);
            if ($product) {
                $lines[] = [
                    'kind'        => 'service',
                    'product_id'  => $product->id,
                    'description' => $product->name,
                    'quantity'    => 1,
                    'unit_price'  => (float)$product->price,
                ];
            }
        }

        $jobData = [
            'tenant_id'          => $tenantId,
            'created_by'         => auth()->id(),
            'party_id'           => $validated['party_id'],
            'title'              => $validated['title'],
            'description'        => $validated['notes'] ?? null,
            'site_address'       => $validated['site_address'] ?? null,
            'priority'           => $validated['priority'] ?? 'normal',
            'status'             => 'scheduled',
            'scheduled_for'      => $validated['scheduled_start_at'] ? date('Y-m-d', strtotime($validated['scheduled_start_at'])) : date('Y-m-d'),
            'scheduled_start_at' => $validated['scheduled_start_at'] ?? null,
            'scheduled_end_at'   => $validated['scheduled_end_at'] ?? null,
            'estimated_total'    => $validated['estimated_total'] ?? 0,
            'lines'              => $lines,
        ];

        $job = $this->engine->createJob($jobData);

        if (!empty($validated['technician_id'])) {
            $this->engine->assignTechnician($job, $validated['technician_id'], 'primary');
        }

        return redirect()->back()->with('success', "Service booking {$job->number} created successfully.");
    }

    /**
     * One job — lines, assignments, tools, expenses, events.
     */
    public function show(int $serviceJob): Response
    {
        $tenantId = app('current.tenant')->id;

        $job = ServiceJob::with([
            'party', 'lines.product', 'assignments.employee', 'events.user', 'contract', 'invoice',
            'tools.tool', 'expenses.expenseCategory'
        ])
            ->where('tenant_id', $tenantId)
            ->findOrFail($serviceJob);

        $employees = Employee::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $tools = Tool::where('tenant_id', $tenantId)->get(['id', 'name', 'category', 'status']);

        return Inertia::render('Services/ServiceJobDetail', [
            'job'       => $job,
            'employees' => $employees,
            'tools'     => $tools,
        ]);
    }

    /**
     * Assign a technician to this job.
     */
    public function assign(Request $request, int $serviceJob): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;

        $validated = $request->validate([
            'employee_id' => ['required', 'string', Rule::exists('employees', 'id')->where('tenant_id', $tenantId)],
            'role'        => 'nullable|in:primary,assistant,specialist',
        ]);

        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        $this->engine->assignTechnician($job, $validated['employee_id'], $validated['role'] ?? 'primary');

        return back()->with('success', 'Technician assigned to job.');
    }

    /**
     * Remove an employee assignment from this job.
     */
    public function removeAssignment(Request $request, int $serviceJob, string $employeeId): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        JobAssignment::where('job_id', $job->id)
            ->where('employee_id', $employeeId)
            ->delete();

        $empName = Employee::find($employeeId)?->name ?? "Employee #{$employeeId}";
        JobEvent::create([
            'job_id'  => $job->id,
            'type'    => 'technician_unassigned',
            'body'    => "{$empName} unassigned from job.",
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Technician unassigned from job.');
    }

    /**
     * Check out a tool against this job.
     */
    public function checkoutTool(Request $request, int $serviceJob): RedirectResponse
    {
        $validated = $request->validate([
            'tool_id'  => 'required|integer|exists:tools,id',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        JobTool::updateOrCreate(
            ['job_id' => $job->id, 'tool_id' => $validated['tool_id']],
            [
                'quantity' => $validated['quantity'] ?? 1,
                'taken_at' => now(),
                'returned_at' => null,
            ]
        );

        Tool::where('id', $validated['tool_id'])->update(['status' => 'with_staff']);

        return back()->with('success', 'Tool checked out to job.');
    }

    /**
     * Mark a job tool as returned.
     */
    public function returnTool(Request $request, int $serviceJob, int $toolId): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        JobTool::where('job_id', $job->id)
            ->where('tool_id', $toolId)
            ->update(['returned_at' => now()]);

        Tool::where('id', $toolId)->update(['status' => 'available']);

        return back()->with('success', 'Tool marked as returned.');
    }

    /**
     * Update schedule dates.
     */
    public function updateSchedule(Request $request, int $serviceJob): RedirectResponse
    {
        $validated = $request->validate([
            'scheduled_for'      => 'nullable|date',
            'scheduled_start_at' => 'nullable|date',
            'scheduled_end_at'   => 'nullable|date',
        ]);

        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        $job->update($validated);

        return back()->with('success', 'Schedule updated.');
    }

    /**
     * Move the job through its lifecycle.
     */
    public function updateStatus(Request $request, int $serviceJob): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,scheduled,in_progress,on_hold,awaiting_parts,completed,invoiced,cancelled',
            'note'   => 'nullable|string|max:500',
        ]);

        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($serviceJob);

        $this->engine->updateStatus($job, $validated['status'], $validated['note'] ?? null);

        return back()->with('success', "Status changed to {$validated['status']}.");
    }

    /**
     * Convert completed job to Invoice.
     */
    public function convertInvoice(int $serviceJob): RedirectResponse
    {
        $tenantId = app('current.tenant')->id;
        $job = ServiceJob::with('lines')->where('tenant_id', $tenantId)->findOrFail($serviceJob);

        if ($job->lines->isEmpty()) {
            return back()->withErrors(['lines' => 'Add at least one line before converting to an invoice.']);
        }

        $invoice = $this->engine->convertJobToInvoice($job);

        return back()->with('success', "Converted to Invoice {$invoice->invoice_number}.");
    }
}

