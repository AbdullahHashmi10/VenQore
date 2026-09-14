import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ show, onClose, title, message, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', isDangerous = false }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-ink">
                            {title}
                        </h2>
                        <p className="text-sm text-ink-muted mt-1">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 '
                                : 'bg-brand-500 hover:bg-brand-600 '
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
