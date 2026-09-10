import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck, Scale, Lock, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function Ledger() {
  const CHECKS = [
    { title: 'Debits equal Credits', desc: 'Sum of debits must equal sum of credits on every journal batch.', status: 'Verified' },
    { title: 'Immutable Historical Log', desc: 'No transaction record is ever deleted or mutated in-place.', status: 'Verified' },
    { title: 'Explicit Reversal Invariants', desc: 'Reversals generate counter-entries; ledger stays auditable.', status: 'Verified' },
    { title: 'Multi-Tenant Isolation', desc: 'Tenant ID is enforced globally across all 116 scoped models.', status: 'Verified' },
    { title: 'FIFO Cost Allocation', desc: 'Inventory depletion strictly pairs with genuine purchase layers.', status: 'Verified' },
    { title: 'Foreign Currency Integrity', desc: 'Exchange rates stamp base-currency equivalency at post time.', status: 'Verified' }
  ];

  return (
    <MarketingLayout
      title="Core Ledger — The Engine of Financial Truth | VenQore"
      description="VenQore's double-entry accounting engine: single source of truth for all sales, purchases, stock moves, and party accounts."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/ledger" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Core Ledger</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              One engine. Every <em className="vq-italic">number</em>.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              VenQore's Core Ledger is a strict double-entry engine. POS checkouts, purchase orders, customer khata, stock write-offs, and multi-channel payouts all post through the exact same financial pipeline.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/security">
                View security &amp; isolation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0">
        <div className="vq-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHECKS.map((c) => (
              <div key={c.title} className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={20} /></span>
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{c.status}</span>
                </div>
                <h3 className="text-base font-bold text-ink">{c.title}</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
