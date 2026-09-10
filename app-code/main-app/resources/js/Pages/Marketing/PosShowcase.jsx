import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ShoppingCart, WifiOff, ScanBarcode, CreditCard, Receipt } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function PosShowcase() {
  return (
    <MarketingLayout
      title="The Register — Point of Sale You Compose Yourself | VenQore"
      description="Offline-first, high-speed point of sale: quick touch grid, barcode scanning, cashier shifts, and offline sync."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/pos" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The Register</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              A till you <em className="vq-italic">compose</em> yourself.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              Touch screen, barcode gun, or keyboard quick-keys. The register works offline during internet drops and syncs seamlessly the moment you reconnect.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Start building <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/tools/receipt-generator">
                Try receipt generator
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0 pb-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><WifiOff size={20} /></span>
              <h3 className="text-base font-bold text-ink">Offline-First Engine</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">Never stop ringing sales when Wi-Fi goes down. IndexedDB stores transactions locally until network is restored.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><ScanBarcode size={20} /></span>
              <h3 className="text-base font-bold text-ink">Sub-50ms Barcode Lookup</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">Rapid item addition with automatic batch assignment, variant selection, and price tier resolution.</p>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-3">
              <span className="p-3 bg-accent-fill/10 text-accent-text rounded-xl inline-block"><CreditCard size={20} /></span>
              <h3 className="text-base font-bold text-ink">Split Tender &amp; Khata</h3>
              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">Split payments across cash, card, and credit account in a single transaction with instant balance updates.</p>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
