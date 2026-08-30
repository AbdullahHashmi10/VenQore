/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — Layout Preview Shell (Interactive Miniature Register UI)       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Renders an accurate, responsive miniature visualization of the composed POS
 * layout according to the selected preset, navigation rail preference, and
 * display modes.
 */

import React from 'react';

export default function LayoutPreviewShell({
    preset = 'column',
    rail = true,
    senior = false,
    className = '',
    style = {},
}) {
    // Determine composition traits
    const isScan = preset === 'scan';
    const isColumn = preset === 'column';
    const isRow = preset === 'row';
    const isGrid = preset === 'grid';
    const isStack = preset === 'stack';
    const isCounter = preset === 'counter';
    const isTable = preset === 'table';

    return (
        <div className={`nqp-preview-shell ${className}`} style={style}>
            {/* Top Mock Window Bar */}
            <div className="nqp-prev-header">
                <div className="nqp-prev-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-amber" />
                    <span className="dot dot-green" />
                </div>
                <div className="nqp-prev-title">
                    <span className="nqp-prev-brand">VenQore POS</span>
                    <span className="nqp-prev-badge">{preset.toUpperCase()} LAYOUT</span>
                    {senior ? <span className="nqp-prev-badge badge-accent">LARGE TEXT</span> : null}
                    {rail ? <span className="nqp-prev-badge badge-muted">NAV RAIL ON</span> : null}
                </div>
                <div className="nqp-prev-status">
                    <span className="status-indicator" /> Live Register Preview
                </div>
            </div>

            {/* Main Mock Screen Body */}
            <div className="nqp-prev-body">
                {/* Left Navigation Rail (if enabled) */}
                {rail && !isCounter ? (
                    <div className="nqp-prev-rail">
                        <div className="nqp-prev-rail-item active">🛍️</div>
                        <div className="nqp-prev-rail-item">📦</div>
                        <div className="nqp-prev-rail-item">🧾</div>
                        <div className="nqp-prev-rail-item">📊</div>
                        <div style={{ marginTop: 'auto' }} className="nqp-prev-rail-item">⚙️</div>
                    </div>
                ) : null}

                {/* Content Workspace Area */}
                <div className="nqp-prev-content">
                    {/* Top Search / Header Strip */}
                    <div className="nqp-prev-topbar">
                        <div className="nqp-prev-search">
                            <span>🔍</span> {isScan ? 'Hero Barcode Scanner (Focus Active)...' : 'Scan barcode or search products...'}
                        </div>
                        <div className="nqp-prev-tab-badge">Tab 1 (Walk-in)</div>
                        <div className="nqp-prev-time">12:00 PM</div>
                    </div>

                    {/* Work Area Grid based on Preset */}
                    <div className="nqp-prev-stage">
                        {/* 1. TABLE PRESET: Table floor plan column */}
                        {isTable ? (
                            <div className="nqp-prev-pane pane-floor">
                                <div className="nqp-prev-pane-hdr">🍽️ Table Floor Plan</div>
                                <div className="nqp-prev-floor-grid">
                                    <div className="nqp-prev-table-card seated">
                                        <b>T-1</b>
                                        <span>2 Guests · ₹1,450</span>
                                    </div>
                                    <div className="nqp-prev-table-card free">
                                        <b>T-2</b>
                                        <span>Available</span>
                                    </div>
                                    <div className="nqp-prev-table-card billed">
                                        <b>T-3</b>
                                        <span>Billed · ₹3,200</span>
                                    </div>
                                    <div className="nqp-prev-table-card free">
                                        <b>T-4</b>
                                        <span>Available</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* 2. ROW / STACK: Top Catalog Strip */}
                        {(isRow || isStack) ? (
                            <div className="nqp-prev-pane pane-catalog-top">
                                <div className="nqp-prev-pane-hdr">
                                    <span>📦 Quick Menu / Category Strip</span>
                                    <span className="tag-pill">32 items</span>
                                </div>
                                <div className="nqp-prev-tile-strip">
                                    <div className="nqp-prev-tile">☕ Hot Coffee</div>
                                    <div className="nqp-prev-tile">🥐 Croissant</div>
                                    <div className="nqp-prev-tile">🍰 Cheesecake</div>
                                    <div className="nqp-prev-tile">🥤 Iced Latte</div>
                                    <div className="nqp-prev-tile">🥪 Club Sandwich</div>
                                </div>
                            </div>
                        ) : null}

                        {/* 3. COLUMN / GRID: Left Catalog Column */}
                        {(isColumn || isGrid) ? (
                            <div className={`nqp-prev-pane pane-catalog ${isGrid ? 'pane-grid-dominant' : ''}`}>
                                <div className="nqp-prev-pane-hdr">
                                    <span>📦 Product Catalog</span>
                                    <span className="tag-pill">{isGrid ? 'Touch Grid 40%' : 'Reference 20%'}</span>
                                </div>
                                <div className="nqp-prev-cats">
                                    <span className="active">All</span>
                                    <span>Bakery</span>
                                    <span>Drinks</span>
                                    <span>Snacks</span>
                                </div>
                                <div className={`nqp-prev-tile-grid ${isGrid ? 'grid-2col' : 'grid-1col'}`}>
                                    <div className="nqp-prev-tile-card">
                                        <div className="tile-img" />
                                        <b>Mineral Water 1.5L</b>
                                        <span className="price">₹90</span>
                                    </div>
                                    <div className="nqp-prev-tile-card">
                                        <div className="tile-img" />
                                        <b>Fresh Milk 1L</b>
                                        <span className="price">₹240</span>
                                    </div>
                                    {isGrid ? (
                                        <>
                                            <div className="nqp-prev-tile-card">
                                                <div className="tile-img" />
                                                <b>Brown Bread</b>
                                                <span className="price">₹160</span>
                                            </div>
                                            <div className="nqp-prev-tile-card">
                                                <div className="tile-img" />
                                                <b>Butter Cookies</b>
                                                <span className="price">₹350</span>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        {/* 4. CART PANE: In the center or dominant area */}
                        <div className={`nqp-prev-pane pane-cart ${isScan ? 'pane-cart-max' : ''} ${isCounter ? 'pane-counter' : ''}`}>
                            <div className="nqp-prev-pane-hdr">
                                <span>🛒 Active Cart</span>
                                <span className="cart-counter">3 Items</span>
                            </div>
                            <div className="nqp-prev-cart-list">
                                <div className="nqp-prev-cart-row">
                                    <div className="cart-item-name">
                                        <b>Cement 50kg Bag</b>
                                        <span className="cart-sku">SKU: CEM-01 · 12 in stock</span>
                                    </div>
                                    <div className="cart-qty-stepper">
                                        <span>−</span> <b>2</b> <span>+</span>
                                    </div>
                                    <div className="cart-item-total">₹2,500</div>
                                </div>
                                <div className="nqp-prev-cart-row">
                                    <div className="cart-item-name">
                                        <b>Steel Rod 12mm</b>
                                        <span className="cart-sku">SKU: STL-12 · 40 in stock</span>
                                    </div>
                                    <div className="cart-qty-stepper">
                                        <span>−</span> <b>5</b> <span>+</span>
                                    </div>
                                    <div className="cart-item-total">₹4,900</div>
                                </div>
                                <div className="nqp-prev-cart-row">
                                    <div className="cart-item-name">
                                        <b>Paint 4L Ivory White</b>
                                        <span className="cart-sku">SKU: PNT-IV · 3 in stock</span>
                                    </div>
                                    <div className="cart-qty-stepper">
                                        <span>−</span> <b>1</b> <span>+</span>
                                    </div>
                                    <div className="cart-item-total">₹3,400</div>
                                </div>
                            </div>

                            {/* Docked Total for Grid/Stack/Counter */}
                            {(isGrid || isStack || isCounter) ? (
                                <div className="nqp-prev-docked-pay">
                                    <div className="docked-total">
                                        <span>Net Payable</span>
                                        <b>₹10,800</b>
                                    </div>
                                    <button type="button" className="nqp-prev-pay-btn">Take Payment (₹10,800)</button>
                                </div>
                            ) : null}
                        </div>

                        {/* 5. RESIDENT PAYMENT PANEL (For Column, Scan, Row, Table) */}
                        {(isColumn || isScan || isRow || isTable) ? (
                            <div className="nqp-prev-pane pane-tender">
                                <div className="nqp-prev-pane-hdr">
                                    <span>💳 Payment & Tender</span>
                                    <span className="tag-pill">Resident</span>
                                </div>
                                <div className="nqp-prev-tender-body">
                                    <div className="nqp-prev-kv">
                                        <span>Subtotal</span>
                                        <span>₹10,800</span>
                                    </div>
                                    <div className="nqp-prev-kv">
                                        <span>Tax (GST 18%)</span>
                                        <span>₹1,944</span>
                                    </div>
                                    <div className="nqp-prev-kv">
                                        <span>Discount</span>
                                        <span className="text-accent">− ₹500</span>
                                    </div>
                                    <div className="nqp-prev-kv total-row">
                                        <b>Net Total</b>
                                        <b className="total-amount">₹12,244</b>
                                    </div>
                                    <div className="nqp-prev-methods">
                                        <span className="method-pill active">Cash</span>
                                        <span className="method-pill">Card</span>
                                        <span className="method-pill">UPI</span>
                                    </div>
                                    <button type="button" className="nqp-prev-pay-btn green">Complete Sale</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Layout Anatomy Legend */}
            <div className="nqp-prev-footer-legend">
                <div className="legend-item">
                    <span className="legend-dot dot-teal" /> <b>Cart & Items</b> ({isScan ? 'Full Width' : 'Center focus'})
                </div>
                <div className="legend-item">
                    <span className="legend-dot dot-sky" /> <b>Catalog</b> ({isScan ? 'Off (Scanner-first)' : isRow || isStack ? 'Top Strip' : isGrid ? '40% Touch Grid' : isTable ? 'Touch' : '20% Column'})
                </div>
                <div className="legend-item">
                    <span className="legend-dot dot-purple" /> <b>Payment</b> ({isGrid || isStack || isCounter ? 'Docked Pay Bar' : 'Resident Column'})
                </div>
                {isTable ? (
                    <div className="legend-item">
                        <span className="legend-dot dot-amber" /> <b>Table Management</b> (Dine-in Floor)
                    </div>
                ) : null}
            </div>
        </div>
    );
}
