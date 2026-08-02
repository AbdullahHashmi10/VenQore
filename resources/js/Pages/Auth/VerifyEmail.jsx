import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowRight, Loader2, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   VERIFY EMAIL — Premium Dark Cinematic
   ═══════════════════════════════════════════════════════════════════════ */

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post('/email/verification-notification', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-void-950 font-sans selection:bg-indigo-500/40 p-4 sm:p-6 relative overflow-hidden">
            <Head title="Verify Email" />

            {/* Ambient */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-6 sm:mb-10">
                    <Link href="/" className="w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08] hover:scale-105 transition-transform">
                        <img src="/images/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-sm text-center">
                    {/* Icon */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Mail size={22} className="text-indigo-400" />
                        </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 sm:mb-3" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                        Check Your Email
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 sm:mb-8 max-w-sm mx-auto">
                        We've sent a verification link to your email address. Click the link to activate your account and get started.
                    </p>

                    {/* Success message */}
                    {status === 'verification-link-sent' && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6 flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} />
                            A new verification link has been sent!
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-3 sm:space-y-4">
                        <button type="submit" disabled={processing}
                            className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-4 bg-white text-void-950 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
                            {processing ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : <><RefreshCw size={16} /> Resend Verification Email</>}
                        </button>

                        <Link href={route('logout')} method="post" as="button"
                            className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
                            <LogOut size={16} /> Sign Out
                        </Link>
                    </form>
                </div>

                {/* Help text */}
                <p className="text-center text-xs text-slate-400 mt-4 sm:mt-6">
                    Didn't receive the email? Check your spam folder or try resending.
                </p>
            </div>

            <style>{`* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }`}</style>
        </div>
    );
}
