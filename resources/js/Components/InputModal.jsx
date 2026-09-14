import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';

export default function InputModal({ show, onClose, title, message, placeholder, initialValue = '', onSubmit, submitLabel = 'Submit', zIndex = 'z-50' }) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (show) setValue(initialValue);
    }, [show, initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(value);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm" zIndex={zIndex}>
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-bold text-ink mb-2">
                    {title}
                </h2>
                {message && (
                    <p className="text-sm text-ink-muted mb-4">
                        {message}
                    </p>
                )}

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-app border border-line rounded-xl px-4 py-3 outline-none focus:ring-2 ring-brand-500 mb-6 text-ink"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-brand-500 hover:bg-brand-600 shadow-lg active:scale-95 transition-all"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
