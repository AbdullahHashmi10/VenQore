<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceJob;
use App\Engines\ServiceEngine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WorkOrderController extends Controller
{
    protected ServiceEngine $engine;

    public function __construct(ServiceEngine $engine)
    {
        $this->engine = $engine;
    }

    /**
     * Display a listing of service jobs / work orders.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = app('current.tenant')->id ?? null;
        if (!$tenantId) {
            return response()->json(['error' => 'Tenant context required'], 400);
        }

        $query = ServiceJob::with(['party', 'assignments.employee', 'lines'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', $request->party_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $jobs = $query->latest()->paginate($request->input('per_page', 25));

        return response()->json($jobs);
    }

    /**
     * Store a newly created service job.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'party_id'        => 'required|integer',
            'title'           => 'required|string|max:180',
            'description'     => 'nullable|string',
            'site_address'    => 'nullable|string',
            'priority'        => 'nullable|in:low,normal,high,urgent',
            'scheduled_for'   => 'nullable|date',
            'estimated_total' => 'nullable|numeric|min:0',
            'lines'           => 'nullable|array',
            'lines.*.kind'        => 'required_with:lines|in:service,part,ad_hoc',
            'lines.*.product_id'  => 'nullable|integer',
            'lines.*.description' => 'required_with:lines|string|max:255',
            'lines.*.quantity'    => 'required_with:lines|numeric|min:0.0001',
            'lines.*.unit_price'  => 'required_with:lines|numeric|min:0',
        ]);

        $job = $this->engine->createJob($validated);

        return response()->json([
            'success' => true,
            'message' => "Work Order {$job->number} created successfully.",
            'data'    => $job->load(['party', 'lines']),
        ], 201);
    }

    /**
     * Display the specified service job.
     */
    public function show(int $id): JsonResponse
    {
        $tenantId = app('current.tenant')->id ?? null;
        $job = ServiceJob::with(['party', 'lines.product', 'assignments.employee', 'events.user', 'contract'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return response()->json($job);
    }

    /**
     * Update job status or details.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = app('current.tenant')->id ?? null;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($id);

        if ($request->has('status')) {
            $request->validate([
                'status' => 'required|in:draft,scheduled,in_progress,on_hold,awaiting_parts,completed,invoiced,cancelled',
                'note'   => 'nullable|string',
            ]);

            $this->engine->updateStatus($job, $request->status, $request->note);
        }

        if ($request->hasAny(['title', 'description', 'site_address', 'priority', 'scheduled_for'])) {
            $job->update($request->only(['title', 'description', 'site_address', 'priority', 'scheduled_for']));
        }

        return response()->json([
            'success' => true,
            'message' => "Work Order {$job->number} updated.",
            'data'    => $job->fresh(['party', 'lines', 'events']),
        ]);
    }

    /**
     * Assign a technician to the job.
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|integer',
            'role'        => 'nullable|string|max:48',
        ]);

        $tenantId = app('current.tenant')->id ?? null;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($id);

        $assignment = $this->engine->assignTechnician($job, $request->employee_id, $request->role ?? 'primary');

        return response()->json([
            'success' => true,
            'message' => 'Technician assigned successfully.',
            'data'    => $assignment->load('employee'),
        ]);
    }

    /**
     * Convert completed job to an invoice.
     */
    public function convertInvoice(int $id): JsonResponse
    {
        $tenantId = app('current.tenant')->id ?? null;
        $job = ServiceJob::where('tenant_id', $tenantId)->findOrFail($id);

        $invoice = $this->engine->convertJobToInvoice($job);

        return response()->json([
            'success' => true,
            'message' => "Work Order {$job->number} converted to Invoice {$invoice->invoice_number}.",
            'data'    => $invoice->load('items'),
        ]);
    }
}
