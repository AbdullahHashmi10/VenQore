import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';

export default function KeyboardShortcutsModal({ isOpen, onClose, mode = 'global' }) {

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const globalShortcuts = {
        'Navigation (SHIFT + Key)': [
            { key: 'H', desc: 'Home / Dashboard' },
            { key: 'P', desc: 'Parties List' },
            { key: 'I', desc: 'Inventory / Items' },
            { key: 'R', desc: 'Reports Hub' },
            { key: 'B', desc: 'Bank Accounts' },
            { key: 'C', desc: 'Cash / Funds' },
            { key: 'E', desc: 'Expenses' },
            { key: 'O', desc: 'Sales Orders' },
            { key: 'S', desc: 'Estimates' },
            { key: '1', desc: 'Settings' },
        ],
        'Creation & Actions (ALT + Key)': [
            { key: 'S', desc: 'New Sale' },
            { key: 'P', desc: 'New Purchase' },
            { key: 'I', desc: 'Payment In' },
            { key: 'O', desc: 'Payment Out' },
            { key: 'E', desc: 'Add Expense' },
            { key: 'N', desc: 'Add Party' },
            { key: 'A', desc: 'Add Item' },
            { key: 'Z', desc: 'Open POS Terminal' },
        ],
        'System': [
            { key: 'ESC', desc: 'Close Modals' },
        ]
    };

    const posShortcuts = {
        'Item Controls': [
            { key: 'F1', desc: 'Focus Search' },
            { key: 'F2', desc: 'Change Quantity' },
            { key: 'F3', desc: 'Item Discount' },
            { key: 'F4', desc: 'Remove Item' },
            { key: 'F5', desc: 'Change Price' },
        ],
        'Transaction': [
            { key: 'F7', desc: 'Override Tax' },
            { key: 'F8', desc: 'Add Charges' },
            { key: 'F9', desc: 'Bill Discount' },
            { key: 'F11', desc: 'Select Customer' },
            { key: 'F12', desc: 'Sale Remarks' },
        ],
        'System & Save': [
            { key: 'Ctrl + S', desc: 'Quick Save' },
            { key: 'Ctrl + P', desc: 'Save & Print' },
            { key: 'Ctrl + N', desc: 'Save & New' },
            { key: 'Ctrl + T', desc: 'New Tab' },
            { key: 'Ctrl + W', desc: 'Close Tab' },
            { key: 'Ctrl + R', desc: 'Reset Tab' },
        ]
    };

    const content = mode === 'pos' ? posShortcuts : globalShortcuts;
    const title = mode === 'pos' ? 'POS Terminal Shortcuts' : 'Global Application Shortcuts';

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="p-6 text-gray-900 dark:text-gray-100">
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">⌨</kbd>
                        <span>{title}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(content).map(([category, items]) => (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wider">
                                {category}
                            </h3>
                            <ul className="space-y-2">
                                {items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm group hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 transition-colors">
                                        <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                                            {item.desc}
                                        </span>
                                        <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                                            {item.key}
                                        </kbd>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-400">
                    Press <kbd className="font-bold">Esc</kbd> to close this reference.
                </div>
            </div>
        </Modal>
    );
}
