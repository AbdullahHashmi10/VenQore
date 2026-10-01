<?php

namespace App\Services\Tools;

use Barryvdh\DomPDF\Facade\Pdf;
use InvalidArgumentException;

/**
 * PackingSlipService — builds a free, unwatermarked PDF packing slip from a ship-from
 * business profile, a ship-to recipient, shipping carrier/tracking details, and line items.
 *
 * Designed specifically for warehouse/fulfillment use: deliberately excludes ALL pricing
 * (no prices, tax, or totals). Tracks Qty Ordered vs Qty Shipped and automatically flags
 * partial shipments.
 */
class PackingSlipService
{
    public const TEMPLATES = [
        'clean'    => ['name' => 'Clean',    'description' => 'Minimal black-and-white, works for any industry.'],
        'modern'   => ['name' => 'Modern',   'description' => 'Bold accent color band, great for e-commerce brands.'],
        'classic'  => ['name' => 'Classic',  'description' => 'Traditional bordered layout with distinct warehouse sections.'],
        'compact'  => ['name' => 'Compact',  'description' => 'Dense layout for shipments with many line items.'],
    ];

    public const MAX_LINE_ITEMS = 100;

    /**
     * @param array $shipFrom    ['name','address','email','phone','logo_base64']
     * @param array $shipTo      ['name','address','email','phone']
     * @param array $billTo      ['name','address','email','phone']
     * @param array $items       list of ['sku','description','quantity_ordered','quantity_shipped','package_number','notes']
     * @param array $meta        ['order_number','pack_date','carrier','tracking_number','special_instructions','template','accent_color']
     * @throws InvalidArgumentException
     */
    public function build(array $shipFrom, array $shipTo, array $billTo, array $items, array $meta): array
    {
        $errors = $this->validate($shipFrom, $shipTo, $items, $meta);
        if (!empty($errors)) {
            throw new InvalidArgumentException(implode(' ', $errors));
        }

        $template = $meta['template'] ?? 'clean';
        if (!array_key_exists($template, self::TEMPLATES)) {
            $template = 'clean';
        }

        $lines = [];
        $hasPartialShipment = false;
        $totalOrdered = 0;
        $totalShipped = 0;

        foreach (array_slice($items, 0, self::MAX_LINE_ITEMS) as $item) {
            $qtyOrdered = max(0, (float) ($item['quantity_ordered'] ?? 0));
            $qtyShipped = max(0, (float) ($item['quantity_shipped'] ?? 0));

            if ($qtyShipped < $qtyOrdered) {
                $hasPartialShipment = true;
            }

            $totalOrdered += $qtyOrdered;
            $totalShipped += $qtyShipped;

            $lines[] = [
                'sku'              => trim($item['sku'] ?? ''),
                'description'      => trim($item['description'] ?? ''),
                'quantity_ordered' => $qtyOrdered,
                'quantity_shipped' => $qtyShipped,
                'package_number'   => trim($item['package_number'] ?? ''),
                'notes'            => trim($item['notes'] ?? ''),
            ];
        }

        $pdf = Pdf::loadView('tools.pdf.packing-slip', [
            'shipFrom'           => $shipFrom,
            'shipTo'             => $shipTo,
            'billTo'             => $billTo,
            'lines'              => $lines,
            'meta'               => $meta,
            'template'           => $template,
            'hasPartialShipment' => $hasPartialShipment,
            'totalOrdered'       => $totalOrdered,
            'totalShipped'       => $totalShipped,
        ])->setPaper('a4', 'portrait');

        return [
            'bytes'              => $pdf->output(),
            'hasPartialShipment' => $hasPartialShipment,
            'totalOrdered'       => $totalOrdered,
            'totalShipped'       => $totalShipped,
        ];
    }

    public function validate(array $shipFrom, array $shipTo, array $items, array $meta): array
    {
        $errors = [];

        if (empty(trim($shipFrom['name'] ?? ''))) {
            $errors[] = 'Your business / ship-from name is required.';
        }
        if (empty(trim($shipTo['name'] ?? ''))) {
            $errors[] = 'A recipient / ship-to name is required.';
        }
        if (empty($items)) {
            $errors[] = 'Add at least one line item.';
        }
        if (count($items) > self::MAX_LINE_ITEMS) {
            $errors[] = 'A single packing slip supports at most ' . self::MAX_LINE_ITEMS . ' line items.';
        }
        foreach ($items as $i => $item) {
            if (empty(trim($item['description'] ?? ''))) {
                $errors[] = 'Line ' . ($i + 1) . ' needs a description.';
                break;
            }
        }

        return $errors;
    }

    public function nextPackingSlipNumber(): string
    {
        return 'PS-' . now()->format('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
    }
}
