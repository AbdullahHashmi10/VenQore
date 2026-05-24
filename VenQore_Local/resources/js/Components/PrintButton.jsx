/**
 * PrintButton Component
 * 
 * A reusable button that provides print options for both
 * regular (A4) and thermal (receipt) printing.
 * 
 * Usage:
 *   <PrintButton sale={saleData} />
 *   <PrintButton sale={saleData} showThermal={false} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { Printer, FileText, Receipt, ChevronDown, Check } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import PrintService from '@/Utils/PrintService';

export default function PrintButton({
    sale,
    settings = null,
    label = 'Print',
    showThermal = true,
    showRegular = true,
    defaultType = null, // null means 'auto' - will read from settings
    variant = 'primary', // 'primary', 'secondary', 'ghost'
    size = 'md', // 'sm', 'md', 'lg'
    onPrint = null,
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [lastPrinted, setLastPrinted] = useState(null);
    const dropdownRef = useRef(null);
    const { settings: sharedSettings } = usePage().props;

    // Get settings from props, shared inertia settings, or global legacy
    const printSettings = settings || sharedSettings || window.amdSettings || {};

    // Determine the effective default print type:
    // 1. Use explicit prop if provided
    // 2. Otherwise read from settings (respects "Set as Default Printer" toggle)
    // 3. Fall back to 'regular'
    const effectiveDefaultType = defaultType || printSettings.default_print_type || 'regular';
    const isThermalDefault = effectiveDefaultType === 'thermal';


    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrint = (type) => {
        PrintService.printInvoice(sale, printSettings, type);
        setLastPrinted(type);
        setIsOpen(false);

        if (onPrint) {
            onPrint(type);
        }

        // Reset the "last printed" indicator after 3 seconds
        setTimeout(() => setLastPrinted(null), 3000);
    };

    // Single option - just a button
    const singleOption = (showThermal && !showRegular) || (!showThermal && showRegular);

    if (singleOption) {
        const type = showThermal ? 'thermal' : 'regular';
        return (
            <button
                onClick={() => handlePrint(type)}
                className={`
                    inline-flex items-center gap-2 font-semibold rounded-xl transition-all active:scale-95
                    ${variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20' : ''}
                    ${variant === 'secondary' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
                    ${variant === 'ghost' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                    ${size === 'sm' ? 'px-3 py-1.5 text-xs' : ''}
                    ${size === 'md' ? 'px-4 py-2.5 text-sm' : ''}
                    ${size === 'lg' ? 'px-6 py-3 text-base' : ''}
                    ${className}
                `}
            >
                {type === 'thermal' ? <Receipt size={size === 'sm' ? 14 : 18} /> : <Printer size={size === 'sm' ? 14 : 18} />}
                {label}
            </button>
        );
    }

    // Both options - dropdown
    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Button */}
            <div className="flex">
                <button
                    onClick={() => handlePrint(effectiveDefaultType)}
                    className={`
                        inline-flex items-center gap-2 font-semibold rounded-l-xl transition-all active:scale-95
                        ${variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                        ${variant === 'secondary' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-r-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
                        ${variant === 'ghost' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : ''}
                        ${size === 'md' ? 'px-4 py-2.5 text-sm' : ''}
                        ${size === 'lg' ? 'px-5 py-3 text-base' : ''}
                        ${className}
                    `}
                >
                    {isThermalDefault ? (
                        <Receipt size={size === 'sm' ? 14 : 18} />
                    ) : (
                        <Printer size={size === 'sm' ? 14 : 18} />
                    )}
                    <span className="ml-1">{isThermalDefault ? `${label} (Thermal)` : label}</span>
                </button>

                {/* Dropdown Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        inline-flex items-center justify-center rounded-r-xl transition-all border-l
                        ${variant === 'primary' ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-500' : ''}
                        ${variant === 'secondary' ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700' : ''}
                        ${variant === 'ghost' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700' : ''}
                        ${size === 'sm' ? 'px-2 py-1.5' : ''}
                        ${size === 'md' ? 'px-2.5 py-2.5' : ''}
                        ${size === 'lg' ? 'px-3 py-3' : ''}
                    `}
                >
                    <ChevronDown size={size === 'sm' ? 12 : 16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-1">
                        {/* Regular Print Option */}
                        {showRegular && (
                            <button
                                onClick={() => handlePrint('regular')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                        Regular Print
                                        {lastPrinted === 'regular' && <Check size={14} className="text-emerald-500" />}
                                    </div>
                                    <div className="text-xs text-slate-500">A4 / Letter paper invoice</div>
                                </div>
                            </button>
                        )}

                        {/* Thermal Print Option */}
                        {showThermal && (
                            <button
                                onClick={() => handlePrint('thermal')}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                    <Receipt size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                        Thermal Receipt
                                        {lastPrinted === 'thermal' && <Check size={14} className="text-emerald-500" />}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {printSettings.thermal_page_size === '2inch' ? '58mm' : '80mm'} receipt paper
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Settings Hint */}
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] text-slate-400">
                            Configure paper size in Settings → Print
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
