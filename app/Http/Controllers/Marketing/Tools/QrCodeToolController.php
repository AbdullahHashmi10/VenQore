<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\QrCodeService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * QrCodeToolController — QR Code Generator, "Barcodes & Labels" group.
 *
 * NOTE: relies on App\Services\Tools\QrCodeService, which itself requires
 * the `endroid/qr-code` composer package — NOT YET installed in this repo's
 * composer.json as of writing. See the top-of-file docblock in
 * QrCodeService for the exact command to run locally
 * (`composer require endroid/qr-code`) before this controller will work.
 *
 * Entirely free and ungated, like the single-barcode path in
 * BarcodeToolController — no email, only the shared `throttle:tools`
 * limiter. There is no email-gated "bulk" upgrade here because a QR code
 * is a single artifact by nature (unlike a barcode print sheet).
 */
class QrCodeToolController extends Controller
{
    public function __construct(
        private readonly QrCodeService $qr,
        private readonly ToolUsageRecorder $usage,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/QrCode', [
            'supportsRaster' => $this->qr->supportsRaster(),
            'supportsLogo'   => $this->qr->supportsLogo(),
            'toolGroups'     => ToolRegistry::groups(),
        ]);
    }

    /**
     * POST /tools/qr-code-generator/render — throttle:tools
     * Free, unlimited (within rate limit), no email required.
     */
    public function render(Request $request)
    {
        $validated = $request->validate([
            'type'   => ['required', 'string', Rule::in(QrCodeService::TYPES)],
            'fields' => ['required', 'array'],

            'fields.url'         => ['nullable', 'string', 'max:2000'],
            'fields.text'        => ['nullable', 'string', 'max:2000'],
            'fields.ssid'        => ['nullable', 'string', 'max:64'],
            'fields.password'    => ['nullable', 'string', 'max:128'],
            'fields.encryption'  => ['nullable', 'string', 'in:WPA,WEP,nopass,NOPASS'],
            'fields.name'        => ['nullable', 'string', 'max:100'],
            'fields.phone'       => ['nullable', 'string', 'max:32'],
            'fields.email'       => ['nullable', 'string', 'max:120'],
            'fields.company'     => ['nullable', 'string', 'max:120'],
            'fields.title'       => ['nullable', 'string', 'max:120'],
            'fields.address'     => ['nullable', 'string', 'max:120'],
            'fields.subject'     => ['nullable', 'string', 'max:200'],
            'fields.body'        => ['nullable', 'string', 'max:1000'],
            'fields.number'      => ['nullable', 'string', 'max:32'],

            'output'           => ['required', 'string', 'in:png,svg'],
            'size'             => ['nullable', 'integer', 'min:100', 'max:1000'],
            'margin'           => ['nullable', 'integer', 'min:0', 'max:60'],
            'error_correction' => ['nullable', 'string', Rule::in(QrCodeService::ERROR_CORRECTION_LEVELS)],
            'foreground'       => ['nullable', 'string', 'regex:/^#?[0-9a-fA-F]{3,6}$/'],
            'background'       => ['nullable', 'string', 'regex:/^#?[0-9a-fA-F]{3,6}$/'],
            // logo is a data: URI or raw base64 string, capped well under
            // the 2MB rule of thumb for a small centered logo image.
            'logo'             => ['nullable', 'string', 'max:2000000'],
        ]);

        try {
            $payload = $this->qr->buildPayload($validated['type'], $validated['fields']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        }

        try {
            $result = $this->qr->render(
                payload: $payload,
                output: $validated['output'],
                size: $validated['size'] ?? 400,
                margin: $validated['margin'] ?? 16,
                errorCorrection: $validated['error_correction'] ?? 'M',
                foreground: $validated['foreground'] ?? '#000000',
                background: $validated['background'] ?? '#FFFFFF',
                logoBase64: $validated['logo'] ?? null,
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['errors' => [$e->getMessage()]], 422);
        } catch (\Throwable $e) {
            return response()->json(['errors' => ['Could not generate that QR code. Double-check the fields and try again.']], 422);
        }

        $this->usage->record('qr-code', $validated['type'], null, [
            'output'      => $result['format'],
            'has_logo'    => !empty($validated['logo']),
            'logo_applied' => $result['logo_applied'],
            'error_correction' => $validated['error_correction'] ?? 'M',
        ]);

        // $result['format'] is what was ACTUALLY produced, which may differ
        // from the requested $validated['output'] if raster support isn't
        // available on this server — same honesty contract as
        // BarcodeToolController::render(). Never mislabel the download.
        $downgraded = $result['format'] !== $validated['output'];

        return response()->json([
            'image_base64'      => base64_encode($result['bytes']),
            'mime_type'         => $this->qr->mimeType($result['format']),
            'file_extension'    => $this->qr->fileExtension($result['format']),
            'actual_format'     => $result['format'],
            'format_downgraded' => $downgraded,
            'logo_applied'      => $result['logo_applied'],
            'payload_preview'   => mb_strlen($payload) > 120 ? mb_substr($payload, 0, 117) . '...' : $payload,
        ]);
    }
}
