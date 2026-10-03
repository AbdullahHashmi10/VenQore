import React, { useState, useRef, useEffect } from 'react';
import { Clock, Sun, Moon, Check, X, ChevronDown } from 'lucide-react';

/**
 * Converts 24h "HH:mm" to 12h components: { h12: 1..12, m: "00", period: "AM"|"PM" }
 */
export function parse24(val) {
    if (!val || typeof val !== 'string' || !val.includes(':')) {
        return { h12: 9, m: '00', period: 'AM' };
    }
    const [hStr, mStr] = val.split(':');
    let h24 = parseInt(hStr, 10);
    const m = (parseInt(mStr, 10) || 0).toString().padStart(2, '0');
    if (isNaN(h24)) h24 = 9;

    const period = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;

    return { h12, m, period };
}

/**
 * Converts 12h components to 24h "HH:mm" string.
 */
export function to24(h12, m, period) {
    let h = parseInt(h12, 10);
    if (isNaN(h)) h = 12;
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const hh = h.toString().padStart(2, '0');
    const mm = (parseInt(m, 10) || 0).toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

/**
 * Formats "HH:mm" into a friendly 12h label e.g. "3:00 PM"
 */
export function format12(val) {
    if (!val) return '';
    const { h12, m, period } = parse24(val);
    return `${h12}:${m} ${period}`;
}

/**
 * Calculates human duration & guidance for a day's open and close times.
 */
export function getScheduleGuidance(open, close) {
    if (!open && !close) {
        return { status: 'closed', label: 'Closed all day', isOvernight: false, durationHours: 0 };
    }
    if (!open || !close) {
        return { status: 'incomplete', label: 'Please set both opening and closing times', isOvernight: false, durationHours: 0 };
    }
    if (open === close) {
        return { status: 'all_day', label: 'Open 24 hours', isOvernight: false, durationHours: 24 };
    }

    const [oh, om] = open.split(':').map((n) => parseInt(n, 10) || 0);
    const [ch, cm] = close.split(':').map((n) => parseInt(n, 10) || 0);
    const oMin = oh * 60 + om;
    const cMin = ch * 60 + cm;

    if (cMin > oMin) {
        const diff = cMin - oMin;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        const durText = `${hrs} hr${hrs === 1 ? '' : 's'}${mins ? ` ${mins}m` : ''}`;
        return {
            status: 'daytime',
            label: `${format12(open)} → ${format12(close)} (${durText} · Same day)`,
            isOvernight: false,
            durationHours: diff / 60,
            summary: `Open ${durText} during the day`,
        };
    }

    // Overnight: closes next morning past midnight
    const diff = (1440 - oMin) + cMin;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    const durText = `${hrs} hr${hrs === 1 ? '' : 's'}${mins ? ` ${mins}m` : ''}`;
    return {
        status: 'overnight',
        label: `${format12(open)} → ${format12(close)} (+1 Day · ${durText} total)`,
        isOvernight: true,
        durationHours: diff / 60,
        summary: `Overnight shift: opens at ${format12(open)} and stays open past midnight until ${format12(close)} next morning (${durText})`,
    };
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '15', '30', '45'];

export default function V6TimePicker({
    value = '',
    onChange,
    placeholder = 'Select time',
    label = '',
    isCloseTime = false,
    disabled = false,
    className = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const parsed = parse24(value);
    const [hour, setHour] = useState(parsed.h12);
    const [minute, setMinute] = useState(parsed.m);
    const [period, setPeriod] = useState(parsed.period);

    // Synchronize internal state whenever incoming value changes
    useEffect(() => {
        if (value) {
            const p = parse24(value);
            setHour(p.h12);
            setMinute(p.m);
            setPeriod(p.period);
        }
    }, [value]);

    // Handle outside clicks
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleApply = (h, m, p) => {
        const nextVal = to24(h, m, p);
        if (onChange) onChange(nextVal);
    };

    const handleQuickSelect = (hhmm) => {
        if (onChange) onChange(hhmm);
        const p = parse24(hhmm);
        setHour(p.h12);
        setMinute(p.m);
        setPeriod(p.period);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) onChange('');
        setIsOpen(false);
    };

    const presets = isCloseTime
        ? [
            { label: '5:00 PM', value: '17:00' },
            { label: '9:00 PM', value: '21:00' },
            { label: '11:00 PM', value: '23:00' },
            { label: '12:00 AM (Midnight)', value: '00:00', badge: 'Next day' },
            { label: '2:00 AM', value: '02:00', badge: '🌙 Next morning' },
            { label: '3:00 AM', value: '03:00', badge: '🌙 Next morning' },
            { label: '4:00 AM', value: '04:00', badge: '🌙 Next morning' },
        ]
        : [
            { label: '8:00 AM', value: '08:00' },
            { label: '9:00 AM', value: '09:00' },
            { label: '10:00 AM', value: '10:00' },
            { label: '12:00 PM (Noon)', value: '12:00' },
            { label: '2:00 PM', value: '14:00' },
            { label: '3:00 PM', value: '15:00', badge: '☀️ Afternoon' },
            { label: '5:00 PM', value: '17:00' },
            { label: '6:00 PM', value: '18:00' },
        ];

    const currentFormatted = value ? format12(value) : '';
    const isOvernightTime = isCloseTime && value && parseInt(value.split(':')[0], 10) < 12;

    return (
        <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-label={label || placeholder}
                className={`group flex items-center justify-between w-full h-10 px-3 py-1.5 rounded-xl border text-sm transition-all select-none
                    ${isOpen
                        ? 'border-teal-500 ring-2 ring-teal-500/20 bg-surface shadow-sm'
                        : 'border-line hover:border-teal-400 bg-surface-2 hover:bg-surface text-ink'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                    backgroundColor: 'var(--vq-surface-2, #f8fafc)',
                    borderColor: isOpen ? 'var(--vq-teal-500, #0baa8f)' : 'var(--vq-line, rgba(0,0,0,0.12))',
                }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Clock
                        size={15}
                        className={`shrink-0 transition-colors ${
                            isOpen ? 'text-teal-600 dark:text-teal-400' : 'text-ink-muted group-hover:text-teal-500'
                        }`}
                    />
                    {value ? (
                        <div className="flex items-center gap-1.5 min-w-0 font-medium">
                            <span className="font-mono text-sm tracking-tight">{currentFormatted}</span>
                            {isOvernightTime && (
                                <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                    +1 Day
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-ink-muted text-xs truncate">{placeholder}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                    {value && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={handleClear}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleClear(e); }}
                            className="p-1 rounded-md text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Clear time"
                        >
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown
                        size={14}
                        className={`text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
                    />
                </div>
            </button>

            {/* Popover Dropdown */}
            {isOpen && (
                <div
                    className="absolute z-50 mt-1.5 w-72 sm:w-80 p-3.5 rounded-2xl border shadow-xl bg-surface animate-in fade-in zoom-in-95 duration-150 right-0 sm:left-0 sm:right-auto"
                    style={{
                        backgroundColor: 'var(--vq-surface, #ffffff)',
                        borderColor: 'var(--vq-line-strong, rgba(0,0,0,0.18))',
                        boxShadow: 'var(--vq-elev-3, 0 16px 36px -8px rgba(0,0,0,0.25))',
                    }}
                >
                    {/* Header: Display selected time & toggle */}
                    <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                        <div>
                            <div className="text-xs uppercase tracking-wider font-semibold text-ink-muted">
                                {isCloseTime ? 'Closing Time' : 'Opening Time'}
                            </div>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-bold font-mono text-ink">
                                    {to24(hour, minute, period) === value && value ? currentFormatted : `${hour}:${minute} ${period}`}
                                </span>
                                <span className="text-xs font-mono text-ink-muted">
                                    ({to24(hour, minute, period)})
                                </span>
                            </div>
                        </div>

                        {/* AM / PM Segmented Control */}
                        <div className="flex rounded-xl p-0.5 border border-line bg-surface-2 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => {
                                    setPeriod('AM');
                                    handleApply(hour, minute, 'AM');
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                                    period === 'AM'
                                        ? 'bg-amber-500 text-white shadow-sm font-bold'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                <Sun size={12} />
                                AM
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setPeriod('PM');
                                    handleApply(hour, minute, 'PM');
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                                    period === 'PM'
                                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                                        : 'text-ink-muted hover:text-ink'
                                }`}
                            >
                                <Moon size={12} />
                                PM
                            </button>
                        </div>
                    </div>

                    {/* Quick Presets Bar */}
                    <div className="mb-3">
                        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Popular Times</span>
                            {isCloseTime && <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">🌙 overnight supported</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                            {presets.map((p) => {
                                const isCurrent = value === p.value;
                                return (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => handleQuickSelect(p.value)}
                                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                                            isCurrent
                                                ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                                                : 'bg-surface-2 text-ink border-line hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                                        }`}
                                    >
                                        <span>{p.label}</span>
                                        {p.badge && (
                                            <span className={`text-[9px] px-1 rounded-full ${
                                                isCurrent ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                            }`}>
                                                {p.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hours Grid */}
                    <div className="mb-3">
                        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                            Hour
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                            {HOURS.map((h) => {
                                const active = hour === h;
                                return (
                                    <button
                                        key={h}
                                        type="button"
                                        onClick={() => {
                                            setHour(h);
                                            handleApply(h, minute, period);
                                        }}
                                        className={`h-7 rounded-lg text-xs font-mono font-medium transition-all ${
                                            active
                                                ? 'bg-teal-600 text-white font-bold shadow-sm scale-105'
                                                : 'bg-surface-2 text-ink hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-transparent hover:border-teal-300'
                                        }`}
                                    >
                                        {h}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Minutes Grid */}
                    <div className="mb-3">
                        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                            Minute
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {MINUTES.map((m) => {
                                const active = minute === m;
                                return (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                            setMinute(m);
                                            handleApply(hour, m, period);
                                        }}
                                        className={`h-7 rounded-lg text-xs font-mono font-medium transition-all ${
                                            active
                                                ? 'bg-teal-600 text-white font-bold shadow-sm'
                                                : 'bg-surface-2 text-ink hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-transparent hover:border-teal-300'
                                        }`}
                                    >
                                        :{m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (onChange) onChange('');
                                setIsOpen(false);
                            }}
                            className="text-xs text-ink-muted hover:text-red-500 py-1 px-2 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                handleApply(hour, minute, period);
                                setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-sm transition-all"
                        >
                            <Check size={13} />
                            Done ({to24(hour, minute, period)})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
