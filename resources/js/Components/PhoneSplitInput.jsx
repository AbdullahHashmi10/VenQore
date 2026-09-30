import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

export const COUNTRY_DIAL_CODES = [
    { code: '+92', country: 'Pakistan', flag: '🇵🇰', iso: 'PK' },
    { code: '+1', country: 'United States / Canada', flag: '🇺🇸', iso: 'US' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
    { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', iso: 'BD' },
    { code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷', iso: 'TR' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦', iso: 'QA' },
    { code: '+968', country: 'Oman', flag: '🇴🇲', iso: 'OM' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼', iso: 'KW' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭', iso: 'BH' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG' },
    { code: '+86', country: 'China', flag: '🇨🇳', iso: 'CN' },
    { code: '+49', country: 'Germany', flag: '🇩🇪', iso: 'DE' },
    { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR' },
    { code: '+39', country: 'Italy', flag: '🇮🇹', iso: 'IT' },
    { code: '+34', country: 'Spain', flag: '🇪🇸', iso: 'ES' },
];

export default function PhoneSplitInput({ value = '', onChange }) {
    const parse = (val) => {
        if (!val) return { dialCode: '+92', localNumber: '' };
        const clean = String(val).trim();
        const matched = COUNTRY_DIAL_CODES.find(c => clean.startsWith(c.code));
        if (matched) {
            const local = clean.slice(matched.code.length).trim();
            return { dialCode: matched.code, localNumber: local };
        }
        if (clean.startsWith('0')) {
            return { dialCode: '+92', localNumber: clean.replace(/^0+/, '') };
        }
        return { dialCode: '+92', localNumber: clean };
    };

    const parsed = useMemo(() => parse(value), [value]);
    const [dialCode, setDialCode] = useState(parsed.dialCode);
    const [localNumber, setLocalNumber] = useState(parsed.localNumber);
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const portalRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const p = parse(value);
        setDialCode(p.dialCode);
        setLocalNumber(p.localNumber);
    }, [value]);

    const updateCoords = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                portalRef.current && !portalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDialChange = (newCode) => {
        setDialCode(newCode);
        setIsOpen(false);
        const combined = localNumber ? `${newCode} ${localNumber}` : newCode;
        onChange(combined);
    };

    const handleLocalChange = (e) => {
        const raw = e.target.value.replace(/[^\d\s-]/g, '');
        setLocalNumber(raw);
        const combined = raw ? `${dialCode} ${raw}` : '';
        onChange(combined);
    };

    const selectedCountry = COUNTRY_DIAL_CODES.find(c => c.code === dialCode) || COUNTRY_DIAL_CODES[0];

    const filtered = COUNTRY_DIAL_CODES.filter(c =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.iso.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex items-center gap-2.5">
            {/* Country Selector Trigger - Separate Section (Height Matched) */}
            <div
                ref={dropdownRef}
                onClick={() => setIsOpen(!isOpen)}
                className="h-11 w-32 sm:w-36 shrink-0 flex items-center justify-between px-3 bg-app hover:bg-surface border border-line rounded-xl cursor-pointer transition-all shadow-xs select-none hover:border-brand-500/40 active:scale-[0.98]"
            >
                <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-ink uppercase tracking-tight">{selectedCountry.iso}</span>
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono">{selectedCountry.code}</span>
                </div>
                <ChevronDown size={14} className={`text-ink-muted shrink-0 transition-transform duration-slow ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Local Phone Number Input - Separate Section (Height Matched) */}
            <div className="relative flex-1">
                <input
                    type="tel"
                    value={localNumber}
                    onChange={handleLocalChange}
                    placeholder="300 1234567"
                    className="h-11 w-full px-3.5 bg-app border border-line rounded-xl text-sm font-bold text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 shadow-xs transition-all"
                />
            </div>

            {/* Country Code Dropdown Portal */}
            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed mt-1.5 bg-surface rounded-xl shadow-2xl border border-line z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-fast"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: Math.max(coords.width + 130, 270)
                    }}
                >
                    <div className="p-2 border-b border-line bg-surface">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country or code..."
                                autoFocus
                                className="w-full pl-8 pr-3 py-1.5 bg-app border border-line rounded-lg text-xs font-bold text-ink outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-line/40">
                        {filtered.map((item) => {
                            const isSelected = item.code === dialCode;
                            return (
                                <div
                                    key={item.iso + item.code}
                                    onClick={() => handleDialChange(item.code)}
                                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                                        isSelected ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-bold' : 'hover:bg-app text-ink'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base">{item.flag}</span>
                                        <span className="truncate max-w-[150px]">{item.country}</span>
                                    </div>
                                    <span className="font-mono font-bold text-ink-muted text-3xs">{item.code}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
