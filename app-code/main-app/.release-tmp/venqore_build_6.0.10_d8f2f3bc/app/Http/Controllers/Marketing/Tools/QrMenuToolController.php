<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\QrCodeService;
use App\Services\Tools\QrMenuService;
use App\Services\Tools\ToolUsageRecorder;
use App\Support\ToolRegistry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class QrMenuToolController extends Controller
{
    public function __construct(
        private readonly QrCodeService $qrCodeService,
        private readonly QrMenuService $qrMenuService,
        private readonly ToolUsageRecorder $usageRecorder,
    ) {
    }

    public function index()
    {
        return Inertia::render('Marketing/Tools/QrMenu', [
            'presets' => QrMenuService::PRESETS,
            'themes' => QrMenuService::THEMES,
            'supportsRaster' => $this->qrCodeService->supportsRaster(),
            'supportsLogo' => $this->qrCodeService->supportsLogo(),
            'toolGroups' => ToolRegistry::groups(),
        ]);
    }

    public function render(Request $request)
    {
        $validated = $request->validate([
            'restaurant_name' => ['required', 'string', 'max:100'],
            'tagline'         => ['nullable', 'string', 'max:150'],
            'menu_url'        => ['required', 'string', 'max:2000'],
            'table_number'    => ['nullable', 'string', 'max:50'],
            'instruction_text'=> ['nullable', 'string', 'max:200'],
            'preset'          => ['required', 'string', Rule::in(array_keys(QrMenuService::PRESETS))],
            'theme'           => ['required', 'string', Rule::in(array_keys(QrMenuService::THEMES))],
            'custom_fg'       => ['nullable', 'string', 'regex:/^#?[0-9a-fA-F]{3,6}$/'],
            'custom_bg'       => ['nullable', 'string', 'regex:/^#?[0-9a-fA-F]{3,6}$/'],
            'logo'            => ['nullable', 'string', 'max:2000000'],
            'menu_items'      => ['nullable', 'array', 'max:50'],
            'menu_items.*.category' => ['nullable', 'string', 'max:100'],
            'menu_items.*.name'     => ['required_with:menu_items', 'string', 'max:100'],
            'menu_items.*.description' => ['nullable', 'string', 'max:250'],
            'menu_items.*.price'    => ['nullable', 'string', 'max:50'],
        ]);

        $url = trim($validated['menu_url']);
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }

        $themeConfig = QrMenuService::THEMES[$validated['theme']];
        $presetConfig = QrMenuService::PRESETS[$validated['preset']];

        $qrFg = $validated['custom_fg'] ?? $themeConfig['qr_fg'];
        $qrBg = $validated['custom_bg'] ?? $themeConfig['qr_bg'];

        $qrImageBase64 = null;
        $qrError = null;

        try {
            $qrResult = $this->qrMenuService->generateQrCode(
                payload: $url,
                format: 'png',
                size: 500,
                foreground: $qrFg,
                background: $qrBg,
                logoBase64: $validated['logo'] ?? null
            );
            $qrImageBase64 = 'data:' . $this->qrCodeService->mimeType($qrResult['format']) . ';base64,' . base64_encode($qrResult['bytes']);
        } catch (\Throwable $e) {
            $qrError = 'Note: QR Code generation is running in compatibility mode (' . $e->getMessage() . ').';
        }

        $this->usageRecorder->record('qr-menu', 'pdf', null, [
            'preset' => $validated['preset'],
            'theme'  => $validated['theme'],
            'has_logo' => !empty($validated['logo']),
        ]);

        $pdf = Pdf::loadView('tools.pdf.qr-menu', [
            'restaurantName'  => $validated['restaurant_name'],
            'tagline'         => $validated['tagline'] ?? 'Scan to view our digital menu',
            'menuUrl'         => $url,
            'tableNumber'     => $validated['table_number'] ?? '',
            'instructionText' => $validated['instruction_text'] ?? 'Point your phone camera at the QR code to open the menu',
            'preset'          => $validated['preset'],
            'presetConfig'    => $presetConfig,
            'theme'           => $validated['theme'],
            'themeConfig'     => $themeConfig,
            'qrImageBase64'   => $qrImageBase64,
            'qrError'         => $qrError,
            'menuItems'       => $validated['menu_items'] ?? [],
        ]);

        $paperMap = [
            'tent_4x6'    => [0, 0, 288, 432], // 4x6 inches in points
            'standee_5x7'  => [0, 0, 360, 504], // 5x7 inches in points
            'sticker_3x3'  => [0, 0, 216, 216], // 3x3 inches in points
        ];

        $pdf->setPaper($paperMap[$validated['preset']] ?? 'letter', 'portrait');

        $filename = 'qr-menu-' . \Illuminate\Support\Str::slug($validated['restaurant_name']) . '.pdf';

        return $pdf->download($filename);
    }
}
