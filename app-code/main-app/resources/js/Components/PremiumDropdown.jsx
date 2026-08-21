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
                className="flex items-center gap-2 bg-app px-3 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 transition-all duration-normal border border-transparent hover:border-line dark:hover:border-line-strong shadow-sm active:scale-95"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-slow ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed mt-2 w-32 origin-top-right rounded-2xl bg-surface shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-command overflow-hidden animate-in fade-in zoom-in-95 duration-normal"
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
                                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                                        : 'text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'}
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
