import React from 'react';
import { Head } from '@inertiajs/react';

import { vq } from '@/theme/runtime';
/**
 * QrMenuPublic — the page a customer actually sees when they scan the QR
 * code at their table. Public, unauthenticated, read-only, no editing
 * capability whatsoever. Deliberately NOT wrapped in ToolShell/
 * MarketingLayout — this is a standalone mobile-first page, not a tool
 * landing page, and must not carry the tools sidebar/promo rail/site nav
 * that would waste screen space on a phone at a restaurant table.
 */

const CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$',
    PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

export default function QrMenuPublic({ restaurant_name, logo_base64, theme_color = vq.indigo[600], currency = 'USD', categories = [] }) {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    return (
        <>
            <Head>
                <title>{restaurant_name} — Menu</title>
                <meta name="description" content={`View the menu for ${restaurant_name}.`} />
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="min-h-screen bg-slate-50" style={{ '--theme': theme_color }}>
                <header
                    className="px-5 pt-10 pb-8 text-center text-slate-900 dark:text-white"
                    style={{ background: `linear-gradient(135deg, ${theme_color}, ${theme_color}cc)` }}
                >
                    {logo_base64 && (
                        <img src={logo_base64} alt={`${restaurant_name} logo`} className="w-16 h-16 object-contain rounded-full bg-white mx-auto mb-3 p-1.5" />
                    )}
                    <h1 className="text-2xl font-black tracking-tight">{restaurant_name}</h1>
                    <p className="text-xs uppercase tracking-widest font-bold opacity-80 mt-1">Menu</p>
                </header>

                <main className="max-w-lg mx-auto px-4 py-6 pb-16">
                    {categories.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-16">This menu doesn't have any items yet.</p>
                    )}

                    {categories.map((cat, ci) => (
                        <section key={ci} className="mb-8">
                            <h2
                                className="text-lg font-black mb-3 pb-2 border-b-2"
                                style={{ color: theme_color, borderColor: `${theme_color}33` }}
                            >
                                {cat.name}
                            </h2>
                            <div className="space-y-4">
                                {cat.items.map((item, ii) => (
                                    <div key={ii} className="flex items-start justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 text-base leading-snug">{item.name}</p>
                                            {item.description && (
                                                <p className="text-sm text-slate-500 mt-1 leading-snug">{item.description}</p>
                                            )}
                                        </div>
                                        <p className="font-black text-lg shrink-0" style={{ color: theme_color }}>
                                            {symbol}{Number(item.price).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </main>

                <footer className="text-center text-1xs text-slate-500 dark:text-slate-400 pb-8 px-4">
                    Menu powered by <a href="/tools/qr-menu-generator" className="underline font-semibold">VenQore</a> — free QR menus for restaurants.
                </footer>
            </div>
        </>
    );
}
