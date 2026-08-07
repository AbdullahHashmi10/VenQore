
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
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
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
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 animate-in fade-in duration-700">
                    <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-12 text-center relative overflow-hidden">

                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-8 animate-bounce-slow">
                                <ShieldX size={48} className="text-red-500" />
                            </div>

                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                Something went wrong
                            </h1>

                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                                We encountered an unexpected issue. Don't worry, your data is safe.
                                We've logged this event and our team is already on it.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 w-full">
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95"
                                >
                                    <RefreshCw size={20} />
                                    Reload Application
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <Home size={20} />
                                    Return Home
                                </button>
                            </div>

                            {/* Technical Details (Hidden by default or subtle) */}
                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 w-full text-left">
                                <details className="group">
                                    <summary className="list-none cursor-pointer text-xs text-slate-400 font-mono hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2 justify-center">
                                        <span>View Technical Details</span>
                                        <span className="group-open:rotate-180 transition-transform">▼</span>
                                    </summary>
                                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                                        <pre className="text-[10px] text-red-500 font-mono whitespace-pre-wrap">
                                            {this.state.error && this.state.error.toString()}
                                            <br />
                                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                                        </pre>
                                    </div>
                                </details>
                            </div>

                            <p className="mt-8 text-xs text-slate-300 dark:text-slate-600 font-mono">
                                Error Reference: {Date.now().toString(36).toUpperCase()}
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
