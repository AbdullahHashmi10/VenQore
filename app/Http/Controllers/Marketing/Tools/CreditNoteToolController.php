<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\CreditNoteService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * CreditNoteToolController — free PDF credit note generator.
 *
 * No persistence: everything (company profile, line items, credit reason) round-trips
 * through the request only.
 */
class CreditNoteToolController extends Controller
{
    public function __construct(
        private readonly CreditNoteService $creditNotes,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/CreditNote', [
            'templates'         => CreditNoteService::TEMPLATES,
            'currencies'        => CreditNoteService::CURRENCIES,
            'reasons'           => CreditNoteService::REASONS,
            'refundMethods'     => CreditNoteService::REFUND_METHODS,
            'maxItems'          => CreditNoteService::MAX_LINE_ITEMS,
            'suggestedNumber'   => $this->creditNotes->nextCreditNoteNumber(),
            'toolGroups'        => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/credit-note-generator/render — throttle:tools
     * Free, unlimited (within rate limit), no email required, no watermark.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'company'                        => ['required', 'array'],
            'company.name'                   => ['required', 'string', 'max:120'],
            'company.address'                => ['nullable', 'string', 'max:300'],
            'company.email'                  => ['nullable', 'string', 'max:120'],
            'company.phone'                  => ['nullable', 'string', 'max:60'],
            'company.tax_id'                 => ['nullable', 'string', 'max:60'],
            'company.logo_base64'            => ['nullable', 'string', 'max:2000000'],

            'client'                         => ['required', 'array'],
            'client.name'                    => ['required', 'string', 'max:120'],
            'client.address'                 => ['nullable', 'string', 'max:300'],
            'client.email'                   => ['nullable', 'string', 'max:120'],

            'items'                          => ['required', 'array', 'min:1', 'max:' . CreditNoteService::MAX_LINE_ITEMS],
            'items.*.description'            => ['required', 'string', 'max:200'],
            'items.*.quantity'               => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.unit_price'             => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.tax_rate'               => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.discount_pct'           => ['nullable', 'numeric', 'min:0', 'max:100'],

            'meta'                           => ['nullable', 'array'],
            'meta.credit_note_number'        => ['nullable', 'string', 'max:60'],
            'meta.original_invoice_number'   => ['required', 'string', 'max:60'],
            'meta.original_invoice_date'     => ['nullable', 'string', 'max:30'],
            'meta.reason'                    => ['nullable', 'string', Rule::in(array_keys(CreditNoteService::REASONS))],
            'meta.custom_reason'             => ['nullable', 'string', 'max:120'],
            'meta.refund_method'             => ['nullable', 'string', Rule::in(array_keys(CreditNoteService::REFUND_METHODS))],
            'meta.issue_date'                => ['nullable', 'string', 'max:30'],
            'meta.currency'                  => ['nullable', 'string', Rule::in(array_keys(CreditNoteService::CURRENCIES))],
            'meta.notes'                     => ['nullable', 'string', 'max:1000'],
            'meta.terms'                     => ['nullable', 'string', 'max:1000'],
            'meta.template'                  => ['nullable', 'string', Rule::in(array_keys(CreditNoteService::TEMPLATES))],
            'meta.accent_color'              => ['nullable', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        try {
            $result = $this->creditNotes->build(
                $validated['company'],
                $validated['client'],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that credit note. Double-check your entries and try again.']], 422);
        }

        $this->usage->record('credit_note', $validated['meta']['template'] ?? 'clean', null, [
            'line_items' => count($validated['items']),
            'currency'   => $validated['meta']['currency'] ?? 'USD',
            'has_logo'   => !empty($validated['company']['logo_base64']),
        ]);

        $filename = 'credit-note-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['credit_note_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'X-Credit-Note-Total' => (string) $result['total'],
        ]);
    }
}
