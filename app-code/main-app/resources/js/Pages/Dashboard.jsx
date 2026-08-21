import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePermission } from '@/Hooks/usePermission';
import ReactGridLayout from 'react-grid-layout';
import useMeasure from 'react-use-measure';

import {
    Plus,
    Save,
    Lock,
    Unlock,
    RotateCcw,
    Globe,
    AlertCircle,
    Info,
    Layout
} from 'lucide-react';

import { getChartComponent } from '../Dashboard/chartRegistry';
import { gridProps, coerce, validate } from '../Dashboard/layoutLaw';
import DashboardCardFrame from '../Dashboard/components/DashboardCardFrame';
import DashboardBuilderSheet from '../Dashboard/components/DashboardBuilderSheet';
import DashboardCardEditor from '../Dashboard/components/DashboardCardEditor';
import axios from 'axios';

export default function Dashboard() {
    const { auth, store } = usePage().props;
    const { hasPerm, isAdmin } = usePermission();
    const [gridRef, { width }] = useMeasure();

    const [dashboards, setDashboards] = useState([]);
    const [currentDashboard, setCurrentDashboard] = useState(null);
    const [catalogue, setCatalogue] = useState([]);
    const [cardData, setCardData] = useState({});
    const [cardLoaders, setCardLoaders] = useState({});
    const [cardErrors, setCardErrors] = useState({});

    // Builder sheet & Edit states
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    // The card the editor is open on. `DashboardCardFrame` has accepted an
    // `onEdit` prop since it was written and nothing ever passed one, so a card
    // could be added and deleted but never edited — to change a period you
    // deleted the card and rebuilt it from step one.
    const [editingCardId, setEditingCardId] = useState(null);
    const [activeLayout, setActiveLayout] = useState([]);
    const [isSavingLayout, setIsSavingLayout] = useState(false);

    const isManager = isAdmin || hasPerm('admin.settings_manage');

    // 1. Initialise Dashboard, Layouts, and catalogue metadata
    useEffect(() => {
        loadDashboards();
        loadCatalogue();
    }, []);

    const loadDashboards = async () => {
        try {
            const res = await axios.get('/api/dashboards');
            setDashboards(res.data.data);
            if (res.data.data.length > 0) {
                // Default to first active or default dashboard
                const defaultDb = res.data.data.find(d => d.is_default) || res.data.data[0];
                loadDashboardDetail(defaultDb.id);
            }
        } catch (err) {
            console.error('Failed to load dashboards list', err);
        }
    };

    const loadCatalogue = async () => {
        try {
            const res = await axios.get('/api/reckoner/catalogue');
            setCatalogue(res.data.data);
        } catch (err) {
            console.error('Failed to load metrics catalogue', err);
        }
    };

    const loadDashboardDetail = async (id) => {
        try {
            const res = await axios.get(`/api/dashboards/${id}`);
            const db = res.data.data;
            setCurrentDashboard(db);
            
            // Map card structures for react-grid-layout
            const gridLayout = db.cards.map(c => ({
                i: c.id,
                x: c.x,
                y: c.y,
                w: c.w,
                h: c.h
            }));
            setActiveLayout(gridLayout);

            // Trigger batch reading for all cards
            fetchCardsData(db.cards);
        } catch (err) {
            console.error('Failed to load dashboard details', err);
        }
    };

    // 2. Batch read metrics values from backend Reckoner API
    const fetchCardsData = async (cards) => {
        if (!cards || cards.length === 0) return;

        // Set loaders
        const loaders = {};
        const errors = {};
        cards.forEach(c => {
            loaders[c.id] = true;
            errors[c.id] = false;
        });
        setCardLoaders(loaders);
        setCardErrors(errors);

        // Prepare requests
        const requests = cards.map(c => ({
            key: c.reading_key,
            period: c.period || 'today',
            custom: c.period_custom,
            granularity: c.granularity,
            args: c.args || {}
        }));

        try {
            const res = await axios.post('/api/reckoner/read', { requests });
            const results = res.data.data;

            const newData = {};
            const newLoaders = { ...loaders };
            
            cards.forEach((c, index) => {
                const result = results[index];
                if (result && result.ok) {
                    newData[c.id] = result.data;
                } else {
                    errors[c.id] = true;
                }
                newLoaders[c.id] = false;
            });

            setCardData(newData);
            setCardLoaders(newLoaders);
            setCardErrors(errors);
        } catch (err) {
            console.error('Failed to batch-read cards metrics values', err);
            const errStates = {};
            cards.forEach(c => {
                errStates[c.id] = true;
                loaders[c.id] = false;
            });
            setCardErrors(errStates);
            setCardLoaders(loaders);
        }
    };

    // 3. Grid interactions
    const handleLayoutChange = (layout) => {
        // Update layout coords locally
        setActiveLayout(layout);
    };

    const handleSaveLayout = async () => {
        if (!currentDashboard) return;
        setIsSavingLayout(true);

        const updatedCards = currentDashboard.cards.map(c => {
            const gridItem = activeLayout.find(item => item.i === c.id);
            return {
                ...c,
                x: gridItem ? gridItem.x : c.x,
                y: gridItem ? gridItem.y : c.y,
                w: gridItem ? gridItem.w : c.w,
                h: gridItem ? gridItem.h : c.h
            };
        });

        try {
            await axios.put(`/api/dashboards/${currentDashboard.id}/layout`, {
                cards: updatedCards
            });
            setIsSavingLayout(false);
            loadDashboardDetail(currentDashboard.id);
        } catch (err) {
            console.error('Failed to save layout coordinates', err);
            setIsSavingLayout(false);
        }
    };

    // 4. Card additions and deletions
    const handleAddCard = async (cardConfig) => {
        if (!currentDashboard) return;
        try {
            await axios.post(`/api/dashboards/${currentDashboard.id}/cards`, cardConfig);
            loadDashboardDetail(currentDashboard.id);
        } catch (err) {
            console.error('Failed to add card to dashboard', err);
        }
    };

    const handleRemoveCard = async (cardId) => {
        if (!currentDashboard) return;
        try {
            await axios.delete(`/api/dashboards/${currentDashboard.id}/cards/${cardId}`);
            loadDashboardDetail(currentDashboard.id);
        } catch (err) {
            console.error('Failed to remove card', err);
        }
    };

    /**
     * Save one card's edits.
     *
     * PATCH rather than delete-and-recreate, so the card keeps its id — which
     * matters because the id is what the layout coordinates, the loading state
     * and the data cache are all keyed on.
     *
     * Mechanism M1 is enforced server-side by LayoutLaw::enforceAccentBudget(),
     * but the accent is cleared here too: the reload is a round trip, and a
     * board that shows two accent cards for 200ms has told the user something
     * false about which number matters.
     */
    const handleUpdateCard = async (cardId, patch) => {
        if (!currentDashboard) return;

        if (patch.style?.accent) {
            setCurrentDashboard(d => ({
                ...d,
                cards: d.cards.map(c => c.id === cardId
                    ? c
                    : { ...c, style: { ...(c.style || {}), accent: false } }),
            }));
        }

        try {
            await axios.patch(`/api/dashboards/${currentDashboard.id}/cards/${cardId}`, patch);
            setEditingCardId(null);
            loadDashboardDetail(currentDashboard.id);
        } catch (err) {
            console.error('Failed to update card', err);
        }
    };

    // Which card currently holds the accent, so the editor can name it before
    // taking it away rather than silently demoting it.
    const accentHolder = (() => {
        const card = currentDashboard?.cards?.find(c => c.style?.accent);
        if (!card) return null;
        const def = catalogue.find(m => m.key === card.reading_key);
        return { id: card.id, label: card.title_override || def?.label || 'A card' };
    })();

    // 5. Manager publishing & locking layout toggles
    const handleResetLayout = async () => {
        if (!currentDashboard) return;
        if (!confirm('Are you sure you want to reset this layout to default settings?')) return;
        try {
            await axios.post(`/api/dashboards/${currentDashboard.id}/reset`);
            loadDashboardDetail(currentDashboard.id);
        } catch (err) {
            console.error('Failed to reset layout', err);
        }
    };

    const handlePublishLayout = async () => {
        if (!currentDashboard) return;
        const role = prompt('Enter role name to publish this layout to (e.g., cashier, manager):');
        if (!role) return;
        const lock = confirm('Do you want to lock this layout for everyone in this role?');
        
        try {
            await axios.post(`/api/dashboards/${currentDashboard.id}/publish`, {
                for_role: role.trim().toLowerCase(),
                is_locked: lock
            });
            alert('Layout published successfully!');
            loadDashboards();
        } catch (err) {
            console.error('Failed to publish layout', err);
        }
    };

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Composition Dashboard" />

            {/* VQ v2 Grid Layout Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

                .react-grid-layout {
                    position: relative;
                    transition: height var(--vq-dur-base, 280ms) ease;
                }
                .react-grid-item {
                    transition: all var(--vq-dur-base, 280ms) var(--vq-ease-out, cubic-bezier(0,0,.2,1));
                    transition-property: left, top, width, height;
                }
                .react-grid-item.cssTransforms {
                    transition-property: left, top;
                }
                .react-grid-item.resizing {
                    z-index: var(--vq-z-raised, 10);
                    opacity: 0.82;
                }
                .react-grid-item.react-draggable-dragging {
                    z-index: var(--vq-z-dropdown, 400);
                    opacity: 0.92;
                    cursor: grabbing;
                    box-shadow: var(--vq-elev-3, 0 16px 48px rgb(10 11 15 / .13));
                    border-radius: var(--vq-r-lg, 14px);
                }
                .react-grid-item > .react-resizable-handle {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    bottom: 5px;
                    right: 5px;
                    cursor: se-resize;
                    border-right: 2px solid var(--vq-line, #D9DDE0);
                    border-bottom: 2px solid var(--vq-line, #D9DDE0);
                    opacity: 0;
                    transition: opacity var(--vq-dur-fast, 180ms);
                    border-radius: 0 0 2px 0;
                }
                .react-grid-item:hover > .react-resizable-handle {
                    opacity: 1;
                }

                /* VQ Dashboard button base */
                .vq-db-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    height: var(--vq-control-sm, 32px);
                    padding: 0 14px;
                    border-radius: var(--vq-r-md, 10px);
                    font-family: var(--vq-font-sans, 'Inter', system-ui, sans-serif);
                    font-size: 12px;
                    font-weight: var(--vq-fw-medium, 500);
                    letter-spacing: 0;
                    border: none;
                    cursor: pointer;
                    transition:
                        background var(--vq-dur-fast, 180ms) var(--vq-ease),
                        transform  var(--vq-dur-fast, 180ms) var(--vq-ease),
                        box-shadow var(--vq-dur-fast, 180ms) var(--vq-ease);
                    white-space: nowrap;
                    text-decoration: none;
                }
                .vq-db-btn:hover { transform: translateY(-1px); }
                .vq-db-btn:active { transform: none; }
                .vq-db-btn:disabled { opacity: 0.42; cursor: not-allowed; transform: none; }

                .vq-db-btn-primary {
                    background: var(--vq-accent, #327882);
                    color: var(--vq-on-accent, #fff);
                }
                .vq-db-btn-primary:hover { background: var(--vq-accent-hover, #21656F); }

                .vq-db-btn-ghost {
                    background: transparent;
                    color: var(--vq-text-2, #595E64);
                    box-shadow: inset 0 0 0 1px var(--vq-line, #D9DDE0);
                }
                .vq-db-btn-ghost:hover {
                    background: var(--vq-sunken, #F4F6F8);
                    color: var(--vq-text, #151A1F);
                }

                .vq-db-btn-dark {
                    background: var(--vq-text, #151A1F);
                    color: var(--vq-text-inverted, #fff);
                }
                .vq-db-btn-dark:hover { background: var(--vq-ink-800, #282D32); }

                .vq-db-btn-publish {
                    background: var(--vq-mod-reports-accent, #34739C);
                    color: #fff;
                }
                .vq-db-btn-publish:hover { background: var(--vq-mod-reports-600, #236086); }

                /* Tab switcher */
                .vq-db-tabs {
                    display: flex;
                    align-items: center;
                    background: var(--vq-sunken, #F4F6F8);
                    border: 1px solid var(--vq-line-soft, #EBEDEF);
                    padding: 3px;
                    border-radius: var(--vq-r-lg, 14px);
                    gap: 2px;
                }
                .vq-db-tab {
                    padding: 5px 14px;
                    border-radius: var(--vq-r-md, 10px);
                    font-size: 12px;
                    font-weight: var(--vq-fw-medium, 500);
                    font-family: var(--vq-font-sans, 'Inter', sans-serif);
                    color: var(--vq-text-2, #595E64);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: background var(--vq-dur-instant, 100ms), color var(--vq-dur-instant, 100ms);
                    white-space: nowrap;
                }
                .vq-db-tab:hover { color: var(--vq-text, #151A1F); }
                .vq-db-tab.active {
                    background: var(--vq-raised, #fff);
                    color: var(--vq-accent-text, #21656F);
                    font-weight: var(--vq-fw-semi, 600);
                    box-shadow: var(--vq-elev-1, 0 1px 2px rgb(10 11 15/.05));
                }
            `}</style>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                width: '100%',
                paddingTop: '8px',
                paddingBottom: '40px',
                paddingLeft: '20px',
                paddingRight: '20px',
                fontFamily: 'var(--vq-font-sans, Inter, system-ui, sans-serif)',
            }}>
                
                {/* ── Dashboard Controls Panel ── */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--vq-line)',
                }}>
                    {/* Left: identity block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--vq-r-md)',
                            background: 'var(--vq-accent-quiet)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--vq-accent-text)',
                            flexShrink: 0,
                        }}>
                            <Layout size={18} />
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: 'var(--vq-fs-h3)',
                                lineHeight: 'var(--vq-lh-h3)',
                                letterSpacing: 'var(--vq-ls-h3)',
                                fontWeight: 'var(--vq-fw-semi)',
                                color: 'var(--vq-text)',
                                margin: 0,
                                marginBottom: '2px',
                            }}>
                                {currentDashboard?.name || 'Loading Dashboard…'}
                            </h1>
                            <p style={{
                                fontFamily: 'var(--vq-font-mono)',
                                fontSize: 'var(--vq-fs-eyebrow)',
                                lineHeight: 'var(--vq-lh-eyebrow)',
                                letterSpacing: 'var(--vq-ls-eyebrow)',
                                textTransform: 'uppercase',
                                color: 'var(--vq-text-3)',
                                fontWeight: 'var(--vq-fw-medium)',
                                margin: 0,
                            }}>
                                {currentDashboard?.is_locked ? '🔒 Locked by management' : '⚡ Personal layout'}
                            </p>
                        </div>
                    </div>

                    {/* Right: action controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {/* Tab Switchers */}
                        {dashboards.length > 1 && (
                            <div className="vq-db-tabs" style={{ marginRight: '4px' }}>
                                {dashboards.map(db => (
                                    <button
                                        key={db.id}
                                        onClick={() => loadDashboardDetail(db.id)}
                                        className={`vq-db-tab${currentDashboard?.id === db.id ? ' active' : ''}`}
                                    >
                                        {db.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Reset layout */}
                        {!currentDashboard?.is_locked && (
                            <button
                                onClick={handleResetLayout}
                                className="vq-db-btn vq-db-btn-ghost"
                                title="Reset dashboard to role defaults"
                            >
                                <RotateCcw size={13} />
                                <span>Reset</span>
                            </button>
                        )}

                        {/* Add metric card button */}
                        {!currentDashboard?.is_locked && (
                            <button
                                onClick={() => setIsBuilderOpen(true)}
                                className="vq-db-btn vq-db-btn-ghost"
                            >
                                <Plus size={13} />
                                <span>Add Card</span>
                            </button>
                        )}

                        {/* Save Layout updates */}
                        {!currentDashboard?.is_locked && (
                            <button
                                onClick={handleSaveLayout}
                                disabled={isSavingLayout}
                                className="vq-db-btn vq-db-btn-primary"
                            >
                                <Save size={13} />
                                <span>{isSavingLayout ? 'Saving…' : 'Save Layout'}</span>
                            </button>
                        )}

                        {/* Publisher & Locker (Manager/Owner only) */}
                        {isManager && (
                            <button
                                onClick={handlePublishLayout}
                                className="vq-db-btn vq-db-btn-publish"
                            >
                                <Globe size={13} />
                                <span>Publish</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Grid Layout View ── */}
                {currentDashboard?.cards?.length === 0 ? (
                    /* Empty state */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px dashed var(--vq-line)',
                        borderRadius: 'var(--vq-r-xl)',
                        padding: '64px 40px',
                        textAlign: 'center',
                        maxWidth: '480px',
                        margin: '48px auto 0',
                        userSelect: 'none',
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--vq-r-lg)',
                            background: 'var(--vq-sunken)',
                            border: '1px solid var(--vq-line-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--vq-text-3)',
                            marginBottom: '20px',
                        }}>
                            <Info size={24} />
                        </div>
                        <h2 style={{
                            fontSize: 'var(--vq-fs-h3)',
                            fontWeight: 'var(--vq-fw-semi)',
                            letterSpacing: 'var(--vq-ls-h3)',
                            color: 'var(--vq-text)',
                            margin: '0 0 8px',
                        }}>
                            Your Dashboard is Empty
                        </h2>
                        <p style={{
                            fontSize: 'var(--vq-fs-small)',
                            color: 'var(--vq-text-2)',
                            margin: '0 0 24px',
                            lineHeight: 'var(--vq-lh-small)',
                            maxWidth: '34ch',
                        }}>
                            Add metric cards to create your customised sales, finance, and operations overview.
                        </p>
                        <button
                            onClick={() => setIsBuilderOpen(true)}
                            className="vq-db-btn vq-db-btn-primary"
                            style={{ height: 'var(--vq-control-lg)', paddingLeft: '20px', paddingRight: '20px' }}
                        >
                            <Plus size={15} />
                            <span>Add Card</span>
                        </button>
                    </div>
                ) : (
                    <div ref={gridRef} style={{ width: '100%' }}>
                        {width > 0 && (
                            <ReactGridLayout
                                className="layout"
                                layout={activeLayout}
                                width={width}
                                /*
                                 * Layout Law v2.0 §1. This read cols={12}
                                 * rowHeight={80} margin={[16,16]}, so every
                                 * persisted card was 16px per row too tall and
                                 * 8px per gutter too tight. The law is
                                 * size(n) = n*64 + (n-1)*24 — 2 rows is 152px,
                                 * not 160 — and react-grid-layout reproduces it
                                 * exactly when rowHeight is the unit and margin
                                 * is the gutter. One source: layout-law.json.
                                 */
                                {...gridProps()}
                                isDraggable={!currentDashboard?.is_locked}
                                isResizable={!currentDashboard?.is_locked}
                                onLayoutChange={handleLayoutChange}
                                draggableHandle=".vq-card-drag-handle"
                            >
                                {currentDashboard?.cards?.map(card => {
                                    const def = catalogue.find(m => m.key === card.reading_key);
                                    const Chart = getChartComponent(card.chart);
                                    
                                    return (
                                        <div key={card.id}>
                                            <DashboardCardFrame
                                                card={card}
                                                definition={def}
                                                loading={cardLoaders[card.id]}
                                                error={cardErrors[card.id]}
                                                isLocked={currentDashboard?.is_locked}
                                                onEdit={() => setEditingCardId(card.id)}
                                                onRemove={() => handleRemoveCard(card.id)}
                                            >
                                                {cardData[card.id] && Chart && (
                                                    <Chart
                                                        data={cardData[card.id]}
                                                        definition={def}
                                                        settings={store?.settings}
                                                        /* A chart needs to know
                                                           which category it is
                                                           in: M2 allows exactly
                                                           two metric sizes, and
                                                           38px does not fit a
                                                           C1 tile. */
                                                        card={card}
                                                    />
                                                )}
                                            </DashboardCardFrame>
                                        </div>
                                    );
                                })}
                            </ReactGridLayout>
                        )}
                    </div>
                )}
            </div>

            {/* Edit one card in place — every knob the builder asks once, plus
                the ones it never asked: category, fit and emphasis. */}
            <DashboardCardEditor
                isOpen={Boolean(editingCardId)}
                card={currentDashboard?.cards?.find(c => c.id === editingCardId) || null}
                definition={catalogue.find(m => m.key ===
                    currentDashboard?.cards?.find(c => c.id === editingCardId)?.reading_key)}
                accentHolder={accentHolder}
                onClose={() => setEditingCardId(null)}
                onSave={(patch) => handleUpdateCard(editingCardId, patch)}
            />

            {/* Step-by-Step Metric card Builder */}
            <DashboardBuilderSheet
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                catalogue={catalogue}
                onSubmit={handleAddCard}
            />
        </OneGlanceLayout>
    );
}
