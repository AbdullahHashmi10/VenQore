import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, FileText, Receipt, ShoppingCart, Truck, Repeat, CreditCard } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function Documents() {
  const DOCS = [
    { type: 'Sales Invoice', cat: 'Sell', desc: 'Standard tax-compliant sales invoice with QR verification code.' },
    { type: 'POS Receipt', cat: 'Sell', desc: 'Thermal 80mm/58mm register receipt with cashier and register identity.' },
    { type: 'Sales Quotation', cat: 'Sell', desc: 'Proforma quote with expiry date, terms, and 1-click invoice conversion.' },
    { type: 'Credit Note', cat: 'Sell', desc: 'Formal refund & adjustment note posting automatic ledger credits.' },
    { type: 'Packing Slip', cat: 'Sell', desc: 'Warehouse fulfillment picking list with barcode scanning.' },
    { type: 'Purchase Order', cat: 'Buy', desc: 'B2B order to suppliers with agreed payment terms and delivery date.' },
    { type: 'Goods Received Note', cat: 'Buy', desc: 'Inward shipment verification creating stock lots and FIFO layers.' },
    { type: 'Purchase Return', cat: 'Buy', desc: 'Debit note returned to vendor adjusting accounts payable.' },
    { type: 'Stock Transfer', cat: 'Stock', desc: 'Inter-branch shipment with transit status and balancing entries.' },
    { type: 'Stock Adjustment', cat: 'Stock', desc: 'Physical audit count write-on and write-off with audit reasons.' },
    { type: 'Payment Receipt', cat: 'Money', desc: 'Customer khata recovery voucher with party balance summary.' },
    { type: 'Expense Voucher', cat: 'Money', desc: 'Operational cash outflow voucher with tax deduction details.' },
    { type: 'Journal Voucher', cat: 'Ledger', desc: 'Manual adjusting journal with dual debit/credit validation.' }
  ];

  return (
    <MarketingLayout
      title="13 Document Types — One Unified Document Engine | VenQore"
      description="Thirteen document types, one engine: invoices, receipts, purchase orders, credit notes, stock transfers, and vouchers."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/documents" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Documents</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              Thirteen document types. <em className="vq-italic">One</em> engine.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              Every document you hand to a customer, driver, supplier or auditor is generated from one unified schema. The same party records, same SKU catalogue, and identical tax rules power all thirteen.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/tools">
                Try free document tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0 pb-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DOCS.map((doc) => (
              <div key={doc.type} className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 bg-accent-fill/10 text-accent-text rounded-xl"><FileText size={18} /></span>
                  <span className="text-2xs font-bold uppercase tracking-wider text-ink-secondary px-2.5 py-0.5 rounded-full bg-surface dark:bg-white/5">{doc.cat}</span>
                </div>
                <h3 className="text-base font-bold text-ink">{doc.type}</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
