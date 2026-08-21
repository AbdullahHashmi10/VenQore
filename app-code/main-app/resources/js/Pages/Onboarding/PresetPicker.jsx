import React, { useState } from 'react';
import { LayoutGrid, ArrowRight, ArrowLeft, Check, Coffee, UserCheck, Wrench, Utensils, Store, Building2, Package, Sparkles, ChevronDown, ShieldCheck } from 'lucide-react';

const PRESET_ICONS = {
    solo_cafe: Coffee,
    freelancer: UserCheck,
    repair_workshop: Wrench,
    restaurant: Utensils,
    retail_grocery: Store,
    wholesaler: Building2,
};

export default function PresetPicker({ presets = {}, onSelectPreset, onNext, onBack }) {
    const [selectedKey, setSelectedKey] = useState('solo_cafe');
    const [expandedKey, setExpandedKey] = useState('solo_cafe');

    const presetList = Object.keys(presets).length > 0 ? presets : {
        solo_cafe: {
            label: 'Solo Cafe / Bakery',
            description: 'For coffee shops, bakeries, food stalls & counter checkouts.',
            modules: ['products', 'pos', 'inventory', 'cookbook', 'expenses', 'reports'],
            opens: 'Coffee shops, bakeries, dhabas, food stalls',
            terms: 'Product, Category, Order, Recipe',
        },
        freelancer: {
            label: 'Freelancer / Agency',
            description: 'Service catalog, professional quotes & invoice management.',
            modules: ['services', 'invoicing', 'quotations', 'expenses', 'reports'],
            opens: 'Designers, developers, consultants, agencies',
            terms: 'Service, Quote, Invoice, Client',
        },
        repair_workshop: {
            label: 'Repair Workshop',
            description: 'Job queue management, spare parts tracking & billing.',
            modules: ['services', 'products', 'park_recall', 'customers', 'invoicing', 'inventory'],
            opens: 'Mobile repair, auto mechanics, electronics service',
            terms: 'Job Order, Spare Part, Customer, Ticket',
        },
        restaurant: {
            label: 'Dine-In Restaurant',
            description: 'Table service, floor plans, kitchen KDS & POS billing.',
            modules: ['products', 'pos', 'park_recall', 'table_service', 'cookbook', 'inventory', 'expenses'],
            opens: 'Restaurants, cafés, diners, bistros',
            terms: 'Table, KDS Ticket, Dish, Order',
        },
        retail_grocery: {
            label: 'Retail / Grocery Store',
            description: 'Fast barcode checkout, stock takes, khata & credit.',
            modules: ['products', 'pos', 'inventory', 'purchases', 'suppliers', 'customers', 'khata_credit', 'barcodes_labels'],
            opens: 'Supermarkets, clothing shops, electronics',
            terms: 'Barcode, SKU, Khata, Supplier',
        },
        wholesaler: {
            label: 'Wholesaler / Distributor',
            description: 'Bulk price tiers, B2B quotes & supplier purchase orders.',
            modules: ['products', 'inventory', 'quotations', 'sales_orders', 'purchases', 'suppliers', 'purchase_orders', 'khata_credit', 'pricing_tiers'],
            opens: 'Wholesale trade, distributors, supply houses',
            terms: 'Price Tier, B2B Quote, Purchase Order, Ledger',
        },
    };

    const handleConfirm = (key) => {
        const item = presetList[key];
        onSelectPreset(key, item?.modules || ['products', 'pos', 'inventory', 'expenses', 'reports'], item);
        onNext();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn relative z-10">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-interactive-hover border border-neutral-800 rounded-xl text-ink-muted hover:text-white text-xs font-semibold transition-all"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Mode Choice</span>
                </button>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-xs font-semibold backdrop-blur-md">
                    <LayoutGrid size={14} />
                    <span>15 Verified Business Blueprints</span>
                </div>
            </div>

            {/* Header Title */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Select Your Business Template
                </h2>
                <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                    Choose a pre-configured architecture for your industry. You can add or remove any module later with zero data loss.
                </p>
            </div>

            {/* Watermelon-Style Split Accordion Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(presetList).map(([key, item]) => {
                    const IconComp = PRESET_ICONS[key] || Package;
                    const isSelected = selectedKey === key;
                    const isExpanded = expandedKey === key;

                    return (
                        <div
                            key={key}
                            onClick={() => {
                                setSelectedKey(key);
                                setExpandedKey(isExpanded ? null : key);
                            }}
                            className={`group cursor-pointer p-6 rounded-2xl border transition-all duration-slow relative overflow-hidden flex flex-col justify-between ${
                                isSelected
                                    ? 'bg-neutral-900/90 border-purple-500 shadow-2xl  ring-1 ring-purple-500'
                                    : 'bg-neutral-900/60 hover:bg-interactive-hover border-neutral-800/80 hover:border-line-strong'
                            }`}
                        >
                            {/* Accent Glow */}
                            {isSelected && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                            )}

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={`p-3 rounded-2xl border transition-colors ${
                                        isSelected
                                            ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                                            : 'bg-neutral-800 border-neutral-700 text-ink-muted group-hover:text-white'
                                    }`}>
                                        <IconComp size={26} />
                                    </div>

                                    {isSelected ? (
                                        <span className="px-3 py-1 bg-purple-500 text-white text-2xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                                            <Check size={12} /> Selected
                                        </span>
                                    ) : (
                                        <span className="text-2xs text-ink-muted uppercase font-mono tracking-wider">
                                            {(item.modules || []).length} Modules
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                        {item.label}
                                    </h3>
                                    <p className="text-ink-muted text-xs leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Included Modules Badges */}
                                <div className="pt-2 flex flex-wrap gap-1.5">
                                    {(item.modules || []).map((mod) => (
                                        <span
                                            key={mod}
                                            className="px-2 py-0.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-2xs text-neutral-300 font-mono"
                                        >
                                            +{mod.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>

                                {/* Split Accordion Detail Drawer */}
                                {isExpanded && (
                                    <div className="pt-3 mt-3 border-t border-white/5 space-y-2 animate-fadeIn text-xs">
                                        <div className="text-ink-muted">
                                            <strong className="text-neutral-300">Opens for:</strong> {item.opens}
                                        </div>
                                        {item.terms && (
                                            <div className="text-ink-muted">
                                                <strong className="text-purple-300 font-mono">Adapts Terms:</strong> {item.terms}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirm(key);
                                }}
                                className={`mt-6 w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-500 hover:to-brand-500 text-white shadow-xl '
                                        : 'bg-neutral-800 hover:bg-interactive-hover text-neutral-200'
                                }`}
                            >
                                <span>Use This Template</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
