import React, { forwardRef } from 'react';
import { Calculator } from 'lucide-react';

const HeaderCalculatorButton = forwardRef(function HeaderCalculatorButton({ isOpen, onClick }, ref) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            title="Calculator"
            aria-label="Calculator"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls="header-calculator-popover"
            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all border shadow-sm relative focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isOpen
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 border-brand-200 dark:border-brand-800'
                    : 'bg-surface text-ink-secondary hover:text-brand-600 hover:shadow-md border-line'
            }`}
        >
            <Calculator size={18} />
        </button>
    );
});

export default HeaderCalculatorButton;
