
import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldX } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });

        // Report to server
        try {
            fetch('/api/report-error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({
                    message: error.message || error.toString(),
                    url: window.location.href,
                    stack_trace: errorInfo.componentStack,
                    file: null,
                    line: null,
                }),
            });
        } catch (e) {
            console.warn("Failed to report error to server:", e);
        }
    }


    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Premium Error UI
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-app p-6 animate-in fade-in duration-slower">
                    <div className="max-w-2xl w-full bg-surface rounded-2xl shadow-2xl border border-line p-12 text-center relative overflow-hidden">

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-8 animate-bounce-slow">
                                <ShieldX size={48} className="text-red-500" />
                            </div>

                            <h1 className="text-4xl font-bold text-ink mb-4 tracking-tight">
                                Something went wrong
                            </h1>

                            <p className="text-ink-muted text-lg mb-8 max-w-md mx-auto leading-relaxed">
                                We encountered an unexpected issue. Don't worry, your data is safe.
                                We've logged this event and our team is already on it.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 w-full">
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
                                >
                                    <RefreshCw size={20} />
                                    Reload Application
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="flex items-center gap-2 px-8 py-4 bg-surface text-ink-secondary dark:text-ink border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl font-bold transition-all active:scale-95"
                                >
                                    <Home size={20} />
                                    Return Home
                                </button>
                            </div>

                            <p className="mt-8 text-xs text-neutral-300 dark:text-ink-secondary font-mono">
                                Reference: {Date.now().toString(36).toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
