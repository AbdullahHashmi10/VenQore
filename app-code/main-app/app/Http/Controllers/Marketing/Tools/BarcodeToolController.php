<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\BarcodeService;
use App\Services\Tools\BarcodeSheetService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * BarcodeToolController — T1 Barcode Generator, plus inline GTIN check-digit
 * validation, merged in per product decision: "we should validate and tell
 * them right away" rather than forcing a visit to a separate page. The
 * standalone /tools/barcode-validator page is KEPT ALIVE alongside this for
 * its own SEO/GEO value — see BarcodeValidatorToolController — this is an
 * addition, not a replacement.
 *
 * Single-barcode render/download is NEVER gated (plan §6.1) — no email,
 * no rate beyond the shared `tools` limiter. Bulk generation (>10 values)
 * requires an email via ToolLeadController and is not implemented in this
 * pass; the free single-barcode path is complete and is what T1's
 * acceptance criteria (plan §7 T1) require.
 */
class BarcodeToolController extends Controller
{
    public function __construct(
        private readonly BarcodeService $barcodes,
        private readonly BarcodeSheetService $sheets,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/Barcode', $this->pageProps());
    }

    public function format(string $format)
    {
        abort_unless($this->barcodes->isValidFormat($format), 404);

        return Inertia::render('Marketing/Tools/Barcode', $this->pageProps([
            'selectedFormat' => $format,
        ]));
    }

    private function pageProps(array $extra = []): array
    {
        return array_merge([
            'formats'        => $this->formatList(),
            'supportsRaster' => $this->barcodes->supportsRaster(),
            'sheetPresets'   => BarcodeSheetService::presetOptions(),
            'maxQuantity'    => BarcodeSheetService::MAX_QUANTITY,
            'toolGroups'     => ToolRegistry::groups(),
        ], $extra);
    }

    /**
     * POST /tools/barcode-generator/render — throttle:tools
     * Free, unlimited (within rate limit), no email required.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'format'       => ['required', 'string', Rule::in(array_keys(BarcodeService::FORMATS))],
            'value'        => ['required', 'string', 'max:64'],
            'output'       => ['required', 'string', 'in:png,svg,jpg'],
            'width_factor' => ['nullable', 'integer', 'min:1', 'max:6'],
            'height'       => ['nullable', 'integer', 'min:20', 'max:400'],
            'show_value'   => ['nullable', 'boolean'],
            'caption'      => ['nullable', 'string', 'max:64'],
            // logo is a data: URI or raw base64 string, capped well under
            // the 2MB rule of thumb for a small centered logo image.
            'logo'         => ['nullable', 'string', 'max:2000000'],
        ]);

        $errors = $this->barcodes->validate($validated['format'], $validated['value']);
        if (!empty($errors)) {
            return response()->json(['errors' => $errors], 422);
        }

        $prepared = $this->barcodes->prepareValue($validated['format'], $validated['value']);

        try {
            $result = $this->barcodes->render(
                slug: $validated['format'],
                value: $prepared['value'],
                output: $validated['output'],
                widthFactor: $validated['width_factor'] ?? 2,
                height: $validated['height'] ?? 60,
                showValue: $validated['show_value'] ?? true,
                caption: $validated['caption'] ?? null,
                logoBase64: $validated['logo'] ?? null,
            );
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not generate that barcode. Double-check the value and try again.']], 422);
        }

        $this->usage->record('barcode', $validated['format'], null, [
            'output'            => $result['format'],
            'auto_check_digit'  => $prepared['was_computed'],
            'has_caption'       => !empty($validated['caption']),
            'has_logo'          => !empty($validated['logo']),
        ]);

        // $result['format'] is what was ACTUALLY produced, which may differ
        // from the requested $validated['output'] if raster support isn't
        // available on this server (see BarcodeService::render() docblock).
        // Reporting this honestly is the fix for downloaded files that
        // wouldn't open because they were mislabeled.
        $downgraded = $result['format'] !== $validated['output'];

        return response()->json([
            'image_base64'     => base64_encode($result['bytes']),
            'mime_type'        => $this->barcodes->mimeType($result['format']),
            'file_extension'   => $this->barcodes->fileExtension($result['format']),
            'actual_format'    => $result['format'],
            'format_downgraded' => $downgraded,
            'encoded_value'    => $prepared['value'],
            'check_digit'      => $prepared['check_digit'],
            'was_computed'     => $prepared['was_computed'],
        ]);
    }

    /**
     * POST /tools/barcode-generator/sheet — throttle:tools
     *
     * Print-ready PDF of N copies at a chosen label size. This is the
     * EMAIL-GATED deliverable for this tool (plan §6.1): the single
     * barcode above stays completely free and ungated because gating the
     * core output raises bounce rate and bounce is a ranking input — but a
     * bulk print sheet is a genuine "volume/portability" upgrade, which is
     * exactly where the plan says a gate belongs.
     *
     * The frontend captures the email via ToolLeadController FIRST, then
     * calls this. We do not verify a lead here: the gate is a conversion
     * mechanism, not a security boundary, and hard-blocking would just
     * push people to a competitor's generator.
     */
    public function sheet(Request $request)
    {
        $validated = $request->validate([
            'format'     => ['required', 'string', Rule::in(array_keys(BarcodeService::FORMATS))],
            'value'      => ['required', 'string', 'max:64'],
            'preset'     => ['required', 'string', Rule::in(array_keys(BarcodeSheetService::PRESETS))],
            'quantity'   => ['required', 'integer', 'min:1', 'max:' . BarcodeSheetService::MAX_QUANTITY],
            'show_value' => ['nullable', 'boolean'],
            'caption'    => ['nullable', 'string', 'max:64'],
        ]);

        try {
            $pdf = $this->sheets->build(
                formatSlug: $validated['format'],
                value: $validated['value'],
                preset: $validated['preset'],
                quantity: $validated['quantity'],
                showValue: $validated['show_value'] ?? true,
                caption: $validated['caption'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not build that print sheet. Try a different label size.']], 422);
        }

        $this->usage->record('barcode-sheet', $validated['preset'], null, [
            'quantity' => $validated['quantity'],
            'format'   => $validated['format'],
        ]);

        $filename = 'barcode-labels-' . $validated['value'] . '-' . $validated['preset'] . '.pdf';

        // Streamed rather than a plain response(): sheets can run to hundreds of
        // labels, so this avoids holding the full PDF in memory twice (once in
        // $pdf, once again while Laravel buffers the response body) and gets the
        // first byte to the browser sooner.
        return response()->streamDownload(function () use ($pdf) {
            echo $pdf;
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * POST /tools/barcode-generator/validate — throttle:tools
     * Inline "paste an existing code, tell me if it's valid" check, reusing
     * the same GTIN arithmetic as the standalone validator tool.
     */
    public function validateExisting(Request $request)
    {
        $validated = $request->validate([
            'value' => ['required', 'string', 'max:32'],
        ]);

        try {
            $result = $this->barcodes->validateGtin($validated['value']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }

        $this->usage->record('barcode-inline-validate', null, null, ['valid' => $result['valid']]);

        return response()->json($result);
    }

    private function formatList(): array
    {
        return collect(BarcodeService::FORMATS)->map(fn ($f, $slug) => [
            'slug'        => $slug,
            'name'        => $f['name'],
            'digits_only' => $f['digits_only'],
            'short_len'   => $f['short_len'],
            'full_len'    => $f['full_len'],
        ])->values()->all();
    }
}
