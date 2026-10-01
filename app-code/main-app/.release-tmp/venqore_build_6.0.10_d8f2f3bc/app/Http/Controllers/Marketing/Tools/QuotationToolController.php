<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\QuotationService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * QuotationToolController — free PDF quotation/estimate generator.
 *
 * No persistence: everything round-trips through the request only. The
 * React page keeps the company profile in its own localStorage key
 * (separate from the Invoice tool's) so returning visitors don't retype it.
 */
class QuotationToolController extends Controller
{
    public function __construct(
        private readonly QuotationService $quotes,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/Quote', [
            'templates'       => QuotationService::TEMPLATES,
            'currencies'      => QuotationService::CURRENCIES,
            'maxItems'        => QuotationService::MAX_LINE_ITEMS,
            'defaultValidityDays' => QuotationService::DEFAULT_VALIDITY_DAYS,
            'suggestedNumber' => $this->quotes->nextQuoteNumber(),
            'toolGroups'      => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/quote-generator/render — throttle:tools
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

            'items'                    => ['required', 'array', 'min:1', 'max:' . QuotationService::MAX_LINE_ITEMS],
            'items.*.description'      => ['required', 'string', 'max:200'],
            'items.*.quantity'         => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.tax_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_pct'     => ['nullable', 'numeric', 'min:0', 'max:100'],

            'meta'                     => ['nullable', 'array'],
            'meta.quote_number'        => ['nullable', 'string', 'max:60'],
            'meta.document_label'      => ['nullable', 'string', Rule::in(['QUOTATION', 'ESTIMATE'])],
            'meta.issue_date'          => ['nullable', 'string', 'max:30'],
            'meta.validity_days'       => ['nullable', 'integer', 'min:1', 'max:3650'],
            'meta.valid_until'         => ['nullable', 'string', 'max:30'],
            'meta.currency'            => ['nullable', 'string', Rule::in(array_keys(QuotationService::CURRENCIES))],
            'meta.notes'               => ['nullable', 'string', 'max:1000'],
            'meta.scope_of_work'       => ['nullable', 'string', 'max:2000'],
            'meta.exclusions'          => ['nullable', 'string', 'max:2000'],
            'meta.template'            => ['nullable', 'string', Rule::in(array_keys(QuotationService::TEMPLATES))],
            'meta.accent_color'        => ['nullable', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        try {
            $result = $this->quotes->build(
                $validated['company'],
                $validated['client'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that quotation. Double-check your line items and try again.']], 422);
        }

        $this->usage->record('quote', $validated['meta']['template'] ?? 'clean', null, [
            'line_items' => count($validated['items']),
            'currency'   => $validated['meta']['currency'] ?? 'USD',
            'has_logo'   => !empty($validated['company']['logo_base64']),
        ]);

        $filename = 'quote-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['quote_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Quote-Total'       => (string) $result['total'],
            'X-Quote-Valid-Until' => (string) $result['valid_until'],
        ]);
    }
}
