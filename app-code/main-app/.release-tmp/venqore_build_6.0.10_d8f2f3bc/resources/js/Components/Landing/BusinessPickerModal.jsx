/**
 * BusinessPickerModal — 85+ business presets in an ultra-clean bouncy accordion.
 *
 * Sorted A to Z for quick discovery, with distinct context-specific icons for each trade,
 * real-time search, sector tabs, pre-wired module badges, and compact vertical rhythm.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity,
    Armchair,
    ArrowRight,
    Bath,
    BatteryCharging,
    Bike,
    BookOpen,
    Boxes,
    Briefcase,
    Building2,
    Cake,
    Calculator,
    Camera,
    Car,
    Cat,
    Check,
    ChefHat,
    ChevronDown,
    Clock,
    Coffee,
    Cog,
    Compass,
    Cpu,
    Croissant,
    Disc,
    Droplets,
    Dumbbell,
    Factory,
    FileSpreadsheet,
    Fish,
    Flame,
    FlaskConical,
    Flower2,
    Footprints,
    Gamepad2,
    Gem,
    Gift,
    Glasses,
    Globe,
    GraduationCap,
    Hammer,
    Heart,
    HeartPulse,
    IceCream,
    Laptop,
    Layers,
    Lightbulb,
    Megaphone,
    Music,
    Package,
    PackageCheck,
    Paintbrush,
    Palette,
    PartyPopper,
    Pill,
    Pizza,
    Printer,
    Scale,
    Scissors,
    Search,
    ShieldAlert,
    ShieldCheck,
    Shirt,
    ShoppingBag,
    ShoppingBasket,
    ShoppingCart,
    Smartphone,
    Sparkles,
    Stethoscope,
    Store,
    Syringe,
    TrendingUp,
    Trophy,
    Truck,
    Tv,
    Utensils,
    UtensilsCrossed,
    Wheat,
    Wind,
    Wine,
    Wrench,
    X,
    Zap,
} from 'lucide-react';
import catalogue from '@/Data/businessTypes.json';
import { SECTORS } from '@/Components/Site/sectorCatalog';

// Precise icon map for every single business type
const TYPE_ICON_MAP = {
    // Services
    phone_repair: Smartphone,
    computer_repair: Laptop,
    auto_repair: Car,
    appliance_repair: Wrench,
    bike_service: Bike,
    salon_barber: Scissors,
    nail_spa: Sparkles,
    pet_care: Stethoscope,
    freelance_creative: Palette,
    marketing_agency: Megaphone,
    consultant: TrendingUp,
    accounting_firm: Calculator,
    law_firm: Scale,
    architect_interior: Compass,
    photo_video: Camera,
    electrician: Zap,
    plumber: Droplets,
    carpenter: Hammer,
    painter_renovation: Paintbrush,
    cleaning: Sparkles,
    hvac: Wind,
    pest_control: ShieldAlert,
    equipment_rental: Clock,
    event_hire: PartyPopper,
    gym_fitness: Dumbbell,
    tuition_academy: GraduationCap,

    // Retail
    grocery: ShoppingBasket,
    supermarket: ShoppingCart,
    pharmacy: Pill,
    surgical_supplies: Syringe,
    mobile_retail: Smartphone,
    electronics: Tv,
    fashion: Shirt,
    footwear: Footprints,
    jewellery: Gem,
    cosmetics: Heart,
    hardware: Wrench,
    sanitary_supply: Bath,
    building_materials: Building2,
    furniture_store: Armchair,
    books_stationery: BookOpen,
    toys: Gamepad2,
    pet_supply: Cat,
    auto_parts: Disc,
    tyre_battery: BatteryCharging,
    optical: Glasses,
    gift_flower: Flower2,
    vape_tobacco: Flame,
    sports: Trophy,
    electrical_lighting: Lightbulb,
    kitchenware: Utensils,

    // Food & Hospitality
    restaurant: UtensilsCrossed,
    cafe: Coffee,
    tea_shop: Coffee,
    bakery: Croissant,
    fast_food: Pizza,
    dessert: IceCream,
    juice_bar: GlassWaterFallback,
    food_truck: Truck,
    sweets: Cake,
    catering: ChefHat,
    cloud_kitchen: Flame,
    pub_lounge: Wine,

    // Wholesale
    fmcg_wholesale: Boxes,
    grain_commodities: Wheat,
    fabric_stockist: Layers,
    hardware_wholesale: PackageCheck,
    electrical_wholesale: Zap,
    pharma_wholesale: Pill,
    tech_distributor: Cpu,
    auto_parts_distributor: Truck,
    packaging: Package,
    office_supplies: FileSpreadsheet,
    chemicals: FlaskConical,
    import_export: Globe,

    // Manufacturing
    commercial_bakery: Factory,
    tailoring: Scissors,
    furniture_maker: Hammer,
    coffee_spice: Coffee,
    signage_print: Printer,
    soap_candle: Sparkles,
    kit_assembly: Boxes,
    aluminium_glass: Layers,
    leather_goods: Briefcase,
    custom_merch: Gift,
};

function GlassWaterFallback(props) {
    return <Wine {...props} />;
}

function getBusinessIcon(key = '', sector = '') {
    if (TYPE_ICON_MAP[key]) return TYPE_ICON_MAP[key];
    const k = key.toLowerCase();
    if (k.includes('pharm') || k.includes('medic') || k.includes('clinic')) return Pill;
    if (k.includes('repair') || k.includes('mechanic')) return Wrench;
    if (k.includes('phone') || k.includes('gadget')) return Smartphone;
    if (k.includes('computer') || k.includes('laptop')) return Laptop;
    if (k.includes('auto') || k.includes('car')) return Car;
    if (k.includes('salon') || k.includes('barber')) return Scissors;
    if (k.includes('restaurant') || k.includes('dine')) return UtensilsCrossed;
    if (k.includes('cafe') || k.includes('coffee')) return Coffee;
    if (k.includes('bakery') || k.includes('cake')) return Croissant;
    if (k.includes('fashion') || k.includes('boutique')) return Shirt;
    if (k.includes('wholesale') || k.includes('distribut')) return Truck;
    if (k.includes('mfg') || k.includes('manufactur') || k.includes('factory')) return Factory;
    
    if (sector === 'services') return Wrench;
    if (sector === 'food') return UtensilsCrossed;
    if (sector === 'wholesale') return Truck;
    if (sector === 'manufacturing') return Factory;
    return Store;
}

// Generate rich explanation & pre-activated module badges
function getPresetMeta(item) {
    const { sector, name, note } = item;
    let explanation = '';
    let modules = [];
    let prompt = '';

    if (sector === 'retail') {
        modules = ['Barcode POS Till', 'Live Inventory', 'Cash Reconcile', 'Customer Khata', 'EOD Z-Report'];
        if (note) {
            explanation = `Pre-configured for retail with ${note}. Features instant barcode lookups, multi-unit pricing, automated reorder alerts, and daily register balancing.`;
            prompt = `I run a ${name} with ${note}. I need automated barcode POS checkout, inventory relief, and supplier accounting.`;
        } else {
            explanation = `Pre-configured with high-speed barcode checkout, automated inventory lot relief, customer khata credit tracking, cash-drawer reconciliation, and daily sales analytics.`;
            prompt = `I run a ${name}. I need a fast counter POS, real-time stock levels, supplier management, and automated sales reporting.`;
        }
    } else if (sector === 'services') {
        modules = ['Job Cards', 'Service Calendar', 'Quotations & Invoicing', 'Technician Dispatch', 'Khata Ledger'];
        if (note) {
            explanation = `Configured for service & repair workflows with ${note}. Converts customer requests into technician job cards and itemised invoices with parts auto-deducted from stock.`;
            prompt = `I run a ${name} with ${note}. I need job card tracking, technician assignments, quotations, and customer invoicing.`;
        } else {
            explanation = `Configured for professional services with instant quotations, service job tracking, technician time logs, customer history, and automated milestone invoicing.`;
            prompt = `I run a ${name}. I need service job scheduling, customer invoices, technician time logs, and automated profit & loss tracking.`;
        }
    } else if (sector === 'food') {
        modules = ['Table Floor Map', 'KOT Kitchen Tickets', 'Recipe Costing', 'Park & Recall', 'Shift Reconciliation'];
        if (note) {
            explanation = `Optimized for food service with ${note}. Links table or walk-in orders directly to kitchen tickets while automatically deducting ingredients via recipe bills of materials.`;
            prompt = `I run a ${name} with ${note}. I need table/counter ordering, kitchen ticket printing, recipe costing, and ingredient stock deduction.`;
        } else {
            explanation = `Pre-wired for hospitality with table management, park-and-recall orders, kitchen ticket printing, ingredient recipe deduction, and real-time food cost accounting.`;
            prompt = `I run a ${name}. I need fast order taking, table service, recipe ingredient deduction, and daily cash-up reports.`;
        }
    } else if (sector === 'wholesale') {
        modules = ['Tiered Price Lists', 'B2B Sales Orders', 'Multi-Warehouse', 'Khata Credit Ledger', 'Tax Invoices'];
        if (note) {
            explanation = `Engineered for high-volume B2B distribution with ${note}. Supports customer price tiers, bulk sales orders, dispatch challans, credit limit enforcement, and statements.`;
            prompt = `I run a ${name} with ${note}. I need tiered customer pricing, bulk sales orders, khata credit accounts, and multi-location inventory.`;
        } else {
            explanation = `Set up with tiered wholesale pricing, B2B sales orders, multi-warehouse stock allocations, credit limits, and automated customer Khata statements.`;
            prompt = `I run a ${name}. I need wholesale B2B pricing, purchase order management, credit limits, and automated ledger statements.`;
        }
    } else if (sector === 'manufacturing') {
        modules = ['BOM & Recipes', 'Production Batches', 'Landed Cost', 'Raw Material FIFO', 'Finished Goods Intake'];
        if (note) {
            explanation = `Assembled for light production with ${note}. Automatically tracks raw material consumption, labour overheads, landed cost allocation, and finished goods intake.`;
            prompt = `I run a ${name} with ${note}. I need bill of materials (BOM), production runs, raw material consumption, and landed cost tracking.`;
        } else {
            explanation = `Pre-configured with bill of materials (BOM), production batch tracking, landed cost calculation, raw material FIFO relief, and finished goods intake.`;
            prompt = `I run a ${name}. I need BOM recipes, production batch scheduling, material consumption tracking, and finished goods accounting.`;
        }
    }

    if (note) {
        const lower = note.toLowerCase();
        if (lower.includes('expiry') || lower.includes('batch')) modules.unshift('Batch & Expiry');
        if (lower.includes('matrix') || lower.includes('variant')) modules.unshift('Variant Matrix');
        if (lower.includes('imei')) modules.unshift('IMEI Intake');
        if (lower.includes('warranty')) modules.unshift('Warranty Tracking');
        if (lower.includes('sync') || lower.includes('woocommerce') || lower.includes('amazon')) modules.unshift('E-Commerce Sync');
    }

    return {
        explanation,
        modules: Array.from(new Set(modules)).slice(0, 5),
        promptText: prompt,
    };
}

export default function BusinessPickerModal({ onPick, onClose }) {
    const [query, setQuery] = useState('');
    const [activeSector, setActiveSector] = useState('all');
    const [expandedKey, setExpandedKey] = useState(null);
    const searchInputRef = useRef(null);
    const cardRef = useRef(null);

    // Prepare all enriched business types and sort A to Z
    const allTypes = useMemo(() => {
        const types = (catalogue.types || []).map((t) => {
            const sectorObj = SECTORS.find((s) => s.key === t.sector);
            const meta = getPresetMeta(t);
            return {
                ...t,
                sectorName: sectorObj?.short || t.sector,
                Icon: getBusinessIcon(t.key, t.sector),
                ...meta,
            };
        });

        // Sort alphabetically from A to Z
        return types.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }, []);

    // Sector counts
    const sectorCounts = useMemo(() => {
        const counts = { all: allTypes.length };
        SECTORS.forEach((s) => {
            counts[s.key] = allTypes.filter((t) => t.sector === s.key).length;
        });
        return counts;
    }, [allTypes]);

    // Filtered types
    const filteredTypes = useMemo(() => {
        const q = query.trim().toLowerCase();
        return allTypes.filter((t) => {
            const matchesSector = activeSector === 'all' || t.sector === activeSector;
            if (!matchesSector) return false;
            if (!q) return true;

            const nameMatch = t.name.toLowerCase().includes(q);
            const noteMatch = (t.note || '').toLowerCase().includes(q);
            const sectorMatch = t.sectorName.toLowerCase().includes(q);
            const moduleMatch = t.modules.some((m) => m.toLowerCase().includes(q));
            return nameMatch || noteMatch || sectorMatch || moduleMatch;
        });
    }, [allTypes, activeSector, query]);

    // Keyboard handlers
    useEffect(() => {
        searchInputRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Body scroll lock
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        const prevHtml = document.documentElement.style.overflowY;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
            document.documentElement.style.overflowY = prevHtml;
        };
    }, []);

    const handleSelect = (item) => {
        onPick({
            label: item.name,
            desc: item.note || item.explanation,
            text: item.promptText,
            key: item.key,
            sector: item.sector,
        });
    };

    const toggleExpand = (key) => {
        setExpandedKey((curr) => (curr === key ? null : key));
    };

    const modalContent = (
        <div className="vq-bp-overlay" role="dialog" aria-modal="true" aria-labelledby="vq-bp-title">
            <div className="vq-bp-scrim" onClick={onClose} />

            <div ref={cardRef} className="vq-bp-card" tabIndex={-1}>
                {/* ── Modal Header ── */}
                <div className="vq-bp-header">
                    <div className="vq-bp-header__meta">
                        <div className="vq-bp-badge">
                            <Sparkles size={12} className="vq-bp-badge__icon" />
                            <span>85+ Curated Business Presets (A–Z)</span>
                        </div>
                        <h2 id="vq-bp-title" className="vq-bp-title">Choose Your Business Preset</h2>
                        <p className="vq-bp-sub">
                            Pre-configured modules, POS tills, and automated accounting tailored to your exact industry.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="vq-bp-close"
                        onClick={onClose}
                        aria-label="Close modal"
                        title="Close (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Search Bar & Filter Tabs ── */}
                <div className="vq-bp-controls">
                    <div className="vq-bp-search-wrap">
                        <Search size={16} className="vq-bp-search-icon" />
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, workflow or keyword (e.g. pharmacy, bakery, tailor, wholesale)..."
                            className="vq-bp-search-input"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="vq-bp-search-clear"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <span className="vq-bp-search-count">
                            {filteredTypes.length} {filteredTypes.length === 1 ? 'preset' : 'presets'}
                        </span>
                    </div>

                    <div className="vq-bp-tabs" role="tablist" aria-label="Filter by sector">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeSector === 'all'}
                            className={`vq-bp-tab${activeSector === 'all' ? ' is-active' : ''}`}
                            onClick={() => setActiveSector('all')}
                        >
                            <span>All (A–Z)</span>
                            <span className="vq-bp-tab__count">{sectorCounts.all}</span>
                        </button>
                        {SECTORS.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                role="tab"
                                aria-selected={activeSector === s.key}
                                className={`vq-bp-tab${activeSector === s.key ? ' is-active' : ''}`}
                                onClick={() => setActiveSector(s.key)}
                            >
                                <span>{s.short}</span>
                                <span className="vq-bp-tab__count">{sectorCounts[s.key] || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Bouncy Accordion List ── */}
                <div className="vq-bp-scroll-pane">
                    {filteredTypes.length === 0 ? (
                        <div className="vq-bp-empty">
                            <div className="vq-bp-empty__icon">
                                <Building2 size={28} />
                            </div>
                            <h3>No matching presets found</h3>
                            <p>Try searching with another keyword or describe your custom business trade directly.</p>
                            <button
                                type="button"
                                className="vq-btn vq-btn--secondary"
                                onClick={() => {
                                    setQuery('');
                                    setActiveSector('all');
                                }}
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <div className="vq-bp-list" role="list">
                            {filteredTypes.map((item) => {
                                const isExpanded = expandedKey === item.key;
                                const { Icon } = item;
                                return (
                                    <div
                                        key={item.key}
                                        className={`vq-bp-item${isExpanded ? ' is-expanded' : ''}`}
                                        role="listitem"
                                    >
                                        {/* Trigger Header */}
                                        <button
                                            type="button"
                                            className="vq-bp-trigger"
                                            onClick={() => toggleExpand(item.key)}
                                            onDoubleClick={() => handleSelect(item)}
                                            aria-expanded={isExpanded}
                                        >
                                            <div className="vq-bp-trigger__left">
                                                <div className="vq-bp-item__icon">
                                                    <Icon size={18} />
                                                </div>
                                                <div className="vq-bp-trigger__info">
                                                    <div className="vq-bp-trigger__title-row">
                                                        <span className="vq-bp-item__name">{item.name}</span>
                                                        <span className="vq-bp-item__sector-tag">{item.sectorName}</span>
                                                    </div>
                                                    {item.note && !isExpanded && (
                                                        <span className="vq-bp-item__preview-note">{item.note}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="vq-bp-trigger__right">
                                                <span className={`vq-bp-chevron${isExpanded ? ' is-open' : ''}`}>
                                                    <ChevronDown size={16} />
                                                </span>
                                            </div>
                                        </button>

                                        {/* Bouncy Expandable Content Container */}
                                        <div className="vq-bp-content">
                                            <div className="vq-bp-content__inner">
                                                {/* Explanation Callout */}
                                                <div className="vq-bp-explanation">
                                                    <div className="vq-bp-explanation__label">
                                                        <ShieldCheck size={14} />
                                                        <span>Preset Workflows:</span>
                                                    </div>
                                                    <p className="vq-bp-explanation__text">{item.explanation}</p>
                                                </div>

                                                {/* Pre-activated Modules */}
                                                <div className="vq-bp-modules">
                                                    <div className="vq-bp-modules__tags">
                                                        {item.modules.map((mod) => (
                                                            <span key={mod} className="vq-bp-mod-chip">
                                                                <Check size={12} className="text-teal-600 dark:text-teal-400" />
                                                                {mod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* CTA Action Row */}
                                                <div className="vq-bp-item__actions">
                                                    <button
                                                        type="button"
                                                        className="vq-bp-select-btn"
                                                        onClick={() => handleSelect(item)}
                                                    >
                                                        <span>Use This Preset</span>
                                                        <ArrowRight size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Modal Footer ── */}
                <div className="vq-bp-footer">
                    <p className="vq-bp-footer__hint">
                        Click to view details · Double-click to load preset immediately
                    </p>
                    <button type="button" className="vq-btn vq-btn--ghost" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }
    return modalContent;
}

