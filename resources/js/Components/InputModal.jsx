import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';

export default function InputModal({ show, onClose, title, message, placeholder, initialValue = '', onSubmit, submitLabel = 'Submit' }) {
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
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                    {title}
                </h2>
                {message && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {message}
                    </p>
                )}

                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500 mb-6 text-slate-800 dark:text-white"
                    autoFocus
                />

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
