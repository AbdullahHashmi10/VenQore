/* ==========================================================================
   This register: layout, product buttons, text & display, top bar buttons
   ==========================================================================
   Everything on these four pages is saved on THIS device. A phone on the pass
   and the till by the door can — and usually should — be set up differently.
   ========================================================================== */

import React from 'react';
import {
    LayoutGrid, ShoppingBasket, MonitorSmartphone, MousePointerClick, RotateCcw, MoveHorizontal,
    Sun, Moon, Laptop, Eye, UtensilsCrossed,
} from 'lucide-react';
import { useSettingsCtx } from '../context';
import { Page, Section, Row, Switch, Segmented, Choices, Stepper, Button, Callout, Pic, Kbd } from '../primitives';

/* Plain names for the layout engine's presets. The engine's own taglines are
   written for designers ("40 / 60", "relay"); these are written for the
   person standing at the till. */
const PRESET_COPY = {
    scan:    { name: 'Scan only',              desc: 'No product buttons. Scan or type to add items. Best for pharmacies, hardware and large shops.' },
    column:  { name: 'Product list + order',   desc: 'A slim product list on the left and a big order list. Suits most shops.' },
    row:     { name: 'Product strip on top',   desc: 'A row of product buttons above the order. Good for cafés and bakeries with a short menu.' },
    grid:    { name: 'Big product buttons',    desc: 'Products fill the left side; tap Pay to open payment. Made for touch screens.' },
    express: { name: 'Touch & quick pay',      desc: 'Products on the left half, order and a quick Pay bar on the right.' },
    stack:   { name: 'Products above, order below', desc: 'For wide, short screens. Payment opens when you tap Pay.' },
    counter: { name: 'One column',             desc: 'The order first, everything else one tap away. Best for phones and small tablets.' },
};

function PresetPic({ id }) {
    const { Box, Col, Row: R } = Pic;
    switch (id) {
        case 'scan': return <><Box flex={3} /><Box flex={2} tone="accent" /></>;
        case 'column': return <><Box flex={1} tone="cool" /><Box flex={3} /><Box flex={2} tone="accent" /></>;
        case 'row': return <Col><Box flex={1} tone="cool" /><R flex={2}><Box flex={3} /><Box flex={2} tone="accent" /></R></Col>;
        case 'grid': return <><Box flex={2} tone="cool" /><Col flex={3}><Box flex={5} /><Box flex={1} tone="fill" /></Col></>;
        case 'express': return <><Box flex={1} tone="cool" /><Col flex={1}><Box flex={4} /><Box flex={1} tone="fill" /></Col></>;
        case 'stack': return <Col><Box flex={2} tone="cool" /><Box flex={2} /><Box flex={1} tone="fill" /></Col>;
        case 'counter': return <Col><Box flex={5} /><R flex={1}><Box tone="cool" /><Box tone="fill" /></R></Col>;
        default: return <Box />;
    }
}

export function LayoutPage() {
    const { p, flash } = useSettingsCtx();
    const comp = p.composition || { catalog: {}, split: {}, tender: 'column' };
    const catMode = comp.catalog?.mode ?? 'left';
    const isStrip = catMode === 'top' || catMode === 'bottom';
    const onTable = p.terminal === 'table';
    const setCat = patch => p.onUpdateComposition?.(prev => ({ ...prev, catalog: { ...prev.catalog, ...patch } }));
    const counterPresets = (p.presets || []).filter(x => x.terminal !== 'table');

    return (
        <Page icon={LayoutGrid} title="Screen layout"
              intro="Choose where the products, the order and the payment panel sit on this screen. Changes show on the right straight away and on the till the moment you make them.">
            {onTable ? (
                <Callout tone="accent" icon={UtensilsCrossed}>
                    <b>You are changing the restaurant screen.</b> The counter screen keeps its own layout,
                    so nothing here changes how the counter looks. To switch this register back to the counter,
                    go to <b>Tables &amp; floor → This register shows</b>.
                </Callout>
            ) : (
                <Section title="Start from a ready-made layout" desc="Pick the one closest to how you sell, then fine-tune anything below. You can always come back.">
                    <Row sid="layout.start" title="Starting layout" stacked flash={flash}>
                        <Choices
                            label="Starting layout"
                            value={p.presetId}
                            onChange={id => p.onApplyPreset?.(id)}
                            options={counterPresets.map(pr => ({
                                value: pr.id,
                                label: PRESET_COPY[pr.id]?.name || pr.name,
                                desc: PRESET_COPY[pr.id]?.desc || pr.tagline || pr.for,
                                pic: <PresetPic id={pr.id} />,
                            }))}
                        />
                    </Row>
                </Section>
            )}

            <Section title="Products" desc="The buttons you tap to add an item." scope="device">
                <Row sid="layout.catalog" stacked flash={flash}
                     title="Where the product list sits"
                     desc="Hidden means you only scan or search. Left or right gives a column of products. Top or bottom gives a strip of buttons. 'Behind a button' keeps the screen clear and opens the products full screen when you need them.">
                    <Segmented
                        label="Where the product list sits"
                        value={catMode}
                        onChange={v => setCat({ mode: v })}
                        options={[
                            { value: 'off', label: 'Hidden' },
                            { value: 'left', label: 'Left' },
                            { value: 'right', label: 'Right' },
                            { value: 'top', label: 'Top' },
                            { value: 'bottom', label: 'Bottom' },
                            { value: 'overlay', label: 'Behind a button' },
                        ]}
                    />
                </Row>
                {isStrip && (
                    <Row sid="layout.strip-rows" flash={flash}
                         title="Rows in the product strip"
                         desc="More rows show more products but leave less room for the order. If the screen is too short, extra rows are given back to the order automatically.">
                        <Stepper label="rows" value={comp.catalog?.rows ?? 1} min={1} max={3}
                                 onChange={v => setCat({ rows: v })} format={v => `${v} row${v === 1 ? '' : 's'}`} />
                    </Row>
                )}
            </Section>

            <Section title="Payment" desc="Where the total and the Pay button live." scope="device">
                <Row sid="layout.payment" stacked flash={flash}
                     title="Payment panel style"
                     desc="A column keeps the total, discount and cash received always in view. A bar keeps just the total and a Pay button at the bottom. 'Opens on Pay' gives the order the whole screen until you are ready to take money.">
                    <Segmented
                        label="Payment panel style"
                        value={comp.tender}
                        onChange={v => p.onUpdateComposition?.(prev => ({
                            ...prev,
                            tender: v,
                            split: { ...prev.split, tender: v === 'column' ? Math.max(0.22, prev.split?.tender || 0) : 0 },
                        }))}
                        options={[
                            { value: 'column', label: 'Always visible' },
                            { value: 'bar', label: 'Slim bar' },
                            { value: 'sheet', label: 'Opens on Pay' },
                        ]}
                    />
                </Row>
                <Row sid="layout.payment-side" stacked flash={flash}
                     title="Which side the payment panel is on"
                     desc="Right suits most counters. Choose left if the customer screen is on the left or the cashier is left-handed. Bottom puts the total in a wide strip under everything — best on wide, short screens."
                     disabled={comp.tender !== 'column'}>
                    <Segmented
                        label="Payment side"
                        disabled={comp.tender !== 'column'}
                        value={comp.tenderSide || 'right'}
                        onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, tenderSide: v }))}
                        options={[{ value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }, { value: 'bottom', label: 'Bottom' }]}
                    />
                </Row>
            </Section>

            <Section title="Order and scanning" scope="device">
                <Row sid="layout.scan" stacked flash={flash}
                     title="Scan box and 'Add item' button"
                     desc="Automatic puts them wherever the product list is not. Choose 'Above the order' if you scan most items, or 'In the product list' if staff mostly tap buttons.">
                    <Segmented
                        label="Scan box"
                        value={comp.scanBar || 'auto'}
                        onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, scanBar: v }))}
                        options={[{ value: 'auto', label: 'Automatic' }, { value: 'order', label: 'Above the order' }, { value: 'catalog', label: 'In the product list' }]}
                    />
                </Row>
                <Row sid="layout.order" flash={flash}
                     title="Show the order list all the time"
                     desc="Turn off for a small menu tapped from big buttons: each button shows how many are in the order, and the payment panel shows the total. The order list returns automatically when there is nowhere else to show the sale.">
                    <Switch label="Show the order list" checked={comp.showOrder !== false}
                            onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, showOrder: v }))} />
                </Row>
            </Section>

            <Section title="Column widths" desc="Make one column wider or narrower right on the register." scope="device">
                <Row sid="layout.widths" stacked flash={flash}
                     title="Drag the line between two columns"
                     desc="On the register, grab the thin handle between two columns and drag it. With a keyboard, press Tab until the handle is highlighted and use the arrow keys (hold Shift for bigger steps). A column stops before it gets too small to read.">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="vqs-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                            <MoveHorizontal size={16} /> <Kbd>Tab</Kbd> then <Kbd>←</Kbd> <Kbd>→</Kbd>
                        </span>
                        <Button v="s" size="sm" icon={RotateCcw} onClick={p.onResetWidths}>Reset widths to this layout</Button>
                    </div>
                </Row>
            </Section>
        </Page>
    );
}

export function CatalogPage() {
    const { p, flash } = useSettingsCtx();
    const comp = p.composition || { catalog: {} };
    const catMode = comp.catalog?.mode ?? 'left';
    const hasButtons = catMode !== 'off';
    const shapeOptions = [
        { value: 'auto', label: 'Automatic', desc: 'Picks the best style for the space available.',
          pic: <><Pic.Col><Pic.Box tone="cool" flex={3} /><Pic.Box flex={1} /></Pic.Col><Pic.Col><Pic.Box tone="cool" flex={3} /><Pic.Box flex={1} /></Pic.Col><Pic.Col><Pic.Box flex={1} /><Pic.Box flex={1} /><Pic.Box flex={1} /></Pic.Col></> },
        { value: 'large_cards', label: 'Big photo cards', desc: 'A large picture with the name and price under it. Best when photos sell.',
          pic: <>{[0, 1, 2].map(i => <Pic.Col key={i}><Pic.Box tone="cool" flex={3} /><Pic.Box flex={1} /></Pic.Col>)}</> },
        { value: 'cards', label: 'Compact cards', desc: 'A small picture beside the name. Fits more on screen.',
          pic: <Pic.Col>{[0, 1, 2].map(i => <Pic.Row key={i}><Pic.Box tone="cool" flex={1} /><Pic.Box flex={3} /><Pic.Box tone="cool" flex={1} /><Pic.Box flex={3} /></Pic.Row>)}</Pic.Col> },
        { value: 'rows', label: 'List rows', desc: 'One product per line. Easiest to read long names.',
          pic: <Pic.Col gap={2}>{[0, 1, 2, 3].map(i => <Pic.Box key={i} />)}</Pic.Col> },
        { value: 'pills', label: 'Small pills', desc: 'Name-only buttons. Fits the most products by far.',
          pic: <Pic.Col>{[0, 1, 2].map(i => <Pic.Row key={i}>{[0, 1, 2].map(j => <Pic.Box key={j} style={{ borderRadius: 999 }} />)}</Pic.Row>)}</Pic.Col> },
    ];

    return (
        <Page icon={ShoppingBasket} title="Product buttons"
              intro="How products look on the register: the button style, how many fit in a row, the category bar and the order they appear in.">
            {!hasButtons && (
                <Callout tone="warn">
                    The product list is hidden on this register (<b>Screen layout → Where the product list sits</b>), so these
                    settings only apply when you open products from search. Turn it on to see buttons on the till.
                </Callout>
            )}
            <Section title="Button style" scope="device">
                <Row sid="catalog.shape" stacked flash={flash} title="Product button style"
                     desc="Choose how each product looks. The preview on the right uses your real products once they have loaded.">
                    <Choices label="Product button style" value={comp.catalogShape || 'auto'}
                             onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, catalogShape: v }))}
                             options={shapeOptions} />
                </Row>
                <Row sid="catalog.tiles" flash={flash} title="Products per row"
                     desc="Automatic fits as many as the space allows. Pick a number to keep it fixed — for example 4 for big, easy-to-hit buttons on a touch screen."
                     example={<><b>Tip:</b> fewer per row means bigger buttons.</>}>
                    <Stepper label="products per row" value={comp.catalog?.tiles ?? 0} min={0} max={8}
                             onChange={v => p.onUpdateComposition?.(prev => ({ ...prev, catalog: { ...prev.catalog, tiles: v === 0 ? null : v } }))}
                             format={v => (v === 0 ? 'Automatic' : `${v} per row`)} />
                </Row>
                <Row sid="catalog.pictures" flash={flash} title="Show product pictures"
                     desc="Turn off for text-only buttons — faster to scan with your eyes when you know your products by name.">
                    <Switch label="Show product pictures" checked={p.showCatalogImages !== false} onChange={p.setShowCatalogImages} />
                </Row>
            </Section>

            <Section title="Categories and order" scope="device">
                <Row sid="catalog.categories" stacked flash={flash} title="Category bar"
                     desc="Show categories as a row of tabs across the top, or as a list down the left side (better when you have many categories).">
                    <Segmented label="Category bar" value={p.categoryOrientation || 'horizontal'} onChange={p.setCategoryOrientation}
                               options={[{ value: 'horizontal', label: 'Tabs across the top' }, { value: 'vertical', label: 'List on the left' }]} />
                </Row>
                <Row sid="catalog.sort" stacked flash={flash} title="Product order"
                     desc="The order products appear in, in 'All items' and in every category.">
                    <Segmented label="Product order" value={p.catalogSort || 'top_selling'} onChange={p.setCatalogSort}
                               options={[
                                   { value: 'top_selling', label: 'Best sellers first' },
                                   { value: 'name_asc', label: 'A to Z' },
                                   { value: 'price_asc', label: 'Cheapest first' },
                                   { value: 'price_desc', label: 'Dearest first' },
                                   { value: 'stock_desc', label: 'Most in stock' },
                                   { value: 'newest', label: 'Newest first' },
                               ]} />
                </Row>
            </Section>

            <Section title="Stock on the buttons" scope="device">
                {p.isStockTracking ? (
                    <>
                        <Row sid="catalog.stock-badge" flash={flash} title="Show how many are left"
                             desc="Adds a small '12 left' label to each product, and 'Sold out' when there are none.">
                            <Switch label="Show how many are left" checked={p.showCatalogStock !== false} onChange={p.setShowCatalogStock} />
                        </Row>
                        <Row sid="catalog.hide-oos" flash={flash} title="Hide sold-out products"
                             desc="Products with no stock disappear from the buttons. They can still be found by scanning or searching.">
                            <Switch label="Hide sold-out products" checked={!!p.hideOutOfStock} onChange={p.setHideOutOfStock} />
                        </Row>
                    </>
                ) : (
                    <Row sid="catalog.stock-badge" flash={flash} title="Stock is not being tracked"
                         desc="This business does not keep stock counts, so every product is always available. Turn stock tracking on in Stock & prices if you want counts on the buttons." />
                )}
            </Section>
        </Page>
    );
}

export function ScreenPage() {
    const { p, flash } = useSettingsCtx();
    const mode = p.appearanceMode || 'light';
    return (
        <Page icon={MonitorSmartphone} title="Text & display"
              intro="Make the register easier to read and easier to tap. These choices are saved on this device only.">
            <Section title="Easy reading" scope="device">
                <Row sid="screen.large" flash={flash}
                     title="Easy-read mode"
                     desc="Bigger text, bigger buttons and stronger contrast everywhere on the register. If a column can no longer fit at the bigger size, it turns into a button instead of squeezing the text."
                     example={<><b>Good for:</b> older staff, bright shops, or a screen viewed from further away.</>}
                     tags={<Eye size={15} className="vqs-muted" />}>
                    <Switch label="Easy-read mode" checked={!!p.seniorMode} onChange={p.setSeniorMode} />
                </Row>
                {typeof p.uiScale === 'number' && (
                    <Row sid="screen.scale" flash={flash}
                         title="Size of everything"
                         desc="Makes the whole register larger or smaller — text, buttons and the space between them. Use this to fit a small screen or fill a big one.">
                        <Stepper label="size" value={Math.round(p.uiScale * 100)} min={90} max={130} step={5}
                                 onChange={v => p.setUiScale?.(v / 100)} format={v => `${v}%`} />
                    </Row>
                )}
            </Section>

            <Section title="Look" scope="device">
                <Row sid="screen.theme" stacked flash={flash}
                     title="Light or dark"
                     desc="Dark is easier on the eyes in a dim restaurant or late at night. 'Match this device' follows the computer's own setting. This follows your account, so your other screens change too.">
                    <Choices label="Light or dark" value={mode} cols="2" onChange={v => p.setAppearanceMode?.(v)}
                             options={[
                                 { value: 'light', label: 'Light', icon: Sun, desc: 'White background. Best in bright shops.' },
                                 { value: 'dark', label: 'Dark', icon: Moon, desc: 'Dark background. Best in dim light.' },
                                 { value: 'system', label: 'Match this device', icon: Laptop, desc: 'Follows the computer or tablet.' },
                             ]} />
                </Row>
                <Row sid="screen.rail" flash={flash}
                     title="Menu bar on the left"
                     desc="Shows the main VenQore menu down the left side of the register. Off gives the till the whole width; you can always leave the register from the button at the top left.">
                    <Switch label="Menu bar on the left" checked={!!p.showRail} onChange={p.setShowRail} />
                </Row>
            </Section>
        </Page>
    );
}

export function ButtonsPage({ SURFACE_BUTTONS }) {
    const { p, flash } = useSettingsCtx();
    const surface = p.surface || {};
    const list = SURFACE_BUTTONS.filter(b => !b.restaurant || p.preparesOrders);
    const on = list.filter(b => surface[b.id]).length;
    return (
        <Page icon={MousePointerClick} title="Top bar buttons"
              intro="Choose which shortcut buttons appear in the register's top bar. Fewer buttons means a calmer screen — anything you switch off is still in these settings or on a keyboard key.">
            <Section title={`Buttons on the top bar (${on} on)`} scope="device"
                     desc="Phones always hide these to make room for the sale tabs.">
                {list.map(b => {
                    const Icon = b.icon;
                    return (
                        <Row key={b.id} sid={`buttons.${b.id}`} flash={flash}
                             title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                                 <span className="vqs-nav-icon" style={{ width: 30, height: 30 }}><Icon size={16} /></span>{b.label}
                             </span>}
                             desc={b.hint}>
                            <Switch label={b.label} checked={!!surface[b.id]} onChange={v => p.setSurface?.({ ...surface, [b.id]: v })} />
                        </Row>
                    );
                })}
            </Section>
            <Callout>
                The <b>sales waiting to upload</b> button is automatic: it appears by itself when this device is offline
                with sales to send, and disappears once they are sent.
            </Callout>
        </Page>
    );
}
