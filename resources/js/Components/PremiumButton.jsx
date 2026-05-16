import React from 'react';

export default function PremiumButton({ children, onClick, className = '', type = 'button', disabled = false }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                relative group overflow-hidden rounded-xl shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all duration-300
                ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
                ${className}
            `}
        >
            {/* Premium Background */}
            <div className="absolute inset-0 bg-slate-900 z-0">
                <div className="absolute top-0 right-0 w-full h-full bg-indigo-600/40 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-full h-full bg-purple-600/30 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 group-hover:from-slate-700 group-hover:to-slate-800 transition-colors duration-300"></div>
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 text-white font-bold tracking-wide">
                {children}
            </div>
        </button>
    );
}
