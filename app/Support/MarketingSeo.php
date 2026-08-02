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

        $pages = array_merge(self::pages(), \App\Support\ToolSeo::pages());

        // Most routes are keyed directly by route name. A handful of
        // programmatic tool routes (e.g. tools.barcode.format) share ONE
        // route name across many URL variants distinguished by a wildcard
        // parameter — those are keyed as "route.name:{param}" in
        // ToolSeo::pages(). Try the parameterised key first, then fall
        // back to the plain route name.
        $lookupKey = $route->getName();
        if (!empty($route->parameters())) {
            $firstParam = array_values($route->parameters())[0] ?? null;
            if ($firstParam !== null && isset($pages["{$lookupKey}:{$firstParam}"])) {
                $lookupKey = "{$lookupKey}:{$firstParam}";
            }
        }

        // Handle dynamic blog.show route dynamically from blog_posts table
        if ($route->getName() === 'blog.show' || $route->getName() === 'marketing.blog.show') {
            $slug = $route->parameter('slug');
            if ($slug) {
                $post = \App\Models\BlogPost::published()->where('slug', $slug)->first();
                if ($post) {
                    $title = ($post->meta_title ?: $post->title) . ' — VenQore Blog';
                    $description = $post->meta_description ?: ($post->excerpt ?: \Illuminate\Support\Str::limit(strip_tags($post->content), 155));
                    $publishedDate = optional($post->published_at ?? $post->created_at)->toIso8601String();
                    $modifiedDate = $post->updated_at ? $post->updated_at->toIso8601String() : $publishedDate;

                    return [
                        'title' => $title,
                        'description' => $description,
                        'keywords' => 'VenQore Blog, ' . $post->category . ', retail management, POS software',
                        'og_image' => $post->image ? url($post->image) : url('/images/logo.png'),
                        'canonical' => 'https://venqore.com/blog/' . $post->slug,
                        'jsonld' => [
                            [
                                '@context' => 'https://schema.org',
                                '@graph' => [
                                    self::organizationLd(),
                                    [
                                        '@type' => 'BlogPosting',
                                        'headline' => $post->title,
                                        'description' => $description,
                                        'datePublished' => $publishedDate,
                                        'dateModified' => $modifiedDate,
                                        'mainEntityOfPage' => 'https://venqore.com/blog/' . $post->slug,
                                        'author' => [
                                            '@type' => 'Person',
                                            'name' => $post->author ?: 'VenQore Editorial',
                                        ],
                                        'publisher' => self::organizationLd(),
                                        'image' => $post->image ? url($post->image) : url('/images/logo.png'),
                                    ],
                                ],
                            ],
                        ],
                        'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                            . '<h1>' . htmlspecialchars($post->title) . '</h1>'
                            . '<p><em>Published on ' . htmlspecialchars(optional($post->published_at ?? $post->created_at)->format('F j, Y')) . ' by ' . htmlspecialchars($post->author) . '</em></p>'
                            . '<div>' . nl2br(htmlspecialchars($post->content)) . '</div>'
                            . '<p><a href="/blog">&larr; Back to Blog Index</a> &middot; <a href="/register"><strong>Start Free Trial</strong></a></p>'
                            . self::navLinks() . '</main>',
                    ];
                }
            }
        }

        // Handle dynamic docs route dynamically from resources/docs
        if ($route->getName() === 'marketing.docs.index' || $route->getName() === 'marketing.docs.show') {
            $slug = $route->parameter('slug') ?: 'getting-started';
            $docsDir = resource_path('docs');
            $filePath = $docsDir . '/' . $slug . '.md';

            if (\Illuminate\Support\Facades\File::exists($filePath)) {
                $content = \Illuminate\Support\Facades\File::get($filePath);
                
                $title = ucfirst(str_replace('-', ' ', $slug));
                $description = 'VenQore Help Center and Documentation Hub.';
                $category = 'General';
                $body = $content;

                if (str_starts_with($content, '---')) {
                    $parts = explode('---', $content, 3);
                    if (count($parts) >= 3) {
                        $frontmatter = $parts[1];
                        $body = $parts[2];

                        foreach (explode("\n", $frontmatter) as $line) {
                            $line = trim($line);
                            if (str_contains($line, ':')) {
                                [$key, $val] = explode(':', $line, 2);
                                $key = trim($key);
                                $val = trim($val, " \t\n\r\0\x0B\"'");
                                if ($key === 'title') $title = $val;
                                elseif ($key === 'description') $description = $val;
                                elseif ($key === 'category') $category = $val;
                            }
                        }
                    }
                }

                $bodyMarkdown = trim($body);
                
                // Parse Q&As for JSON-LD schema and crawler blocks
                $qas = [];
                preg_match_all('/### Q:\s*(.+?)\r?\n\*\*A:\*\*\s*(.+?)(?=\r?\n### Q:|\z)/s', $bodyMarkdown, $matches, PREG_SET_ORDER);
                
                // Let's compile structured schema array for FAQPage
                $faqList = [];
                foreach ($matches as $match) {
                    $faqList[] = [trim($match[1]), trim($match[2])];
                }

                // Render styled blocks for crawlers to see as small structured sections
                $smallBlocks = '';
                foreach ($matches as $index => $match) {
                    $q = htmlspecialchars(trim($match[1]));
                    $a = htmlspecialchars(trim($match[2]));
                    $smallBlocks .= "<div id=\"faq-item-{$index}\" itemscope itemtype=\"https://schema.org/Question\" style=\"margin: 1.5rem 0; padding: 1rem; border: 1px solid #333; border-radius: 8px; background: #111;\">\n"
                        . "  <h3 itemprop=\"name\" style=\"color: #fff; margin-top: 0;\">Q: {$q}</h3>\n"
                        . "  <div itemprop=\"acceptedAnswer\" itemscope itemtype=\"https://schema.org/Answer\">\n"
                        . "    <p itemprop=\"text\" style=\"color: #ccc; margin-bottom: 0;\"><strong>A:</strong> {$a}</p>\n"
                        . "  </div>\n"
                        . "</div>\n";
                }

                return [
                    'title' => $title . ' — VenQore Docs',
                    'description' => $description,
                    'keywords' => 'VenQore Help Center, documentation, ' . $category . ', POS instructions, user guide',
                    'og_image' => url('/images/logo.png'),
                    'canonical' => 'https://venqore.com/docs' . ($slug === 'getting-started' ? '' : '/' . $slug),
                    'jsonld' => empty($faqList) ? [] : [ self::faq($faqList) ],
                    'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                        . '<nav aria-label="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/docs">Docs</a> &rsaquo; ' . htmlspecialchars($title) . '</nav>'
                        . '<h1>' . htmlspecialchars($title) . '</h1>'
                        . '<p><strong>' . htmlspecialchars($description) . '</strong></p>'
                        . '<h2>Help &amp; Documentation Q&amp;A Hub</h2>'
                        . '<div class="vq-docs-crawler-grid" style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 2rem;">'
                        . $smallBlocks
                        . '</div>'
                        . '<p><a href="/docs">Back to Documentation Hub</a></p>'
                        . self::navLinks() . '</main>',
                ];
            }
        }

        $def = $pages[$lookupKey] ?? null;
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
        return '<nav><a href="/">Home</a> · <a href="/features">Features</a> · <a href="/pricing">Pricing</a> · <a href="/demo">Live Demo</a> · <a href="/tools">Free Tools</a> · <a href="/vensynq">VenSynQ</a> · <a href="/smartcapture">SmartCapture</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/subscribe">Newsletter</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refund-policy">Refunds</a></nav>';
    }

    private static function pages(): array
    {
        $nav = self::navLinks();

        return [

            'welcome' => [
                'title' => 'VenQore — The last software your business will need',
                'description' => 'Point of sale, stock, purchases, invoices, customers and real accounting — one system instead of five subscriptions and a notebook. Enter it once; VenQore does the rest. Guarded by 1,500+ automated tests. Try the live demo, no signup.',
                'keywords' => 'POS system, Online ERP, Online Business Software, offline point of sale, offline business software, offline ERP software, offline invoicing software, offline billing app, offline cash register, offline shop management, no internet POS, internet down POS backup, offline retail system, offline database billing, offline stock tracking, bookkeeper software, shop bookkeeping system, retail bookkeeping software, small business bookkeeping, automated bookkeeping app, ledger book app, digital ledger app, credit ledger software, accounts bookkeeping software, accounting and bookkeeping system, daily bookkeeping app, khata bookkeeping system, point of sale system, retail POS software, wholesale POS system, billing software, invoicing system, cash register software, retail billing app, multi store POS, cloud POS system, offline POS software, offline first point of sale, PWA point of sale, mobile POS system, tablet point of sale, store management software, shop billing software, supermarket POS, pharmacy billing software, grocery POS system, clothing store POS, electronics shop POS, retail management system, business operating system, inventory management software, stock control system, FIFO inventory tracking, barcode inventory software, batch tracking software, expiry date tracking inventory, serial number tracking POS, IMEI tracking software, variant inventory management, multi warehouse inventory, stock valuation report, purchase order management, supplier management software, composite products creator, manufacturing recipe ERP, raw materials tracking, stock transfer software, double entry accounting software, ledger bookkeeping app, automatic journal entries, general ledger system, profit and loss report, balance sheet generator, trial balance software, cash flow statement app, financial reporting software, auditor grade accounting, bank reconciliation system, accounts receivable aging, accounts payable tracker, debit credit manager, customer khata book, customer credit limits, digital ledger book, tax exclusive billing, tax inclusive invoicing, sales tax reporting software, WooCommerce POS sync, e-commerce inventory sync, online store POS integration, web store sync ERP, multi channel fulfillment software, WhatsApp debt reminders, customer loyalty program, loyalty points system POS, gift cards software, customer CRM for retail, sales analytics dashboard, business intelligence for retail, AI invoice capture, scan to invoice software, receipt OCR software, voice to invoice assistant, staff management POS, cashier role permissions, audit logs software, thermal printer software POS, WebUSB printing system, barcode generator software, lifetime deal POS, AppSumo LTD ERP, SaaS billing system, cloud ERP software, small business ERP, enterprise retail suite, B2B invoicing platform, wholesale inventory ERP, retail shop calculator, cloud ledger books, offline billing app, fast retail checkout, hold cart POS, split payment POS, discount manager POS, customer database app, mobile billing printer, shop ledger bookkeeping, online business software, best POS software 2026, business ERP dashboard, simple bookkeeping for shops',
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
                                'description' => 'The last software your business will need. Offline-first POS and ERP with built-in verified double-entry accounting, FIFO inventory, 40+ financial reports, multi-store support and WooCommerce sync.',
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
                    . '<h1>The last software your business will need.</h1>'
                    . '<p><strong>Point of sale, stock, purchases, invoices, customers and real accounting — one system instead of five subscriptions and a notebook.</strong> Enter it once; VenQore does the rest. The accounting engine is guarded by 1,500+ automated tests.</p>'
                    . '<h2>Why VenQore Exists</h2>'
                    . '<p>Businesses don&#39;t fail because they lack software. They fail because they spend their best hours making five apps and a notebook agree with each other. A sale happens in seconds — then gets typed into the stock app, the accounts, the spreadsheet, and the online store. VenQore is one system where it happens once.</p>'
                    . '<h2>What you get</h2><ul>'
                    . '<li>Offline-first POS: barcode scanning, split payments, hold bills, thermal printing</li>'
                    . '<li>Real double-entry accounting: trial balance always zero, FIFO cost of goods, immutable posted ledger</li>'
                    . '<li>40+ financial reports from one verified ledger: P&amp;L, balance sheet, cash flow, aging, stock valuation</li>'
                    . '<li>Customer credit (khata), loyalty points, gift cards, purchase orders, manufacturing recipes</li>'
                    . '<li>Multi-store, staff roles, WooCommerce sync, AI-assisted workflows</li></ul>'
                    . '<h2>Why offline-first</h2><p>Internet drops. Power cuts. Your till should not care. VenQore keeps selling on the device, saves every cart before the server even confirms it, and syncs back automatically the moment connectivity returns — so a bad connection never becomes a lost sale or a corrupted count.</p>'
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
                    . '<p>Deep-dive pages: <a href="/features/point-of-sale">Point of Sale</a> · <a href="/features/accounting">Accounting</a> · <a href="/features/inventory-management">Inventory Management</a> · <a href="/features/offline-pos">Offline POS</a> · <a href="/features/growth-engine">Growth Intelligence Engine</a></p>'
                    . '<p><a href="/demo">Launch the live demo</a> · <a href="/pricing">Pricing</a></p>' . $nav . '</main>',
            ],

            // ── Feature deep-dive pages (/features/{slug}) ─────────────

            'marketing.features.show:point-of-sale' => [
                'title' => 'Point of Sale (POS) System — VenQore',
                'description' => 'VenQore\'s offline-first POS: barcode scanning, split payments, hold & recall carts, thermal printing, staff roles, customer khata and loyalty — all in one checkout.',
                'keywords' => 'point of sale software, offline POS system, barcode scanning POS, split payment POS, thermal receipt printing, customer khata POS, loyalty points POS, hold cart POS, retail checkout software',
                'jsonld' => [
                    self::faq([
                        ['Does VenQore POS work on any device?', 'Yes. VenQore runs in any modern browser on any device — iPad, Android tablet, Windows laptop, Mac, or desktop PC. It installs as a PWA (Progressive Web App) from the browser with no App Store required.'],
                        ['Does VenQore have a per-transaction fee like Square?', 'No. VenQore charges a flat monthly subscription ($36 / $63 / $129). There is no percentage or per-transaction fee on any sale, regardless of payment method or volume.'],
                        ['Can VenQore handle split payments?', 'Yes. The payment modal lets you enter any combination of amounts across cash, card, bank transfer, customer credit (khata) and loyalty points. VenQore calculates change and posts every method to the correct account automatically.'],
                        ['Does VenQore work offline?', 'Yes. VenQore is offline-first. The POS runs completely without internet — barcode lookups hit a local cache, carts save to the device, and receipts print via WebUSB. Everything syncs when the connection returns.'],
                        ['Can I process returns at the POS?', 'Yes. Open the original sale from history, select the items and quantity to return, and VenQore reverses the sale, restores the inventory batch, and issues a refund to cash, khata, or a gift card.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Point of Sale System — The Checkout Your Business Actually Needs</h1>'
                    . '<p><strong>Offline-first checkout with barcode scanning, split payments, hold &amp; recall carts, WebUSB thermal printing, customer khata credit and loyalty points — all in one verified system with no per-transaction fees.</strong></p>'
                    . '<h2>What VenQore POS includes</h2><ul>'
                    . '<li>Offline-first checkout — keeps selling with no internet, zero latency</li>'
                    . '<li>Barcode scanning at full hardware speed via USB or Bluetooth</li>'
                    . '<li>Multi-tab carts with hold &amp; recall — park one, start another</li>'
                    . '<li>Split payments: cash, card, bank transfer, customer credit, loyalty points, any combination</li>'
                    . '<li>Customer khata (credit account) with WhatsApp payment reminders</li>'
                    . '<li>Loyalty points and digital gift cards</li>'
                    . '<li>WebUSB thermal receipt printing — no drivers, no cloud relay</li>'
                    . '<li>7-level staff roles and cashier PIN authentication</li>'
                    . '<li>Every sale posts automatic double-entry journal entries — P&amp;L is always right</li>'
                    . '</ul>'
                    . '<h2>VenQore vs Square POS: zero transaction fees</h2>'
                    . '<p>Square charges 2.6% + 10¢ per swipe. VenQore charges $0 per transaction — flat monthly plans from $36. On $30,000/month in sales, that is $828/month saved on processing markups alone.</p>'
                    . '<p><a href="/demo"><strong>Try live demo</strong></a> · <a href="/pricing">Pricing from $36/month</a> · <a href="/compare/venqore-vs-square">VenQore vs Square</a> · <a href="/features/offline-pos">Offline architecture</a> · <a href="/features/accounting">Built-in accounting</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.features.show:accounting' => [
                'title' => 'Double-Entry Accounting Software — VenQore',
                'description' => 'VenQore\'s built-in double-entry accounting posts every sale, purchase and expense automatically. P&L, Balance Sheet and 40+ reports — always reconciled.',
                'keywords' => 'double entry accounting software, built-in POS accounting, automatic journal entries, profit and loss software, balance sheet generator, FIFO cost of goods sold, bank reconciliation software, trial balance software, bookkeeping app for retail',
                'jsonld' => [
                    self::faq([
                        ['Is VenQore a proper double-entry accounting system?', 'Yes. Every transaction posts a balanced debit-credit journal entry. The trial balance is always zero. VenQore is not a single-entry or cash-book style system.'],
                        ['Do I need QuickBooks or Xero with VenQore?', 'No. VenQore\'s accounting engine is fully built-in. You get P&L, Balance Sheet, Cash Flow, Trial Balance, Aging reports and Bank Reconciliation without any third-party plugin.'],
                        ['How does VenQore calculate Cost of Goods Sold?', 'Using FIFO from real batch purchase costs. When you sell a product, VenQore automatically consumes the oldest batch first, at the price you actually paid, and posts that exact cost to the COGS account.'],
                        ['What plans include the accounting features?', 'The core double-entry engine and Profit & Loss are included on every plan, including Starter ($36/month). Bank Reconciliation and the full 40-report suite unlock on Growth ($63/month) and Enterprise ($129/month).'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Double-Entry Accounting — Books That Close Themselves</h1>'
                    . '<p><strong>Every sale, purchase, refund and expense writes a balanced journal entry automatically. VenQore\'s double-entry engine means your Profit &amp; Loss is always right — guarded by 1,500+ automated tests.</strong></p>'
                    . '<h2>What is included</h2><ul>'
                    . '<li>Automatic double-entry journals on every sale, purchase, payment, refund and expense</li>'
                    . '<li>Immutable posted ledger — corrections flow through reversal entries, as auditors require</li>'
                    . '<li>FIFO Cost of Goods Sold — exact batch costs, not averages or guesses</li>'
                    . '<li>40+ financial reports: P&amp;L, Balance Sheet, Cash Flow, Trial Balance, AR &amp; AP Aging, Stock Valuation</li>'
                    . '<li>Bank Reconciliation (Growth &amp; Enterprise)</li>'
                    . '<li>Configurable Chart of Accounts with sub-accounts and cost centres</li>'
                    . '</ul>'
                    . '<h2>No QuickBooks. No Xero. No extra cost.</h2>'
                    . '<p>Most POS systems charge $30–$80/month for an accounting integration that still requires manual sync. VenQore includes a full double-entry engine at no extra cost. The trial balance is always zero — enforced by the engine.</p>'
                    . '<p><a href="/demo"><strong>Try live demo</strong></a> · <a href="/pricing">Pricing from $36/month</a> · <a href="/features/inventory-management">FIFO Inventory</a> · <a href="/features/point-of-sale">Point of Sale</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.features.show:inventory-management' => [
                'title' => 'Inventory Management Software — VenQore',
                'description' => 'FIFO batch tracking, expiry dates, serial/IMEI numbers, variants, purchase orders and stock transfers — all in one verified inventory system.',
                'keywords' => 'inventory management software, FIFO inventory tracking, batch expiry tracking, serial number inventory, IMEI tracking POS, product variant inventory, multi warehouse software, purchase order management, stock transfer software, composite product inventory',
                'jsonld' => [
                    self::faq([
                        ['Does VenQore track expiry dates on pharmacy products?', 'Yes. Every purchase batch can have an expiry date. VenQore dispatches in FEFO order (first-expiry, first-out) so the shortest-dated stock always leaves first. Expiry alerts surface before a product becomes unsellable.'],
                        ['Can I track serial numbers and IMEI numbers for electronics?', 'Yes. Serial and IMEI numbers are captured at point of receipt and permanently linked to the batch. At the point of sale, the unit is linked to the customer. Warranty queries are answered in seconds.'],
                        ['How does VenQore handle products with multiple variants?', 'Create one parent product and add as many variant attributes as you need. Each combination gets its own SKU, stock level, price and barcode.'],
                        ['Can I transfer stock between branches?', 'Yes. Raise a stock transfer from the source location. The system deducts from the source and adds to the destination in a single double-entry transaction with a full audit trail.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Inventory Management — Every Unit. Every Batch. Every Location.</h1>'
                    . '<p><strong>FIFO batch tracking, expiry dates, serial and IMEI numbers, product variants, multiple warehouses and composite recipes — all posting exact costs to the accounting engine automatically.</strong></p>'
                    . '<h2>Inventory capabilities</h2><ul>'
                    . '<li>FIFO &amp; FEFO batch tracking — every purchase creates a batch with its own cost and expiry date</li>'
                    . '<li>Serial &amp; IMEI number tracking — each unit traced from purchase to sale to customer</li>'
                    . '<li>Product variants — size, colour, flavour, material — per-SKU stock and pricing</li>'
                    . '<li>Multi-warehouse &amp; branch stock transfers — atomic, double-entry, full audit trail</li>'
                    . '<li>Composite products &amp; manufacturing recipes — bill of materials with auto-deduction on assembly or sale</li>'
                    . '<li>Purchase orders with partial receiving — each delivery creates a FIFO batch at PO cost</li>'
                    . '</ul>'
                    . '<p><a href="/solutions/pharmacy">Pharmacy inventory</a> · <a href="/solutions/electronics-store">Electronics IMEI tracking</a> · <a href="/features/accounting">FIFO cost posting to accounting</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.features.show:offline-pos' => [
                'title' => 'Offline POS System — Works Without Internet | VenQore',
                'description' => 'VenQore\'s offline-first POS keeps selling when internet drops. Saves every cart before the server confirms it. Syncs automatically when connection returns.',
                'keywords' => 'offline POS system, POS without internet, offline point of sale, offline first retail software, PWA POS system, internet down POS, offline barcode scanning, offline receipt printing, offline cash register',
                'jsonld' => [
                    self::faq([
                        ['How long can VenQore operate without internet?', 'Indefinitely. The product catalogue, pricing and pending carts are stored on the device. As long as the device has power, the POS keeps running — for hours or days without a connection.'],
                        ['What happens when the internet comes back after an offline period?', 'VenQore detects the reconnection and replays all queued transactions to the server in order. Inventory counts update, FIFO batches consume in the right sequence, and accounting journals post automatically.'],
                        ['Can I install VenQore on a tablet or phone without an app store?', 'Yes. VenQore is a Progressive Web App (PWA). Open the URL in any modern browser, tap "Add to Home Screen", and it installs like a native app on iOS, Android, Windows or macOS.'],
                        ['Does offline mode work with barcode scanners?', 'Yes. The product catalogue is cached locally, so barcode lookups are instant with no network dependency. USB and Bluetooth barcode scanners work exactly as they do online.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Offline POS — Internet Down. POS Still Running.</h1>'
                    . '<p><strong>VenQore saves every cart to the device before it even reaches the server. When the internet drops, the POS keeps selling. When it returns, everything syncs automatically — no lost sales, no corrupted counts.</strong></p>'
                    . '<h2>Offline architecture</h2><ul>'
                    . '<li>Local-first cart engine — carts written to IndexedDB before server confirmation</li>'
                    . '<li>Offline product catalogue cache — barcode lookups at full speed, zero network round-trips</li>'
                    . '<li>Automatic conflict-free sync — offline transactions replay in order on reconnect</li>'
                    . '<li>Installable PWA — install to home screen on any device, no app store</li>'
                    . '<li>WebUSB thermal printing — receipts print directly to hardware, no cloud relay</li>'
                    . '<li>Offline cashier PIN authentication — auto-lock screen works without server</li>'
                    . '</ul>'
                    . '<h2>Real-world offline scenarios</h2>'
                    . '<p>Router outage on a Saturday rush: the till keeps running. Power cuts the connection mid-sale: the cart is saved on the device. ISP maintenance overnight: morning shift starts normally, everything syncs in seconds.</p>'
                    . '<p><a href="/demo"><strong>Try live demo</strong></a> · <a href="/compare/venqore-vs-square">vs Square POS (offline comparison)</a> · <a href="/features/point-of-sale">Full POS features</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.features.show:growth-engine' => [
                'title' => 'Growth Intelligence Engine — Retail Analytics That Score Themselves | VenQore',
                'description' => 'Four engines read your customers, stock, margin and cash. Every insight shows the numbers behind it, and every prediction is checked afterwards against what actually happened.',
                'keywords' => 'retail business intelligence, customer churn prediction retail, stockout prediction software, dead stock report, margin erosion tracking, FIFO margin analysis, discount leakage report, aged receivables alerts, RFM customer segmentation POS, cross-sell market basket analysis, retail analytics without AI, self-learning business insights, cash conversion monitoring, reorder point software',
                'jsonld' => [
                    self::faq([
                        ['Does the VenQore Growth Intelligence Engine use AI?', 'No, and that is deliberate. It is deterministic statistics run over your own ledger — the same input always produces the same output. That means no AI subscription, no per-message cost, no data leaving your server, and no possibility of it inventing a number that is not in your data.'],
                        ['How does it know when a customer is late?', 'It learns each customer\'s own ordering gap and how consistent that gap is, then measures how many standard deviations past their personal normal they currently are. A customer who orders like clockwork gets a tight tolerance; an erratic one gets a wide tolerance.'],
                        ['How do I know whether to trust its predictions?', 'Because it tells you. Every prediction is checked after its horizon passes and graded as correct or incorrect. The dashboard shows the hit rate for each insight type, so you can weight them accordingly.'],
                        ['Will it flood me with alerts?', 'No. Insights are ranked by the money actually at stake. Anything you dismiss stays dismissed for a cooling-off period. Insight types you never act on become less sensitive, and ones that keep proving wrong mute themselves temporarily.'],
                        ['Does running it slow down my POS?', 'No. It analyses an entire business in roughly a dozen database queries and runs as a background job, never inside a checkout or page load. Stores with no new transactions since the last pass are skipped after a single lookup.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Growth Intelligence Engine — It Shows You Its Working</h1>'
                    . '<p><strong>Most business &quot;insights&quot; ask you to trust a number that appeared from nowhere. VenQore shows the evidence behind every recommendation — then scores itself, publishing how often it was actually right.</strong></p>'
                    . '<h2>Four engines, running continuously</h2><ul>'
                    . '<li><strong>Customers:</strong> learns each buyer&rsquo;s personal ordering rhythm and flags them when they fall outside it — measured in standard deviations of their own gap, not one rule for everybody. Also catches quiet decline, rising customers, credit-limit breaches and cross-sell pairs.</li>'
                    . '<li><strong>Stock:</strong> models demand as units per day across 7, 30 and 90-day windows, projects days of cover and a stockout date, and times the alert to how long your suppliers actually take. Also surfaces dead stock, trapped cash, expiry write-off risk and demand surges.</li>'
                    . '<li><strong>Profit:</strong> uses real FIFO cost per line to catch margin erosion, products now selling below cost, discount leakage, price headroom and a sales mix drifting toward low-margin lines while revenue looks healthy.</li>'
                    . '<li><strong>Cash &amp; operations:</strong> aged receivables grouped by customer, concentration risk, collection velocity when cash starts arriving slower, plus peak trading hours, consistently quiet days and cashier discount outliers.</li>'
                    . '</ul>'
                    . '<h2>Why it earns trust</h2><ul>'
                    . '<li>Every insight opens to show the numbers it was built from, so you can verify it yourself</li>'
                    . '<li>Every prediction is graded afterwards; the hit rate per insight type is published to you</li>'
                    . '<li>Accurate insight types become more sensitive; ones that keep missing get quieter and eventually mute themselves</li>'
                    . '<li>Thresholds are learned from your own trading — median order value, reorder gap, supplier lead time, payment terms</li>'
                    . '<li>Acting on a warning and preventing the problem counts as a success, not a failed forecast</li>'
                    . '<li>No AI key, no per-message cost, identical results every run</li>'
                    . '</ul>'
                    . '<p><a href="/demo"><strong>Try live demo</strong></a> · <a href="/features/accounting">Built-in accounting</a> · <a href="/features/inventory-management">FIFO inventory</a> · <a href="/pricing">Pricing from $36/month</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.pricing' => [
                'title' => 'VenQore Pricing — Plans from $36/month, 14-Day Free Trial',
                'description' => 'Simple POS + ERP pricing: Starter $36/mo, Growth $63/mo, Enterprise $129/mo. Every plan includes the verified double-entry engine and Profit & Loss. 14-day free trial, no credit card.',
                'keywords' => 'POS software price, ERP software cost, cheap retail POS, retail ERP pricing, point of sale subscription, Pakistan POS software price, online ERP pricing, small business software subscription',
                'jsonld' => [
                    self::faq([
                        ['Do I need a credit card to start my trial?', 'No. If you select a base plan without any AI add-on, sync integration, or onboarding service, your 14-day trial starts immediately with zero card details required. A card is only needed if you add an AI plan, connect a sync channel, or select an onboarding service.'],
                        ['What is the $5 one-time BYOK fee for?', 'Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $5 platform activation fee to unlock the AI routing layer in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing. This fee does not expire and has no hidden conditions.'],
                        ['How does managed AI billing work?', 'Managed AI plans (AI Core, AI Lite, AI Pro, AI Ultimate) are monthly add-ons. We handle the infrastructure, models, and usage. You pay us a flat monthly fee and we take care of the rest. There is no usage surprise billing — your monthly cap is shown clearly on your plan.'],
                        ['When will my card actually be charged?', 'Your subscription is only charged after your 14-day free trial ends — not on the day you sign up. The only immediate charge possible is the $5 BYOK activation fee (if you select that option). Onboarding services are charged from inside your admin panel when you choose to initiate the service — not at checkout.'],
                        ['How do onboarding services work with the trial?', 'You have two options. You can start your trial immediately and request the setup service later from your admin panel (we begin within 48 hours of your request). Or you can choose "Pause Trial" — your trial clock is held while our team completes your setup, and you get your full 14 days on a store that\'s already ready.'],
                        ['Can I cancel during the trial?', 'Yes, at any time. No questions asked. If you cancel before day 14, you owe nothing for your subscription. If you selected a BYOK activation, that $5 one-time fee is non-refundable (it activated your AI routing). If you added an onboarding service and we have already begun work, the service fee applies per our terms.'],
                        ['Can I change my plan later?', 'Yes. You can upgrade or downgrade your plan at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.'],
                        ['Are there any hidden fees or setup costs?', 'No. There are zero hidden fees, transaction markups, or setup fees. The monthly or annual price you see is exactly what you pay. Standard payment processing fees from your merchant gateway still apply if you process credit cards.'],
                        ['Do you offer discounts for annual billing?', 'Yes. Every plan has a discounted annual billing option. Choosing annual billing saves you 20% compared to monthly billing, which is the equivalent of getting two months completely free.'],
                        ['What happens when the 14-day free trial ends?', 'Before your trial ends, we will notify you by email and dashboard alert. If you wish to continue using VenQore, you can select your plan and provide payment details. If you choose not to subscribe, your account will be paused, and you can export your data anytime. We never charge you automatically.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Pricing</h1>'
                    . '<p><strong>Three plans. Every one keeps real double-entry books.</strong> 14-day free trial, no credit card.</p>'
                    . '<ul><li><strong>Starter — $36/month</strong>: 1 location, 3 staff, 1,000 SKUs, offline POS, verified ledger, Profit &amp; Loss included</li>'
                    . '<li><strong>Growth — $63/month</strong>: 3 locations, 10 staff, 10,000 SKUs, bank reconciliation, production &amp; recipes, campaigns, advanced reports</li>'
                    . '<li><strong>Enterprise — $129/month</strong>: 10 locations, 50 staff, 50,000 SKUs, full 40-report suite, API access, loyalty &amp; gift cards, priority support</li></ul>'
                    . '<h2>Trust &amp; Security</h2>'
                    . '<p>✓ 14-Day Free Trial · ✓ No Credit Card Required · ✓ Cancel Anytime · ✓ SOC2-Compliant Security</p>'
                    . '<h2>Compare Competitor Costs (Save up to $13,000/year)</h2>'
                    . '<p>Shopify POS Pro + Apps: $5,028/yr<br>Square POS (Plus Device Add-ons): $3,360/yr<br><strong>VenQore Growth (Annual): $636/yr</strong></p>'
                    . '<h2>Frequently Asked Questions</h2>'
                    . '<p><strong>Do I need a credit card to start my trial?</strong> No. If you select a base plan without any AI add-on, sync integration, or onboarding service, your 14-day trial starts immediately with zero card details required. A card is only needed if you add an AI plan, connect a sync channel, or select an onboarding service.</p>'
                    . '<p><strong>What is the $5 one-time BYOK fee for?</strong> Bringing Your Own API Key (BYOK) means you connect your own OpenAI or Gemini key. We charge a one-time $5 platform activation fee to unlock the AI routing layer in your account. After that, you are billed directly by your AI provider — we charge you nothing ongoing. This fee does not expire and has no hidden conditions.</p>'
                    . '<p><strong>How does managed AI billing work?</strong> Managed AI plans (AI Core, AI Lite, AI Pro, AI Ultimate) are monthly add-ons. We handle the infrastructure, models, and usage. You pay us a flat monthly fee and we take care of the rest. There is no usage surprise billing — your monthly cap is shown clearly on your plan.</p>'
                    . '<p><strong>When will my card actually be charged?</strong> Your subscription is only charged after your 14-day free trial ends — not on the day you sign up. The only immediate charge possible is the $5 BYOK activation fee (if you select that option). Onboarding services are charged from inside your admin panel when you choose to initiate the service — not at checkout.</p>'
                    . '<p><strong>How do onboarding services work with the trial?</strong> You have two options. You can start your trial immediately and request the setup service later from your admin panel (we begin within 48 hours of your request). Or you can choose "Pause Trial" — your trial clock is held while our team completes your setup, and you get your full 14 days on a store that\'s already ready.</p>'
                    . '<p><strong>Can I cancel during the trial?</strong> Yes, at any time. No questions asked. If you cancel before day 14, you owe nothing for your subscription. If you selected a BYOK activation, that $5 one-time fee is non-refundable (it activated your AI routing). If you added an onboarding service and we have already begun work, the service fee applies per our terms.</p>'
                    . '<p><strong>Can I change my plan later?</strong> Yes. You can upgrade or downgrade your plan at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.</p>'
                    . '<p><strong>Are there any hidden fees or setup costs?</strong> No. There are zero hidden fees, transaction markups, or setup fees. The monthly or annual price you see is exactly what you pay. Standard payment processing fees from your merchant gateway still apply if you process credit cards.</p>'
                    . '<p><strong>Do you offer discounts for annual billing?</strong> Yes. Every plan has a discounted annual billing option. Choosing annual billing saves you 20% compared to monthly billing, which is the equivalent of getting two months completely free.</p>'
                    . '<p><strong>What happens when the 14-day free trial ends?</strong> Before your trial ends, we will notify you by email and dashboard alert. If you wish to continue using VenQore, you can select your plan and provide payment details. If you choose not to subscribe, your account will be paused, and you can export your data anytime. We never charge you automatically.</p>'
                    . '<p><a href="/demo">Try the live demo first</a> · <a href="/register">Start your free trial</a></p>' . $nav . '</main>',
            ],

            'demo.landing' => [
                'title' => 'VenQore Live Demo — Explore a Real Store, No Signup Required',
                'description' => 'Walk into a fully loaded VenQore store: run the POS, post sales, open the P&L, check inventory. Real product, real data, zero signup. Resets daily.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Live Demo</h1>'
                    . '<p><strong>Explore a real, running VenQore store without creating an account.</strong> Ring up sales on the POS, open the Profit &amp; Loss, browse inventory and reports — everything is live and resets daily.</p>'
                    . '<p>No signup and no time limit on exploring &mdash; the demo store resets nightly so you always start fresh. Ring up a sale on the POS, watch the FIFO cost update in real time, then open the Profit &amp; Loss and reconcile it yourself.</p>'
                    . '<p><a href="/pricing">Pricing from $36/month</a> · <a href="/register">Start a 14-day free trial</a></p>' . $nav . '</main>',
            ],

            'marketing.about' => [
                'title' => 'About VenQore — One System for the Whole Business',
                'description' => 'Most businesses run on five tools and a notebook. VenQore puts sales, inventory, purchasing, invoices, customers, and accounting in one place — guarded by 1,500+ automated tests.',
                'jsonld' => [['@context' => 'https://schema.org'] + self::organizationLd()],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>About VenQore &mdash; Run your business, not your software.</h1>'
                    . '<p><strong>Most businesses don&#39;t run on one system. They run on five &mdash; a till, a stock app, an accounting tool, a spreadsheet, and a notebook &mdash; plus the hours spent making them all agree.</strong> VenQore ends that. Enter something once and it&#39;s everywhere: a sale updates inventory, writes the books, and syncs the store by itself.</p>'
                    . '<h2>The Destination</h2>'
                    . '<p>Information should enter a business once &mdash; from a customer, a supplier, a marketplace, or AI &mdash; and never be typed again. Owners should run the business. The software should run itself.</p>'
                    . '<p>Guarded by 1,500+ automated tests. Works 100% offline.</p>'
                    . '<p><a href="/demo"><strong>See it live</strong></a> &middot; <a href="/features">Explore the platform</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.roadmap' => [
                'title' => 'Public Product Roadmap — VenQore (Now / Next / Later)',
                'description' => 'Explore VenQore\'s public product roadmap. See what is shipped today, what is rolling out next, and how we are building toward zero-typing business management.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Where VenQore is Headed: Public Product Roadmap',
                                'description' => 'First we put everything in one place. Now we are teaching it to fill itself in. Eventually nobody types anything.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Public Product Roadmap — Where VenQore is Headed</h1>'
                    . '<p>First we put everything in one place. Now we are teaching it to fill itself in. Eventually nobody types anything.</p>'
                    . '<h2>1. Now (Shipped)</h2><p>Point of sale, inventory, purchasing, invoicing, customers, expenses, staff, and real accounting in one system. 40+ reports, offline PWA, WooCommerce sync live.</p>'
                    . '<h2>2. Next (Rolling Out)</h2><p>SmartCapture (photos/voice to digital records), VenSynQ multi-channel expansion (Amazon, eBay, TikTok Shop), AI owner insights.</p>'
                    . '<h2>3. Later (Building Toward)</h2><p>Zero-typing business management, VenQore B2B Trade Network, hosted storefronts, autonomous AI advisor.</p>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Explore Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.index' => [
                'title' => 'Industry Solutions — Industry-Specific Operating Systems | VenQore',
                'description' => 'Explore VenQore\'s industry-tailored POS and ERP operating systems. Built for Pharmacy batch/expiry, Electronics IMEI tracking, Grocery, Wholesale, and Multi-Store retail.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'ItemList',
                                'name' => 'VenQore Industry Operating Systems',
                                'itemListElement' => [
                                    ['@type' => 'ListItem', 'position' => 1, 'name' => 'Pharmacy POS & ERP', 'url' => url('/solutions/pharmacy')],
                                    ['@type' => 'ListItem', 'position' => 2, 'name' => 'Electronics Store POS & ERP', 'url' => url('/solutions/electronics-store')],
                                ],
                            ],
                        ],
                    ],
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Industry Operating Systems &mdash; Built for Your Trade</h1>'
                    . '<p>Generic POS tools force every retail trade into a cash register box. VenQore delivers trade-specific controls backed by auditor-grade double-entry accounting.</p>'
                    . '<ul><li><a href="/solutions/pharmacy"><strong>Pharmacy POS &amp; Inventory:</strong></a> batch/expiry tracking, FEFO/FIFO dispatch, drug control registers.</li>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:pharmacy' => [
                'title' => 'Pharmacy POS System with Expiry Tracking & FIFO Batch Control — VenQore',
                'description' => 'The pharmacy POS software built for precision. Track batch numbers, expiry dates, FEFO dispatch, drug control registers, and real double-entry accounting. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Pharmacy POS & Inventory System with Expiry & FIFO Batch Control',
                                'description' => 'Stop writing off expired medicine. Track batch numbers, expiry dates, supplier returns, and drug registers automatically.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['How does VenQore handle medicines with different expiry dates under the same barcode?', 'VenQore supports multi-batch inventory per barcode. When scanning a barcode, the system prompts the cashier to select or confirm the active batch number, enforcing FEFO (First-Expired, First-Out) dispatching.'],
                        ['Can I sell medicine by the strip or single tablet instead of full boxes?', 'Yes. VenQore features built-in multi-unit of measure (UOM) conversions. Stock deducts accurately regardless of which unit is sold at checkout.'],
                        ['What happens if a cashier tries to sell an expired medicine batch?', 'VenQore features an optional hard-lock setting. If a batch is past its expiry date, the POS displays a red warning banner and blocks the cashier from adding it to the cart without manager PIN authorization.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Pharmacy POS &amp; Inventory System with Expiry &amp; FIFO Batch Control</h1>'
                    . '<p>Stop writing off expired medicine. Track batch numbers, expiry dates, supplier returns, and drug registers automatically with verified double-entry accounting.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>Batch &amp; Expiry Date Management</li>'
                    . '<li>FEFO (First-Expired, First-Out) Smart Dispatch</li>'
                    . '<li>Supplier Return &amp; Credit Management</li>'
                    . '<li>Multi-Unit UOM (Box / Strip / Tablet) Conversions</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:electronics-store' => [
                'title' => 'Electronics POS System with Serial & IMEI Tracking — VenQore',
                'description' => 'Electronics retail POS software with serial & IMEI tracking, warranty management, supplier RMA tracking, and double-entry accounting. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Electronics Store POS & ERP with Serial & IMEI Number Tracking',
                                'description' => 'Track smartphones, laptops, and serialised gadgets from purchase to customer warranty without spreadsheets.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['Does VenQore require scanning IMEI numbers during checkout?', 'For serialised product categories, VenQore prompts the cashier to scan or enter the unique IMEI/Serial number before adding the item to the bill.'],
                        ['Can I look up a customer warranty using their phone serial number?', 'Yes. Enter or scan any serial/IMEI number in the search bar to view the original purchase date, customer name, invoice number, and warranty expiration date.'],
                        ['How does VenQore handle customer trade-ins or buying used gadgets?', 'VenQore includes a Trade-In Module. The device enters inventory as a serialised unit and posts a purchase entry automatically.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Electronics Store POS &amp; ERP with Serial &amp; IMEI Number Tracking</h1>'
                    . '<p>Track smartphones, laptops, and serialised gadgets from purchase receiving to customer warranty claims without spreadsheets.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>IMEI &amp; Serial Number Lifecycle Tracking</li>'
                    . '<li>Instant Receipt &amp; Warranty Card Generation</li>'
                    . '<li>Supplier RMA &amp; Warranty Claim Management</li>'
                    . '<li>Trade-In &amp; Used Device Procurement</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:grocery' => [
                'title' => 'Grocery & Supermarket POS System with Scale Integration — VenQore',
                'description' => 'Supermarket POS software built for speed and volume. Track weight scales, package variations, reorder alerts, and double-entry books. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Grocery POS & Supermarket ERP with High-Speed Checkout & Scale Integration',
                                'description' => 'Eliminate lines, integrate weighing scales, print barcodes, and track FIFO margins on thousands of SKUs.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['How does VenQore handle weighed vegetables and fruits?', 'VenQore supports barcode-generating scales. The scale prints a barcode containing the product SKU and weight. When scanned at the POS, VenQore automatically decodes the weight, calculates the total price, and updates inventory.'],
                        ['Can I import my existing supermarket inventory list?', 'Yes. You can import thousands of products, descriptions, barcodes, costs, prices, and categories in seconds using our CSV upload tool.'],
                        ['Does VenQore run offline if the internet fails?', 'Yes. The POS checkout cache runs locally on IndexedDB. You can scan barcodes, check out customers, print receipts, and reconcile cash shifts offline. Data syncs when the internet returns.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Grocery POS &amp; Supermarket ERP with High-Speed Checkout &amp; Scale Integration</h1>'
                    . '<p>High-speed checkout, direct weight scale integration, multi-pack bundling, automatic reorder level alerts, and verified double-entry accounting in one offline-first platform.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>Weight Scale Integration &amp; Unit Conversion</li>'
                    . '<li>Multi-Pack &amp; Bundle Pricing</li>'
                    . '<li>Fast Barcode Tag Printing</li>'
                    . '<li>Hold &amp; Recall Parked Carts</li>'
                    . '<li>Supplier Purchase &amp; Reorder Workflow</li>'
                    . '<li>Automated General Ledger posting</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:wholesale' => [
                'title' => 'Wholesale POS System & B2B Distribution ERP — VenQore',
                'description' => 'Wholesale POS and ERP software with tiered pricing, customer credit limit guards, aging accounts receivable, and double-entry accounting. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Wholesale POS & B2B Distribution ERP with Customer Credit & Tiered Pricing',
                                'description' => 'Secure customer credit, manage tiered B2B pricing, track sales orders, and automate aging receivables.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['Can I enforce credit limits for customer credit sales?', 'Yes. You can configure approved credit limits per customer. The POS checkout blocks the sale if the invoice total pushes the client\'s balance past their limit.'],
                        ['How does VenQore help my salesmen take orders on site?', 'VenQore is a browser-based PWA that installs on smartphones and tablets. Salesmen can access the catalog, search stock by warehouse, raise quotes or sales orders on-site, and sync back to HQ.'],
                        ['Can I print accounts statements for my clients?', 'Yes. One click generates a Customer Khata Ledger Statement detailing opening balance, chronological invoice charges, payment receipts, and current closing balance.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Wholesale POS &amp; B2B Distribution ERP with Customer Credit &amp; Tiered Pricing</h1>'
                    . '<p>Multi-tier customer pricing matrix, automated credit limit controls, salesman order booking support, accounts receivable aging, and verified double-entry ledgers.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>Tiered Customer Price Matrices</li>'
                    . '<li>B2B Credit Limit Safeguards</li>'
                    . '<li>Accounts Receivable Aging Reports</li>'
                    . '<li>Multi-Unit Packaging conversions</li>'
                    . '<li>Sales Order &amp; Quote workflow</li>'
                    . '<li>Immutable Ledger Accounting</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:clothing' => [
                'title' => 'Fashion Boutique POS & Apparel Inventory System — VenQore',
                'description' => 'Apparel retail POS software with size/color variant matrix, custom barcode label printing, WooCommerce stock sync, and real accounting. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Fashion Boutique POS & Retail ERP with Size & Color Variant Matrix',
                                'description' => 'Manage size/color variants, print barcodes, sync online sales, and track fashion margins.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['How does the variant matrix simplify adding clothing items?', 'Instead of creating separate products for each size/color combination, you create one product, enter attributes, and the matrix creates all combinations automatically.'],
                        ['How fast does the WooCommerce stock sync update?', 'VenQore listens to WooCommerce sales webhooks. When an online sale occurs, inventory deducts immediately. Physical store checkout sales update online WooCommerce inventory levels automatically within 5 minutes.'],
                        ['Can I print custom tag labels with my store logo?', 'Yes. Our built-in barcode generator and label printing tool support custom templates. You can print size, color, brand name, price, and scannable barcode to standard label printers.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Fashion Boutique POS &amp; Retail ERP with Size &amp; Color Variant Matrix</h1>'
                    . '<p>Variant matrix grids, custom tag barcode printing, real-time WooCommerce online store inventory sync, and auditor-grade double-entry accounting in one system.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>Size &amp; Color Variant Matrix Grids</li>'
                    . '<li>Real-Time WooCommerce Inventory Sync</li>'
                    . '<li>Custom Barcode Tag Designer</li>'
                    . '<li>Markdown &amp; Promotional Campaigns</li>'
                    . '<li>Customer Loyalty &amp; CRM Tools</li>'
                    . '<li>Automated Financial Reports</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.solutions.show:multi-store' => [
                'title' => 'Multi-Store POS System & Retail Chain ERP — VenQore',
                'description' => 'Multi-store retail POS and ERP software with consolidated ledgers, store-wise P&L, secure stock transfers, and cashier audit logs. Try the live demo.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'Article',
                                'headline' => 'Enterprise POS & ERP for Multi-Store Retail Chains & Franchises',
                                'description' => 'Consolidate multiple warehouses, transfer stock securely, control staff roles, and centralize your ledger.',
                                'author' => self::organizationLd(),
                                'publisher' => self::organizationLd(),
                            ],
                        ],
                    ],
                    self::faq([
                        ['How many branches or locations can I manage?', 'Our Growth plan supports up to 3 locations, while the Enterprise plan supports up to 10 locations. Contact our support team for custom franchise configurations past 10 outlets.'],
                        ['Can branch cashiers see product stock levels at other branches?', 'Yes. If permitted by manager role permissions, cashiers can search a product SKU to see stock levels across all other outlets and warehouses.'],
                        ['Is my data secure across cashier terminals?', 'Yes. Cashiers log in using unique numerical PIN passcodes. All cashier actions are logged with date and operator details in the audit trail.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Enterprise POS &amp; ERP for Multi-Store Retail Chains &amp; Franchises</h1>'
                    . '<p>Centralized multi-warehouse stock transfers, store-wise Profit &amp; Loss statements, consolidated trial balances, 7 cashier and manager role levels, and real-time operational oversight.</p>'
                    . '<h2>Core Capabilities</h2><ul>'
                    . '<li>Consolidated General Ledger &amp; HQ dashboard</li>'
                    . '<li>Atomic Multi-Warehouse Transfers</li>'
                    . '<li>Store-Wise Profit &amp; Loss Reports</li>'
                    . '<li>7 Staff Role Permission Levels</li>'
                    . '<li>Cashier Shift Cash Reconciliation</li>'
                    . '<li>Central Product Catalog Controls</li></ul>'
                    . '<p><a href="/register"><strong>Start Free Trial</strong></a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.contact' => [
                'title' => 'Contact VenQore — Sales, Support & Partnerships',
                'description' => 'Talk to the VenQore team about your store, migration from another POS, partnerships, or support. We reply within one business day.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Contact VenQore &mdash; Let&#39;s Talk</h1>'
                    . '<p><strong>Whether you need a personalized walkthrough, have technical questions, or want to discuss enterprise licensing, we respond within hours, not days.</strong></p>'
                    . '<ul><li><strong>WhatsApp:</strong> the fastest way to reach us, with immediate response during business hours</li>'
                    . '<li><strong>Email:</strong> <a href="mailto:hello@venqore.com">hello@venqore.com</a> for detailed inquiries, partnerships and enterprise discussions</li>'
                    . '<li><strong>Live demo:</strong> book a 30-minute, one-on-one walkthrough of VenQore with your own data</li>'
                    . '<li><strong>Partners:</strong> <a href="mailto:partners@venqore.com">partners@venqore.com</a> for reselling, white-labeling or integration inquiries</li></ul>'
                    . '<p>We are a remote-first team with engineering based in Pakistan, serving retail and food businesses globally. Typical response time is 2-4 hours during business hours.</p>'
                    . '<p><a href="/register"><strong>Start your free trial</strong></a> &middot; <a href="/demo">Try the live demo first</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.partners' => [
                'title' => 'B2B Partnership & Licensing Programs — VenQore',
                'description' => 'Explore white-label opportunities, B2B reseller programs, and source-code licensing for VenQore\'s offline-first POS & ERP platform.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@graph' => [
                            self::organizationLd(),
                            [
                                '@type' => 'WebPage',
                                '@id' => 'https://venqore.com/partners#webpage',
                                'url' => 'https://venqore.com/partners',
                                'name' => 'B2B Partnership & Licensing Programs — VenQore',
                                'description' => 'Explore white-label opportunities, B2B reseller programs, and source-code licensing for VenQore\'s offline-first POS & ERP platform.'
                            ],
                            [
                                '@type' => 'B2BBusiness',
                                'name' => 'VenQore Partnerships',
                                'parentOrganization' => [
                                    '@id' => 'https://venqore.com/#organization'
                                ],
                                'contactPoint' => [
                                    '@type' => 'ContactPoint',
                                    'contactType' => 'reseller relations',
                                    'email' => 'founder@venqore.com',
                                    'url' => 'https://venqore.com/partners'
                                ]
                            ]
                        ]
                    ]
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>B2B Partnership &amp; Licensing Programs</h1>'
                    . '<p>VenQore licenses its platform to B2B resellers, hardware distributors, and enterprise partners. Serious partnership and licensing conversations are welcome. The company is not for sale; however, we license the software through our structured licensing ladder:</p>'
                    . '<h2>The Licensing Ladder</h2>'
                    . '<ol>'
                    . '<li><strong>White-Label Partner:</strong> Rebrand VenQore under your own domain name and branding. Receive a healthy revenue share of all merchant subscriptions without hosting or maintaining the infrastructure. The default answer for B2B resellers.</li>'
                    . '<li><strong>Source-Code License (Non-Exclusive):</strong> Acquire a full source-code license to deploy on your own server infrastructure. Suitable for regional hardware distributors or software operators who want full operational independence. Five-figure setup plus annual maintenance.</li>'
                    . '<li><strong>Exclusive Vertical or Regional License:</strong> Purchase exclusive rights to operate VenQore in a specific industry vertical or geographical country. Secure six-figure valuation posture.</li>'
                    . '<li><strong>Strategic Acquisition:</strong> Full IP and asset purchase. Discussed only under strategic premiums and direct revenue multiples. No code-broker anchor negotiations.</li>'
                    . '</ol>'
                    . '<p>Submit your inquiry below or contact <a href="mailto:founder@venqore.com">founder@venqore.com</a> directly.</p>'
                    . $nav . '</main>',
            ],

            'marketing.newsletter' => [
                'title' => 'VenQore Newsletter — Product Launches & Retail Playbooks',
                'description' => 'Get notified when new VenQore capabilities launch (VenSynQ marketplace sync, SmartCapture scan-to-invoice) plus practical playbooks for running a tighter retail operation.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Newsletter &mdash; Product Launches &amp; Retail Playbooks</h1>'
                    . '<p><strong>Get notified the moment new VenQore capabilities launch</strong> &mdash; VenSynQ marketplace sync, SmartCapture scan-to-invoice &mdash; plus practical playbooks for running a tighter retail operation: inventory control, FIFO costing, and double-entry accounting for shopkeepers.</p>'
                    . '<p>One email per release, no spam. Unsubscribe any time.</p>'
                    . '<p><a href="/demo"><strong>Try the live demo</strong></a> &middot; <a href="/blog">Read the blog</a></p>'
                    . $nav . '</main>',
            ],

            'blog.index' => [
                'title' => 'VenQore Blog — Retail Operations, POS & Accounting Guides',
                'description' => 'Practical guides on point of sale, inventory control, FIFO costing, double-entry accounting for shopkeepers, and growing a retail business.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore Blog &mdash; Retail Operations, POS &amp; Accounting Guides</h1>'
                    . '<p><strong>Practical guides on point of sale, inventory control, FIFO costing, double-entry accounting for shopkeepers, and growing a retail business.</strong></p>'
                    . '<ul>'
                    . '<li><a href="/blog/your-business-has-been-lying-to-you-about-revenue">Your Business Has Been Lying to You About Revenue &mdash; Here&#39;s How to Find Out</a>: why the &quot;revenue&quot; figure in most POS systems includes tax you owe the government, and how to check your own numbers.</li>'
                    . '<li><a href="/blog/the-hidden-tax-on-every-business-that-doesnt-track-customers-properly">The Hidden Tax on Every Business That Doesn&#39;t Track Customers Properly</a>: the silent cost of customers who quietly stop coming back, and a framework for catching them in time.</li>'
                    . '</ul>'
                    . '<p><a href="/demo">Try the live demo</a> &middot; <a href="/subscribe">Get new posts by email</a></p>'
                    . $nav . '</main>',
            ],

            'terms' => [
                'title' => 'Terms of Service — VenQore',
                'description' => 'The terms that govern your use of VenQore, the offline-first POS and ERP platform.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Terms of Service</h1>'
                    . '<p>Please read these Terms of Service carefully before using VenQore. By creating an account or using any part of the Service, you agree to be bound by these terms.</p>'
                    . '<p><strong>VenQore</strong> is a cloud-based Point of Sale (POS) and ERP platform for retail businesses, including inventory management, sales tracking, accounting and reporting. You must provide accurate information when creating an account, and you are responsible for all activity under it. Paid subscriptions are billed monthly or annually through Lemon Squeezy; you may cancel at any time, effective at the end of the current billing period.</p>'
                    . '<p><a href="/privacy">Read the Privacy Policy</a> &middot; <a href="/refund-policy">Refund Policy</a></p>'
                    . $nav . '</main>',
            ],

            'privacy' => [
                'title' => 'Privacy Policy — VenQore',
                'description' => 'How VenQore collects, uses and protects your data. Your business data belongs to you.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Privacy Policy</h1>'
                    . '<p>Your privacy matters to us. This policy explains what data we collect, why we collect it, and how you can control it. We do not sell your data.</p>'
                    . '<p>We collect account data (name, email, business name, hashed password), business data you create in the Service (products, customers, sales, invoices, accounting entries &mdash; which belongs to you), usage data (IP address, browser type, pages visited) for security and improvement, and payment data handled entirely by Lemon Squeezy &mdash; we never see your full card number.</p>'
                    . '<p>Your business data is never used for anything other than providing the Service to you.</p>'
                    . '<p><a href="/terms">Read the Terms of Service</a> &middot; <a href="/refund-policy">Refund Policy</a></p>'
                    . $nav . '</main>',
            ],

            'refund-policy' => [
                'title' => 'Refund Policy — VenQore',
                'description' => 'VenQore refund terms for subscriptions and lifetime deals — plain language, no surprises.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Refund Policy</h1>'
                    . '<p><strong>AppSumo Lifetime Deal purchases are covered by AppSumo&#39;s standard 60-day money-back guarantee.</strong> You may request a full refund within 60 calendar days of your original purchase date through your AppSumo dashboard or by contacting AppSumo support directly.</p>'
                    . '<p>If you have stacked multiple codes and request a refund, the refund applies per code: refunding a code downgrades your plan to the next lower tier, and refunding all codes deactivates your account.</p>'
                    . '<p><a href="/terms">Terms of Service</a> &middot; <a href="/privacy">Privacy Policy</a></p>'
                    . $nav . '</main>',
            ],

            'register' => [
                'title' => 'Create Your Free VenQore Account — 14-Day Trial, No Credit Card',
                'description' => 'Start your 14-day free trial of VenQore: offline-first POS with verified double-entry accounting, FIFO inventory and 40+ financial reports. No credit card required.',
                'jsonld' => [],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>Create Your VenQore Account</h1>'
                    . '<p><strong>Start a 14-day free trial &mdash; full features, no credit card required.</strong> VenQore is the offline-first point of sale and ERP with verified double-entry accounting built in.</p>'
                    . '<ul><li>Auditor-grade accuracy: every transaction writes a correct, balanced journal entry</li>'
                    . '<li>Professional POS: fast checkout shortcuts and a crash-proof, offline-first architecture</li>'
                    . '<li>Dozens of verified financial reports: Profit &amp; Loss, Balance Sheet, Cash Flow and more</li>'
                    . '<li>Full inventory control: FIFO costing, batch tracking, multi-warehouse support</li></ul>'
                    . '<p><a href="/pricing">See plans from $36/month</a> &middot; <a href="/demo">Try the live demo first, no signup</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.vensynq' => [
                'title' => 'VenSynQ — Sync POS Inventory with WooCommerce & Marketplaces',
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
                    . '<h2>Frequently asked</h2>'
                    . '<p><strong>What is VenSynQ?</strong> The multi-channel e-commerce fulfillment engine inside VenQore POS. It keeps one inventory and one verified ledger across your physical store and online channels — WooCommerce today, with Amazon, eBay and TikTok Shop connections coming soon.</p>'
                    . '<p><strong>Does VenQore sync with WooCommerce?</strong> Yes — stock levels sync automatically and WooCommerce orders become POS sales, matched by SKU, with webhook-verified security.</p>'
                    . '<p><a href="/subscribe"><strong>Join the waitlist</strong></a> — get an email the moment each channel launches. · <a href="/demo">Try the live demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.smartcapture' => [
                'title' => 'SmartCapture — Paper Invoices & Voice Notes to Digital Records',
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
                    . '<h2>Frequently asked</h2>'
                    . '<p><strong>What is SmartCapture?</strong> VenQore&#39;s AI input layer: photograph a paper invoice or speak a voice note, and it becomes a structured, editable transaction — line items recognized, products matched to your catalog, ready to post to the verified ledger.</p>'
                    . '<p><strong>When does it launch?</strong> SmartCapture is in final testing. Join the waitlist on this page to be notified at launch.</p>'
                    . '<p><strong>Coming soon.</strong> <a href="/subscribe"><strong>Join the waitlist</strong></a> and be first in when it ships. · <a href="/demo">Try the live demo</a></p>'
                    . $nav . '</main>',
            ],
            'marketing.compare.index' => [
                'title' => 'VenQore POS & ERP Comparisons — See How VenQore Compares',
                'description' => 'Compare VenQore with Square, Vyapar, Shopify POS, Lightspeed and Toast. Discover why growing businesses choose VenQore for zero transaction fees and built-in double-entry accounting.',
                'jsonld' => [
                    self::organizationLd(),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore POS &amp; ERP Comparisons</h1>'
                    . '<p><strong>Compare VenQore to legacy POS systems and billing software.</strong> Discover how VenQore eliminates 2.6%+ transaction markups and integrates real double-entry accounting directly into your point of sale.</p>'
                    . '<ul>'
                    . '<li><a href="/compare/venqore-vs-square"><strong>VenQore vs Square POS:</strong> Compare transaction fee math, accounting capabilities, and offline stability.</a></li>'
                    . '<li><a href="/compare/venqore-vs-vyapar"><strong>VenQore vs Vyapar:</strong> Discover auditor-grade double-entry general ledger vs desktop single-entry billing.</a></li>'
                    . '</ul>'
                    . $nav . '</main>',
            ],

            'marketing.compare.show:venqore-vs-square' => [
                'title' => 'VenQore vs Square POS (2026 Comparison & Pricing Math)',
                'description' => 'Compare VenQore vs Square POS: see transaction fee math, built-in double-entry accounting vs QuickBooks add-ons, offline PWA stability, and real FIFO inventory.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'Article',
                        'headline' => 'VenQore vs Square POS — Pricing Math, Accounting & Features Comparison',
                        'description' => 'Compare VenQore vs Square POS: transaction fee math, built-in double-entry accounting, and offline PWA reliability.',
                        'url' => 'https://venqore.com/compare/venqore-vs-square',
                        'datePublished' => '2026-08-01',
                        'publisher' => self::organizationLd(),
                    ],
                    self::faq([
                        ['Why is VenQore significantly cheaper than Square POS for active stores?', 'Square POS generates revenue by taking 2.6% + 10¢ from every transaction. For a store processing $25,000/month, Square fees exceed $660/month. VenQore charges a flat $36/month subscription with $0 processing markup.'],
                        ['Does VenQore replace QuickBooks when migrating from Square?', 'Yes. VenQore includes an auditor-grade double-entry accounting engine where every sale automatically creates a balanced journal entry in your General Ledger.'],
                        ['Can VenQore operate when my internet goes down?', 'Yes. VenQore is an offline-first Progressive Web App (PWA) allowing complete checkout and inventory management offline.'],
                        ['Can I import my existing product catalog from Square into VenQore?', 'Yes. VenQore provides a 1-click CSV importer that reads exported Square inventory files in under 5 minutes.'],
                        ['What hardware do I need to run VenQore compared to Square?', 'Square requires proprietary hardware. VenQore runs on any standard web browser on PC, Mac, iPad, Android tablets, or smartphones.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore vs Square POS — Pricing Math &amp; Feature Comparison</h1>'
                    . '<p><strong>Square POS charges 2.6% + 10&cent; on every sale and lacks built-in accounting. VenQore gives you $0 transaction fees and automated double-entry bookkeeping.</strong></p>'
                    . '<h2>Pricing Math Breakdown</h2>'
                    . '<p>At $25,000/month in card sales, Square POS costs $660/month in transaction fees plus $50/month for QuickBooks ($710/month total). VenQore costs a flat $36/month — saving over $8,000/year.</p>'
                    . '<h2>Detailed Comparison</h2>'
                    . '<ul><li><strong>Accounting:</strong> VenQore has built-in double-entry accounting; Square requires external apps.</li>'
                    . '<li><strong>Offline Access:</strong> VenQore is a 100% offline-first PWA; Square limits offline card buffers to 24h.</li>'
                    . '<li><strong>Inventory Costing:</strong> VenQore tracks exact FIFO batch costs; Square provides basic average costs.</li></ul>'
                    . '<p><a href="/register">Start 14-Day Free Trial</a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],

            'marketing.compare.show:venqore-vs-vyapar' => [
                'title' => 'VenQore vs Vyapar (2026 Comparison & Feature Breakdown)',
                'description' => 'Compare VenQore vs Vyapar: discover true double-entry accounting vs single-entry billing, cross-platform cloud PWA vs desktop-only apps, and 10-minute .vyb data import.',
                'jsonld' => [
                    [
                        '@context' => 'https://schema.org',
                        '@type' => 'Article',
                        'headline' => 'VenQore vs Vyapar — Double-Entry Accounting vs Billing App Comparison',
                        'description' => 'Compare VenQore vs Vyapar: true double-entry accounting vs single-entry billing, cross-platform cloud PWA vs desktop-only apps.',
                        'url' => 'https://venqore.com/compare/venqore-vs-vyapar',
                        'datePublished' => '2026-08-01',
                        'publisher' => self::organizationLd(),
                    ],
                    self::faq([
                        ['How does VenQore differ from Vyapar in accounting accuracy?', 'Vyapar is a single-entry billing app. VenQore is an auditor-grade ERP where every transaction automatically posts balanced debit and credit entries to a double-entry general ledger.'],
                        ['Can I import my data from Vyapar into VenQore?', 'Yes. VenQore includes a dedicated Vyapar import tool supporting .vyb and CSV files in under 10 minutes.'],
                        ['Does VenQore run on Apple Mac and mobile devices unlike Vyapar?', 'Yes. VenQore is an offline-first Progressive Web App (PWA) that runs across Mac, Windows, iPad, iPhone, and Android devices.'],
                        ['Can VenQore manage multiple shop locations simultaneously?', 'Yes. VenQore supports multi-store management natively with consolidated reporting.'],
                        ['Is VenQore easy to learn for staff used to Vyapar?', 'Yes. VenQore features an intuitive high-speed POS interface designed for fast checkout.'],
                    ]),
                ],
                'static_html' => '<main style="font-family:system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;line-height:1.6">'
                    . '<h1>VenQore vs Vyapar — Double-Entry ERP vs Billing Software</h1>'
                    . '<p><strong>Vyapar provides simple single-entry billing for desktop. VenQore gives you true double-entry accounting, real-time multi-store sync, and offline PWA performance.</strong></p>'
                    . '<h2>Key Differences</h2>'
                    . '<ul><li><strong>Double-Entry Accounting:</strong> VenQore maintains a verified general ledger, Balance Sheet, and P&amp;L; Vyapar is single-entry.</li>'
                    . '<li><strong>Cross-Platform:</strong> VenQore runs on any web browser, Mac, Windows, iOS, or Android; Vyapar is desktop-focused.</li>'
                    . '<li><strong>Easy Migration:</strong> Import your Vyapar .vyb files into VenQore in 10 minutes.</li></ul>'
                    . '<p><a href="/register">Start 14-Day Free Trial</a> &middot; <a href="/demo">Try Live Demo</a></p>'
                    . $nav . '</main>',
            ],
        ];
    }
}
