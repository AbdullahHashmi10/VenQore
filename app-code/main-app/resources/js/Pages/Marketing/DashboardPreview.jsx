import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, LayoutDashboard, TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react';
import MarketingLayout from './Shared/MarketingLayout';

export default function DashboardPreview() {
  return (
    <MarketingLayout
      title="The Dashboard — 58 Verified Readings in Real Time | VenQore"
      description="Explore the VenQore real-time dashboard: 58 readings calculated straight from Core Ledger and Reckoner."
    >
      <Head>
        <link rel="canonical" href="https://venqore.com/dashboard-preview" />
      </Head>

      <section className="vq-section pt-32 pb-16">
        <div className="vq-container relative">
          <div className="max-w-3xl">
            <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Dashboard</span>
            <h1 className="vq-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">
              58 readings. <em className="vq-italic">Self-assembling</em>.
            </h1>
            <p className="vq-lede text-lg sm:text-xl text-ink-muted mt-6 leading-relaxed">
              Every card on the dashboard connects to The Reckoner. You can add, rearrange, and resize cards to fit how you monitor cash, margin, and stock.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">
                Build your dashboard <span className="vq-btn__arrow"><ArrowRight size={16} /></span>
              </Link>
              <Link className="vq-btn vq-btn--secondary vq-btn--lg" href="/reckoner">
                Readings catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="vq-section pt-0 pb-20">
        <div className="vq-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-2">
              <span className="text-2xs font-bold uppercase tracking-widest text-ink-secondary">Sales Today</span>
              <span className="text-3xl font-bold text-ink block font-mono">Rs 184,200</span>
              <span className="text-xs text-emerald-500 font-medium">▲ +8.2% vs last week</span>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-2">
              <span className="text-2xs font-bold uppercase tracking-widest text-ink-secondary">Gross Margin</span>
              <span className="text-3xl font-bold text-ink block font-mono">31.4%</span>
              <span className="text-xs text-ink-muted font-medium">Weighted across 142 items</span>
            </div>
            <div className="vq-card p-6 rounded-2xl bg-sunken dark:bg-void-900 border border-line dark:border-white/10 space-y-2">
              <span className="text-2xs font-bold uppercase tracking-widest text-ink-secondary">Expiring ≤ 30 Days</span>
              <span className="text-3xl font-bold text-amber-500 block font-mono">27 Batches</span>
              <span className="text-xs text-amber-500 font-medium">FEFO discount queue active</span>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
