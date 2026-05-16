import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

const PremiumSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select option",
    onAddNew,
    addNewLabel,
    disabled,
    className = "",
    searchable = true // Enable search by default
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const portalRef = useRef(null);
    const searchInputRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const updateCoords = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords);
            window.addEventListener('resize', updateCoords);
            // Focus search input when opened
            setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
            setSearchQuery(''); // Clear search when closed
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                portalRef.current && !portalRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => String(o.id) === String(value));

    // Filter options based on search query
    const filteredOptions = searchable && searchQuery
        ? options.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                    text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all 
                    cursor-pointer flex items-center justify-between shadow-sm
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''} 
                    ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}
                `}
            >
                <span className={`truncate ${!selectedOption ? 'text-slate-400' : ''}`}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: Math.max(coords.width, 280)
                    }}
                >
                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white placeholder-slate-400"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
                        {filteredOptions.length === 0 && !onAddNew && (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                {searchQuery ? 'No matching options' : 'No options available'}
                            </div>
                        )}
                        {filteredOptions.map(option => (
                            <div
                                key={option.id}
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all flex items-center justify-between mb-0.5
                                    ${String(value) === String(option.id)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                `}
                            >
                                <span className="truncate">{option.name}</span>
                                {String(value) === String(option.id) && <Check size={16} className="shrink-0" />}
                            </div>
                        ))}
                        {onAddNew && (
                            <div
                                onClick={() => {
                                    onAddNew();
                                    setIsOpen(false);
                                }}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-3"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">+</span> {addNewLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PremiumSelect;
