import React, { useState, useRef } from 'react';
import { Download, QrCode as QrIcon, Plus, Trash2, Palette, Layout, Utensils, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

const PRESET_OPTIONS = [
    { value: 'tent_4x6', label: 'Table Tent (4" x 6")', hint: 'Standard folded/standing tent card' },
    { value: 'standee_5x7', label: 'Table Standee (5" x 7")', hint: 'Acrylic frame / large display' },
    { value: 'sticker_3x3', label: 'Table Sticker (3" x 3")', hint: 'Compact table corner decal' },
];

const THEME_OPTIONS = [
    { value: 'classic_dark', label: 'Classic Dark Slate', hint: 'Dark navy background with gold accents' },
    { value: 'modern_light', label: 'Modern Light Clean', hint: 'Crisp white card with blue accents' },
    { value: 'warm_amber', label: 'Warm Amber / Café', hint: 'Cozy cream & warm brown' },
    { value: 'emerald_bistro', label: 'Emerald Bistro', hint: 'Deep green card with fresh mint accents' },
];

const FAQS = [
    { q: 'Is the QR Menu Generator free to use?', a: 'Yes! You can generate, customize, and download print-ready table tent cards and QR menu graphics completely free with no watermark.' },
    { q: 'What card layout sizes are available?', a: 'We support Table Tent (4"x6"), Table Standee (5"x7"), and compact Table Sticker (3"x3") formats suitable for acrylic stands, table tents, and table decals.' },
    { q: 'Can I add a logo to the QR Code?', a: 'Yes. Upload your logo image and it will be embedded right in the center of the QR code using high error correction to ensure perfect scannability.' },
    { q: 'Can I include sample menu items on the printed card?', a: 'Yes. You can add featured items or popular dishes with prices, which will be styled cleanly below the QR code on 4x6" and 5x7" layouts.' },
    { q: 'How do customers view the menu?', a: 'Customers simply point their smartphone camera at the printed QR code on their table to automatically open your online menu or PDF link.' },
];

const inputBase = 'w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-neutral-900/10 dark:border-white/10 text-ink placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400/60 transition-colors';
const labelBase = 'block text-xs font-bold uppercase tracking-widest text-ink-muted mb-2';

export default function QrMenuTool({ presets = {}, themes = {}, supportsRaster = true, supportsLogo = true, toolGroups = [] }) {
    const [restaurantName, setRestaurantName] = useState('The Artisan Bistro');
    const [tagline, setTagline] = useState('Scan for Digital Menu & Daily Specials');
    const [menuUrl, setMenuUrl] = useState('https://venqore.com/menu');
    const [tableNumber, setTableNumber] = useState('12');
    const [instructionText, setInstructionText] = useState('Point your camera at the QR code to view menu');
    const [preset, setPreset] = useState('tent_4x6');
    const [theme, setTheme] = useState('classic_dark');
    const [customFg, setCustomFg] = useState('#000000');
    const [customBg, setCustomBg] = useState('#FFFFFF');
    const [useCustomColors, setUseCustomColors] = useState(false);
    const [logo, setLogo] = useState(null);
    const logoInputRef = useRef(null);

    const [menuItems, setMenuItems] = useState([
        { name: 'Truffle Mushroom Burger', price: '$16.50', description: 'Angus beef patty, black truffle aioli, aged cheddar' },
        { name: 'Artisan Wood-fired Pizza', price: '$18.00', description: 'San Marzano tomatoes, fresh mozzarella, basil' },
    ]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result);
        reader.readAsDataURL(file);
    };

    const addMenuItem = () => {
        setMenuItems([...menuItems, { name: '', price: '', description: '' }]);
    };

    const updateMenuItem = (index, key, val) => {
        const updated = [...menuItems];
        updated[index][key] = val;
        setMenuItems(updated);
    };

    const removeMenuItem = (index) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const handleDownload = () => {
        if (!restaurantName.trim()) {
            setErrors(['Please enter a Restaurant or Café Name.']);
            return;
        }
        if (!menuUrl.trim()) {
            setErrors(['Please enter a Menu URL / Website Link.']);
            return;
        }

        setErrors([]);
        setLoading(true);

        const payload = {
            restaurant_name: restaurantName,
            tagline,
            menu_url: menuUrl,
            table_number: tableNumber,
            instruction_text: instructionText,
            preset,
            theme,
            custom_fg: useCustomColors ? customFg : null,
            custom_bg: useCustomColors ? customBg : null,
            logo: logo || null,
            menu_items: menuItems.filter((item) => item.name.trim() !== ''),
        };

        fetch(route('tools.qr-menu.render'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/pdf',
                'X-CSRF-TOKEN': csrf(),
            },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}));
                    setErrors(json.errors || ['Failed to generate PDF. Please check your inputs.']);
                    return;
                }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `qr-menu-${restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => setErrors(['Network error occurred while generating PDF.']))
            .finally(() => setLoading(false));
    };

    // Current theme preview colors
    const activeTheme = themes[theme] || {
        bg_color: 'rgb(var(--vq-slate-800))',
        card_bg: '#0f172a',
        text_color: '#ffffff',
        accent_color: 'rgb(var(--vq-amber-500))',
    };

    return (
        <ToolShell
            title="Free QR Menu & Table Card Generator — Restaurant & Café | VenQore"
            metaDescription="Create printable QR code menu cards, table tents (4x6, 5x7) & stickers (3x3). Customize colors, logo & menu items. Free PDF download, no watermark."
            eyebrow="Free Tool"
            h1="QR Menu & Table Tent Generator"
            answer="Design and print restaurant QR code menus, table tent cards, acrylic standee inserts, and table sticker decals in minutes. Enter your menu link, customize themes and logo, list optional featured dishes, and download a print-ready PDF."
            faqs={FAQS}
            toolGroups={toolGroups}
            currentSlug="qr-menu-generator"
            cta={{
                headline: 'Turn table scans into live POS orders & inventory sync.',
                subtext: 'VenQore POS empowers restaurants with QR table ordering, kitchen display systems, inventory tracking, and double-entry accounting.',
            }}
            related={[
                { label: 'QR Code Generator', href: '/tools/qr-code-generator' },
                { label: 'Recipe Costing Calculator', href: '/tools/food-cost-calculator' },
                { label: 'Price Tag Generator', href: '/tools/price-tag-generator' },
            ]}
        >
            <div className="rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10 p-5 sm:p-7">
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Controls Column */}
                    <div className="lg:col-span-7 space-y-6 min-w-0">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                                <Utensils size={16} className="text-amber-500" /> Restaurant & Menu Details
                            </h3>
                            <div>
                                <label className={labelBase}>Restaurant / Café Name *</label>
                                <input
                                    type="text"
                                    className={inputBase}
                                    value={restaurantName}
                                    onChange={(e) => setRestaurantName(e.target.value)}
                                    placeholder="e.g. The Artisan Bistro"
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Menu URL / Digital Link *</label>
                                <input
                                    type="text"
                                    className={inputBase}
                                    value={menuUrl}
                                    onChange={(e) => setMenuUrl(e.target.value)}
                                    placeholder="e.g. https://myrestaurant.com/menu"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelBase}>Tagline / Header</label>
                                    <input
                                        type="text"
                                        className={inputBase}
                                        value={tagline}
                                        onChange={(e) => setTagline(e.target.value)}
                                        placeholder="e.g. Scan for Digital Menu"
                                    />
                                </div>
                                <div>
                                    <label className={labelBase}>Table Number (Optional)</label>
                                    <input
                                        type="text"
                                        className={inputBase}
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        placeholder="e.g. 12 or A-4"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelBase}>Instruction Text</label>
                                <input
                                    type="text"
                                    className={inputBase}
                                    value={instructionText}
                                    onChange={(e) => setInstructionText(e.target.value)}
                                    placeholder="e.g. Point your camera at the QR code to open menu"
                                />
                            </div>
                        </div>

                        {/* Layout & Style */}
                        <div className="space-y-4 pt-2 border-t border-line dark:border-white/10">
                            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                                <Layout size={16} className="text-brand-500" /> Layout & Theme Presets
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelBase}>Card Layout Preset</label>
                                    <Select value={preset} onChange={setPreset} options={PRESET_OPTIONS} />
                                </div>
                                <div>
                                    <label className={labelBase}>Color Theme</label>
                                    <Select value={theme} onChange={setTheme} options={THEME_OPTIONS} />
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className={labelBase}>QR Center Logo (Optional)</label>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => (logo ? setLogo(null) : logoInputRef.current?.click())}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                            logo
                                                ? 'bg-amber-500/15 border border-amber-400/40 text-amber-600 dark:text-amber-300'
                                                : 'bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink-secondary hover:border-line-strong'
                                        }`}
                                    >
                                        <ImageIcon size={14} /> {logo ? 'Remove Logo' : 'Upload Center Logo'}
                                    </button>
                                    <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                    {logo && (
                                        <div className="flex items-center gap-2">
                                            <img src={logo} alt="" className="w-8 h-8 object-contain rounded bg-white p-0.5" />
                                            <span className="text-xs text-ink-muted">Logo attached</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Optional Menu Items */}
                        {preset !== 'sticker_3x3' && (
                            <div className="space-y-4 pt-2 border-t border-line dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                                        <Utensils size={16} className="text-emerald-500" /> Featured Items / Specials (Optional)
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addMenuItem}
                                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Item
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {menuItems.map((item, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className={`${inputBase} flex-1`}
                                                    placeholder="Dish Name"
                                                    value={item.name}
                                                    onChange={(e) => updateMenuItem(idx, 'name', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className={`${inputBase} w-24`}
                                                    placeholder="Price"
                                                    value={item.price}
                                                    onChange={(e) => updateMenuItem(idx, 'price', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMenuItem(idx)}
                                                    className="p-2 text-ink-muted hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                className={`${inputBase} text-xs py-1.5`}
                                                placeholder="Short description / ingredients (optional)"
                                                value={item.description}
                                                onChange={(e) => updateMenuItem(idx, 'description', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {errors.length > 0 && (
                            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                                <div className="text-sm text-red-600 dark:text-red-300">
                                    {errors.map((err, i) => (
                                        <p key={i}>{err}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            disabled={loading}
                            className="w-full py-4 bg-sunken dark:bg-white text-white dark:text-[#05030f] rounded-2xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Download size={18} /> {loading ? 'Generating PDF...' : 'Download Printable PDF'}
                        </button>
                    </div>

                    {/* Preview Column */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                        <div className="sticky top-6 w-full max-w-sm">
                            <label className={labelBase}>Live Card Mockup Preview</label>
                            <div
                                className="w-full rounded-2xl p-6 border shadow-2xl transition-all flex flex-col items-center text-center relative overflow-hidden"
                                style={{
                                    backgroundColor: activeTheme.card_bg,
                                    borderColor: activeTheme.accent_color,
                                    color: activeTheme.text_color,
                                    minHeight: preset === 'sticker_3x3' ? '280px' : '420px',
                                }}
                            >
                                {tableNumber && (
                                    <span
                                        className="text-2xs font-bold uppercase px-3 py-1 rounded-full mb-3 tracking-wider text-ink"
                                        style={{ backgroundColor: activeTheme.accent_color }}
                                    >
                                        Table {tableNumber}
                                    </span>
                                )}

                                <h2 className="text-xl font-bold leading-snug mb-1">{restaurantName || 'Restaurant Name'}</h2>
                                <p className="text-xs opacity-80 italic mb-4">{tagline || 'Scan to view menu'}</p>

                                {/* QR Placeholder Mock */}
                                <div className="p-3 bg-white rounded-xl shadow-md mb-4 relative">
                                    <div className="w-32 h-32 bg-sunken flex flex-col items-center justify-center rounded border border-line">
                                        <QrIcon size={64} className="text-ink" />
                                        <span className="text-3xs font-mono text-ink-muted mt-1">QR Code</span>
                                    </div>
                                    {logo && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <img src={logo} alt="" className="w-8 h-8 object-contain rounded bg-white p-0.5 shadow" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs font-semibold mb-1">{instructionText || 'Scan with your camera'}</p>
                                <p className="text-2xs font-mono opacity-60 break-all max-w-[220px]">{menuUrl || 'https://example.com/menu'}</p>

                                {/* Menu Preview items */}
                                {preset !== 'sticker_3x3' && menuItems.filter((i) => i.name).length > 0 && (
                                    <div className="w-full mt-4 pt-3 border-t border-dashed text-left space-y-1.5 text-xs opacity-90" style={{ borderColor: activeTheme.accent_color }}>
                                        {menuItems.filter((i) => i.name).slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-start text-1xs">
                                                <div>
                                                    <span className="font-bold">{item.name}</span>
                                                    {item.description && <span className="block text-3xs opacity-75">{item.description}</span>}
                                                </div>
                                                {item.price && <span className="font-bold ml-2" style={{ color: activeTheme.accent_color }}>{item.price}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-1xs text-ink-muted text-center mt-3">
                                PDF generates high-resolution vectors formatted to exact physical paper dimensions ({preset}).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolShell>
    );
}
