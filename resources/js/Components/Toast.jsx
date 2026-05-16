import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast Notification Component
 * Props:
 * - toasts: Array of { id, message, type: 'success' | 'error' | 'warning' | 'info' }
 * - removeToast: Function(id) to remove a toast
 * - duration: Auto-dismiss duration in ms (default: 4000)
 */
export default function Toast({ toasts = [], removeToast, duration = 4000 }) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                    duration={duration}
                />
            ))}
        </div>
    );
}

function ToastItem({ toast, onClose, duration }) {
    const progressRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const remainingRef = useRef(duration);

    const typeStyles = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
            border: 'border-emerald-200 dark:border-emerald-700',
            text: 'text-emerald-800 dark:text-emerald-200',
            icon: <CheckCircle size={18} className="text-emerald-500" />,
            progress: 'bg-emerald-500'
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900/30',
            border: 'border-red-200 dark:border-red-700',
            text: 'text-red-800 dark:text-red-200',
            icon: <AlertCircle size={18} className="text-red-500" />,
            progress: 'bg-red-500'
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            border: 'border-amber-200 dark:border-amber-700',
            text: 'text-amber-800 dark:text-amber-200',
            icon: <AlertTriangle size={18} className="text-amber-500" />,
            progress: 'bg-amber-500'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            border: 'border-blue-200 dark:border-blue-700',
            text: 'text-blue-800 dark:text-blue-200',
            icon: <Info size={18} className="text-blue-500" />,
            progress: 'bg-blue-500'
        }
    };

    const style = typeStyles[toast.type] || typeStyles.info;

    // Auto-dismiss timer with progress bar
    useEffect(() => {
        startTimeRef.current = Date.now();
        remainingRef.current = duration;

        const startTimer = () => {
            timerRef.current = setTimeout(() => {
                onClose();
            }, remainingRef.current);
        };

        startTimer();

        // Animate progress bar
        if (progressRef.current) {
            progressRef.current.style.transition = `width ${remainingRef.current}ms linear`;
            progressRef.current.style.width = '0%';
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [duration, onClose]);

    // Pause on hover
    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const elapsed = Date.now() - startTimeRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        if (progressRef.current) {
            const currentWidth = (remainingRef.current / duration) * 100;
            progressRef.current.style.transition = 'none';
            progressRef.current.style.width = `${currentWidth}%`;
        }
    };

    // Resume on mouse leave
    const handleMouseLeave = () => {
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
            onClose();
        }, remainingRef.current);
        if (progressRef.current) {
            progressRef.current.style.transition = `width ${remainingRef.current}ms linear`;
            progressRef.current.style.width = '0%';
        }
    };

    return (
        <div
            className={`pointer-events-auto min-w-[280px] max-w-sm rounded-xl border shadow-lg overflow-hidden animate-in slide-in-from-right-5 fade-in duration-300 ${style.bg} ${style.border}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-start gap-3 p-3">
                <div className="shrink-0 mt-0.5">{style.icon}</div>
                <p className={`text-sm font-medium flex-1 ${style.text}`}>{toast.message}</p>
                <button
                    onClick={onClose}
                    className={`shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${style.text}`}
                >
                    <X size={14} />
                </button>
            </div>
            {/* Progress Bar */}
            <div className="h-1 w-full bg-black/5 dark:bg-white/10">
                <div
                    ref={progressRef}
                    className={`h-full w-full ${style.progress}`}
                />
            </div>
        </div>
    );
}
