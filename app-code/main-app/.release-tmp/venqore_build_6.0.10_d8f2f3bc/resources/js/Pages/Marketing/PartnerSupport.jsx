import React, { useState, useEffect, useRef } from 'react';
import MarketingLayout from './Shared/MarketingLayout';
import { MessageSquare, Send, CheckCircle2, Loader2, ArrowLeft, RefreshCw, User, Shield, Upload, FileText, ExternalLink } from 'lucide-react';
import axios from 'axios';
import useTurnstile from '@/Components/Builder/useTurnstile';

export default function PartnerSupport() {
    // Bot check (2026-09-10): starting a chat is guarded by the `turnstile` middleware.
    const getTurnstileToken = useTurnstile();
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
            const tt = await getTurnstileToken();
            if (tt) formData.append('cf-turnstile-response', tt);
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
            <section className="vq-section vq-mkt-hero vq-psd">
                <div className="vq-container" style={{ maxWidth: 920 }}>
                    <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 'var(--vq-space-10)' }}>
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">VIP partner desk</span>
                        <h1 className="vq-display vq-mt-4">Partner &amp; owner support desk</h1>
                        <p className="vq-lede">
                            Submit your digital product purchase details below. We manually verify details on our backend and credit your cloud store dashboard automatically.
                        </p>
                    </div>

                    {loading ? (
                        <div className="vq-card vq-card--xl vq-center" style={{ paddingBlock: 'var(--vq-space-16)' }}>
                            <Loader2 className="animate-spin vq-accent-text" size={40} style={{ margin: '0 auto var(--vq-space-4)' }} aria-hidden="true" />
                            <p className="vq-body vq-text-2" style={{ marginInline: 'auto' }}>Uploading details and securing communication link...</p>
                        </div>
                    ) : showSuccessScreen ? (
                        <div className="vq-card vq-card--xl vq-mkt-form vq-center">
                            <span className="vq-lead__icon vq-lead__icon--ok"><CheckCircle2 size={32} aria-hidden="true" /></span>
                            <h2 className="vq-h2 vq-mt-6">Thank you for your purchase!</h2>
                            <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>
                                We have received your verification request. Our systems will manually review your uploaded invoice and confirm your account eligibility.
                                This verification process typically takes <strong>1 to 2 business days</strong>.
                            </p>

                            <div className="vq-psd__next vq-mt-8">
                                <span className="vq-eyebrow vq-eyebrow--accent">Next action required</span>
                                <p className="vq-small vq-text-2 vq-mt-2" style={{ lineHeight: 1.65 }}>
                                    Please make sure you register your store on the cloud website using the <strong>EXACT SAME EMAIL</strong> address ({ticket?.requester_email}) you provided in this form.
                                    Once verified, we will automatically credit the bonus trial days to your dashboard.
                                </p>
                                <a href="/register" target="_blank" className="vq-link vq-mt-3">
                                    Create / register your new store <ExternalLink size={14} aria-hidden="true" />
                                </a>
                            </div>

                            <div className="vq-row vq-wrap vq-gap-3 vq-mt-8" style={{ justifyContent: 'center' }}>
                                <button type="button" onClick={() => setShowSuccessScreen(false)} className="vq-btn vq-btn--primary vq-btn--lg">
                                    Go to active chat thread
                                </button>
                                <button type="button" onClick={handleReset} className="vq-btn vq-btn--secondary vq-btn--lg">
                                    Submit another verification
                                </button>
                            </div>
                        </div>
                    ) : ticket ? (
                        // ── CHAT SCREEN ──
                        <div className="vq-card vq-card--xl vq-mkt-form">
                            <div className="vq-psd__chat-head">
                                <div className="vq-row vq-gap-3">
                                    <span className="vq-tile__icon" style={{ marginBottom: 0 }}><User aria-hidden="true" /></span>
                                    <div>
                                        <h2 className="vq-psd__who">{ticket.requester_name}</h2>
                                        <p className="vq-caption">{ticket.requester_email}</p>
                                    </div>
                                </div>
                                <button type="button" onClick={handleReset} className="vq-btn vq-btn--ghost vq-btn--sm">
                                    <ArrowLeft size={14} aria-hidden="true" /> New session
                                </button>
                            </div>

                            {/* Chat transcript */}
                            <div className="vq-psd__thread custom-scrollbar">
                                {ticket.replies && ticket.replies.map((reply, idx) => (
                                    <div key={idx} className={`vq-psd__msg ${reply.is_platform_owner ? 'vq-psd__msg--them' : 'vq-psd__msg--me'}`}>
                                        <div className="vq-psd__bubble">
                                            <span className="vq-psd__from">
                                                {reply.is_platform_owner ? 'Engineering team (owner)' : 'You (partner)'}
                                            </span>
                                            <p className="whitespace-pre-wrap">{reply.body}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Reply */}
                            <form onSubmit={handleSendReply} className="vq-row vq-gap-3">
                                <label htmlFor="psd-reply" className="vq-sr">Reply</label>
                                <input
                                    id="psd-reply"
                                    type="text"
                                    value={replyBody}
                                    onChange={e => setReplyBody(e.target.value)}
                                    placeholder="Type support reply message..."
                                    className="vq-input"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="submit"
                                    disabled={replying || !replyBody.trim()}
                                    className="vq-btn vq-btn--primary vq-btn--lg"
                                    aria-label="Send reply"
                                >
                                    {replying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </form>
                        </div>
                    ) : (
                        // ── FORM SCREEN ──
                        <div className="vq-card vq-card--xl vq-mkt-form">
                            <form onSubmit={handleStartChat} className="vq-mkt-form__grid">
                                {error && (
                                    <div className="vq-mkt-form__full vq-psd__alert" role="alert">{error}</div>
                                )}

                                <div className="vq-field">
                                    <label htmlFor="psd-name" className="vq-label">Purchase roster name</label>
                                    <input id="psd-name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Exact name used during check-out" className="vq-input" />
                                </div>

                                <div className="vq-field">
                                    <label htmlFor="psd-email" className="vq-label">Purchase email address</label>
                                    <input id="psd-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email used during check-out" className="vq-input" />
                                </div>

                                <div className="vq-field">
                                    <label htmlFor="psd-source" className="vq-label">Purchased from (platform)</label>
                                    <input id="psd-source" type="text" required value={purchaseSource} onChange={e => setPurchaseSource(e.target.value)} placeholder="e.g. Etsy, VIP Partner Marketplace" className="vq-input" />
                                </div>

                                <div className="vq-field">
                                    <label htmlFor="psd-file" className="vq-label">Upload purchase invoice (JPG/PNG/PDF)</label>
                                    <div className="vq-psd__file">
                                        <input
                                            id="psd-file"
                                            type="file"
                                            required
                                            onChange={handleFileChange}
                                            accept=".jpg,.jpeg,.png,.pdf,.zip,.txt,.doc,.docx"
                                        />
                                        <span>{attachmentName || 'Select invoice file...'}</span>
                                        <Upload size={18} aria-hidden="true" />
                                    </div>
                                </div>

                                {/* Trial status */}
                                <fieldset className="vq-mkt-form__full vq-psd__choices">
                                    <legend className="vq-label">Trial status option</legend>
                                    <div className="vq-grid vq-grid--2 vq-mt-2" style={{ gap: 'var(--vq-space-4)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setTrialStatus('started')}
                                            aria-pressed={trialStatus === 'started'}
                                            className="vq-psd__choice"
                                        >
                                            <span className="vq-psd__choice-title">Started 14-day trial</span>
                                            <span className="vq-psd__choice-body">Get extra 30 days added onto your existing account.</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTrialStatus('not_started')}
                                            aria-pressed={trialStatus === 'not_started'}
                                            className="vq-psd__choice"
                                        >
                                            <span className="vq-psd__choice-title">I haven't started trial yet</span>
                                            <span className="vq-psd__choice-body">Get a brand new store loaded with 45 full days of access.</span>
                                        </button>
                                    </div>
                                </fieldset>

                                {/* Verification note */}
                                <div className="vq-mkt-form__full vq-psd__warn">
                                    <Shield size={20} aria-hidden="true" />
                                    <p>
                                        <strong>Verification check guarantee:</strong> Every request is manually matched against platform transaction ledgers. False entries or billing logs will trigger security rejection and platform access bans.
                                    </p>
                                </div>

                                <div className="vq-field vq-mkt-form__full">
                                    <label htmlFor="psd-msg" className="vq-label">Additional comments <span className="vq-text-3">(optional)</span></label>
                                    <textarea id="psd-msg" rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Any comments, requests or license numbers you want to include..." className="vq-textarea" />
                                </div>

                                <div className="vq-mkt-form__full">
                                    <button type="submit" disabled={loading} className="vq-btn vq-btn--primary vq-btn--lg vq-btn--block">
                                        Submit license details
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
