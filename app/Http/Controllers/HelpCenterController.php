<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpCenterController extends Controller
{
    private function getArticles(): array
    {
        return [
            [
                'slug'        => 'pos-setup-getting-started',
                'title'       => 'Getting Started with VenQore POS',
                'category'    => 'POS & Setup',
                'summary'     => 'How to set up your store, register locations, and configure register hardware.',
                'content'     => 'VenQore POS is designed for rapid onboarding. Navigate to Settings > Store Locations to add registers, staff seats, and printer connections.',
            ],
            [
                'slug'        => 'smartcapture-scan-guide',
                'title'       => 'SmartCapture Invoice Scanning Guide',
                'category'    => 'SmartCapture AI',
                'summary'     => 'How to scan invoices, paper receipts, and handwritten inventory sheets.',
                'content'     => 'Use SmartCapture from the POS menu or mobile web scanner. Ensure photos are taken straight-on under adequate lighting for optimal OCR precision.',
            ],
            [
                'slug'        => 'inventory-management-skus',
                'title'       => 'Managing Inventory & SKU Limits',
                'category'    => 'Inventory',
                'summary'     => 'Understanding SKU limits across plans and managing stock level alerts.',
                'content'     => 'Each plan includes a declared SKU capacity (Counter: 500, Starter: 5,000, Growth: 20,000, Business: 50,000). Stock alerts trigger at threshold levels.',
            ],
            [
                'slug'        => 'ltd-plans-and-byok',
                'title'       => 'AppSumo Lifetime Deals & BYOK AI Mode',
                'category'    => 'Billing & LTD',
                'summary'     => 'How Lifetime Deal tiers work and connecting your own Gemini or OpenAI API key.',
                'content'     => 'LTD tiers include lifetime access to the POS engine. Platform managed AI is hard-blocked on LTD tiers; navigate to Settings > AI Scan to enter your own BYOK key.',
            ],
            [
                'slug'        => 'transaction-limits-explained',
                'title'       => 'Monthly Transaction Quotas & Top-ups',
                'category'    => 'Billing & LTD',
                'summary'     => 'Understanding monthly transaction caps and automatic monthly resets.',
                'content'     => 'AppSumo LTD tiers carry monthly transaction caps (Tier 1: 1,000/mo, Tier 2: 3,000/mo, Tier 3: 8,000/mo). Counters reset automatically on your monthly anniversary.',
            ],
            [
                'slug'        => 'hosted-until-renewal',
                'title'       => 'Lifetime Hosting & $9/mo Continuation Subscriptions',
                'category'    => 'Billing & LTD',
                'summary'     => 'What happens when your hosted_until period approaches.',
                'content'     => 'LTD tiers include lifetime cloud hosting. When your initial hosting window ends, renew via the $9/mo continuation plan to keep active store writes enabled.',
            ],
            [
                'slug'        => 'multi-channel-vensynq',
                'title'       => 'VenSynQ E-Commerce & Channel Integration',
                'category'    => 'Integrations',
                'summary'     => 'Syncing catalog products and stock levels with Amazon, WooCommerce, and Shopify.',
                'content'     => 'VenSynQ syncs inventory live across channels. Enable channel add-ons from Settings > Multi-Channel to connect external store API credentials.',
            ],
            [
                'slug'        => 'shared-catalog-opt-out',
                'title'       => 'Shared Catalog & Data Privacy Settings',
                'category'    => 'Privacy & Compliance',
                'summary'     => 'How anonymous global product lookup works and toggling catalog opt-out.',
                'content'     => 'VenQore builds an anonymous shared product catalog. No prices or store data are ever shared. Opt-out anytime in Settings > Privacy & Data.',
            ],
            [
                'slug'        => 'receipt-printers-hardware',
                'title'       => 'Connecting ESC/POS Receipt Printers',
                'category'    => 'Hardware',
                'summary'     => 'Configuring USB, Bluetooth, and LAN receipt printers.',
                'content'     => 'VenQore supports standard ESC/POS thermal printers. Connect your printer via USB or local network IP in Register Settings.',
            ],
            [
                'slug'        => 'barcode-scanners-configuration',
                'title'       => 'Barcode Scanner Setup',
                'category'    => 'Hardware',
                'summary'     => 'Using 1D/2D USB and Bluetooth barcode scanners at register checkout.',
                'content'     => 'Plug and play HID barcode scanners work natively. Ensure your scanner is set to send a carriage return (CR) suffix after every scan.',
            ],
            [
                'slug'        => 'staff-roles-permissions',
                'title'       => 'Staff Roles & Register Access Control',
                'category'    => 'Staff Management',
                'summary'     => 'Managing owner, manager, cashier, and accountant permissions.',
                'content'     => 'Assign granular roles under Settings > Staff. Cashiers are restricted to register sales, while managers can perform inventory edits and refunds.',
            ],
            [
                'slug'        => 'ai-descriptions-generator',
                'title'       => 'AI Product Description Generator',
                'category'    => 'SmartCapture AI',
                'summary'     => 'Batch generating marketplace-optimized titles, descriptions, and tags.',
                'content'     => 'Select products in your catalog and click "Generate AI Descriptions". Generated copy is optimized for Web, Amazon, or POS catalogs.',
            ],
            [
                'slug'        => 'amazon-image-compliance',
                'title'       => 'Amazon Listing Image Compliance Tool',
                'category'    => 'Integrations',
                'summary'     => 'Automating 2000x2000 white background image transformations.',
                'content'     => 'Upload product photos to automatically apply a 2000x2000 RGB(255,255,255) pure white background with 85% proportional aspect scaling.',
            ],
            [
                'slug'        => 'sales-tax-vat-configuration',
                'title'       => 'Configuring Sales Tax & VAT Rules',
                'category'    => 'POS & Setup',
                'summary'     => 'Setting multi-region tax rates and tax-inclusive pricing.',
                'content'     => 'Set default store tax rates under Settings > Financials. Individual products can be set to taxable, tax-exempt, or custom rate categories.',
            ],
            [
                'slug'        => 'daily-cash-drawer-reconciliation',
                'title'       => 'Daily Cash Drawer & End-of-Day Shifts',
                'category'    => 'POS & Setup',
                'summary'     => 'Opening shifts, counting cash drawers, and closing register reports.',
                'content'     => 'Open shifts with a starting float. At day end, close the shift to view expected vs actual cash totals and print Z-reports.',
            ],
            [
                'slug'        => 'customer-loyalty-debt-tracking',
                'title'       => 'Customer Accounts & Receivables Tracking',
                'category'    => 'CRM & Financials',
                'summary'     => 'Managing store credit, customer ledger balances, and payment reminders.',
                'content'     => 'Track customer balances and credit terms. View outstanding receivables and send payment reminders directly from Customer Statements.',
            ],
            [
                'slug'        => 'supplier-payables-purchase-orders',
                'title'       => 'Supplier Payables & Purchase Orders',
                'category'    => 'CRM & Financials',
                'summary'     => 'Creating POs, logging supplier invoices, and tracking payables.',
                'content'     => 'Create purchase orders for suppliers. When stock arrives, scan supplier invoices via SmartCapture to update inventory and payables automatically.',
            ],
            [
                'slug'        => 'offline-pos-mode-sync',
                'title'       => 'Offline Mode & Local Data Resilience',
                'category'    => 'POS & Setup',
                'summary'     => 'How VenQore handles network interruptions during peak hours.',
                'content'     => 'VenQore buffers transactions locally when internet connections drop. Pending sales sync automatically once connectivity is restored.',
            ],
            [
                'slug'        => 'data-export-backups',
                'title'       => 'Exporting Sales Data & Reports',
                'category'    => 'Reports & Analytics',
                'summary'     => 'Exporting inventory lists, sales ledgers, and tax reports to CSV/Excel.',
                'content'     => 'Export full store data anytime from Reports > Data Export. All standard reports can be downloaded in CSV or PDF formats.',
            ],
            [
                'slug'        => 'troubleshooting-common-errors',
                'title'       => 'Troubleshooting & Support Escalation',
                'category'    => 'Support',
                'summary'     => 'Resolving sync errors, hardware disconnects, and contacting support.',
                'content'     => 'Check network settings and device drivers. If issues persist, submit a ticket from Help > Contact Support or view the Known Issues page.',
            ],
        ];
    }

    public function index(Request $request): Response
    {
        $articles = $this->getArticles();
        $query    = strtolower(trim((string) $request->input('q', '')));

        if (!empty($query)) {
            $articles = array_values(array_filter($articles, function ($a) use ($query) {
                return str_contains(strtolower($a['title']), $query)
                    || str_contains(strtolower($a['summary']), $query)
                    || str_contains(strtolower($a['category']), $query);
            }));
        }

        return Inertia::render('Help/Index', [
            'articles' => $articles,
            'query'    => $query,
        ]);
    }

    public function show(string $slug): Response
    {
        $articles = $this->getArticles();
        $article  = collect($articles)->firstWhere('slug', $slug);

        if (!$article) {
            abort(404);
        }

        return Inertia::render('Help/Show', [
            'article' => $article,
        ]);
    }
}
