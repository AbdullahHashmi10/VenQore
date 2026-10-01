import React, { useState, useEffect, useRef } from 'react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
import { Head } from '@inertiajs/react';
import { 
    MessageSquare, Settings, RefreshCw, Send, CheckCircle, 
    User, Search, Loader2, Package, Clock, ShieldCheck, Upload, Trash2, Plus, Globe, Layers, AlertCircle, Edit2
} from 'lucide-react';
import axios from 'axios';

export default function Index({ stats }) {
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
            if (res.data.success) {
                setChats(res.data.chats);
                if (selectedChat) {
                    const updated = res.data.chats.find(c => c.id === selectedChat.id);
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
            if (res.data.success) {
                setProducts(res.data.products);
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
            if (res.data.success) {
                setChats(res.data.chats);
                const updated = res.data.chats.find(c => c.id === id);
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
            if (res.data.success) {
                const newReply = res.data.reply;
                setSelectedChat(prev => ({
                    ...prev,
                    replies: [...prev.replies, newReply]
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
            if (res.data.success) {
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

        // Filter empty link lists
        const filteredPlatforms = platformsList.filter(p => p.name.trim() !== '' && p.link.trim() !== '');

        try {
            let res;
            if (editingProduct) {
                // Update mode
                res = await axios.post(`/VenQore/digital-hub/products/${editingProduct.id}/update`, {
                    name: newProductName,
                    description: newProductDesc,
                    version: newProductVersion,
                    status: newProductStatus,
                    platforms: filteredPlatforms,
                });
            } else {
                // Create mode
                res = await axios.post('/VenQore/digital-hub/products', {
                    name: newProductName,
                    description: newProductDesc,
                    version: newProductVersion,
                    status: newProductStatus,
                    platforms: filteredPlatforms,
                });
            }

            if (res.data.success) {
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
            if (res.data.success) {
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

    const filteredChats = chats.filter(c => 
        c.requester_name.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.requester_email.toLowerCase().includes(chatSearch.toLowerCase()) ||
        c.message.toLowerCase().includes(chatSearch.toLowerCase())
    );

    return (
        <OneGlanceLayout mode="admin" activeMenu="Digital Products" title="Digital Products & Registry Hub">
            <Head title="Digital Products Hub" />

            <div className="space-y-6">
                {/* Hub Header Card */}
                <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">VenQore Master Registry Control</h2>
                        <p className="text-ink-muted text-sm max-w-xl">
                            Communicate directly with offline license buyers using the Etsy Partner Support desk or manage listings on the public digital catalog catalog.
                        </p>
                    </div>
                    <div className="flex gap-4 self-stretch md:self-auto">
                        <div className="px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex-1 md:flex-none text-center">
                            <span className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1">Active Chats</span>
                            <span className="text-xl font-bold text-brand-400">{stats.open_chats}</span>
                        </div>
                        <div className="px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex-1 md:flex-none text-center">
                            <span className="block text-2xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Products</span>
                            <span className="text-xl font-bold text-emerald-400">{products.length}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs selection */}
                <div className="flex border-b border-neutral-800 gap-6">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`pb-4 text-sm font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'chats'
                                ? 'border-brand-500 text-white'
                                : 'border-transparent text-ink-muted hover:text-neutral-300'
                        }`}
                    >
                        <MessageSquare size={16} />
                        Partner Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`pb-4 text-sm font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === 'products'
                                ? 'border-brand-500 text-white'
                                : 'border-transparent text-ink-muted hover:text-neutral-300'
                        }`}
                    >
                        <Package size={16} />
                        Manage Digital Catalog
                    </button>
                </div>

                {/* Tab content area */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden min-h-[500px]">
                    {activeTab === 'chats' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 h-[600px] divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
                            {/* Left Side: Ticket List */}
                            <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                                <div className="p-4 bg-sunken border-b border-neutral-800 flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-3.5 text-ink-secondary" size={16} />
                                        <input
                                            type="text"
                                            value={chatSearch}
                                            onChange={e => setChatSearch(e.target.value)}
                                            placeholder="Search partner chats..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-ink-secondary outline-none focus:border-brand-500/50"
                                        />
                                    </div>
                                    <button 
                                        onClick={loadChats}
                                        disabled={loadingChats}
                                        className="p-3 bg-sunken border border-neutral-800 hover:bg-interactive-hover rounded-xl transition-colors text-ink-muted hover:text-white"
                                    >
                                        <RefreshCw size={14} className={loadingChats ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40 custom-scrollbar">
                                    {loadingChats ? (
                                        <div className="p-8 text-center text-ink-muted text-xs">Loading active channels...</div>
                                    ) : filteredChats.length === 0 ? (
                                        <div className="p-8 text-center text-ink-muted text-xs">No active chat requests found.</div>
                                    ) : (
                                        filteredChats.map(chat => (
                                            <div
                                                key={chat.id}
                                                onClick={() => setSelectedChat(chat)}
                                                className={`p-4 cursor-pointer hover:bg-interactive-hover transition-colors flex flex-col gap-2 ${
                                                    selectedChat?.id === chat.id ? 'bg-neutral-800/60' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm text-neutral-200">{chat.requester_name}</span>
                                                    <span className={`text-3xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                                                        chat.status === 'open'
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            : chat.status === 'in_progress'
                                                            ? 'bg-brand-500/10 border-brand-500/20 text-brand-400'
                                                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                        {chat.status}
                                                    </span>
                                                </div>
                                                <div className="text-ink-muted text-xs truncate">{chat.message}</div>
                                                <div className="flex items-center text-2xs text-ink-muted gap-1.5 mt-1">
                                                    <Clock size={10} />
                                                    <span>Updated {new Date(chat.updated_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Chat Console */}
                            <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-sunken">
                                {selectedChat ? (
                                    <>
                                        {/* Console Header */}
                                        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-white text-base">{selectedChat.requester_name}</h3>
                                                <p className="text-ink-muted text-xs">{selectedChat.requester_email}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedChat.status !== 'resolved' && selectedChat.status !== 'closed' ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(selectedChat.id, 'resolved')}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                                                    >
                                                        <CheckCircle size={14} />
                                                        Mark Resolved
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpdateStatus(selectedChat.id, 'in_progress')}
                                                        className="px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        Reopen Ticket
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* VIP Details Banner */}
                                        <div className="px-6 py-4 bg-neutral-950/40 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                                            <div className="flex flex-wrap gap-6">
                                                <div>
                                                    <span className="text-ink-muted block text-3xs font-bold uppercase tracking-wider mb-0.5">Purchase Platform Source</span>
                                                    <span className="text-white font-bold">{selectedChat.purchase_source || 'Unknown / General'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-ink-muted block text-3xs font-bold uppercase tracking-wider mb-0.5">Trial Selection Preference</span>
                                                    <span className={`font-bold uppercase text-2xs ${selectedChat.trial_status === 'started' ? 'text-brand-400' : 'text-emerald-400'}`}>
                                                        {selectedChat.trial_status === 'started' ? 'Already Started Trial (+30 days credit)' : 'Not Started Trial (Full 45 days store)'}
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedChat.attachment_path && (
                                                <a
                                                    href={selectedChat.attachment_path}
                                                    target="_blank"
                                                    className="px-3.5 py-1.5 bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 text-brand-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                                                >
                                                    <Upload size={12} />
                                                    View Invoice Attachment
                                                </a>
                                            )}
                                        </div>

                                        {/* Messages area */}
                                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-950/40 custom-scrollbar">
                                            {selectedChat.replies && selectedChat.replies.map((reply, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex ${reply.is_platform_owner ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed border ${
                                                        reply.is_platform_owner
                                                            ? 'bg-brand-600/10 border-brand-500/20 text-brand-200 rounded-tr-none'
                                                            : 'bg-neutral-800/60 border-neutral-700/50 text-neutral-300 rounded-tl-none'
                                                    }`}>
                                                        <div className="flex items-center gap-1.5 mb-1 text-2xs">
                                                            {reply.is_platform_owner ? (
                                                                <span className="font-bold text-brand-400 uppercase tracking-widest">Hashmi Dashboard</span>
                                                            ) : (
                                                                <span className="font-bold text-ink-muted">Partner Operator</span>
                                                            )}
                                                            <span className="text-3xs text-ink-muted ml-auto">
                                                                {new Date(reply.created_at).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <p className="whitespace-pre-wrap">{reply.body}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>

                                        {/* Input Box */}
                                        <form onSubmit={handleSendReply} className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center gap-3">
                                            <input
                                                type="text"
                                                value={replyBody}
                                                onChange={e => setReplyBody(e.target.value)}
                                                placeholder="Type partner message response..."
                                                disabled={sendingReply || selectedChat.status === 'closed'}
                                                className="flex-1 px-5 py-3.5 bg-sunken border border-neutral-800 rounded-xl text-white text-xs outline-none focus:border-brand-500/50 transition-colors"
                                            />
                                            <button
                                                type="submit"
                                                disabled={sendingReply || !replyBody.trim()}
                                                className="w-12 h-12 bg-brand-600 hover:bg-brand-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
                                            >
                                                {sendingReply ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Send size={16} />
                                                )}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-ink-muted text-xs">
                                        <MessageSquare size={32} className="text-ink-secondary mb-3" />
                                        <span>Select a chat thread from the column list to start messaging</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800 min-h-[500px]">
                            {/* Left Side: Create/Edit form */}
                            <div className="lg:col-span-5 p-6 space-y-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Plus size={16} className="text-brand-400" />
                                        {editingProduct ? `Edit Digital Product` : `Add New Digital Product`}
                                    </span>
                                    {editingProduct && (
                                        <button
                                            onClick={resetForm}
                                            className="text-2xs text-ink-muted hover:text-white uppercase tracking-wider font-bold"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </h3>

                                <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                                    <div className="space-y-1.5">
                                        <label className="text-ink-muted font-bold block">Product Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProductName}
                                            onChange={e => setNewProductName(e.target.value)}
                                            placeholder="e.g. Cafe Quick POS station"
                                            className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-ink-muted font-bold block">Product Description</label>
                                        <textarea
                                            rows={3}
                                            value={newProductDesc}
                                            onChange={e => setNewProductDesc(e.target.value)}
                                            placeholder="Detailed description of functionalities..."
                                            className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50 resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-ink-muted font-bold block">Version / Tag</label>
                                            <input
                                                type="text"
                                                value={newProductVersion}
                                                onChange={e => setNewProductVersion(e.target.value)}
                                                placeholder="v1.0.0 or Coming Soon"
                                                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-ink-muted font-bold block">Development Status</label>
                                            <select
                                                value={newProductStatus}
                                                onChange={e => setNewProductStatus(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none cursor-pointer focus:border-brand-500/50"
                                            >
                                                <option value="active">Done / Operational</option>
                                                <option value="dev">In Development</option>
                                                <option value="soon">Coming Soon</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Platform links */}
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-ink-muted font-bold">Platform Purchase Links</label>
                                            <button
                                                type="button"
                                                onClick={addPlatformField}
                                                className="text-2xs text-brand-400 hover:text-brand-300 font-bold uppercase tracking-wider"
                                            >
                                                + Add Platform
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {platformsList.map((plat, idx) => (
                                                <div key={idx} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                                                    <input
                                                        type="text"
                                                        value={plat.name}
                                                        onChange={e => updatePlatformItem(idx, 'name', e.target.value)}
                                                        placeholder="Platform (e.g. Etsy)"
                                                        className="w-full sm:w-1/4 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50 text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={plat.label || ''}
                                                        onChange={e => updatePlatformItem(idx, 'label', e.target.value)}
                                                        placeholder="Button Label (e.g. Buy it on Etsy)"
                                                        className="w-full sm:w-1/3 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50 text-xs"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={plat.link}
                                                        onChange={e => updatePlatformItem(idx, 'link', e.target.value)}
                                                        placeholder="Purchase URL link..."
                                                        className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white outline-none focus:border-brand-500/50 text-xs"
                                                    />
                                                    {platformsList.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePlatformField(idx)}
                                                            className="text-red-400 hover:text-red-300 p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-colors shadow-lg uppercase tracking-wider text-xs"
                                    >
                                        {editingProduct ? 'Update Product Listing' : 'Save Product Listing'}
                                    </button>
                                </form>
                            </div>

                            {/* Right Side: Products list */}
                            <div className="lg:col-span-7 p-6 flex flex-col h-full overflow-hidden">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <Layers size={16} className="text-brand-400" />
                                    Active Digital Catalog ({products.length})
                                </h3>

                                <div className="space-y-3 overflow-y-auto max-h-[420px] custom-scrollbar pr-2">
                                    {loadingProducts ? (
                                        <div className="p-8 text-center text-ink-muted text-xs">Loading products catalog...</div>
                                    ) : products.length === 0 ? (
                                        <div className="p-8 text-center text-ink-muted text-xs">No products cataloged. Add your first listing using the left panel.</div>
                                    ) : (
                                        products.map(prod => (
                                            <div 
                                                key={prod.id}
                                                className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                                                    editingProduct?.id === prod.id
                                                        ? 'bg-brand-500/5 border-brand-500/30'
                                                        : 'bg-neutral-950/40 border-neutral-800'
                                                }`}
                                            >
                                                <div className="space-y-1 text-xs flex-1 cursor-pointer" onClick={() => handleStartEdit(prod)}>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-sm hover:text-brand-400 transition-colors flex items-center gap-1.5">
                                                            {prod.name}
                                                            <Edit2 size={12} className="text-ink-muted" />
                                                        </h4>
                                                        <span className="text-2xs font-mono text-ink-muted">{prod.version}</span>
                                                    </div>
                                                    <p className="text-ink-muted line-clamp-2 leading-relaxed">{prod.description}</p>
                                                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${
                                                            prod.status === 'active' 
                                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                                : prod.status === 'dev'
                                                                ? 'bg-brand-500/10 border-brand-500/25 text-brand-400'
                                                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                        }`}>
                                                            {prod.status === 'active' ? 'Operational' : prod.status === 'dev' ? 'In Dev' : 'Coming Soon'}
                                                        </span>
                                                        {prod.platforms && prod.platforms.map((plat, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-ink-muted text-3xs">
                                                                {plat.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteProduct(prod.id)}
                                                    className="text-red-400 hover:text-red-300 p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
