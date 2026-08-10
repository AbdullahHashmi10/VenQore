<?php

namespace App\Support;

/**
 * ToolRegistry — single source of truth for the /tools sidebar, hub page
 * and internal linking.
 *
 * Every tool from the Free Tools plan lives here, including ones not built
 * yet (status 'soon'). Listing planned tools is deliberate: it shows the
 * visitor the tool set is broad (more reasons to come back), and gives us
 * real internal-link targets to light up as each ships. A 'soon' tool
 * renders as a non-clickable item in the sidebar — never a dead link, and
 * never a route that 404s.
 *
 * When you ship a tool: flip status to 'live' and add its route name. The
 * sidebar, hub and sitemap all follow automatically.
 *
 * See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §2.2.
 */
class ToolRegistry
{
    public const STATUS_LIVE = 'live';
    public const STATUS_SOON = 'soon';

    /**
     * @return array<int, array{
     *   key:string, label:string, tools:array<int, array{
     *     slug:string, name:string, short:string, description:string,
     *     status:string, route:?string, href:?string
     *   }>
     * }>
     */
    public static function groups(): array
    {
        $groups = [
            [
                'key'   => 'barcodes',
                'label' => 'Barcodes & Labels',
                'tools' => [
                    self::tool('barcode-generator', 'Barcode Generator', 'Barcode Generator', 'Generate Code128, EAN-13, UPC-A and more as PNG, SVG or JPG.', self::STATUS_LIVE, 'tools.barcode'),
                    self::tool('barcode-validator', 'Barcode Validator', 'Barcode Validator', 'Check UPC/EAN/GTIN check digits with a full arithmetic breakdown.', self::STATUS_LIVE, 'tools.barcode-validator'),
                    self::tool('barcode-label-generator', 'Barcode Label Sheet Generator', 'Barcode Labels', 'Printable Avery-compatible inventory label sheets — a real scannable barcode on every product.', self::STATUS_LIVE, 'tools.barcode-label'),
                    self::tool('label-sheet-generator', 'Label Sheet Generator', 'Text Labels', 'Printable Avery-compatible text labels — addresses, warnings, folder tabs, name badges.', self::STATUS_LIVE, 'tools.label-sheet'),
                    self::tool('price-tag-generator', 'Price Tag Generator', 'Price Tags', 'Retail shelf-edge strips and price tags, print-ready.', self::STATUS_LIVE, 'tools.price-tag'),
                    self::tool('qr-code-generator', 'QR Code Generator', 'QR Codes', 'Free QR codes for URLs, WiFi, contact cards, email and phone — with colors, logo and error correction.', self::STATUS_LIVE, 'tools.qr'),
                    self::tool('qr-menu-generator', 'QR Menu Generator', 'QR Menus', 'Restaurant QR code menus and printable table cards.', self::STATUS_LIVE, 'tools.qr-menu'),
                ],
            ],
            [
                'key'   => 'documents',
                'label' => 'Documents',
                'tools' => [
                    self::tool('smart-capture', 'Smart Capture AI', 'Smart Capture', 'Scan handwritten images, PDFs, and invoices with AI to extract vendor details, totals, and item breakdowns.', self::STATUS_LIVE, 'tools.smart-capture'),
                    self::tool('invoice-generator', 'Invoice Generator', 'Invoices', 'Free, unwatermarked PDF invoices in multiple templates.', self::STATUS_LIVE, 'tools.invoice'),
                    self::tool('receipt-generator', 'Receipt Generator', 'Receipts', 'Free POS-style PDF receipts for 80mm thermal printers or Letter/A4 records.', self::STATUS_LIVE, 'tools.receipt'),
                    self::tool('purchase-order-generator', 'Purchase Order Generator', 'Purchase Orders', 'Free, unwatermarked PDF purchase orders with ship-to address and signature line.', self::STATUS_LIVE, 'tools.purchase-order'),
                    self::tool('quote-generator', 'Quotation Generator', 'Quotations', 'Quotes and estimates your customers can sign off.', self::STATUS_LIVE, 'tools.quote'),
                    self::tool('packing-slip-generator', 'Packing Slip Generator', 'Packing Slips', 'Free packing slip generator with ship-to vs bill-to addresses, carrier/tracking, and box line items.', self::STATUS_LIVE, 'tools.packing-slip'),
                    self::tool('credit-note-generator', 'Credit Note Generator', 'Credit Notes', 'Free, unwatermarked PDF credit notes for returns and refunds — references the original invoice.', self::STATUS_LIVE, 'tools.credit-note'),
                ],
            ],
            [
                'key'   => 'inventory',
                'label' => 'Inventory & Data',
                'tools' => [
                    self::tool('sku-generator', 'Bulk SKU Generator', 'SKU Generator', 'Build a structured SKU scheme and generate codes in bulk.', self::STATUS_LIVE, 'tools.sku-generator'),
                    self::tool('product-csv-cleaner', 'Product CSV Cleaner', 'CSV Cleaner', 'Validate and fix Shopify/WooCommerce product import files.', self::STATUS_LIVE, 'tools.csv-cleaner'),
                    self::tool('stock-count-sheet', 'Stock Count Sheet', 'Stock Count Sheets', 'Printable stocktake sheets for physical inventory counts.', self::STATUS_LIVE, 'tools.stock-count'),
                    self::tool('cash-drawer-count-sheet', 'Cash Drawer Count Sheet', 'Cash Drawer Sheets', 'Till reconciliation sheets with denomination rows.', self::STATUS_LIVE, 'tools.cash-drawer'),
                    self::tool('inventory-health', 'Inventory Health Toolkit', 'Inventory Health', 'Reorder point, safety stock, EOQ, GMROI and turnover in one place.', self::STATUS_LIVE, 'tools.inventory-health'),
                ],
            ],
            [
                'key'   => 'calculators',
                'label' => 'Calculators',
                'tools' => [
                    self::tool('margin-calculator', 'Profit Margin & Markup Calculator', 'Margin Calculator', 'Solve cost, price, margin and markup live, plus bulk product-list mode.', self::STATUS_LIVE, 'tools.margin-calculator'),
                    self::tool('pos-roi-calculator', 'POS ROI Calculator', 'POS ROI', 'Work out whether a POS system actually pays for itself.', self::STATUS_LIVE, 'tools.pos-roi'),
                    self::tool('payment-fee-calculator', 'Payment Fee Calculator', 'Payment Fees', 'Compare Stripe, Square, PayPal, Clover and Shopify Payments processing fees.', self::STATUS_LIVE, 'tools.payment-fee'),
                    self::tool('food-cost-calculator', 'Recipe Costing Calculator', 'Food Cost', 'Cost a recipe per portion and price it to a target margin.', self::STATUS_LIVE, 'tools.food-cost'),
                ],
            ],
        ];

        return $groups;
    }

    /** Flat list of every tool, live and planned. */
    public static function all(): array
    {
        return collect(self::groups())->flatMap(fn ($g) => $g['tools'])->all();
    }

    /** Only the tools that are actually built and routable. */
    public static function live(): array
    {
        return collect(self::all())->filter(fn ($t) => $t['status'] === self::STATUS_LIVE)->values()->all();
    }

    private static function tool(
        string $slug,
        string $name,
        string $short,
        string $description,
        string $status,
        ?string $routeName = null,
    ): array {
        $href = null;
        if ($status === self::STATUS_LIVE && $routeName && \Illuminate\Support\Facades\Route::has($routeName)) {
            $href = route($routeName);
        }

        return [
            'slug'        => $slug,
            'name'        => $name,
            'short'       => $short,
            'description' => $description,
            'status'      => $status,
            'route'       => $routeName,
            'href'        => $href,
        ];
    }
}
