/* ==========================================================================
   Restaurant & café: tables & floor, kitchen tickets
   ==========================================================================
   Everything a restaurant needs lives here and nowhere else in these
   settings. The restaurant screen keeps its OWN layout (Screen layout edits
   whichever screen this register is showing), so changing the floor never
   moves the counter around, and the reverse.
   ========================================================================== */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
    UtensilsCrossed, ChefHat, LayoutGrid, Rows3, Columns3, LayoutList, ShoppingBag, Bike,
    ExternalLink, Plus, Trash2, Printer, Search, X, Tv, Wand2, Combine, Split, Store,
    Loader2, Map as MapIcon,
} from 'lucide-react';
import { useSettingsCtx } from '../context';
import { Page, Section, Row, Switch, Segmented, Choices, Stepper, Field, Button, Callout, Tag, Pic } from '../primitives';
import {
    PRINTER_OPTIONS, STATION_HUES, STATION_IDEAS, DEFAULT_ROUTING, normaliseRouting,
} from '../kitchenRouting';

const safeRoute = (name, params) => { try { return route(name, params); } catch (_) { return null; } };

/* ── TABLES & FLOOR ───────────────────────────────────────────────────── */

export function RestaurantPage() {
    const { p, flash, track } = useSettingsCtx();
    const locked = !p.canManageStore;
    const onTable = p.terminal === 'table';
    const runsTables = p.serviceMode === 'tables' || p.serviceMode === 'both';
    const comp = p.composition || {};
    const planHref = safeRoute('store.tables.plan', { store_slug: p.storeSlug });
    const [lanes, setLanes] = useState({ takeaway: p.lanes?.takeaway !== false, delivery: p.lanes?.delivery !== false });
    useEffect(() => { setLanes({ takeaway: p.lanes?.takeaway !== false, delivery: p.lanes?.delivery !== false }); }, [p.lanes?.takeaway, p.lanes?.delivery]);

    const saveLanes = next => {
        const prev = lanes;
        setLanes(next);
        track(axios.post(route('store.tables.plan.lanes', { store_slug: p.storeSlug }), next))
            .then(() => p.reloadSettings?.())
            .catch(() => setLanes(prev));
    };

    const viewOptions = [
        { value: 'map', label: 'Room map', icon: MapIcon, desc: 'Your room drawn as it is: round, square and long tables with chairs. Managers can drag tables into place.',
          pic: <Pic.Col>{[0, 1].map(r => <Pic.Row key={r}>{[0, 1, 2].map(c => <Pic.Box key={c} tone={(r + c) % 2 ? 'accent' : undefined} />)}</Pic.Row>)}</Pic.Col> },
        { value: 'cards', label: 'Smart cards', icon: LayoutGrid, desc: 'Tables that need someone jump to the front. Shows guests, time and money.',
          pic: <Pic.Col>{[0, 1].map(r => <Pic.Row key={r}><Pic.Box tone={r ? undefined : 'warm'} /><Pic.Box tone="accent" /><Pic.Box /></Pic.Row>)}</Pic.Col> },
        { value: 'sections', label: 'By area', icon: Rows3, desc: 'Tables grouped under each area — Main hall, Patio, Upstairs.',
          pic: <Pic.Col gap={2}><Pic.Box flex={0.4} tone="fill" /><Pic.Row><Pic.Box tone="accent" /><Pic.Box /><Pic.Box /></Pic.Row><Pic.Box flex={0.4} tone="fill" /><Pic.Row><Pic.Box /><Pic.Box tone="warm" /><Pic.Box /></Pic.Row></Pic.Col> },
        { value: 'grid', label: 'Seating chart', icon: Columns3, desc: 'Small squares with big table numbers. See the whole room at a glance.',
          pic: <Pic.Col>{[0, 1, 2].map(r => <Pic.Row key={r}>{[0, 1, 2, 3, 4].map(c => <Pic.Box key={c} tone={(r + c) % 3 === 0 ? 'accent' : (r + c) % 4 === 0 ? 'warm' : undefined} />)}</Pic.Row>)}</Pic.Col> },
        { value: 'list', label: 'Simple list', icon: LayoutList, desc: 'One line per table. Best on a phone or a narrow screen.',
          pic: <Pic.Col gap={2}>{[0, 1, 2, 3].map(i => <Pic.Box key={i} tone={i === 1 ? 'accent' : undefined} />)}</Pic.Col> },
    ];

    return (
        <Page icon={UtensilsCrossed} title="Tables & floor"
              intro="How you serve guests, what the floor looks like on this register, and the extras on a table's bill.">
            <Section title="How you serve customers" scope="store" locked={locked}>
                <Row sid="rest.service" stacked flash={flash} title="Service style"
                     desc="Counter: customers order and pay at the till. Tables: guests sit, and orders belong to their table until they pay. Both: a café that does takeaway at the counter and has tables too.">
                    <Choices label="Service style" value={p.serviceMode} cols="2" disabled={locked}
                             onChange={v => p.setServiceMode?.(v)}
                             options={[
                                 { value: 'counter', label: 'Counter only', icon: Store, desc: 'Order and pay at the till. No tables.' },
                                 { value: 'tables', label: 'Table service', icon: UtensilsCrossed, desc: 'Guests sit; each table keeps its own bill.' },
                                 { value: 'both', label: 'Counter and tables', icon: Combine, desc: 'Takeaway at the till, dine-in at tables.' },
                             ]} />
                </Row>
            </Section>

            {runsTables && (
                <Section title="This register" scope="device"
                         desc="Each register chooses its own screen. The till at the door can stay a counter while the tablet on the floor shows tables.">
                    <Row sid="rest.screen" stacked flash={flash} title="This register shows"
                         desc="The restaurant screen opens on the floor: pick a table, take the order, send it to the kitchen, take payment. It keeps its own layout, separate from the counter.">
                        <Choices label="This register shows" value={onTable ? 'table' : 'counter'} cols="2"
                                 onChange={v => p.onSwitchTerminal?.(v)}
                                 options={[
                                     { value: 'counter', label: 'Counter screen', icon: Store, desc: 'Products, order and payment. For takeaway and quick sales.' },
                                     { value: 'table', label: 'Restaurant screen', icon: UtensilsCrossed, desc: 'Tables first, then the table’s order.' },
                                 ]} />
                    </Row>
                </Section>
            )}

            {runsTables && (
                <Section title="How tables look" scope="device" desc="Saved on this device. The picture on the right uses your real tables when there are some.">
                    <Row sid="rest.floor-view" stacked flash={flash} title="Table view"
                         desc="Pick the view that matches how your staff work.">
                        <Choices label="Table view" value={p.floorView} onChange={p.setFloorView} options={viewOptions} />
                    </Row>
                    <Row sid="rest.floor-sort" stacked flash={flash} title="Table order"
                         desc="'Needs attention first' moves tables waiting for a waiter or for payment to the top, so staff know where to walk. 'Table number' keeps every table in the same place.">
                        <Segmented label="Table order" value={p.floorSort} onChange={p.setFloorSort}
                                   options={[{ value: 'attention', label: 'Needs attention first' }, { value: 'number', label: 'Table number' }]} />
                    </Row>
                    <Row sid="rest.floor-size" stacked flash={flash} title="Table card size"
                         desc="Bigger cards are easier to tap; smaller ones fit more tables on the screen.">
                        <Segmented label="Table card size" value={p.floorSize} onChange={p.setFloorSize}
                                   options={[{ value: 'compact', label: 'Small' }, { value: 'normal', label: 'Medium' }, { value: 'large', label: 'Large' }]} />
                    </Row>
                    <Row sid="rest.floor-details" stacked flash={flash} title="Details on each table"
                         desc="Choose what each table card shows. Fewer details make a calmer floor.">
                        <div className="vqs-chips">
                            {[
                                ['showMoney', 'Amount due'],
                                ['showTime', 'Time seated'],
                                ['showServer', 'Waiter initials'],
                            ].map(([k, label]) => (
                                <button key={k} type="button" className="vqs-chip" aria-pressed={p.floorShow?.[k] !== false}
                                        onClick={() => p.setFloorShow?.({ ...p.floorShow, [k]: p.floorShow?.[k] === false })}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Row>
                    {onTable && (
                        <Row sid="rest.floor-place" stacked flash={flash} title="Tables and the order side by side"
                             desc="'Side by side' keeps the tables open next to the order on wide screens. 'One at a time' shows the tables full screen, then the order once you pick a table — better on small tablets.">
                            <Segmented label="Tables and order" value={comp.floor === 'overlay' ? 'overlay' : 'left'}
                                       onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, floor: v }))}
                                       options={[{ value: 'left', label: 'Side by side' }, { value: 'overlay', label: 'One at a time' }]} />
                        </Row>
                    )}
                </Section>
            )}

            {runsTables && (
                <Section title="Tables, areas and orders without a table" scope="store" locked={locked}>
                    <Row sid="rest.plan" flash={flash} title="Tables and areas"
                         desc="Add tables, name your areas (Main hall, Patio…), set how many seats each table has, and print table QR codes for ordering.">
                        {planHref && (
                            <a className="vqs-btn" data-v="s" href={planHref} target="_blank" rel="noopener noreferrer">
                                <LayoutGrid size={16} /> Edit tables <ExternalLink size={14} />
                            </a>
                        )}
                    </Row>
                    <Row sid="rest.lanes" stacked flash={flash} title="Takeaway and delivery"
                         desc="Adds Takeaway and Delivery buttons to the floor, for orders that do not sit at a table. Delivery orders can be given to a rider and tracked.">
                        <div className="vqs-chips">
                            <button type="button" className="vqs-chip" aria-pressed={lanes.takeaway} disabled={locked}
                                    onClick={() => saveLanes({ ...lanes, takeaway: !lanes.takeaway })}>
                                <ShoppingBag size={15} /> Takeaway
                            </button>
                            <button type="button" className="vqs-chip" aria-pressed={lanes.delivery} disabled={locked}
                                    onClick={() => saveLanes({ ...lanes, delivery: !lanes.delivery })}>
                                <Bike size={15} /> Delivery
                            </button>
                        </div>
                    </Row>
                </Section>
            )}

            {runsTables && (
                <Section title="The table's bill">
                    <Row sid="rest.service-charge" flash={flash}
                         title={<>Service charge <Tag tone="accent">Whole business</Tag></>}
                         desc="A percentage added to every table bill, after discounts. It is the restaurant's income — not a tip."
                         example={Number(p.serviceCharge) > 0 ? <>On a bill of 2,000 this adds <b>{(2000 * Number(p.serviceCharge) / 100).toLocaleString()}</b>.</> : null}>
                        <Stepper label="service charge" disabled={locked} value={Number(p.serviceCharge) || 0} min={0} max={25} step={0.5}
                                 onChange={p.setServiceCharge} format={v => (v ? `${v}%` : 'Off')} />
                    </Row>
                    <Row sid="rest.tip" flash={flash}
                         title={<>Tip box on the bill <Tag>This device</Tag></>}
                         desc="Shows a box on the table's bill where staff type the tip the guest adds. Tips are recorded separately from your sales.">
                        <Switch label="Tip box" checked={p.tipEnabled !== false} onChange={p.setTipEnabled} />
                    </Row>
                </Section>
            )}

            {!runsTables && (
                <Callout tone="accent" icon={UtensilsCrossed}>
                    Choose <b>Table service</b> or <b>Counter and tables</b> above to set up tables, the floor view and
                    table bills. Your counter keeps working exactly as it does now.
                </Callout>
            )}
        </Page>
    );
}

/* ── KITCHEN TICKETS ──────────────────────────────────────────────────── */

export function useKitchenRouting(p, enabled) {
    const [state, setState] = useState({ loading: true, error: null, routing: DEFAULT_ROUTING, categories: [], tags: [], names: {} });
    useEffect(() => {
        if (!enabled) return undefined;
        let live = true;
        const url = safeRoute('store.tables.kitchen.routing', { store_slug: p.storeSlug });
        if (!url) { setState(s => ({ ...s, loading: false, error: 'unavailable' })); return undefined; }
        axios.get(url).then(({ data }) => {
            if (!live) return;
            setState({
                loading: false, error: null,
                routing: normaliseRouting(data?.routing),
                categories: Array.isArray(data?.categories) ? data.categories : [],
                tags: Array.isArray(data?.product_tags) ? data.product_tags : [],
                names: data?.product_names && typeof data.product_names === 'object' ? data.product_names : {},
            });
        }).catch(e => {
            if (!live) return;
            setState(s => ({ ...s, loading: false, error: e?.response?.status === 404 ? 'unavailable' : 'failed' }));
        });
        return () => { live = false; };
    }, [enabled, p.storeSlug]);
    return [state, setState];
}

export function KitchenPage({ kitchen, setKitchen }) {
    const { p, flash, track } = useSettingsCtx();
    const locked = !p.canManageStore;
    const { routing, categories, tags, names, loading, error } = kitchen;
    const saveTimer = useRef(null);
    const [newName, setNewName] = useState('');

    const persist = next => {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            track(axios.post(route('store.tables.kitchen.routing.save', { store_slug: p.storeSlug }), { routing: next }))
                .then(({ data }) => {
                    if (data?.routing) setKitchen(k => ({ ...k, routing: normaliseRouting(data.routing) }));
                })
                .catch(() => {});
        }, 450);
    };
    useEffect(() => () => clearTimeout(saveTimer.current), []);

    const update = fn => {
        if (locked) return;
        const next = normaliseRouting(fn(routing));
        setKitchen(k => ({ ...k, routing: next }));
        persist(next);
    };

    const used = new Set([routing.main_name.toLowerCase(), ...routing.stations.map(s => s.name.toLowerCase())]);
    const addStation = name => {
        const n = String(name || '').trim().slice(0, 32);
        if (!n || used.has(n.toLowerCase())) return;
        update(r => ({ ...r, mode: 'stations', stations: [...r.stations, { id: `st_${Date.now().toString(36)}`, name: n, printer: /bar|drink|juice|coffee|beverage/i.test(n) ? 'bar' : 'kitchen', categories: [], products: [] }] }));
        setNewName('');
    };
    const claimedCats = useMemo(() => {
        const m = new Map();
        routing.stations.forEach(s => s.categories.forEach(c => { if (!m.has(c)) m.set(c, s.name); }));
        return m;
    }, [routing]);
    const unassigned = categories.filter(c => !claimedCats.has(String(c.id)));
    const newTags = tags.filter(t => !used.has(String(t.name).toLowerCase()));

    if (!p.preparesOrders) {
        return (
            <Page icon={ChefHat} title="Kitchen tickets" intro="Send orders to the kitchen as printed tickets or to a kitchen screen.">
                <Section title="Does this business prepare orders?" scope="store" locked={locked}>
                    <Row sid="kitchen.prepares" flash={flash} title="This business prepares orders"
                         desc="Turn on for restaurants, cafés, bakeries and juice bars. The register gets a 'Send to kitchen' button, and orders appear on the kitchen screen and kitchen printers.">
                        <Switch label="This business prepares orders" disabled={locked} checked={false} onChange={p.setPreparesOrders} />
                    </Row>
                </Section>
            </Page>
        );
    }

    return (
        <Page icon={ChefHat} title="Kitchen tickets"
              intro="Decide where orders go when you press 'Send to kitchen': one ticket for everything, or a separate ticket for each station — bar, grill, cold prep and so on.">
            {locked && <Callout tone="warn">You can see how orders are sent, but only an <b>owner or manager</b> can change it.</Callout>}

            <Section title="Sending orders" scope="store" locked={locked}>
                <Row sid="kitchen.prepares" flash={flash} title="This business prepares orders"
                     desc="Keeps the 'Send to kitchen' button, kitchen tickets and the kitchen screen switched on.">
                    <Switch label="This business prepares orders" disabled={locked} checked onChange={p.setPreparesOrders} />
                </Row>
                <Row sid="kitchen.mode" stacked flash={flash} title="One ticket, or split by station?"
                     desc="Split by station when different people cook different things. Until you create stations, everything still goes to one place.">
                    {loading ? (
                        <span className="vqs-muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Loader2 size={16} className="vqs-spin" /> Loading…</span>
                    ) : error === 'unavailable' ? (
                        <Callout tone="warn">Kitchen routing needs the latest server update. Orders currently go to one kitchen.</Callout>
                    ) : error ? (
                        <Callout tone="warn">The kitchen settings could not be loaded. Check the internet connection, then close and reopen settings.</Callout>
                    ) : (
                        <Choices label="One ticket or split" cols="2" disabled={locked} value={routing.mode}
                                 onChange={v => update(r => ({ ...r, mode: v }))}
                                 options={[
                                     { value: 'single', label: 'One ticket for everything', icon: Combine, desc: `The whole order prints as one ticket at ${routing.main_name}. Simplest for a small kitchen.` },
                                     { value: 'stations', label: 'A ticket for each station', icon: Split, desc: 'Drinks go to the bar, burgers to the grill… each station gets only its own items.' },
                                 ]} />
                    )}
                </Row>
            </Section>

            {!loading && !error && (
                <Section title="Main kitchen" scope="store" locked={locked}
                         desc={routing.mode === 'stations'
                             ? 'Anything not given to a station comes here — so nothing is ever lost.'
                             : 'Every order comes here.'}>
                    <Row sid="kitchen.main" stacked flash={flash} title="Name and printer">
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                            <MainName value={routing.main_name} disabled={locked} onSave={v => update(r => ({ ...r, main_name: v || 'Kitchen' }))} />
                            <Segmented label="Printer for the main kitchen" disabled={locked} value={routing.main_printer}
                                       onChange={v => update(r => ({ ...r, main_printer: v }))}
                                       options={PRINTER_OPTIONS.map(o => ({ value: o.value, label: o.label, hint: o.desc }))} />
                        </div>
                    </Row>
                </Section>
            )}

            {!loading && !error && routing.mode === 'stations' && (
                <Section title={`Stations (${routing.stations.length})`} scope="store" locked={locked}
                         desc="Create a station for each place that prepares food or drinks, then tell it which categories — or which single items — it makes.">
                    {newTags.length > 0 && (
                        <Row sid="kitchen.tags" stacked flash={flash}
                             title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Wand2 size={16} /> Your products already name some stations</span>}
                             desc="These names are written on your products. Add them as stations and those products will go to them straight away.">
                            <div className="vqs-chips">
                                {newTags.map(t => (
                                    <button key={t.name} type="button" className="vqs-chip" data-dashed="1" disabled={locked} onClick={() => addStation(t.name)}>
                                        <Plus size={13} /> {t.name} <span className="vqs-chip-n">{t.count}</span>
                                    </button>
                                ))}
                                {newTags.length > 1 && (
                                    <Button v="soft" size="sm" disabled={locked}
                                            onClick={() => update(r => ({
                                                ...r, mode: 'stations',
                                                stations: [...r.stations, ...newTags.map((t, i) => ({ id: `st_${Date.now().toString(36)}${i}`, name: t.name, printer: /bar|drink|juice|coffee|beverage/i.test(t.name) ? 'bar' : 'kitchen', categories: [], products: [] }))],
                                            }))}>
                                        Add all {newTags.length}
                                    </Button>
                                )}
                            </div>
                        </Row>
                    )}

                    <Row sid="kitchen.stations" stacked flash={flash} title="Add a station"
                         desc="Type a name, or tap a suggestion.">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <Field width={260} label="New station name" placeholder="e.g. Bar, Grill, Cold prep" maxLength={32} disabled={locked}
                                       value={newName} onChange={setNewName} />
                                <Button v="p" icon={Plus} disabled={locked || !newName.trim() || used.has(newName.trim().toLowerCase())} onClick={() => addStation(newName)}>Add station</Button>
                            </div>
                            <div className="vqs-chips">
                                {STATION_IDEAS.filter(n => !used.has(n.toLowerCase())).slice(0, 8).map(n => (
                                    <button key={n} type="button" className="vqs-chip" data-dashed="1" disabled={locked} onClick={() => addStation(n)}>
                                        <Plus size={13} /> {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Row>

                    {routing.stations.length === 0 ? (
                        <Callout tone="accent">No stations yet, so <b>everything still goes to {routing.main_name}</b>. Add one above to start splitting orders.</Callout>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
                            {routing.stations.map((s, i) => (
                                <StationCard key={s.id} station={s} hue={STATION_HUES[i % STATION_HUES.length]} locked={locked}
                                             categories={categories} claimedCats={claimedCats} names={names} p={p}
                                             onChange={patch => update(r => ({ ...r, stations: r.stations.map(x => (x.id === s.id ? { ...x, ...patch } : x)) }))}
                                             onRemove={() => update(r => ({ ...r, stations: r.stations.filter(x => x.id !== s.id) }))}
                                             onNamesLoaded={more => setKitchen(k => ({ ...k, names: { ...k.names, ...more } }))}
                                             onTest={() => p.onTestKitchenTicket?.(s.name, s.printer)} />
                            ))}
                        </div>
                    )}

                    {routing.stations.length > 0 && (
                        <>
                            <Row sid="kitchen.tags" flash={flash} title="Also use the station written on each product"
                                 desc="If a product's own 'kitchen station' matches one of these station names, send it there even when its category is not chosen above.">
                                <Switch label="Use product stations" disabled={locked} checked={routing.use_product_tags}
                                        onChange={v => update(r => ({ ...r, use_product_tags: v }))} />
                            </Row>
                            {unassigned.length > 0 && (
                                <Callout>
                                    <b>{unassigned.length} categor{unassigned.length === 1 ? 'y goes' : 'ies go'} to {routing.main_name}:</b>{' '}
                                    {unassigned.slice(0, 8).map(c => c.name).join(', ')}{unassigned.length > 8 ? '…' : ''}. That is fine — it just means
                                    the main kitchen makes them.
                                </Callout>
                            )}
                        </>
                    )}
                </Section>
            )}

            <Section title="Check it works">
                <Row sid="kitchen.test" flash={flash} title="Print a test ticket"
                     desc={`Prints a short sample ticket for ${routing.main_name} on its printer, so you can see it arrives in the right place.`}>
                    <Button v="s" icon={Printer} onClick={() => p.onTestKitchenTicket?.(routing.main_name, routing.main_printer)}>Test {routing.main_name}</Button>
                </Row>
                <Row sid="kitchen.screens" flash={flash} title="Kitchen and customer screens"
                     desc="The kitchen screen shows orders for cooks to mark as ready. The customer TV screen shows order numbers when they are ready to collect. Each opens in a new tab — put them on any screen in the kitchen or dining room.">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {safeRoute('store.restaurant.kitchen', { store_slug: p.storeSlug }) && (
                            <a className="vqs-btn" data-v="s" data-size="sm" href={safeRoute('store.restaurant.kitchen', { store_slug: p.storeSlug })} target="_blank" rel="noopener noreferrer">
                                <ChefHat size={15} /> Kitchen screen
                            </a>
                        )}
                        {safeRoute('store.restaurant.queue', { store_slug: p.storeSlug }) && (
                            <a className="vqs-btn" data-v="s" data-size="sm" href={safeRoute('store.restaurant.queue', { store_slug: p.storeSlug })} target="_blank" rel="noopener noreferrer">
                                <Tv size={15} /> Customer TV screen
                            </a>
                        )}
                    </div>
                </Row>
            </Section>
        </Page>
    );
}

function MainName({ value, onSave, disabled }) {
    const [v, setV] = useState(value);
    useEffect(() => { setV(value); }, [value]);
    return (
        <Field width={220} label="Main kitchen name" maxLength={32} disabled={disabled} value={v} onChange={setV}
               onCommit={x => { const t = String(x || '').trim(); if (t && t !== value) onSave(t); else setV(value); }} />
    );
}

function StationCard({ station, hue, locked, categories, claimedCats, names, p, onChange, onRemove, onNamesLoaded, onTest }) {
    const [name, setName] = useState(station.name);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    useEffect(() => { setName(station.name); }, [station.name]);

    useEffect(() => {
        const term = q.trim();
        if (term.length < 2) { setResults([]); return undefined; }
        const url = safeRoute('store.pos.search', { store_slug: p.storeSlug });
        if (!url) return undefined;
        setSearching(true);
        const t = setTimeout(() => {
            axios.get(url, { params: { q: term } })
                .then(({ data }) => {
                    const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                    setResults(list.slice(0, 8).map(x => ({ id: String(x.id), name: x.name })));
                })
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 280);
        return () => clearTimeout(t);
    }, [q, p.storeSlug]);

    const toggleCat = id => {
        const k = String(id);
        onChange({ categories: station.categories.includes(k) ? station.categories.filter(c => c !== k) : [...station.categories, k] });
    };

    return (
        <div className="vqs-station">
            <div className="vqs-station-head">
                <span className="vqs-station-swatch" style={{ background: hue }} />
                <Field width={220} label="Station name" maxLength={32} disabled={locked} value={name} onChange={setName}
                       onCommit={v => { const t = String(v || '').trim(); if (t && t !== station.name) onChange({ name: t }); else setName(station.name); }} />
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <Button v="g" size="sm" icon={Printer} onClick={onTest}>Test</Button>
                    <button type="button" className="vqs-iconbtn" data-size="sm" title={`Remove ${station.name}`} disabled={locked} onClick={onRemove}>
                        <Trash2 size={15} />
                    </button>
                </span>
            </div>

            <div>
                <div className="vqs-station-label" style={{ marginBottom: 6 }}>Prints on</div>
                <Segmented label={`Printer for ${station.name}`} disabled={locked} value={station.printer}
                           onChange={v => onChange({ printer: v })}
                           options={PRINTER_OPTIONS.map(o => ({ value: o.value, label: o.label, hint: o.desc }))} />
            </div>

            <div>
                <div className="vqs-station-label" style={{ marginBottom: 6 }}>Makes these categories</div>
                {categories.length === 0 ? (
                    <p className="vqs-muted" style={{ margin: 0, fontSize: 14 }}>No categories yet. Add categories to your products, or pick single items below.</p>
                ) : (
                    <div className="vqs-chips">
                        {categories.map(c => {
                            const on = station.categories.includes(String(c.id));
                            const owner = claimedCats.get(String(c.id));
                            const elsewhere = owner && owner !== station.name;
                            return (
                                <button key={c.id} type="button" className="vqs-chip" aria-pressed={on} disabled={locked}
                                        title={elsewhere ? `Already chosen at ${owner}. If both choose it, the station higher in this list gets it.` : undefined}
                                        style={elsewhere && !on ? { opacity: .55 } : undefined}
                                        onClick={() => toggleCat(c.id)}>
                                    {c.name}
                                    {elsewhere && !on ? <span className="vqs-chip-n">{owner}</span> : <span className="vqs-chip-n">{c.count}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <div className="vqs-station-label" style={{ marginBottom: 6 }}>Also makes these single items</div>
                {station.products.length > 0 && (
                    <div className="vqs-chips" style={{ marginBottom: 8 }}>
                        {station.products.map(id => (
                            <button key={id} type="button" className="vqs-chip" aria-pressed="true" disabled={locked}
                                    title="Remove" onClick={() => onChange({ products: station.products.filter(x => x !== id) })}>
                                {names[id] || 'Product'} <X size={13} />
                            </button>
                        ))}
                    </div>
                )}
                <div style={{ position: 'relative', maxWidth: 420 }}>
                    <Field width="100%" label="Find a product" placeholder="Search a product to add…" disabled={locked}
                           prefix={searching ? <Loader2 size={15} className="vqs-spin" /> : <Search size={15} />} value={q} onChange={setQ} />
                    {results.length > 0 && (
                        <div className="vqs-list" style={{ marginTop: 6 }}>
                            {results.map(r => {
                                const has = station.products.includes(r.id);
                                return (
                                    <div key={r.id} className="vqs-list-row">
                                        <span className="vqs-grow">{r.name}</span>
                                        <Button v={has ? 'g' : 'soft'} size="sm" disabled={has || locked}
                                                onClick={() => { onNamesLoaded({ [r.id]: r.name }); onChange({ products: [...station.products, r.id] }); setQ(''); setResults([]); }}>
                                            {has ? 'Added' : 'Add'}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <p className="vqs-row-example">A single item always wins over its category — handy for one cold dessert in a hot-food category.</p>
            </div>
        </div>
    );
}

