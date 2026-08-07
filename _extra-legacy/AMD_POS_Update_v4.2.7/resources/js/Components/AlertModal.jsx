import React from 'react';
import Modal from '@/Components/Modal';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function AlertModal({ show, onClose, type = 'error', title, message, actionLabel = 'Okay', onAction }) {
    const icons = {
        success: <CheckCircle className="text-emerald-500 w-12 h-12" />,
        error: <XCircle className="text-red-500 w-12 h-12" />,
        warning: <AlertTriangle className="text-amber-500 w-12 h-12" />,
        info: <Info className="text-blue-500 w-12 h-12" />,
    };

    const handleAction = () => {
        if (onAction) onAction();
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full bg-opacity-10 ${type === 'error' ? 'bg-red-500' :
                            type === 'success' ? 'bg-emerald-500' :
                                type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`}>
                        {icons[type]}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    {title}
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {message}
                </p>

                <button
                    onClick={handleAction}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                            type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' :
                                type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' :
                                    'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'
                        }`}
                >
                    {actionLabel}
                </button>
            </div>
        </Modal>
    );
}
