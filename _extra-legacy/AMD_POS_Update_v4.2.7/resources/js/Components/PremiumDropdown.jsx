import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

const PremiumDropdown = ({ value, options, onChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const portalRef = useRef(null);

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
        }
        return () => {
            window.removeEventListener('scroll', updateCoords);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside the trigger button OR the dropdown content
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                (!portalRef.current || !portalRef.current.contains(event.target))
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm active:scale-95"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed mt-2 w-32 origin-top-right rounded-2xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: coords.top,
                        left: coords.left + coords.width - 128, // Align right (w-32 = 128px)
                    }}
                >
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    flex items-center w-full px-4 py-2.5 text-xs font-bold transition-colors
                                    ${value === option.value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PremiumDropdown;
