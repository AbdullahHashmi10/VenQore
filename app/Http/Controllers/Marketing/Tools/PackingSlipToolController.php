<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\PackingSlipService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * PackingSlipToolController — free PDF packing slip generator.
 *
 * Stateless PDF generator: round-trips ship-from, ship-to, carrier/tracking, and line items.
 * Price-free design.
 */
class PackingSlipToolController extends Controller
{
    public function __construct(
        private readonly PackingSlipService $packingSlips,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/PackingSlip', [
            'templates'       => PackingSlipService::TEMPLATES,
            'maxItems'        => PackingSlipService::MAX_LINE_ITEMS,
            'suggestedNumber' => $this->packingSlips->nextPackingSlipNumber(),
            'toolGroups'      => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/packing-slip-generator/render — throttle:tools
     * Free, unlimited, no prices shown, unwatermarked PDF.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'shipFrom'                  => ['required', 'array'],
            'shipFrom.name'             => ['required', 'string', 'max:120'],
            'shipFrom.address'          => ['nullable', 'string', 'max:300'],
            'shipFrom.email'            => ['nullable', 'string', 'max:120'],
            'shipFrom.phone'            => ['nullable', 'string', 'max:60'],
            'shipFrom.logo_base64'      => ['nullable', 'string', 'max:2000000'],

            'shipTo'                    => ['required', 'array'],
            'shipTo.name'               => ['required', 'string', 'max:120'],
            'shipTo.address'            => ['nullable', 'string', 'max:300'],
            'shipTo.email'              => ['nullable', 'string', 'max:120'],
            'shipTo.phone'              => ['nullable', 'string', 'max:60'],

            'billTo'                    => ['nullable', 'array'],
            'billTo.name'               => ['nullable', 'string', 'max:120'],
            'billTo.address'            => ['nullable', 'string', 'max:300'],
            'billTo.email'              => ['nullable', 'string', 'max:120'],
            'billTo.phone'              => ['nullable', 'string', 'max:60'],

            'items'                     => ['required', 'array', 'min:1', 'max:' . PackingSlipService::MAX_LINE_ITEMS],
            'items.*.sku'               => ['nullable', 'string', 'max:60'],
            'items.*.description'       => ['required', 'string', 'max:200'],
            'items.*.quantity_ordered'  => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.quantity_shipped'  => ['required', 'numeric', 'min:0', 'max:1000000'],
            'items.*.package_number'    => ['nullable', 'string', 'max:60'],
            'items.*.notes'             => ['nullable', 'string', 'max:200'],

            'meta'                      => ['nullable', 'array'],
            'meta.order_number'         => ['nullable', 'string', 'max:60'],
            'meta.pack_date'            => ['nullable', 'string', 'max:30'],
            'meta.carrier'              => ['nullable', 'string', 'max:100'],
            'meta.tracking_number'      => ['nullable', 'string', 'max:100'],
            'meta.special_instructions' => ['nullable', 'string', 'max:1000'],
            'meta.gift_message'         => ['nullable', 'string', 'max:1000'],
            'meta.template'             => ['nullable', 'string', Rule::in(array_keys(PackingSlipService::TEMPLATES))],
            'meta.accent_color'         => ['nullable', 'string', 'max:9', 'regex:/^#[0-9a-fA-F]{3,8}$/'],
        ]);

        try {
            $result = $this->packingSlips->build(
                $validated['shipFrom'],
                $validated['shipTo'],
                $validated['billTo'] ?? [],
                $validated['items'],
                $validated['meta'] ?? []
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that packing slip. Double-check your line items and try again.']], 422);
        }

        $this->usage->record('packing-slip', $validated['meta']['template'] ?? 'clean', null, [
            'line_items'           => count($validated['items']),
            'has_logo'             => !empty($validated['shipFrom']['logo_base64']),
            'has_partial_shipment' => $result['hasPartialShipment'],
        ]);

        $filename = 'packing-slip-' . preg_replace('/[^A-Za-z0-9\-]/', '', $validated['meta']['order_number'] ?? 'draft') . '.pdf';

        return response($result['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
