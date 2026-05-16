import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import { Lock, Sparkles } from 'lucide-react';
import SecondaryButton from '@/Components/SecondaryButton';

export default function FeatureLockBadge({
    children,
    isLocked = false,
    className = '',
    showBadge = true
}) {
    const [showModal, setShowModal] = useState(false);

    const handleClick = (e) => {
        if (isLocked) {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(true);
        }
    };

    if (!isLocked) return children;

    return (
        <>
            <div onClick={handleClick} className={`relative cursor-pointer group ${className}`}>
                {children}
                {showBadge && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Lock size={12} className="text-amber-500" />
                    </div>
                )}
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="sm">
                <div className="relative overflow-hidden bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                    <div className="p-8 text-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-900/20 rotate-3 transform group-hover:rotate-6 transition-transform">
                            <Lock size={32} className="text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                            Coming Soon <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono uppercase border border-amber-500/30">V1.1</span>
                        </h2>

                        <p className="text-slate-300 mb-8 leading-relaxed">
                            This advanced module is part of our upcoming Gold Release expansion.
                            We are currently finalizing the security and performance audits.
                        </p>

                        <div className="flex justify-center">
                            <SecondaryButton
                                onClick={() => setShowModal(false)}
                                className="!bg-slate-800 !text-slate-300 !border-slate-700 hover:!bg-slate-700 hover:!text-white"
                            >
                                Acknowledge
                            </SecondaryButton>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
