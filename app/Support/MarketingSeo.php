<?php

namespace App\Support;

use Illuminate\Support\Facades\Route;

/**
 * MarketingSeo (2026-07-03) — server-rendered SEO/GEO layer.
 *
 * WHY: venqore.com served an empty client-rendered shell to every crawler
 * (verified live 2026-07-03). Googlebot eventually renders JS; GPTBot,
 * ClaudeBot, PerplexityBot and most AI crawlers DO NOT. This class gives
 * every public marketing route real server-rendered HTML: title, meta
 * description, canonical, OpenGraph/Twitter tags, JSON-LD structured data,
 * and a crawler-visible static content block that React replaces on mount
 * (root uses createRoot → the fallback is simply swapped out; no hydration
 * mismatch). Same content users see pre-hydration — not cloaking.
 *
 * Used by resources/views/app.blade.php via MarketingSeo::current().
 * Add a page: add an entry to pages() keyed by ROUTE NAME.
 */
class MarketingSeo
{
    public static function current(): ?array
    {
        $route = Route::current();
        if (!$route || !$route->getName()) {
            return null;
        }

        $pages = self::pages();
        $def   = $pages[$route->getName()] ?? null;
        if (!$def) {
            return null;
        }

        // Force the canonical URL to HTTPS, venqore.com host, and remove trailing slashes (except for home page)
        $path = $route->uri() === '/' ? '' : '/' . rtrim($route->uri(), '/');
        $def['canonical'] = 'https://venqore.com' . $path;
        $def['og_image']  = $def['og_image'] ?? url('/images/logo.png');

        return $def;
    }

    private static function organizationLd(): array
    {
        return [
            '@type' => 'Organization',
            'name'  => 'VenQore',
            'url'   => url('/'),
            'logo'  => url('/images/logo.png'),
            'description' => 'VenQore builds the retail operating system where the books are always right: an offline-first POS and ERP with verified double-entry accounting built in.',
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'contactType' => 'customer support',
                'url' => url('/contact'),
            ],
        ];
    }

    private static function faq(array $qas): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn($qa) => [
                '@type' => 'Question',
                'name' => $qa[0],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $qa[1]],
            ], $qas),
        ];
    }

    private static function navLinks(): string
    {
        return '<nav><a href="/">Home</a> · <a href="/features">Features</a> · <a href="/pricing">Pricing</a> · <a href="/demo">Live Demo</a> · <a href="/vensynq">VenSynQ</a> · <a href="/smartcapture">SmartCapture</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/subscribe">Newsletter</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refund-policy">Refunds</a></nav>';
    }

    private static function pages(): array
    {
        $nav = self::navLinks();

        return [

            'welcome' => [
                'title' => 'VenQore — Offline-First POS & ERP with Verified Double-Entry Accounting',
                'description' => 'VenQore is the point of sale that keeps real books. Offline-first POS + full ERP where every sale, purchase and return writes a balanced double-entry journal — verified by 636 automated tests. Try the live demo, no signup.',
                'keywords' => 'POS system, Online ERP, Online Business Software, point of sale system, retail POS software, wholesale POS system, billing software, invoicing system, cash register software, retail billing app, multi store POS, cloud POS system, offline POS software, offline first point of sale, PWA point of sale, mobile POS system, tablet point of sale, store management software, shop billing software, supermarket POS, pharmacy billing software, grocery POS system, clothing store POS, electronics shop POS, retail management system, business operating system, inventory management software, stock control system, FIFO inventory tracking, barcode inventory software, batch tracking software, expiry date tracking inventory, serial number tracking POS, IMEI tracking software, variant inventory management, multi warehouse inventory, stock valuation report, purchase order management, supplier management software, composite products creator, manufacturing recipe ERP, raw materials tracking, stock transfer software, double entry accounting software, ledger bookkeeping app, automatic journal entries, general ledger system, profit and loss report, balance sheet generator, trial balance software, cash flow statement app, financial reporting software, auditor grade accounting, bank reconciliation system, accounts receivable aging, accounts payable tracker, debit credit manager, customer khata book, customer credit limits, digital ledger book, tax exclusive billing, tax inclusive invoicing, sales tax reporting software, WooCommerce POS sync, e-commerce inventory sync, online store POS integration, web store sync ERP, multi channel fulfillment software, WhatsApp debt reminders, customer loyalty program, loyalty points system POS, gift cards software, customer CRM for retail, sales analytics dashboard, business intelligence for retail, AI invoice capture, scan to invoice software, receipt OCR software, voice to invoice assistant, staff management POS, cashier role permissions, audit logs software, thermal printer software POS, WebUSB printing system, barcode generator software, lifetime deal POS, AppSumo LTD ERP, SaaS billing system, cloud ERP software, small business ERP, enterprise retail suite, B2B invoicing platform, wholesale inventory ERP, retail shop calculator, cloud ledger books, offline billing app, fast retail checkout, hold cart POS, split payment POS, discount manager POS, customer database app, mobile billing printer, shop ledger bookkeeping, online business software, retail POS Pakistan, cloud billing software Pakistan, best POS software 2026, business ERP dashboard, simple bookkeeping for shops',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'SoftwareApplication',
                                'name' => 'VenQore POS',
                                'applicationCategory' => 'BusinessApplication',
                                'applicationSubCategory' => 'Point of Sale (POS) and ERP',
                                'operatingSystem' => 'Web browser (offline-capable PWA)',
                                'url' => url('/'),
                                'description' => 'Offline-first POS and ERP with built-in verified double-entry accounting, FIFO inventory, 40+ financial reports, multi-store support and WooCommerce sync.',
                                'offers' => [
                                    '@type' => 'AggregateOffer',
                                    'priceCurrency' => 'USD',
                                    'lowPrice' => '36',
                                    'highPrice' => '129',
                                    'offerCount' => '3',
                                    'url' => url('/pricing'),
                                ],
                                'featureList' => 'Offline-first POS checkout; Double-entry accounting engine; FIFO inventory with batch and serial tracking; 40+ verified financial reports; Multi-store management; Customer credit (khata) tracking; WooCommerce synchronization; Barcode scanning and thermal printing; Staff roles and permissions; Loyalty points and gift cards',
                            ],
                        ],
                    ],
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore — The Books Are Always Right.</h1>'
                    . '<p><strong>VenQore is an offline-first point of sale and ERP with verified double-entry accounting built in.</strong> Every sale, purchase, return and transfer writes a correct, balanced journal entry automatically — no accountant required. The accounting engine is proven by 636 automated tests, including a reconciliation gate that checks every report against the ledger to the cent.</p>'
                    . '<h2>Who it is for</h2><p>Retail shops, grocery and convenience stores, mobile and electronics sellers, pharmacies and multi-location businesses that need a fast till AND books they can trust — even when the internet goes down.</p>'
                    . '<h2>What you get</h2><ul>'
                    . '<li>Offline-first POS: barcode scanning, split payments, hold bills, thermal printing</li>'
                    . '<li>Real double-entry accounting: trial balance always zero, FIFO cost of goods, immutable posted ledger</li>'
                    . '<li>40+ financial reports from one verified ledger: P&amp;L, balance sheet, cash flow, aging, stock valuation</li>'
                    . '<li>Customer credit (khata), loyalty points, gift cards, purchase orders, manufacturing recipes</li>'
                    . '<li>Multi-store, staff roles, WooCommerce sync, AI-assisted workflows</li></ul>'
                    . '<p><a href="/demo"><strong>Try the live demo — no signup</strong></a> · <a href="/pricing">See pricing (from $36/month, 14-day free trial)</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.features' => [
                'title' => 'VenQore Features — 226+ POS & ERP Capabilities on One Verified Ledger',
                'description' => 'Every VenQore feature, from offline POS checkout and FIFO inventory to double-entry accounting, 40+ reports, multi-store, staff roles, loyalty, and WooCommerce sync.',
                'keywords' => 'POS system features, online ERP capabilities, inventory tracking, FIFO batches, double-entry ledger, multi-store POS, retail accounting software, WooCommerce sync, barcode scanning POS, offline POS, credit khata tracking',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Features</h1>'
                    . '<p><strong>226+ features across POS, inventory, accounting, reporting and growth — all writing to one verified double-entry ledger.</strong></p>'
                    . '<ul><li><strong>POS:</strong> offline-first checkout, barcode scanning, multi-tab carts, hold &amp; recall, split payments, WebUSB thermal printing</li>'
                    . '<li><strong>Inventory:</strong> FIFO batches with expiry, serial/IMEI tracking, variants, multi-unit, composite products &amp; recipes, purchase orders with partial receiving</li>'
                    . '<li><strong>Accounting:</strong> automatic balanced journal entries, derived account balances that cannot drift, immutable posted history, bank reconciliation</li>'
                    . '<li><strong>Reports:</strong> 40+ statements — P&amp;L, balance sheet, cash flow, trial balance, aging, item and party profitability — all reconciled to the ledger</li>'
                    . '<li><strong>Growth:</strong> customer khata &amp; credit limits, loyalty points, gift cards, campaigns, WhatsApp debt reminders</li>'
                    . '<li><strong>Platform:</strong> multi-store, 7 staff roles, audit logs, WooCommerce sync, AI capture &amp; assistant</li></ul>'
                    . '<p><a href="/demo">Launch the live demo</a> · <a href="/pricing">Pricing</a></p>' . $nav . '</main>',
            ],

            'marketing.pricing' => [
                'title' => 'VenQore Pricing — Starter $36, Growth $63, Enterprise $129/month | 14-Day Free Trial',
                'description' => 'Simple POS + ERP pricing: Starter $36/mo, Growth $63/mo, Enterprise $129/mo (Pakistan: Rs 1,100 / 1,800 / 5,300). Every plan includes the verified double-entry engine and Profit & Loss. 14-day free trial, no credit card.',
                'keywords' => 'POS software price, ERP software cost, cheap retail POS, retail ERP pricing, point of sale subscription, Pakistan POS software price, online ERP pricing, small business software subscription',
                'jsonld' => [
                    self::faq([
                        ['How much does VenQore cost?', 'VenQore Starter is $36/month, Growth is $63/month, and Enterprise is $129/month (billed monthly; annual billing is discounted). In Pakistan: Rs 1,100, Rs 1,800 and Rs 5,300 per month. Every plan starts with a 14-day free trial with no credit card required.'],
                        ['Does every VenQore plan include real accounting?', 'Yes. The verified double-entry accounting engine and the Profit & Loss statement are included on every plan, including Starter. Advanced statements like Balance Sheet and the full 40-report suite unlock on higher tiers.'],
                        ['Does VenQore work offline?', 'Yes. The POS terminal is offline-first: it keeps selling with no internet and syncs back automatically when the connection returns.'],
                        ['Is there a free trial?', 'Yes — 14 days, full features of your chosen tier, no credit card required. There is also a free live demo store you can explore without creating an account.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Pricing</h1>'
                    . '<p><strong>Three plans. Every one keeps real double-entry books.</strong> 14-day free trial, no credit card.</p>'
                    . '<ul><li><strong>Starter — $36/month</strong> (Pakistan Rs 1,100): 1 location, 3 staff, 1,000 SKUs, offline POS, verified ledger, Profit &amp; Loss included</li>'
                    . '<li><strong>Growth — $63/month</strong> (Rs 1,800): 3 locations, 10 staff, 10,000 SKUs, bank reconciliation, production &amp; recipes, campaigns, advanced reports</li>'
                    . '<li><strong>Enterprise — $129/month</strong> (Rs 5,300): 10 locations, 50 staff, 50,000 SKUs, full 40-report suite, API access, loyalty &amp; gift cards, priority support</li></ul>'
                    . '<p><a href="/demo">Try the live demo first</a> · <a href="/register">Start your free trial</a></p>' . $nav . '</main>',
            ],

            'demo.landing' => [
                'title' => 'VenQore Live Demo — Explore a Real Store, No Signup Required',
                'description' => 'Walk into a fully loaded VenQore store: run the POS, post sales, open the P&L, check inventory. Real product, real data, zero signup. Resets daily.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Live Demo</h1>'
                    . '<p><strong>Explore a real, running VenQore store without creating an account.</strong> Ring up sales on the POS, open the Profit &amp; Loss, browse inventory and reports — everything is live and resets daily.</p>'
                    . '<p><a href="/pricing">Pricing from $36/month</a> · <a href="/register">Start a 14-day free trial</a></p>' . $nav . '</main>',
            ],

            'marketing.about' => [
                'title' => 'About VenQore — Why We Built the POS That Keeps Real Books',
                'description' => 'VenQore exists because small retailers deserve books they can bet on. The story, the engineering standard (636 automated tests), and the team behind the retail operating system.',
                'jsonld' => [['@context' => 'https://schema.org'] + self::organizationLd()],
                'static_html' => null,
            ],

            'marketing.contact' => [
                'title' => 'Contact VenQore — Sales, Support & Partnerships',
                'description' => 'Talk to the VenQore team about your store, migration from another POS, partnerships, or support. We reply within one business day.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'marketing.newsletter' => [
                'title' => 'VenQore Newsletter — Product Launches & Retail Playbooks',
                'description' => 'Get notified when new VenQore capabilities launch (VenSynQ marketplace sync, SmartCapture scan-to-invoice) plus practical playbooks for running a tighter retail operation.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'blog.index' => [
                'title' => 'VenQore Blog — Retail Operations, POS & Accounting Guides',
                'description' => 'Practical guides on point of sale, inventory control, FIFO costing, double-entry accounting for shopkeepers, and growing a retail business.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'terms' => [
                'title' => 'Terms of Service — VenQore',
                'description' => 'The terms that govern your use of VenQore, the offline-first POS and ERP platform.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'privacy' => [
                'title' => 'Privacy Policy — VenQore',
                'description' => 'How VenQore collects, uses and protects your data. Your business data belongs to you.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'refund-policy' => [
                'title' => 'Refund Policy — VenQore',
                'description' => 'VenQore refund terms for subscriptions and lifetime deals — plain language, no surprises.',
                'jsonld' => [],
                'static_html' => null,
            ],

            'marketing.vensynq' => [
                'title' => 'VenSynQ — Sync Your POS Inventory with WooCommerce, Amazon, eBay & TikTok Shop',
                'description' => 'VenSynQ is VenQore\'s multi-channel e-commerce sync engine: one inventory, one ledger, every marketplace. WooCommerce sync is live; Amazon, eBay and TikTok Shop are coming soon — join the waitlist.',
                'jsonld' => [
                    self::faq([
                        ['What is VenSynQ?', 'VenSynQ is the multi-channel e-commerce fulfillment engine inside VenQore POS. It keeps one inventory and one verified ledger across your physical store and online channels — WooCommerce today, with Amazon, eBay and TikTok Shop connections coming soon.'],
                        ['Does VenQore sync with WooCommerce?', 'Yes. VenQore syncs stock levels to WooCommerce and turns WooCommerce orders into POS sales automatically, matched by SKU, with webhook-verified security.'],
                        ['When do Amazon, eBay and TikTok Shop sync launch?', 'They are in active development. Join the VenSynQ waitlist on this page and you will be emailed the moment each channel goes live.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenSynQ — One Inventory. One Ledger. Every Channel.</h1>'
                    . '<p><strong>VenSynQ is VenQore\'s multi-channel e-commerce sync engine.</strong> It connects your physical store\'s POS inventory and accounting to your online channels, so a sale anywhere updates stock and books everywhere. <strong>WooCommerce sync is live today.</strong> Amazon, eBay and TikTok Shop connections are coming soon.</p>'
                    . '<ul><li>Stock synced to WooCommerce automatically when it changes in store</li>'
                    . '<li>Online orders become POS sales with correct COGS and a balanced journal entry</li>'
                    . '<li>SKU-based matching, webhook signature verification, conflict resolution</li>'
                    . '<li>Coming soon: Amazon, eBay, TikTok Shop — one dashboard for every channel</li></ul>'
                    . '<p><a href="/subscribe"><strong>Join the waitlist</strong></a> — get an email the moment each channel launches. · <a href="/demo">Try the live demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.smartcapture' => [
                'title' => 'SmartCapture — Turn Paper Invoices, Photos & Voice Notes into Digital Records',
                'description' => 'SmartCapture converts a photo of a supplier invoice or a spoken voice note into a structured digital transaction inside VenQore — items matched, prices filled, ledger-ready. Coming soon; join the waitlist.',
                'jsonld' => [
                    self::faq([
                        ['What is SmartCapture?', 'SmartCapture is VenQore\'s AI input layer: photograph a paper invoice or speak a voice note, and it becomes a structured, editable transaction — line items recognized, products matched to your catalog, totals ready to post to the verified ledger.'],
                        ['Can I convert scanned invoices into digital invoices?', 'Yes — that is exactly what SmartCapture does. Snap a photo of a supplier bill or receipt and VenQore extracts the line items and matches them to your products. You review, confirm, and it posts with a balanced journal entry.'],
                        ['Can I create an invoice by voice?', 'Yes. Speak a memo like "sold 5 bags of rice to Ali on credit" and SmartCapture drafts the transaction for your review.'],
                        ['When does SmartCapture launch?', 'SmartCapture is in final testing. Join the waitlist on this page and you will be notified at launch.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>SmartCapture — From Paper or Voice to Posted Books.</h1>'
                    . '<p><strong>SmartCapture turns a photo of any paper invoice — or a spoken voice note — into a structured digital transaction in VenQore.</strong> Line items extracted, products matched to your catalog, prices filled in, and one tap posts it to your verified double-entry ledger. No more evening data entry.</p>'
                    . '<ul><li><strong>Scan to invoice:</strong> photograph supplier bills and receipts; get editable line items, not just a stored image</li>'
                    . '<li><strong>Voice to transaction:</strong> say it — "sold 5 bags of rice to Ali on credit" — and review the drafted sale</li>'
                    . '<li><strong>Catalog matching:</strong> recognized items map to your real products and cost history</li>'
                    . '<li><strong>Ledger-ready:</strong> every capture posts as a balanced journal entry, like everything in VenQore</li></ul>'
                    . '<p><strong>Coming soon.</strong> <a href="/subscribe"><strong>Join the waitlist</strong></a> and be first in when it ships. · <a href="/demo">Try the live demo</a></p>'
                    . $nav . '</main>',
            ],
        ];
    }
}
