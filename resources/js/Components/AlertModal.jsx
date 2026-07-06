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

    const isSaleCompleted = title === 'Sale Completed!';

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className={`p-8 text-center rounded-2xl transition-all duration-300 ${isSaleCompleted ? 'bg-slate-900 text-white' : ''}`}>
                <div className="flex justify-center mb-5">
                    <div className={`p-4 rounded-full bg-opacity-10 ${
                        type === 'error' ? 'bg-red-500' :
                        type === 'success' ? 'bg-emerald-500' :
                        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}>
                        {icons[type]}
                    </div>
                </div>

                <h2 className={`text-2xl font-black mb-4 tracking-tight ${isSaleCompleted ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                    {title}
                </h2>

                {typeof message === 'string' ? (
                    <p className={`mb-6 whitespace-pre-line text-sm leading-relaxed ${isSaleCompleted ? 'text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                        {message}
                    </p>
                ) : (
                    <div className="mb-6">
                        {message}
                    </div>
                )}

                <button
                    onClick={handleAction}
                    className={`w-full py-4 rounded-xl font-extrabold text-white shadow-lg active:scale-[0.98] transition-all text-base ${
                        isSaleCompleted 
                        ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                        : (type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                           type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' :
                           type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' :
                           'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30')
                    }`}
                >
                    {actionLabel}
                </button>
            </div>
        </Modal>
    );
}
