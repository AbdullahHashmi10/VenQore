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
            <div className={`p-8 text-center rounded-2xl transition-all duration-slow ${isSaleCompleted ? 'bg-neutral-900 text-white' : ''}`}>
                <div className="flex justify-center mb-5">
                    <div className={`p-4 rounded-full bg-opacity-10 ${
                        type === 'error' ? 'bg-red-500' :
                        type === 'success' ? 'bg-emerald-500' :
                        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}>
                        {icons[type]}
                    </div>
                </div>

                <h2 className={`text-2xl font-bold mb-4 tracking-tight ${isSaleCompleted ? 'text-white' : 'text-ink'}`}>
                    {title}
                </h2>

                {typeof message === 'string' ? (
                    <p className={`mb-6 whitespace-pre-line text-sm leading-relaxed ${isSaleCompleted ? 'text-neutral-300 font-medium' : 'text-ink-muted'}`}>
                        {message}
                    </p>
                ) : (
                    <div className="mb-6">
                        {message}
                    </div>
                )}

                <button
                    onClick={handleAction}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all text-base ${
                        isSaleCompleted 
                        ? 'bg-emerald-500 hover:bg-emerald-600 ' 
                        : (type === 'error' ? 'bg-red-500 hover:bg-red-600 ' :
                           type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 ' :
                           type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 ' :
                           'bg-blue-500 hover:bg-blue-600 ')
                    }`}
                >
                    {actionLabel}
                </button>
            </div>
        </Modal>
    );
}
