<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class BlogPostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeds the blog_posts table with:
     * - 3 original editorial articles (inline content)
     * - 10 master knowledge-base articles (loaded from markdown files)
     *
     * Uses updateOrCreate keyed on 'slug' so re-running is safe.
     */
    public function run(): void
    {
        // ── Original Editorial Articles (preserved) ──────────────────────
        $originalPosts = [
            [
                'slug' => 'your-business-has-been-lying-to-you-about-revenue',
                'title' => 'Your Business Has Been Lying to You About Revenue — Here\'s How to Find Out',
                'excerpt' => 'The "revenue" figure in most POS systems is SELECT SUM(total) FROM sales. That\'s it. That single number includes the government tax you collected. Tax you will hand over. Tax that was never yours.',
                'category' => 'Financial Truth',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Your Business Has Been Lying to You About Revenue — VenQore',
                'meta_description' => 'Why most POS revenue reports overstate real revenue by including government tax, and how to verify your real sales numbers with double-entry accounting.',
                'image' => '/images/blog/revenue-lie.jpg',
                'is_published' => true,
                'published_at' => '2026-04-10 09:00:00',
                'content' => 'I used to think I understood my revenue. I had a POS. It showed me daily totals. I could tell you within a few thousand what last month looked like. I felt like I had a handle on the numbers. Then I started looking at where those numbers actually came from.

The "revenue" figure in most POS systems is SELECT SUM(total) FROM sales. That\'s it. That single number — used for every dashboard card, every trend line, every monthly comparison — includes the government tax you collected. Tax you will hand over. Tax that was never yours.

In a 15% GST market, your displayed "revenue" is overstated by 13% before any other error enters the calculation.

**The COGS Problem Is Worse**

Most systems calculate your profit margin like this: take your current selling price, subtract your "cost price," and call it gross profit. Simple. Except: where does "cost price" come from?

In the vast majority of SMB software, cost_price is a single column on the product table. It gets overwritten every time you receive a purchase. Buy 100 units at $5, then buy another 100 at $8 — the system now believes your cost is $8. On all units. Including the ones sitting in your warehouse from the first batch.

Your historical profit reports are now fabricated. Every sale from before the price change shows the wrong margin.

**The Framework for Diagnosing Your Own System**

* Pull your last 12 months of revenue. Does that number include tax collected? Compare to your VAT return — if they\'re close, you\'ve been measuring gross.
* Find a product you bought at two different prices. Does your profit report show a step change at the second purchase date, or a static number?
* Find a month where you made a large return to a supplier. Did your inventory value adjust correctly?
* Ask your accountant: "Do your month-end numbers match what the system shows?" If not, you have a reconciliation problem.

**The Uncomfortable Conclusion**

If your software isn\'t built on double-entry bookkeeping, FIFO cost tracking, and immutable posted records — you don\'t have a financial system. You have a receipt generator that approximates your numbers after the fact.

The fix isn\'t to get a better accountant. It\'s to demand software that starts with the math.

> VenQore was built because we were tired of fabricated numbers. Every sale posts a journal entry. Every cost is tracked by batch. Every balance sheet balances. The books are always right — not because we work harder, but because the architecture won\'t allow them to be wrong.',
            ],
            [
                'slug' => 'the-hidden-tax-on-every-business-that-doesnt-track-customers-properly',
                'title' => 'The Hidden Tax on Every Business That Doesn\'t Track Customers Properly',
                'excerpt' => 'There\'s a number that almost no small business tracks, and it silently destroys more profit than any other single factor. It\'s the cost of a customer you already had — who left.',
                'category' => 'Growth Strategy',
                'author' => 'VenQore Editorial',
                'meta_title' => 'The Hidden Tax on Business Customer Churn — VenQore',
                'meta_description' => 'How unnoticed customer churn silently drains small business profits, and how to build an automated retention system before relationships slip away.',
                'image' => '/images/blog/customer-retention.jpg',
                'is_published' => true,
                'published_at' => '2026-04-12 10:30:00',
                'content' => 'There\'s a number that almost no small business tracks, and it silently destroys more profit than any other single factor.

It\'s not your cost of goods. It\'s not your payroll. It\'s not even your rent.

It\'s the cost of a customer you already had — who left — and who you never noticed was gone.

**The Math of Customer Loss Is Brutal**

60–70% of customers who will never return show no visible signal of departure. They bought from you. They were satisfied enough not to complain. And then, somewhere between their last visit and now, they found another option — and stayed there. You never knew.

Your revenue didn\'t drop suddenly. It declined over 6 months, slowly, in a trend you attributed to seasonality. It was actually a list of names — people who used to come every three weeks and haven\'t been in for six months.

**The Signal Is in the Cadence**

Every repeat customer has a purchase rhythm. When that rhythm breaks, something changed. The window to intervene is about 2–3 cycles past their normal return date. After that, the relationship has to be rebuilt from scratch — at acquisition cost, not retention cost.

If you track 500 active customers, at any given time, 40–80 of them are past their expected return window. You have 2 weeks to reach out before they\'re effectively gone.

**The Framework for Building a Retention System**

* Establish a return cadence for each customer based on historical visit frequency.
* Define a churn threshold (typically 1.5x–2x their normal cadence).
* Create a touchpoint sequence: Day 35 check-in, Day 42 targeted offer, Day 56 personal escalation.
* Measure recovery rate. A 15% recovery rate on at-risk customers adds measurable revenue without a single new acquisition.
* Feed outcomes back into the model. Returning customers reset their cadence clock.

> VenQore\'s Retention Engine calculates expected return windows for every repeat customer and surfaces the ones who\'ve gone quiet. Not as a report you run — as an alert that reaches you before the relationship is gone. Because by the time you notice the revenue drop, the window has already closed.',
            ],
            [
                'slug' => 'why-offline-first-architecture-and-double-entry-bookkeeping-belong-together',
                'title' => 'Why Offline-First Architecture and Double-Entry Bookkeeping Belong Together',
                'excerpt' => 'When the internet drops during peak Saturday trade, traditional cloud POS systems freeze or create duplicate un-reconciled orders. Here is how offline-first sync + immutable ledger posting fixes retail.',
                'category' => 'Engineering & Architecture',
                'author' => 'VenQore Tech Team',
                'meta_title' => 'Offline-First POS & Double-Entry Accounting Architecture — VenQore',
                'meta_description' => 'Learn how local-first IndexedDB sync combined with server-side double-entry accounting guarantees zero missed sales and perfectly reconciled ledgers.',
                'image' => '/images/blog/offline-first-accounting.jpg',
                'is_published' => true,
                'published_at' => '2026-04-18 14:00:00',
                'content' => 'When your internet connection drops during peak Saturday trade, your point of sale shouldn\'t crash or lock cashiers out.

Traditional cloud-only POS systems make a remote API request on every cart checkout. When latency spikes or connectivity fails, registers lock up, long lines form at the counter, and cashiers start writing orders on paper receipts.

**The Flaw in Traditional Cloud Architecture**

Most SaaS POS systems treat the browser as a dumb terminal. When connection is lost:
1. Sales stall completely until internet returns.
2. Or systems allow offline mode without validation, resulting in duplicate invoice numbers, missing batch deductions, and un-balanced accounting entries when synced back later.

**The Local-First + Immutable Ledger Solution**

VenQore solves this by combining local-first PWA architecture with a server-side double-entry ledger engine:

* **IndexedDB & Service Workers**: Every store transaction executes locally in under 5 milliseconds. The POS continues ringing sales, printing receipts, and scanning barcodes whether connected or completely offline.
* **Deterministic Event Queueing**: Transactions queue in IndexedDB with cryptographic UUIDs and vector timestamps.
* **Auto-Reconciliation Engine**: When internet returns, the background sync engine pushes queued transactions. The server validates batch FIFO availability and posts real double-entry journal entries (`Debit Cash / Accounts Receivable`, `Credit Sales Revenue`, `Debit COGS`, `Credit Inventory`).

> Your store never stops ringing, and your books are always 100% reconciled.',
            ],
        ];

        // ── Master Knowledge Base Articles (loaded from markdown files) ──
        $masterArticles = [
            [
                'slug' => 'fifo-vs-lifo-vs-weighted-average-inventory-costing-retail-2026',
                'title' => 'FIFO vs. LIFO vs. Weighted Average Inventory Costing: Which Method Saves Retailers More Money in 2026?',
                'excerpt' => 'FIFO, LIFO, and Weighted Average Cost are the three primary inventory costing methods retailers use to calculate Cost of Goods Sold and gross margins. FIFO assigns oldest batch costs first, reducing write-downs by up to 68%. LIFO is prohibited under IFRS. Automated batch-level costing engines reduce inventory drift from 3.8% to under 0.05%.',
                'category' => 'Inventory & Accounting',
                'author' => 'VenQore Editorial',
                'meta_title' => 'FIFO vs LIFO vs Weighted Average Inventory Costing for Retail 2026 — VenQore',
                'meta_description' => 'Compare FIFO, LIFO, and Weighted Average inventory costing methods for retail. Learn which saves more money with IFRS/GAAP compliance, tax implications, and real-world examples.',
                'image' => '/images/blog/inventory-costing-methods.jpg',
                'is_published' => true,
                'published_at' => '2026-07-01 08:00:00',
                'file' => '01-inventory-costing-methods.md',
            ],
            [
                'slug' => 'hidden-cost-square-shopify-credit-card-processing-fees-2026',
                'title' => 'The Hidden Cost of Square & Shopify: A 2026 Financial Analysis of Credit Card Processing Fees vs. Flat-Rate POS Platforms',
                'excerpt' => 'Square charges 2.6% + $0.10 per transaction. Shopify POS charges 2.4-2.9% + $0.30. On $800,000 annual revenue, these bundled processing fees create $12,000 to $28,000 in avoidable cost. Zero-fee POS architectures that decouple software from payment processing save merchants over $100,000 across five years.',
                'category' => 'Financial Analysis',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Hidden Cost of Square & Shopify Processing Fees 2026 — VenQore',
                'meta_description' => 'Financial analysis of Square, Shopify, and Clover credit card processing fees vs zero-fee POS. Includes TCO calculator, 5-year projections, and interchange-plus comparison.',
                'image' => '/images/blog/processing-fees-analysis.jpg',
                'is_published' => true,
                'published_at' => '2026-07-03 08:00:00',
                'file' => '02-hidden-cost-processing-fees.md',
            ],
            [
                'slug' => 'automating-double-entry-bookkeeping-retail-pos-2026',
                'title' => 'Automating Double-Entry Bookkeeping in Retail: How Modern POS Systems Eliminate Manual Month-End Reconciliation',
                'excerpt' => 'Automated double-entry bookkeeping in retail POS systems reduces month-end closing from 12-14 days to under 4 hours, cuts weekly reconciliation labor from 8 hours to 30 minutes, and eliminates the $3,500-$8,000 annual ledger drift caused by unrecorded payment processing fees and single-entry bookkeeping errors.',
                'category' => 'Accounting & ERP',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Automated Double-Entry Bookkeeping for Retail POS Systems 2026 — VenQore',
                'meta_description' => 'How automated double-entry accounting in POS systems eliminates month-end reconciliation, prevents ledger drift, and reduces CPA audit costs by up to 82%.',
                'image' => '/images/blog/double-entry-bookkeeping.jpg',
                'is_published' => true,
                'published_at' => '2026-07-05 08:00:00',
                'file' => '03-automating-double-entry-bookkeeping.md',
            ],
            [
                'slug' => 'multi-location-barcode-inventory-synchronization-omnichannel-2026',
                'title' => 'Multi-Location Barcode & Inventory Synchronization: Eliminating Phantom Stockouts in Omnichannel Stores',
                'excerpt' => 'Phantom inventory causes one-third of retail out-of-stock events, contributing to $1.1 trillion in global losses. Sub-second inventory synchronization using event-driven webhooks reduces e-commerce overselling from 4.8% to 0.00%, while native Code128 barcode support achieves 99.99% scanning accuracy across all channels.',
                'category' => 'Omnichannel Commerce',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Multi-Location Inventory Sync & Barcode Management 2026 — VenQore',
                'meta_description' => 'Eliminate phantom stockouts with sub-second inventory synchronization across stores, WooCommerce, and Amazon. Includes Code128 barcode standards and IMEI tracking.',
                'image' => '/images/blog/inventory-sync.jpg',
                'is_published' => true,
                'published_at' => '2026-07-08 08:00:00',
                'file' => '04-multi-location-inventory-sync.md',
            ],
            [
                'slug' => 'predictive-ai-retail-demand-forecasting-reduce-overstocking-stockouts-2026',
                'title' => 'Predictive AI in Retail Operations: How Automated Demand Forecasting Reduces Overstocking and Stockouts',
                'excerpt' => 'Predictive AI demand forecasting reduces retail carrying costs by 20-30%, cuts overstocking by 35%, and lowers stockout-driven lost sales from 4.5% to under 0.8% of gross revenue. AI-powered invoice OCR processes supplier documents in under 15 seconds at 99.4% accuracy, replacing $18-$25 per-invoice manual entry costs.',
                'category' => 'AI & Analytics',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Predictive AI Demand Forecasting for Retail Operations 2026 — VenQore',
                'meta_description' => 'How AI demand forecasting reduces overstocking by 35% and stockouts by 48%. Includes safety stock formulas, EOQ calculations, and SmartCapture AI invoice processing.',
                'image' => '/images/blog/ai-demand-forecasting.jpg',
                'is_published' => true,
                'published_at' => '2026-07-10 08:00:00',
                'file' => '05-predictive-ai-retail-demand-forecasting.md',
            ],
            [
                'slug' => 'best-pos-system-small-retail-store-2026-buyers-guide',
                'title' => 'How to Choose the Best POS System for a Small Retail Store in 2026: The Complete Buyer\'s Guide',
                'excerpt' => 'Small retail stores selecting a POS in 2026 must prioritize offline functionality, zero-transaction-fee architectures, and native double-entry accounting. Payment markups of 1.5-3.5% inflate costs by $12,000-$28,000 annually. Open WebUSB hardware reduces setup costs by up to 78% compared to proprietary bundles.',
                'category' => 'Buyer\'s Guide',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Best POS System for Small Retail Store 2026 — Complete Buyer\'s Guide — VenQore',
                'meta_description' => 'Complete buyer\'s guide to choosing the best POS system for small retail stores in 2026. Compare Square, Shopify, Lightspeed, Clover vs zero-fee platforms.',
                'image' => '/images/blog/pos-buyers-guide.jpg',
                'is_published' => true,
                'published_at' => '2026-07-14 08:00:00',
                'file' => '06-best-pos-system-small-retail-2026.md',
            ],
            [
                'slug' => 'switch-pos-systems-without-losing-data-migration-guide',
                'title' => 'How to Switch POS Systems Without Losing Inventory Data or Interrupting Sales: The Complete Migration Guide',
                'excerpt' => 'Zero-downtime POS migration requires pre-cleaning SKU data, standardized CSV mapping, and parallel ledger validation. Uncoordinated cutovers average 4.5 hours of register downtime at $1,200 per hour. Automated delta synchronization captures live sales during switchover, eliminating the 15-25% data loss rate of manual migrations.',
                'category' => 'Migration Guide',
                'author' => 'VenQore Editorial',
                'meta_title' => 'How to Switch POS Systems Without Losing Data — Migration Guide — VenQore',
                'meta_description' => 'Step-by-step POS migration guide for zero-downtime switching. Includes SKU data cleaning, variant mapping, delta synchronization, and ledger reconciliation.',
                'image' => '/images/blog/pos-migration-guide.jpg',
                'is_published' => true,
                'published_at' => '2026-07-17 08:00:00',
                'file' => '07-switch-pos-systems-migration-guide.md',
            ],
            [
                'slug' => 'pos-sales-accounting-books-dont-match-how-to-fix',
                'title' => 'Why Your POS Sales and Accounting Books Don\'t Match (And How to Fix It)',
                'excerpt' => 'POS-to-accounting discrepancies stem from unrecorded processing fees, cash register variances, and settlement timing gaps. Single-entry bookkeeping creates $3,500-$8,000 in annual unexplained ledger drift. Native double-entry POS accounting eliminates these mismatches by posting balanced journal entries for every transaction in real time.',
                'category' => 'Troubleshooting',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Why POS Sales Don\'t Match Accounting Books — How to Fix — VenQore',
                'meta_description' => 'Diagnose and fix POS-to-accounting discrepancies caused by processing fees, cash variances, and single-entry bookkeeping. Includes root cause analysis and journal entries.',
                'image' => '/images/blog/pos-accounting-mismatch.jpg',
                'is_published' => true,
                'published_at' => '2026-07-21 08:00:00',
                'file' => '08-pos-sales-accounting-mismatch-fix.md',
            ],
            [
                'slug' => 'retail-pos-hardware-checklist-receipt-printers-barcode-scanners-cash-drawers-2026',
                'title' => 'The Ultimate Retail Hardware Checklist: Which Receipt Printers, Barcode Scanners & Cash Drawers Work Best in 2026?',
                'excerpt' => 'Open-protocol WebUSB and WebBluetooth POS hardware eliminates proprietary vendor lock-in and 200-300% markup pricing. Browser-native thermal printing executes in under 500 milliseconds versus 3,500ms for legacy OS spoolers. A complete 3-terminal setup costs $750 with open-market hardware versus $3,600 for proprietary bundles.',
                'category' => 'Hardware Guide',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Retail POS Hardware Checklist 2026 — Printers, Scanners, Drawers — VenQore',
                'meta_description' => 'Complete retail POS hardware checklist for 2026. Compare WebUSB printers, Bluetooth barcode scanners, and RJ11 cash drawers. Avoid proprietary vendor lock-in.',
                'image' => '/images/blog/hardware-checklist.jpg',
                'is_published' => true,
                'published_at' => '2026-07-24 08:00:00',
                'file' => '09-retail-hardware-checklist.md',
            ],
            [
                'slug' => 'physical-stock-take-step-by-step-without-closing-store',
                'title' => 'How to Do a Physical Stock Take Step-by-Step (Without Closing Your Store)',
                'excerpt' => 'Perpetual cycle counting with mobile barcode scanners eliminates annual store shutdowns that cost $9,600 in lost sales plus $2,400 in overtime. ABC inventory classification reduces auditing labor by 70% while maintaining accuracy above 98%, compared to 35% accuracy at month 11 under traditional annual audit methods.',
                'category' => 'Operations Guide',
                'author' => 'VenQore Editorial',
                'meta_title' => 'Physical Stock Take Guide — Step-by-Step Without Closing Store — VenQore',
                'meta_description' => 'Step-by-step guide to physical stock takes without closing your store. Includes ABC classification, cycle counting, variance resolution, and double-entry adjustments.',
                'image' => '/images/blog/stock-take-guide.jpg',
                'is_published' => true,
                'published_at' => '2026-07-28 08:00:00',
                'file' => '10-physical-stock-take-guide.md',
            ],
        ];

        // ── Seed original editorial posts ────────────────────────────────
        foreach ($originalPosts as $postData) {
            BlogPost::updateOrCreate(
                ['slug' => $postData['slug']],
                $postData
            );
        }

        // ── Seed master knowledge-base articles from markdown files ──────
        $articlesDir = database_path('seeders/blog-articles');

        foreach ($masterArticles as $articleMeta) {
            $filePath = $articlesDir . DIRECTORY_SEPARATOR . $articleMeta['file'];

            if (! file_exists($filePath)) {
                $this->command->warn("Article file not found: {$articleMeta['file']} — skipping.");
                continue;
            }

            $content = file_get_contents($filePath);

            // Remove the 'file' key before inserting into the database
            unset($articleMeta['file']);

            $articleMeta['content'] = $content;

            BlogPost::updateOrCreate(
                ['slug' => $articleMeta['slug']],
                $articleMeta
            );

            $wordCount = str_word_count(strip_tags($content));
            $this->command->info("Seeded: {$articleMeta['slug']} ({$wordCount} words)");
        }

        $totalPosts = BlogPost::count();
        $this->command->info("Blog seeding complete. Total posts: {$totalPosts}");
    }
}
