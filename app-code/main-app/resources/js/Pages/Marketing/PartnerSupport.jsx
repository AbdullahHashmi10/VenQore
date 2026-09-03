import React, { useState, useEffect, useRef } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from './Shared/MarketingLayout';
import { MessageSquare, Send, CheckCircle2, Loader2, ArrowLeft, RefreshCw, User, Shield, Upload, FileText, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function PartnerSupport() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [purchaseSource, setPurchaseSource] = useState('');
    const [trialStatus, setTrialStatus] = useState('not_started'); // started | not_started
    const [attachment, setAttachment] = useState(null);
    const [attachmentName, setAttachmentName] = useState('');

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [error, setError] = useState(null);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const chatEndRef = useRef(null);

    // Load active ticket if saved in localStorage
    useEffect(() => {
        const savedTicketId = localStorage.getItem('vq_partner_ticket_id');
        if (savedTicketId) {
            fetchTicket(savedTicketId);
        }
    }, []);

    // Scroll to bottom of chat when messages update
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ticket?.replies]);

    // Poll messages every 5 seconds if ticket is active
    useEffect(() => {
        if (!ticket) return;
        const interval = setInterval(() => {
            fetchTicketQuiet(ticket.id);
        }, 5000);
        return () => clearInterval(interval);
    }, [ticket?.id]);

    const fetchTicket = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/partner-support/chat/${id}`);
            if (res.data.success) {
                setTicket(res.data.ticket);
            } else {
                localStorage.removeItem('vq_partner_ticket_id');
            }
        } catch (err) {
            localStorage.removeItem('vq_partner_ticket_id');
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketQuiet = async (id) => {
        try {
            const res = await axios.get(`/api/partner-support/chat/${id}`);
            if (res.data.success) {
                setTicket(res.data.ticket);
            }
        } catch (err) {
            // Ignore background errors
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentName(file.name);
        }
    };

    const handleStartChat = async (e) => {
        e.preventDefault();
        if (!attachment) {
            setError('Please upload a proof of purchase (invoice screenshot, PDF, etc.).');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('message', message);
        formData.append('purchase_source', purchaseSource);
        formData.append('trial_status', trialStatus);
        formData.append('attachment', attachment);

        try {
            const res = await axios.post('/api/partner-support/chat', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                setTicket(res.data.ticket);
                localStorage.setItem('vq_partner_ticket_id', res.data.ticket.id);
                setShowSuccessScreen(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit verification request. Please verify file types and fields.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyBody.trim()) return;
        setReplying(true);
        try {
            const res = await axios.post(`/api/partner-support/chat/${ticket.id}/reply`, {
                body: replyBody
            });
            if (res.data.success) {
                setTicket(prev => ({
                    ...prev,
                    replies: [...prev.replies, res.data.reply]
                }));
                setReplyBody('');
            }
        } catch (err) {
            // Reply error
        } finally {
            setReplying(false);
        }
    };

    const handleReset = () => {
        localStorage.removeItem('vq_partner_ticket_id');
        setTicket(null);
        setName('');
        setEmail('');
        setMessage('');
        setPurchaseSource('');
        setAttachment(null);
        setAttachmentName('');
        setShowSuccessScreen(false);
    };

    return (
        <MarketingLayout
            title="VIP Partner Support Desk — VenQore"
            description="Verification & licensing support desk for operators using offline digital package solutions."
        >
            <section className="relative pt-40 pb-24 px-6 min-h-screen flex items-center justify-center">
                {/* Background lighting */}
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />

                <div className="max-w-4xl w-full mx-auto relative z-10">
                    <RevealOnScroll>
                        <div className="text-center mb-8">
                            <SectionLabel icon={MessageSquare}>VIP Partner Desk</SectionLabel>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-tight mt-4 mb-4 font-display">
                                <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">Partner & Owner</span>{''}
                                <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent vq-text-glow">Support Desk.</span>
                            </h1>
                            <p className="text-ink-muted text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                                Submit your digital product purchase details below. We manually verify details on our backend and credit your cloud store dashboard automatically.
                            </p>
                        </div>
                    </RevealOnScroll>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-brand-500 mb-4" size={40} />
                            <p className="text-ink-muted text-sm">Uploading details and securing communication link...</p>
                        </div>
                    ) : showSuccessScreen ? (
                        <RevealOnScroll>
                            <GlassCard className="p-8 border border-emerald-500/20 bg-neutral-900/60 backdrop-blur-xl rounded-xl shadow-2xl text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-ink">Thank you for your purchase!</h2>
                                    <p className="text-ink-muted text-sm max-w-lg mx-auto leading-relaxed">
                                        We have received your verification request. Our systems will manually review your uploaded invoice and confirm your account eligibility. 
                                        This verification process typically takes <strong>1 to 2 business days</strong>.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-brand-950/20 border border-brand-500/10 text-left max-w-xl mx-auto space-y-3">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Next Action Required:</span>
                                    <p className="text-ink-secondary text-xs leading-relaxed">
                                        Please make sure you register your store on the cloud website using the <strong>EXACT SAME EMAIL</strong> address ({ticket?.requester_email}) you provided in this form. 
                                        Once verified, we will automatically credit the bonus trial days to your dashboard.
                                    </p>
                                    <div className="pt-2">
                                        <a
                                            href="/register"
                                            target="_blank"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-300 transition-colors"
                                        >
                                            Create / Register Your New Store <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-center gap-4">
                                    <button
                                        onClick={() => setShowSuccessScreen(false)}
                                        className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Go to Active Chat Thread
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="px-6 py-3 bg-sunken dark:bg-white/5 border border-line dark:border-white/10 hover:bg-white/10 text-ink rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Submit Another Verification
                                    </button>
                                </div>
                            </GlassCard>
                        </RevealOnScroll>
                    ) : ticket ? (
                        // ── CHAT SCREEN ──
                        <RevealOnScroll delay={0.1}>
                            <GlassCard className="p-8 border border-white/[0.06] bg-neutral-900/40 backdrop-blur-xl rounded-xl shadow-2xl relative">
                                <div className="flex items-center justify-between border-b border-line dark:border-white/5 pb-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-ink">{ticket.requester_name}</h3>
                                            <p className="text-ink-muted text-xs">{ticket.requester_email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-xs text-ink-muted hover:text-white flex items-center gap-1.5 transition-colors"
                                    >
                                        <ArrowLeft size={14} /> New Session
                                    </button>
                                </div>

                                {/* Chat Transcript */}
                                <div className="h-96 overflow-y-auto space-y-4 pr-2 mb-6 custom-scrollbar">
                                    {ticket.replies && ticket.replies.map((reply, idx) => (
                                        <div key={idx} className={`flex ${reply.is_platform_owner ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed border ${
                                                reply.is_platform_owner
                                                    ? 'bg-neutral-800 border-neutral-700/50 text-neutral-200 rounded-tl-none'
                                                    : 'bg-brand-600/10 border-brand-500/20 text-brand-200 rounded-tr-none'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1.5 text-3xs font-bold uppercase tracking-wider">
                                                    {reply.is_platform_owner ? (
                                                        <span className="text-brand-600 dark:text-brand-400">Engineering Team (Owner)</span>
                                                    ) : (
                                                        <span className="text-ink-muted">You (Partner)</span>
                                                    )}
                                                </div>
                                                <p className="whitespace-pre-wrap">{reply.body}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Form Input */}
                                <form onSubmit={handleSendReply} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={replyBody}
                                        onChange={e => setReplyBody(e.target.value)}
                                        placeholder="Type support reply message..."
                                        className="flex-1 px-5 py-4 bg-white/[0.03] border border-white/[0.06] focus:border-brand-500/40 rounded-2xl text-ink text-sm outline-none transition-all duration-slow"
                                    />
                                    <button
                                        type="submit"
                                        disabled={replying || !replyBody.trim()}
                                        className="w-14 h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-40"
                                    >
                                        {replying ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </button>
                                </form>
                            </GlassCard>
                        </RevealOnScroll>
                    ) : (
                        // ── FORM SCREEN ──
                        <RevealOnScroll delay={0.1}>
                            <GlassCard className="p-8 border border-white/[0.06] bg-neutral-900/40 backdrop-blur-xl rounded-xl shadow-2xl">
                                <form onSubmit={handleStartChat} className="space-y-6">
                                    {error && (
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Purchase Name */}
                                        <div className="relative group">
                                            <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                                Purchase Roster Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Exact name used during check-out"
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower"
                                            />
                                        </div>

                                        {/* Purchase Email */}
                                        <div className="relative group">
                                            <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                                Purchase Email Address
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="Email used during check-out"
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Purchase Source Platform */}
                                        <div className="relative group">
                                            <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                                Purchased From (Platform)
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={purchaseSource}
                                                onChange={e => setPurchaseSource(e.target.value)}
                                                placeholder="e.g. Etsy, VIP Partner Marketplace"
                                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower"
                                            />
                                        </div>

                                        {/* Invoice File Attachment */}
                                        <div className="relative group">
                                            <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted">
                                                Upload Purchase Invoice (JPG/PNG/PDF)
                                            </label>
                                            <div className="relative w-full h-14 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 rounded-2xl flex items-center justify-between px-5 transition-all duration-slower cursor-pointer overflow-hidden">
                                                <input
                                                    type="file"
                                                    required
                                                    onChange={handleFileChange}
                                                    accept=".jpg,.jpeg,.png,.pdf,.zip,.txt,.doc,.docx"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                                <span className="text-ink-muted text-xs truncate max-w-[200px]">
                                                    {attachmentName || 'Select invoice file...'}
                                                </span>
                                                <Upload size={16} className="text-ink-muted" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trial Status Cards Selection */}
                                    <div className="space-y-3">
                                        <label className="block text-2xs font-bold uppercase tracking-[0.25em] text-ink-muted">
                                            Trial Status Option
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setTrialStatus('started')}
                                                className={`w-full p-5 rounded-2xl border text-left transition-all duration-slow flex flex-col gap-1 ${
                                                    trialStatus === 'started'
                                                        ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-lg'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-ink-muted hover:border-white/10 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-xs font-bold uppercase tracking-wider ${trialStatus === 'started' ? 'text-brand-400' : 'text-neutral-200'}`}>
                                                    Started 14-day trial
                                                </span>
                                                <span className="text-1xs leading-relaxed opacity-85">Get extra 30 days added onto your existing account.</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setTrialStatus('not_started')}
                                                className={`w-full p-5 rounded-2xl border text-left transition-all duration-slow flex flex-col gap-1 ${
                                                    trialStatus === 'not_started'
                                                        ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-lg'
                                                        : 'bg-white/[0.02] border-white/[0.06] text-ink-muted hover:border-white/10 hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <span className={`text-xs font-bold uppercase tracking-wider ${trialStatus === 'not_started' ? 'text-brand-400' : 'text-neutral-200'}`}>
                                                    I haven't started trial yet
                                                </span>
                                                <span className="text-1xs leading-relaxed opacity-85">Get a brand new store loaded with 45 full days of access.</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warnings Disclaimer */}
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 text-ink-muted text-xs leading-relaxed">
                                        <Shield size={24} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Verification Check Guarantee:</strong> Every request is manually matched against platform transaction ledgers. False entries or billing logs will trigger security rejection and platform access bans.
                                        </p>
                                    </div>

                                    {/* Optional message */}
                                    <div className="relative group">
                                        <label className="block text-2xs font-bold uppercase tracking-[0.25em] mb-3 text-ink-muted group-focus-within:text-brand-400 transition-colors">
                                            Additional Comments (Optional)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Any comments, requests or license numbers you want to include..."
                                            className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-brand-500/40 focus:bg-brand-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-slower resize-none"
                                        />
                                    </div>

                                    <MagneticButton
                                        type="submit"
                                        disabled={loading}
                                        variant="indigo"
                                        className="w-full h-14 rounded-2xl font-bold text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-colors shadow-lg disabled:opacity-50 group"
                                    >
                                        Submit License Details
                                    </MagneticButton>
                                </form>
                            </GlassCard>
                        </RevealOnScroll>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
