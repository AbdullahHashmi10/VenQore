import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { useT, Panel, PageHeader, Badge, Button, Input, Field, Select, EmptyState, KpiCard, BRAND } from '@/Platform/ui';
import {
    MessageSquare, Settings, RefreshCw, Send, CheckCircle,
    User, Search, Loader2, Package, Clock, ShieldCheck, Upload,
    Trash2, Plus, Globe, Layers, AlertCircle, Edit2, ArrowLeft,
    CheckCircle2, ExternalLink
} from 'lucide-react';
import axios from 'axios';

export default function Index({ stats = {} }) {
    const t = useT();
    const [activeTab, setActiveTab] = useState('chats'); // chats | products
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);

    // Active chat details
    const [selectedChat, setSelectedChat] = useState(null);
    const [replyBody, setReplyBody] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Filters & Search
    const [chatSearch, setChatSearch] = useState('');

    // Product Catalog Management
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form fields
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProductName, setNewProductName] = useState('');
    const [newProductDesc, setNewProductDesc] = useState('');
    const [newProductVersion, setNewProductVersion] = useState('v1.0.0');
    const [newProductStatus, setNewProductStatus] = useState('active'); // active | dev | soon

    // Product Platform Links
    const [platformsList, setPlatformsList] = useState([{ name: '', label: '', link: '' }]);

    const chatEndRef = useRef(null);

    // Initial load
    useEffect(() => {
        loadChats();
        loadProducts();
    }, []);

    // Scroll to bottom of chat when replies update
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedChat?.replies]);

    // Poll active chat replies if selected
    useEffect(() => {
        if (!selectedChat) return;
        const interval = setInterval(() => {
            refreshSelectedChat(selectedChat.id);
        }, 5000);
        return () => clearInterval(interval);
    }, [selectedChat?.id]);

    const loadChats = async () => {
        setLoadingChats(true);
        try {
            const res = await axios.get('/VenQore/digital-hub/chats');
            if (res.data?.success) {
                setChats(res.data.chats || []);
                if (selectedChat) {
                    const updated = (res.data.chats || []).find(c => c.id === selectedChat.id);
                    if (updated) setSelectedChat(updated);
                }
            }
        } catch (err) {
            console.error('Failed loading chats', err);
        } finally {
            setLoadingChats(false);
        }
    };

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await axios.get('/VenQore/digital-hub/products');
            if (res.data?.success) {
                setProducts(res.data.products || []);
            }
        } catch (err) {
            console.error('Failed loading products', err);
        } finally {
            setLoadingProducts(false);
        }
    };

    const refreshSelectedChat = async (id) => {
        try {
            const res = await axios.get('/VenQore/digital-hub/chats');
            if (res.data?.success) {
                setChats(res.data.chats || []);
                const updated = (res.data.chats || []).find(c => c.id === id);
                if (updated) setSelectedChat(updated);
            }
        } catch (err) {
            // Ignore background error
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyBody.trim() || !selectedChat) return;
        setSendingReply(true);
        try {
            const res = await axios.post(`/VenQore/digital-hub/chats/${selectedChat.id}/reply`, {
                body: replyBody
            });
            if (res.data?.success) {
                const newReply = res.data.reply;
                setSelectedChat(prev => ({
                    ...prev,
                    replies: [...(prev.replies || []), newReply]
                }));
                setReplyBody('');
                loadChats();
            }
        } catch (err) {
            console.error('Reply failed', err);
        } finally {
            setSendingReply(false);
        }
    };

    const handleUpdateStatus = async (ticket_id, status) => {
        try {
            const res = await axios.post(`/VenQore/digital-hub/chats/${ticket_id}/status`, { status });
            if (res.data?.success) {
                loadChats();
                if (selectedChat && selectedChat.id === ticket_id) {
                    setSelectedChat(prev => ({ ...prev, status }));
                }
            }
        } catch (err) {
            console.error('Failed status update', err);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!newProductName.trim()) return;

        const filteredPlatforms = platformsList.filter(p => p.name.trim() !== '' && p.link.trim() !== '');

        try {
            let res;
            if (editingProduct) {
                res = await axios.post(`/VenQore/digital-hub/products/${editingProduct.id}/update`, {
                    name: newProductName,
                    description: newProductDesc,
                    version: newProductVersion,
                    status: newProductStatus,
                    platforms: filteredPlatforms,
                });
            } else {
                res = await axios.post('/VenQore/digital-hub/products', {
                    name: newProductName,
                    description: newProductDesc,
                    version: newProductVersion,
                    status: newProductStatus,
                    platforms: filteredPlatforms,
                });
            }

            if (res.data?.success) {
                resetForm();
                loadProducts();
            }
        } catch (err) {
            console.error('Product saving failed', err);
        }
    };

    const handleStartEdit = (prod) => {
        setEditingProduct(prod);
        setNewProductName(prod.name);
        setNewProductDesc(prod.description || '');
        setNewProductVersion(prod.version || 'v1.0.0');
        setNewProductStatus(prod.status || 'soon');

        if (prod.platforms && prod.platforms.length > 0) {
            setPlatformsList(prod.platforms);
        } else {
            setPlatformsList([{ name: '', label: '', link: '' }]);
        }
    };

    const resetForm = () => {
        setEditingProduct(null);
        setNewProductName('');
        setNewProductDesc('');
        setNewProductVersion('v1.0.0');
        setNewProductStatus('active');
        setPlatformsList([{ name: '', label: '', link: '' }]);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this digital product?')) return;
        try {
            const res = await axios.delete(`/VenQore/digital-hub/products/${id}`);
            if (res.data?.success) {
                loadProducts();
                if (editingProduct && editingProduct.id === id) {
                    resetForm();
                }
            }
        } catch (err) {
            console.error('Failed deleting product', err);
        }
    };

    const addPlatformField = () => {
        setPlatformsList([...platformsList, { name: '', label: '', link: '' }]);
    };

    const updatePlatformItem = (index, key, val) => {
        const updated = [...platformsList];
        updated[index][key] = val;
        setPlatformsList(updated);
    };

    const removePlatformField = (index) => {
        const updated = [...platformsList];
        updated.splice(index, 1);
        setPlatformsList(updated);
    };

    const filteredChats = useMemo(() => {
        return chats.filter(c =>
            c.requester_name?.toLowerCase().includes(chatSearch.toLowerCase()) ||
            c.requester_email?.toLowerCase().includes(chatSearch.toLowerCase()) ||
            c.message?.toLowerCase().includes(chatSearch.toLowerCase())
        );
    }, [chats, chatSearch]);

    const activeProductsCount = products.filter(p => p.status === 'active').length;

    return (
        <PlatformLayout title="Digital Products & Registry Hub">
            <Head title="Digital Products & Registry Hub — VenQore Platform" />

            <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Page Header ────────────────────────────────────────── */}
                <PageHeader
                    title="Digital Products & Registry Hub"
                    subtitle="Communicate directly with offline license buyers using the Partner Support desk and manage listings on the public digital catalog."
                    icon={Package}
                    accent={BRAND.indigo}
                    actions={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Link href={route('platform.dashboard')}>
                                <Button variant="secondary" icon={ArrowLeft} size="sm">
                                    Dashboard
                                </Button>
                            </Link>
                            <Button
                                variant="secondary"
                                icon={RefreshCw}
                                size="sm"
                                disabled={loadingChats || loadingProducts}
                                onClick={() => { loadChats(); loadProducts(); }}
                            >
                                Refresh
                            </Button>
                        </div>
                    }
                />

                {/* ── KPI Metrics Bar ────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <KpiCard
                        label="Active Support Chats"
                        value={stats.open_chats ?? chats.filter(c => c.status === 'open').length}
                        sub="Awaiting merchant response"
                        icon={MessageSquare}
                        accent={BRAND.amber}
                    />
                    <KpiCard
                        label="Digital Catalog Listings"
                        value={products.length}
                        sub="Registered software packages"
                        icon={Package}
                        accent={BRAND.indigo}
                    />
                    <KpiCard
                        label="Operational / Live"
                        value={activeProductsCount}
                        sub="Available in public registry"
                        icon={CheckCircle}
                        accent={BRAND.emerald}
                    />
                </div>

                {/* ── Tabs selection ─────────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${t.border}`,
                    gap: 8,
                    paddingBottom: 2,
                }}>
                    <button
                        onClick={() => setActiveTab('chats')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            fontSize: 13,
                            fontWeight: 800,
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === 'chats' ? BRAND.indigo : 'transparent'}`,
                            background: 'transparent',
                            color: activeTab === 'chats' ? t.ink : t.muted,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: -2,
                        }}
                    >
                        <MessageSquare size={16} style={{ color: activeTab === 'chats' ? BRAND.indigo : t.muted }} />
                        <span>Partner Support Chats</span>
                        <span style={{
                            fontSize: 11,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: activeTab === 'chats' ? `${BRAND.indigo}18` : t.inputBg,
                            color: activeTab === 'chats' ? BRAND.indigo : t.muted,
                            fontWeight: 700,
                        }}>
                            {chats.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            fontSize: 13,
                            fontWeight: 800,
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === 'products' ? BRAND.indigo : 'transparent'}`,
                            background: 'transparent',
                            color: activeTab === 'products' ? t.ink : t.muted,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            marginBottom: -2,
                        }}
                    >
                        <Package size={16} style={{ color: activeTab === 'products' ? BRAND.indigo : t.muted }} />
                        <span>Manage Digital Catalog</span>
                        <span style={{
                            fontSize: 11,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: activeTab === 'products' ? `${BRAND.indigo}18` : t.inputBg,
                            color: activeTab === 'products' ? BRAND.indigo : t.muted,
                            fontWeight: 700,
                        }}>
                            {products.length}
                        </span>
                    </button>
                </div>

                {/* ── Tab Content: Chats ─────────────────────────────────── */}
                {activeTab === 'chats' && (
                    <Panel pad={0} style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', minHeight: 620 }}>
                            {/* Left Side: Ticket List */}
                            <div style={{ borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', background: t.panel2 }}>
                                <div style={{ padding: 14, borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
                                        <Input
                                            value={chatSearch}
                                            onChange={e => setChatSearch(e.target.value)}
                                            placeholder="Search partner chats…"
                                            style={{ paddingLeft: 32, fontSize: 12.5 }}
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        icon={RefreshCw}
                                        onClick={loadChats}
                                        disabled={loadingChats}
                                    />
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {loadingChats ? (
                                        <div style={{ padding: 32, textAlign: 'center', color: t.muted, fontSize: 12 }}>
                                            Loading active channels…
                                        </div>
                                    ) : filteredChats.length === 0 ? (
                                        <div style={{ padding: 32, textAlign: 'center', color: t.muted, fontSize: 12 }}>
                                            No chat requests found.
                                        </div>
                                    ) : (
                                        filteredChats.map(chat => {
                                            const isSelected = selectedChat?.id === chat.id;
                                            const statusColor = chat.status === 'open' ? BRAND.amber : chat.status === 'in_progress' ? BRAND.indigo : BRAND.emerald;

                                            return (
                                                <div
                                                    key={chat.id}
                                                    onClick={() => setSelectedChat(chat)}
                                                    style={{
                                                        padding: '14px 16px',
                                                        borderBottom: `1px solid ${t.border}`,
                                                        cursor: 'pointer',
                                                        background: isSelected ? t.hover : 'transparent',
                                                        borderLeft: isSelected ? `4px solid ${BRAND.indigo}` : '4px solid transparent',
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 800, color: t.ink }}>
                                                            {chat.requester_name}
                                                        </span>
                                                        <Badge color={statusColor} tone="soft">
                                                            {chat.status}
                                                        </Badge>
                                                    </div>

                                                    <div style={{ fontSize: 12, color: t.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                                                        {chat.message}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.muted, fontFamily: 'monospace' }}>
                                                        <Clock size={11} />
                                                        <span>{new Date(chat.updated_at).toLocaleDateString()} {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Chat Console */}
                            <div style={{ display: 'flex', flexDirection: 'column', background: t.panel }}>
                                {selectedChat ? (
                                    <>
                                        {/* Console Header */}
                                        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: t.panel2 }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: t.ink }}>
                                                    {selectedChat.requester_name}
                                                </h3>
                                                <p style={{ margin: '2px 0 0', fontSize: 12, color: t.muted }}>
                                                    {selectedChat.requester_email}
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {selectedChat.status !== 'resolved' && selectedChat.status !== 'closed' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="success"
                                                        icon={CheckCircle}
                                                        onClick={() => handleUpdateStatus(selectedChat.id, 'resolved')}
                                                    >
                                                        Mark Resolved
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleUpdateStatus(selectedChat.id, 'in_progress')}
                                                    >
                                                        Reopen Ticket
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* VIP Details Banner */}
                                        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${t.border}`, background: t.inputBg, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
                                            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                                <div>
                                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: t.muted, display: 'block', marginBottom: 2 }}>
                                                        Purchase Source
                                                    </span>
                                                    <span style={{ fontWeight: 800, color: t.ink }}>
                                                        {selectedChat.purchase_source || 'Unknown / General'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: t.muted, display: 'block', marginBottom: 2 }}>
                                                        Trial Preference
                                                    </span>
                                                    <span style={{ fontWeight: 800, color: selectedChat.trial_status === 'started' ? BRAND.indigo : BRAND.emerald }}>
                                                        {selectedChat.trial_status === 'started' ? 'Already Started (+30 days credit)' : 'Not Started (Full 45 days store)'}
                                                    </span>
                                                </div>
                                            </div>

                                            {selectedChat.attachment_path && (
                                                <a
                                                    href={selectedChat.attachment_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <Button size="sm" variant="secondary" icon={Upload}>
                                                        View Invoice
                                                    </Button>
                                                </a>
                                            )}
                                        </div>

                                        {/* Messages area */}
                                        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {/* Original customer message */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                <div style={{
                                                    maxWidth: '75%',
                                                    borderRadius: 16,
                                                    borderTopLeftRadius: 4,
                                                    padding: '14px 18px',
                                                    background: t.panel2,
                                                    border: `1px solid ${t.border}`,
                                                    color: t.ink,
                                                    fontSize: 13,
                                                    lineHeight: 1.6,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4, fontSize: 11 }}>
                                                        <span style={{ fontWeight: 800, color: BRAND.sky }}>
                                                            {selectedChat.requester_name} (Initial Request)
                                                        </span>
                                                        <span style={{ color: t.muted, fontFamily: 'monospace' }}>
                                                            {new Date(selectedChat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedChat.message}</p>
                                                </div>
                                            </div>

                                            {/* Reply threads */}
                                            {selectedChat.replies && selectedChat.replies.map((reply, idx) => {
                                                const isOwner = reply.is_platform_owner;
                                                return (
                                                    <div
                                                        key={idx}
                                                        style={{ display: 'flex', justifyContent: isOwner ? 'flex-end' : 'flex-start' }}
                                                    >
                                                        <div style={{
                                                            maxWidth: '75%',
                                                            borderRadius: 16,
                                                            borderTopRightRadius: isOwner ? 4 : 16,
                                                            borderTopLeftRadius: !isOwner ? 4 : 16,
                                                            padding: '14px 18px',
                                                            background: isOwner ? `${BRAND.indigo}18` : t.panel2,
                                                            border: `1px solid ${isOwner ? `${BRAND.indigo}33` : t.border}`,
                                                            color: t.ink,
                                                            fontSize: 13,
                                                            lineHeight: 1.6,
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4, fontSize: 11 }}>
                                                                <span style={{ fontWeight: 800, color: isOwner ? BRAND.indigo : BRAND.sky }}>
                                                                    {isOwner ? 'Platform Operator (Hashmi HQ)' : selectedChat.requester_name}
                                                                </span>
                                                                <span style={{ color: t.muted, fontFamily: 'monospace' }}>
                                                                    {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{reply.body}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={chatEndRef} />
                                        </div>

                                        {/* Input Box */}
                                        <form onSubmit={handleSendReply} style={{ padding: 16, borderTop: `1px solid ${t.border}`, background: t.panel2, display: 'flex', gap: 10 }}>
                                            <Input
                                                value={replyBody}
                                                onChange={e => setReplyBody(e.target.value)}
                                                placeholder="Type partner message response…"
                                                disabled={sendingReply || selectedChat.status === 'closed'}
                                                style={{ flex: 1 }}
                                            />
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                icon={Send}
                                                disabled={sendingReply || !replyBody.trim()}
                                            >
                                                {sendingReply ? 'Sending…' : 'Reply'}
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <EmptyState
                                            icon={MessageSquare}
                                            title="No chat selected"
                                            message="Select a partner message thread from the left column to view conversation history and send responses."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>
                )}

                {/* ── Tab Content: Digital Catalog ──────────────────────── */}
                {activeTab === 'products' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: 20, alignItems: 'start' }}>
                        {/* Left Side: Create / Edit Form */}
                        <Panel pad={24}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Package size={18} style={{ color: BRAND.indigo }} />
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: t.ink }}>
                                        {editingProduct ? 'Edit Digital Product' : 'Add New Digital Product'}
                                    </h3>
                                </div>
                                {editingProduct && (
                                    <Button size="sm" variant="ghost" onClick={resetForm}>
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Field label="Product Name" hint="Official commercial package title">
                                    <Input
                                        required
                                        value={newProductName}
                                        onChange={e => setNewProductName(e.target.value)}
                                        placeholder="e.g. Cafe Quick POS station"
                                    />
                                </Field>

                                <Field label="Product Description" hint="Detailed feature set and functionalities">
                                    <textarea
                                        rows={3}
                                        value={newProductDesc}
                                        onChange={e => setNewProductDesc(e.target.value)}
                                        placeholder="Comprehensive breakdown of package offerings…"
                                        style={{
                                            width: '100%',
                                            padding: '10px 13px',
                                            fontSize: 13,
                                            borderRadius: 11,
                                            background: t.inputBg,
                                            color: t.ink,
                                            fontFamily: 'inherit',
                                            border: `1px solid ${t.inputBorder}`,
                                            outline: 'none',
                                            resize: 'vertical',
                                        }}
                                    />
                                </Field>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <Field label="Version / Release Tag">
                                        <Input
                                            value={newProductVersion}
                                            onChange={e => setNewProductVersion(e.target.value)}
                                            placeholder="v1.0.0"
                                        />
                                    </Field>

                                    <Field label="Deployment Status">
                                        <Select
                                            value={newProductStatus}
                                            onChange={e => setNewProductStatus(e.target.value)}
                                            options={[
                                                { value: 'active', label: 'Operational' },
                                                { value: 'dev', label: 'In Development' },
                                                { value: 'soon', label: 'Coming Soon' },
                                            ]}
                                        />
                                    </Field>
                                </div>

                                {/* Platform links */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>Platform Purchase Links</label>
                                        <button
                                            type="button"
                                            onClick={addPlatformField}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: BRAND.indigo,
                                                fontSize: 11.5,
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            + Add Link
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {platformsList.map((plat, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <Input
                                                    placeholder="Platform (e.g. Etsy)"
                                                    value={plat.name}
                                                    onChange={e => updatePlatformItem(idx, 'name', e.target.value)}
                                                    style={{ width: '28%' }}
                                                />
                                                <Input
                                                    placeholder="Label (Buy on Etsy)"
                                                    value={plat.label || ''}
                                                    onChange={e => updatePlatformItem(idx, 'label', e.target.value)}
                                                    style={{ width: '32%' }}
                                                />
                                                <Input
                                                    placeholder="URL link…"
                                                    value={plat.link}
                                                    onChange={e => updatePlatformItem(idx, 'link', e.target.value)}
                                                    style={{ flex: 1 }}
                                                />
                                                {platformsList.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePlatformField(idx)}
                                                        style={{
                                                            background: `${BRAND.rose}15`,
                                                            border: `1px solid ${BRAND.rose}33`,
                                                            color: BRAND.rose,
                                                            borderRadius: 8,
                                                            padding: 6,
                                                            cursor: 'pointer',
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    style={{ width: '100%', marginTop: 8 }}
                                >
                                    {editingProduct ? 'Update Listing' : 'Publish Product Listing'}
                                </Button>
                            </form>
                        </Panel>

                        {/* Right Side: Products list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: t.ink }}>
                                    Active Digital Catalog ({products.length})
                                </h3>
                            </div>

                            {loadingProducts ? (
                                <Panel pad={32} style={{ textAlign: 'center', color: t.muted }}>
                                    Loading products catalog…
                                </Panel>
                            ) : products.length === 0 ? (
                                <Panel pad={48}>
                                    <EmptyState
                                        icon={Package}
                                        title="No products cataloged"
                                        message="Add your first digital product offering using the form on the left."
                                    />
                                </Panel>
                            ) : (
                                products.map(prod => {
                                    const isBeingEdited = editingProduct?.id === prod.id;
                                    const statusColor = prod.status === 'active' ? BRAND.emerald : prod.status === 'dev' ? BRAND.indigo : BRAND.amber;
                                    const statusLabel = prod.status === 'active' ? 'Operational' : prod.status === 'dev' ? 'In Dev' : 'Coming Soon';

                                    return (
                                        <Panel
                                            key={prod.id}
                                            pad={18}
                                            style={{
                                                border: `1px solid ${isBeingEdited ? BRAND.indigo : t.border}`,
                                                background: isBeingEdited ? `${BRAND.indigo}0c` : t.panel,
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between',
                                                gap: 16,
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => handleStartEdit(prod)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: t.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {prod.name}
                                                        <Edit2 size={12} style={{ color: t.muted }} />
                                                    </h4>
                                                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: t.muted, background: t.inputBg, padding: '2px 6px', borderRadius: 6, border: `1px solid ${t.border}` }}>
                                                        {prod.version}
                                                    </span>
                                                </div>

                                                <p style={{ margin: '0 0 8px', fontSize: 12.5, color: t.sub, lineHeight: 1.5 }}>
                                                    {prod.description}
                                                </p>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <Badge color={statusColor} tone="soft">
                                                        {statusLabel}
                                                    </Badge>

                                                    {prod.platforms && prod.platforms.map((plat, i) => (
                                                        <a
                                                            key={i}
                                                            href={plat.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={e => e.stopPropagation()}
                                                            style={{
                                                                textDecoration: 'none',
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                color: t.muted,
                                                                background: t.inputBg,
                                                                padding: '3px 8px',
                                                                borderRadius: 6,
                                                                border: `1px solid ${t.border}`,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 4,
                                                            }}
                                                        >
                                                            <span>{plat.name}</span>
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => handleDeleteProduct(prod.id)}
                                                    style={{
                                                        background: `${BRAND.rose}15`,
                                                        border: `1px solid ${BRAND.rose}33`,
                                                        color: BRAND.rose,
                                                        borderRadius: 8,
                                                        padding: 8,
                                                        cursor: 'pointer',
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                    }}
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </Panel>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PlatformLayout>
    );
}
