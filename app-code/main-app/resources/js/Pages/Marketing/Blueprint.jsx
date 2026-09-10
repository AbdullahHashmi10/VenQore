import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Play, Check, X, Shield, Layers, FileText, Database, Scale, Users } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

const BLUEPRINT_PRESETS = {
  pharmacy: {
    label: 'Pharmacy',
    prompt: 'I run a 3-branch pharmacy with batch expiry tracking and distributor 30-day credit terms.',
    steps: [
      { num: '01', title: 'Intent parsed', text: 'Identified vertical: Retail & Wholesale Pharmacy. 3 physical branches.' },
      { num: '02', title: 'Modules selected', text: 'Enabled POS, Batch & Expiry, Branch Transfers, Khata, Ledger. Disabled BOM/Kitchen.' },
      { num: '03', title: 'Vocabulary mapped', text: 'Customers → "Patients", Suppliers → "Distributors", Stock Unit → "Packs / Strips".' },
      { num: '04', title: 'Ledger rules locked', text: 'Near-expiry write-offs bound to Expense account #5120. Double-entry verified.' }
    ],
    result: {
      title: 'Pharmacy Operating System',
      badge: '11 of 46 modules active',
      modules: ['POS Checkout', 'Batch & Expiry', 'Stock Transfers', 'Supplier Khata', 'Core Ledger', 'Vena AI Alerts'],
      omitted: ['Kitchen BOM', 'Table Service', 'Vehicle Logistics', 'Room Booking']
    }
  },
  wholesale: {
    label: 'Wholesale',
    prompt: 'Auto parts wholesale with 10,000 SKUs, bulk discount tiers, and container logistics.',
    steps: [
      { num: '01', title: 'Intent parsed', text: 'Identified vertical: B2B Wholesale Distribution. High SKU count.' },
      { num: '02', title: 'Modules selected', text: 'Enabled Tiered Pricing, Container Logistics, Purchase Orders, Party Ledgers.' },
      { num: '03', title: 'Vocabulary mapped', text: 'Accounts → "Trade Accounts", Shipments → "Containers", Orders → "Proformas".' },
      { num: '04', title: 'Ledger rules locked', text: 'Landed cost allocation (freight + customs) distributed proportionally across units.' }
    ],
    result: {
      title: 'Wholesale Distribution ERP',
      badge: '14 of 46 modules active',
      modules: ['B2B Sales Orders', 'Container Logistics', 'Tiered Price Matrix', 'Supplier Credit', 'Core Ledger', 'Aging Reports'],
      omitted: ['Table Service', 'Bar Register', 'Recipe Costing']
    }
  },
  cafe: {
    label: 'Café',
    prompt: 'Artisan bakery and central kitchen with recipe costing, ingredient batching, and 4 shop drops.',
    steps: [
      { num: '01', title: 'Intent parsed', text: 'Identified vertical: Food & Beverage Manufacturing + Multi-outlet Retail.' },
      { num: '02', title: 'Modules selected', text: 'Enabled Recipes & BOM, Daily Production Runs, Store Requisitions, POS Quick-Touch.' },
      { num: '03', title: 'Vocabulary mapped', text: 'Products → "Menu Items", Raw Stock → "Ingredients", Drops → "Store Dispatches".' },
      { num: '04', title: 'Ledger rules locked', text: 'Daily batch yield conversions debit Finished Goods and credit Raw Inventory.' }
    ],
    result: {
      title: 'Bakery & Production System',
      badge: '9 of 46 modules active',
      modules: ['Quick-Touch POS', 'Recipe BOM Engine', 'Daily Production', 'Branch Transfers', 'Waste Write-off', 'Core Ledger'],
      omitted: ['IMEI Serial Tracking', 'Contractor Trade Credit', 'Container Freight']
    }
  },
  hardware: {
    label: 'Hardware store',
    prompt: 'Hardware store with 9,000 SKUs, FIFO valuation, variant dimensions and contractor trade credit.',
    steps: [
      { num: '01', title: 'Intent parsed', text: 'Identified vertical: Retail & Contractor Supply. Heavy dimensional matrix.' },
      { num: '02', title: 'Modules selected', text: 'Enabled Dimensional Variants, FIFO Stock Ledger, Contractor Accounts, Barcode Labels.' },
      { num: '03', title: 'Vocabulary mapped', text: 'Buyers → "Contractors", Units → "Meters / Kgs / Pieces", Credit → "Trade Khata".' },
      { num: '04', title: 'Ledger rules locked', text: 'FIFO layers strictly enforced on every sale item for genuine margin fidelity.' }
    ],
    result: {
      title: 'Hardware & Contractor OS',
      badge: '12 of 46 modules active',
      modules: ['Dimensional POS', 'FIFO Inventory', 'Contractor Ledger', 'Price Tag Generator', 'Barcode Printing', 'Core Ledger'],
      omitted: ['Table Service', 'Recipe Costing', 'Kitchen Display']
    }
  },
  multi: {
    label: 'Multi-branch',
    prompt: 'Multi-branch retail with variant matrix (size/color) synced live to Amazon and WooCommerce.',
    steps: [
      { num: '01', title: 'Intent parsed', text: 'Identified vertical: Multi-Branch Omnichannel Apparel & Fashion.' },
      { num: '02', title: 'Modules selected', text: 'Enabled Multi-Location Sync, VenSynQ Marketplace Connector, Matrix Grid POS.' },
      { num: '03', title: 'Vocabulary mapped', text: 'Outlets → "Stores", Online → "VenSynQ Channels", Stock Moves → "Inter-branch Manifests".' },
      { num: '04', title: 'Ledger rules locked', text: 'Automated inter-company balancing entries posted on all stock transshipments.' }
    ],
    result: {
      title: 'Omnichannel Retail Network',
      badge: '16 of 46 modules active',
      modules: ['Matrix POS', 'Multi-Branch Transfers', 'VenSynQ Sync', 'E-commerce Connector', 'Consolidated Ledger', 'Vena Pulse'],
      omitted: ['Batch Expiry', 'Kitchen BOM', 'Table Reservations']
    }
  }
};

export default function Blueprint() {
  const [activePreset, setActivePreset] = useState('pharmacy');
  const preset = BLUEPRINT_PRESETS[activePreset];

  return (
    <MarketingLayout
      title="Blueprint — The AI that Builds Your ERP | VenQore"
      description="Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/blueprint" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Blueprint</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              Describe your business. <em className="vq-italic">Approve</em> the plan. It exists.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              Blueprint is the part of VenQore that turns a description of your business into a working ERP and POS configuration: which of the 46 modules you get, what each thing is called, who can see what, which tax rules apply and which of the 13 document types you issue. You review every line before anything becomes real, and you can rebuild it at any time.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/onboarding">
                <Play size={15} /> See a build
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0">
        <div className="vq-container">
          <div className="vq-card vq-card--xl p-6 sm:p-8 bg-sunken dark:bg-void-900 border border-line dark:border-white/10 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line dark:border-white/10">
              <span className="vq-eyebrow text-xs font-bold uppercase tracking-wider text-ink-secondary">Try an interactive scenario</span>
              <div className="flex flex-wrap gap-2" role="tablist">
                {Object.entries(BLUEPRINT_PRESETS).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setActivePreset(key)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                      activePreset === key
                        ? 'bg-accent-fill text-accent-on shadow-md'
                        : 'bg-surface dark:bg-white/5 text-ink-muted hover:text-ink hover:bg-interactive-hover/[0.08]'
                    }`}
                  >
                    {data.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-widest text-ink-secondary">What the owner typed</span>
                  <div className="mt-3 p-4 rounded-xl bg-surface dark:bg-void-950 border border-line dark:border-white/10 font-mono text-sm text-ink leading-relaxed">
                    "{preset.prompt}"
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-2xs font-bold uppercase tracking-widest text-ink-secondary">How Blueprint compiled it</span>
                  {preset.steps.map((step) => (
                    <div key={step.num} className="p-4 rounded-xl bg-surface dark:bg-void-950 border border-line dark:border-white/5 flex gap-4 items-start">
                      <span className="font-mono text-xs font-bold text-accent-text pt-0.5">{step.num}</span>
                      <div>
                        <h4 className="text-sm font-bold text-ink">{step.title}</h4>
                        <p className="text-xs text-ink-muted mt-1 leading-normal">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-ink-muted pt-4 border-t border-line dark:border-white/10">
                  Blueprint cannot post a transaction. It cannot alter the accounting engine. It cannot change historical data. <b className="text-ink">It builds the room; it doesn't touch the safe.</b>
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="p-6 rounded-xl bg-surface dark:bg-void-950 border border-line dark:border-white/10 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="text-base font-bold text-ink">{preset.result.title}</h3>
                      <span className="px-3 py-1 bg-accent-fill/10 text-accent-text text-2xs font-bold uppercase tracking-wider rounded-full border border-accent-line">
                        {preset.result.badge}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-2xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 mb-2">
                          <Check size={14} /> Active Modules
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {preset.result.modules.map((m) => (
                            <div key={m} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-medium text-ink">
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-line dark:border-white/5">
                        <span className="text-2xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-1.5 mb-2">
                          <X size={14} /> Deliberately Omitted
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {preset.result.omitted.map((m) => (
                            <div key={m} className="p-2.5 rounded-lg bg-surface dark:bg-white/[0.02] border border-line dark:border-white/5 text-xs text-ink-muted line-through opacity-70">
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-line dark:border-white/10">
                    <Link href={`/build-workspace?preset=${activePreset}`} className="w-full py-3 bg-accent-fill text-accent-on rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:shadow-lg transition-all">
                      Build this configuration <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section vq-section--alt py-20">
        <div className="vq-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="vq-eyebrow">What's in a Blueprint</span>
            <h2 className="vq-display text-3xl sm:text-4xl font-bold mt-3">Six things, and you can edit all six.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Layers size={20} /></span>
              <h3 className="text-base font-bold text-ink">Modules</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Only the ones your business needs — and an explicit list of the ones it deliberately left off, with reasons. Not greyed out with an upsell badge. Absent.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><FileText size={20} /></span>
              <h3 className="text-base font-bold text-ink">Your vocabulary</h3>
              <p className="text-sm text-ink-muted leading-relaxed">If you call them jobs and not orders, the system says jobs. If your customers are patients, the menu says patients. It is one table, and it is yours to edit.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Users size={20} /></span>
              <h3 className="text-base font-bold text-ink">Roles &amp; approvals</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Who can discount, who can write off stock, what needs a second pair of eyes. Seven roles out of the box, and an approval chain shaped like your actual business.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Scale size={20} /></span>
              <h3 className="text-base font-bold text-ink">Tax &amp; compliance</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Set for how and where you actually sell. Inclusive or exclusive, per-item rates, the QR verification your receipts need.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Database size={20} /></span>
              <h3 className="text-base font-bold text-ink">Reports</h3>
              <p className="text-sm text-ink-muted leading-relaxed">The ones your business is judged by, on the dashboard, not buried five levels into a menu you never open.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-surface dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><Shield size={20} /></span>
              <h3 className="text-base font-bold text-ink">The ledger mapping</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Which accounts each kind of transaction posts to. Editable, and never bypassable — that is the one line the AI is not allowed to cross.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
