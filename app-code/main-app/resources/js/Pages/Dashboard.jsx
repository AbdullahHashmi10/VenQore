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
import DashboardCardFrame from '../Dashboard/components/DashboardCardFrame';
import DashboardBuilderSheet from '../Dashboard/components/DashboardBuilderSheet';
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

            {/* Injected Grid Layout Selector Styles */}
            <style>{`
                .react-grid-layout {
                    position: relative;
                    transition: height 200ms ease;
                }
                .react-grid-item {
                    transition: all 200ms ease;
                    transition-property: left, top;
                }
                .react-grid-item.cssTransforms {
                    transition: property left, top 200ms ease;
                }
                .react-grid-item.resizing {
                    z-index: 10;
                    opacity: 0.8;
                }
                .react-grid-item.react-draggable-dragging {
                    z-index: 50;
                    opacity: 0.9;
                    cursor: grabbing;
                }
                .react-grid-item > .react-resizable-handle {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    bottom: 4px;
                    right: 4px;
                    cursor: se-resize;
                    border-right: 2px solid rgb(203, 213, 225);
                    border-bottom: 2px solid rgb(203, 213, 225);
                }
                .dark .react-grid-item > .react-resizable-handle {
                    border-right-color: rgb(71, 85, 105);
                    border-bottom-color: rgb(71, 85, 105);
                }
            `}</style>

            <div className="flex flex-col gap-6 w-full pt-2 pb-6 px-4">
                
                {/* --- Dashboard Controls Panel --- */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                            <Layout size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
                                {currentDashboard?.name || 'Loading Dashboard...'}
                            </h1>
                            <p className="text-3xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                {currentDashboard?.is_locked ? '🔒 Locked by management' : '⚡ Personal layout'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 select-none">
                        {/* Tab Switchers */}
                        {dashboards.length > 1 && (
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-0.5 rounded-xl mr-2 text-3xs font-bold">
                                {dashboards.map(db => (
                                    <button
                                        key={db.id}
                                        onClick={() => loadDashboardDetail(db.id)}
                                        className={`px-3 py-1.5 rounded-lg transition-colors ${currentDashboard?.id === db.id ? 'bg-white dark:bg-slate-900 text-indigo-500 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
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
                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 dark:bg-slate-800/30 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-3xs rounded-xl shadow-xs transition-colors"
                                title="Reset dashboard to role defaults"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        )}

                        {/* Add metric card button */}
                        {!currentDashboard?.is_locked && (
                            <button
                                onClick={() => setIsBuilderOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-3xs rounded-xl shadow-xs transition-colors"
                            >
                                <Plus size={12} />
                                <span>Add Card</span>
                            </button>
                        )}

                        {/* Save Layout updates */}
                        {!currentDashboard?.is_locked && (
                            <button
                                onClick={handleSaveLayout}
                                disabled={isSavingLayout}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-3xs rounded-xl shadow-xs transition-colors"
                            >
                                <Save size={12} />
                                <span>{isSavingLayout ? 'Saving...' : 'Save Layout'}</span>
                            </button>
                        )}

                        {/* Publisher & Locker (Manager/Owner only) */}
                        {isManager && (
                            <button
                                onClick={handlePublishLayout}
                                className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-3xs rounded-xl shadow-xs transition-colors"
                            >
                                <Globe size={12} />
                                <span>Publish</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Grid Layout View --- */}
                {currentDashboard?.cards?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto mt-12 select-none">
                        <Info size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
                        <h2 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm tracking-tight mb-1">Your Dashboard is Empty</h2>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 font-semibold mb-4 leading-normal">Add metrics cards to create your customized sales, finance, and operations overview.</p>
                        <button
                            onClick={() => setIsBuilderOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                        >
                            <Plus size={14} />
                            <span>Add Card</span>
                        </button>
                    </div>
                ) : (
                    <div ref={gridRef} className="w-full">
                        {width > 0 && (
                            <ReactGridLayout
                                className="layout mt-2"
                                layout={activeLayout}
                                cols={12}
                                rowHeight={80}
                                width={width}
                                margin={[16, 16]}
                                isDraggable={!currentDashboard?.is_locked}
                                isResizable={!currentDashboard?.is_locked}
                                onLayoutChange={handleLayoutChange}
                                draggableHandle=".font-bold" // dragging is initiated by header
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
                                                onRemove={() => handleRemoveCard(card.id)}
                                            >
                                                {cardData[card.id] && Chart && (
                                                    <Chart
                                                        data={cardData[card.id]}
                                                        definition={def}
                                                        settings={store?.settings}
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
