import React, { Fragment, useCallback, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * FormModal - Reusable modal component for forms with Midnight Nebula design
 * 
 * @param {Boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback to close modal
 * @param {String} title - Modal title
 * @param {String} subtitle - Optional subtitle
 * @param {ReactNode} children - Form content
 * @param {ReactNode} footer - Footer with action buttons
 * @param {String} size - Modal size: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {Boolean} loading - Show loading state
 */
export default function FormModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    loading = false,
    confirmClose = true // Default to true for better UX
}) {
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);
    // Base size classes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95%] h-[95vh]' // Making it much larger as requested
    };

    // Unified closure logic with confirmation
    const requestClose = useCallback(() => {
        if (confirmClose) {
            setShowExitConfirmation(true);
        } else {
            onClose();
        }
    }, [confirmClose, onClose]);

    // Backdrop click handler - specifically checks if the background was clicked
    const handleBackdropInteraction = (e) => {
        if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            // User requested to disable backdrop closing to prevent accidental data loss
            // requestClose(); 
        }
    };

    React.useEffect(() => {
        if (isOpen) setShowExitConfirmation(false);
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' || event.keyCode === 27) {
                if (isOpen) {
                    event.preventDefault();
                    event.stopPropagation();
                    // If showing confirmation, ESC should cancel confirmation, not close modal again (or maybe it should just do nothing)
                    // Let's make ESC close the confirmation if open, or request close if not.
                    /* 
                    We need to access the CURRENT state of showExitConfirmation here. 
                    Since we are inside a useEffect with dependencies, we need either a ref or robust logic.
                    However, simplified: standard requestClose handles logic.
                    */
                    requestClose();
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        }

        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, requestClose]);

    // Final check for open state after hooks
    if (!isOpen) return null;

    return (
        <Fragment>
            {/* 1. SEPARATE BACKDROP: High-opacity blur behind everything */}
            <div
                className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500 cursor-pointer"
                onMouseDown={handleBackdropInteraction}
                onTouchStart={handleBackdropInteraction}
            />

            {/* 2. MODAL CONTAINER: Higher z-index, centered, pointer-events-none so backdrop is reachable */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-12 pointer-events-none overflow-hidden">
                <div
                    className={`
                        ${sizeClasses[size]} w-full pointer-events-auto
                        bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.8)]
                        border-4 border-white/10 dark:border-slate-800/50
                        animate-in zoom-in-95 fade-in duration-500
                        ${size === 'full' ? 'h-[94vh]' : 'max-h-[96vh]'} 
                        flex flex-col relative overflow-hidden
                    `}
                >
                    {/* Midnight Nebula Background Effect */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                    {/* Header: Elevated with glass effect */}
                    <div className="px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-6">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                                    <span className="w-3 h-10 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full" />
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-lg font-bold text-slate-400 dark:text-slate-500 mt-2 max-w-4xl tracking-tight leading-none">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    requestClose();
                                }}
                                className="group p-5 rounded-[2rem] bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-400 dark:text-slate-500 hover:text-white transition-all active:scale-90 shadow-inner"
                                title="Safe Close (Esc)"
                            >
                                <X size={32} className="group-hover:rotate-180 transition-transform duration-700 ease-out" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-10 py-10 relative z-10 custom-scrollbar-premium bg-gradient-to-b from-transparent to-slate-50/20 dark:to-slate-900/10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-8">
                                <div className="relative">
                                    <div className="w-32 h-32 border-8 border-indigo-600/10 rounded-full" />
                                    <div className="absolute top-0 left-0 w-32 h-32 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <p className="text-2xl font-black text-slate-600 dark:text-slate-300 tracking-[0.2em] uppercase animate-pulse">Processing Block...</p>
                                    <p className="text-sm font-bold text-slate-400">Please do not refresh or close.</p>
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </div>

                    {/* Footer Area */}
                    {footer && (
                        <div className="px-10 py-10 border-t-2 border-slate-100 dark:border-slate-800/80 shrink-0 relative z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                            {footer}
                        </div>
                    )}

                    {/* EXIT CONFIRMATION OVERLAY */}
                    {showExitConfirmation && (
                        <div className="absolute inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border-2 border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mb-2">
                                        <AlertTriangle size={32} strokeWidth={2.5} />
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Discard Changes?</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        You have unsaved changes. Are you sure you want to close this form? Data will be lost.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowExitConfirmation(false);
                                            }}
                                            className="px-4 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            No, Stay
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onClose();
                                            }}
                                            className="px-4 py-3 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/30 transition-colors"
                                        >
                                            Yes, Discard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Fragment>
    );
}

/**
 * Form field wrapper for consistent styling
 */
export function FormField({ label, error, required, children, hint, className = "" }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    {label}
                    {required && <span className="text-rose-500 ml-1.5">*</span>}
                </label>
            )}
            {children}
            {(hint || error) && (
                <div className="flex items-start gap-2 pt-1 transition-all">
                    {error ? (
                        <p className="text-sm font-bold text-rose-500 animate-in slide-in-from-left-2">{error}</p>
                    ) : (
                        <p className="text-xs font-medium text-slate-400">{hint}</p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Form input with consistent styling
 */
export function FormInput({
    type = 'text',
    error,
    className = '',
    ...props
}) {
    return (
        <input
            type={type}
            className={`
                w-full px-5 py-4 rounded-2xl
                bg-slate-50 dark:bg-slate-800/30
                border-2 ${error ? 'border-rose-500/50' : 'border-slate-200 dark:border-slate-700/50'}
                text-slate-900 dark:text-white text-lg font-bold
                placeholder:text-slate-300 dark:placeholder:text-slate-600
                outline-none focus:ring-4 ${error ? 'ring-rose-500/10 focus:border-rose-500' : 'ring-indigo-500/10 focus:border-indigo-500'}
                transition-all hover:bg-white dark:hover:bg-slate-800/50
                ${className}
            `}
            {...props}
        />
    );
}

// Custom Dropdown Select to allow full styling control (rounded corners on list, etc.)
export function FormSelect({
    value,
    onChange,
    onCreate,
    error,
    children,
    className = '',
    placeholder = 'Select an option',
    searchable = true,
    creatable = false,
    ...props
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const containerRef = React.useRef(null);
    const searchInputRef = React.useRef(null);

    // Parse options
    const allOptions = React.Children.toArray(children).map(child => ({
        value: child.props.value,
        label: child.props.children,
        disabled: child.props.disabled || child.props.value === ""
    })).filter(opt => !opt.disabled);

    // Filter options
    const filteredOptions = allOptions.filter(opt =>
        String(opt.label).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find current label
    const selectedOption = allOptions.find(opt => opt.value == value);
    const displayLabel = selectedOption ? selectedOption.label : (placeholder || 'Select...');

    // Effects
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opened
    React.useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 50);
        }
        if (!isOpen) {
            setSearchTerm(''); // Reset search on close
        }
    }, [isOpen, searchable]);

    const handleSelect = (val) => {
        const event = { target: { value: val, name: props.name || '' } };
        if (onChange) onChange(event);
        setIsOpen(false);
    };

    const handleCreate = () => {
        if (onCreate && searchTerm.trim()) {
            onCreate(searchTerm.trim());
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-5 py-4 rounded-2xl text-left flex items-center justify-between
                    bg-slate-50 dark:bg-slate-800/30 
                    border-2 ${error ? 'border-rose-500/50' : 'border-slate-200 dark:border-slate-700/50'}
                    text-slate-900 dark:text-white text-lg font-bold
                    outline-none focus:ring-4 ${error ? 'ring-rose-500/10 focus:border-rose-500' : 'ring-indigo-500/10 focus:border-indigo-500'}
                    transition-all hover:bg-white dark:hover:bg-slate-800/50
                    ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''}
                    ${className}
                `}
            >
                <span className={!selectedOption ? 'text-slate-400 dark:text-slate-600' : ''}>{displayLabel}</span>
                <span className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-[100] w-full mt-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col">

                    {/* Search Bar */}
                    {searchable && (
                        <div className="p-3 border-b-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Type to search or create..."
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-bold outline-none focus:border-indigo-500 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto custom-scrollbar-premium p-2 space-y-1">
                        {/* PROMINENT Create Option */}
                        {creatable && searchTerm && !allOptions.some(o => o.label.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                            <button
                                type="button"
                                onClick={handleCreate}
                                className="w-full px-4 py-6 rounded-2xl text-left text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-4 shadow-xl border-4 border-white/20 mb-4 animate-bounce"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase opacity-70">Add New Category</span>
                                    <span>Create "{searchTerm}"</span>
                                </div>
                            </button>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleSelect(opt.value)}
                                    className={`
                                        w-full px-4 py-3.5 rounded-2xl text-left text-base font-bold transition-all flex items-center justify-between
                                        ${value == opt.value
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-2 border-emerald-100 dark:border-emerald-500/20'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:pl-6'}
                                    `}
                                >
                                    {opt.label}
                                    {value == opt.value && (
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-in zoom-in">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : !searchTerm ? (
                            <div className="px-4 py-12 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No options available</p>
                            </div>
                        ) : null}

                        {filteredOptions.length === 0 && searchTerm && !creatable && (
                            <div className="px-4 py-12 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Results Found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Form textarea with consistent styling
 */
export function FormTextarea({
    error,
    className = '',
    rows = 3,
    ...props
}) {
    return (
        <textarea
            rows={rows}
            className={`
                w-full px-4 py-3 rounded-2xl
                bg-slate-50 dark:bg-slate-800/50
                border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}
                text-slate-800 dark:text-white font-medium
                placeholder:text-slate-400
                outline-none focus:ring-2 ${error ? 'ring-red-500/20' : 'ring-indigo-500/20 focus:border-indigo-500'}
                transition-all resize-none hover:bg-white dark:hover:bg-slate-800
                ${className}
            `}
            {...props}
        />
    );
}

/**
 * Button components for form actions
 */
export function PrimaryButton({ children, loading, className = '', ...props }) {
    return (
        <button
            className={`
                px-6 py-2.5 rounded-xl font-semibold text-white
                bg-gradient-to-r from-indigo-600 to-indigo-700
                hover:from-indigo-700 hover:to-indigo-800
                shadow-lg shadow-indigo-500/25
                transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `}
            disabled={loading}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}

export function SecondaryButton({ children, className = '', ...props }) {
    return (
        <button
            className={`
                px-6 py-2.5 rounded-xl font-semibold
                border border-slate-200 dark:border-slate-700
                text-slate-700 dark:text-slate-300
                hover:bg-slate-50 dark:hover:bg-slate-800
                transition-all active:scale-95
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}

export function DangerButton({ children, loading, className = '', ...props }) {
    return (
        <button
            className={`
                px-6 py-2.5 rounded-xl font-semibold text-white
                bg-gradient-to-r from-red-600 to-red-700
                hover:from-red-700 hover:to-red-800
                shadow-lg shadow-red-500/25
                transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `}
            disabled={loading}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {children}
        </button>
    );
}
