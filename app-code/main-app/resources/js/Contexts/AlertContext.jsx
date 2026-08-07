import React, { createContext, useContext, useState, useCallback } from 'react';
import FormModal from '@/Components/FormModal';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // info, success, warning, error
        confirmLabel: 'OK',
        cancelLabel: 'Cancel',
        isConfirm: false,
        onConfirm: () => { },
        onCancel: () => { },
    });

    const closeAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showAlert = useCallback(({
        title,
        message,
        type = 'info',
        confirmLabel = 'OK',
        onConfirm
    }) => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            confirmLabel,
            isConfirm: false,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeAlert();
            },
            onCancel: closeAlert
        });
    }, [closeAlert]);

    // Network Error Listener
    React.useEffect(() => {
        const handleNetworkError = (e) => {
            // 🛑 SUPPRESS ON INSTALLER: The installer handles its own errors via the Wizard UI
            if (window.location.pathname.startsWith('/installer')) {
                // Optionally redirect to the error page if we suspect the app is truly broken
                // But for now, just don't show the generic modal.
                return;
            }

            showAlert({
                title: 'Connection Issue',
                message: e.detail?.message || 'We are experiencing connectivity issues.',
                type: 'error',
                confirmLabel: 'Dismiss'
            });
        };
        window.addEventListener('amd:network-error', handleNetworkError);
        return () => window.removeEventListener('amd:network-error', handleNetworkError);
    }, [showAlert]);

    const showConfirm = useCallback(({
        title,
        message,
        type = 'warning',
        confirmLabel = 'Yes',
        cancelLabel = 'Cancel',
        onConfirm,
        onCancel
    }) => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            confirmLabel,
            cancelLabel,
            isConfirm: true,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                closeAlert();
            },
            onCancel: () => {
                if (onCancel) onCancel();
                closeAlert();
            }
        });
    }, [closeAlert]);

    // Icon mapping
    const getIcon = () => {
        switch (alertState.type) {
            case 'success': return <CheckCircle2 size={48} className="text-emerald-500" />;
            case 'error': return <XCircle size={48} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={48} className="text-amber-500" />;
            default: return <Info size={48} className="text-indigo-500" />;
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Global Alert Modal */}
            <FormModal
                isOpen={alertState.isOpen}
                onClose={alertState.onCancel}
                title={alertState.title}
                size="sm"
            >
                <div className="flex flex-col items-center text-center p-4">
                    <div className={`mb-4 w-20 h-20 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 ${alertState.type === 'success' ? 'bg-emerald-100' :
                        alertState.type === 'error' ? 'bg-red-100' :
                            alertState.type === 'warning' ? 'bg-amber-100' : 'bg-indigo-100'
                        }`}>
                        {getIcon()}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-xs leading-relaxed">
                        {alertState.message}
                    </p>

                    <div className="flex w-full gap-3">
                        {alertState.isConfirm && (
                            <button
                                onClick={alertState.onCancel}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                {alertState.cancelLabel}
                            </button>
                        )}
                        <button
                            onClick={alertState.onConfirm}
                            className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 ${alertState.type === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                                alertState.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                    alertState.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' :
                                        'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                        >
                            {alertState.confirmLabel}
                        </button>
                    </div>
                </div>
            </FormModal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => useContext(AlertContext);
