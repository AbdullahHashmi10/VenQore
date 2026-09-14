<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\InvoiceService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * InvoiceToolController — free PDF invoice generator.
 *
 * No persistence: everything (company profile, line items) round-trips
 * through the request only. The React page keeps the company profile in
 * localStorage so returning visitors don't retype it — that is a client
 * convenience, not server state (plan §6.1: never gate or require an
 * account for core output).
 */
class InvoiceToolController extends Controller
{
    public function __construct(
        private readonly InvoiceService $invoices,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/Invoice', [
            'templates'   => InvoiceService::TEMPLATES,
            'currencies'  => InvoiceService::CURRENCIES,
            'maxItems'    => InvoiceService::MAX_LINE_ITEMS,
            'suggestedNumber' => $this->invoices->nextInvoiceNumber(),
            'toolGroups'  => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/invoice-generator/render — throttle:tools
     * Free, unlimited (within rate limit), no email required, no watermark.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'company'                  => ['required', 'array'],
            'company.name'             => ['required', 'string', 'max:120'],
            'company.address'          => ['nullable', 'string', 'max:300'],
            'company.email'            => ['nullable', 'string', 'max:120'],
            'company.phone'            => ['nullable', 'string', 'max:60'],
            'company.tax_id'           => ['nullable', 'string', 'max:60'],
            'company.logo_base64'      => ['nullable', 'string', 'max:2000000'],

            'client'                   => ['required', 'array'],
            'client.name'              => ['required', 'string', 'max:120'],
            'client.address'           => ['nullable', 'string', 'max:300'],
            'client.email'             => ['nullable', 'string', 'max:120'],

            'items'                    => ['required', 'array', 'min:1', 'max:' . InvoiceService::MAX_LINE_ITEMS],
            'items.*.description'      => ['required', 'string', 'max:200'],
            'items.*.quantity'         => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.tax_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_pct'     => ['nullable', 'numeric', 'min:0', 'max:100'],

            'meta'                     => ['nullable', 'array'],
            'meta.invoice_number'      => ['nullable', 'string', 'max:60'],
            'meta.issue_date'          => ['nullable', 'string', 'max:30'],
            'meta.due_date'            => ['nullable', 'string', 'max:30'],
            'meta.currency'            => ['nullable', 'string', Rule::in(array_keys(InvoiceService::CURRENCIES))],
            'meta.notes'               => ['nullable', 'string', 'max:1000'],
            'meta.terms'               => ['nullable', 'string', 'max:1000'],
            'meta.template'            => ['nullable', 'string', Rule::in(array_keys(InvoiceService::TEMPLATES))],
            'meta.accent_color'        => ['nullable', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        try {
            $result = $this->invoices->build(
                $validated['company'],
                $validated['client'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that invoice. Double-check your line items and try again.']], 422);
        }

        $this->usage->record('invoice', $validated['meta']['template'] ?? 'clean', null, [
            'line_items' => count($validated['items']),
            'currency'   => $validated['meta']['currency'] ?? 'USD',
            'has_logo'   => !empty($validated['company']['logo_base64']),
        ]);

        $filename = 'invoice-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['invoice_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Invoice-Total'     => (string) $result['total'],
        ]);
    }
}
