import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * The menu: search, category chips, product tiles. Pure view over useCatalog;
 * what a tap MEANS (variants, add-ons, adding a line) is the order pane's job.
 */
export default function CatalogPane({ catalog, eightySixIds = [], money, onPick, disabled = false, onEnter }) {
    const { categories, products, loading, query, setQuery, categoryId, setCategoryId } = catalog;
    const out = new Set((eightySixIds || []).map(String));

    return (
        <section className="foh-catalog" aria-label="Menu">
            <div className="foh-search">
                <Search size={16} aria-hidden="true" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && products.length === 1 && !disabled) { onPick(products[0]); setQuery(''); onEnter?.(); } }}
                    placeholder="Search the menu or scan a barcode"
                    aria-label="Search the menu"
                />
                {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}
            </div>

            <div className="foh-cats" role="tablist" aria-label="Categories">
                <button type="button" role="tab" aria-selected={!categoryId} data-on={!categoryId ? '1' : '0'} onClick={() => setCategoryId(null)}>All</button>
                {categories.map((c) => (
                    <button key={c.id} type="button" role="tab" aria-selected={categoryId === c.id} data-on={categoryId === c.id ? '1' : '0'} onClick={() => setCategoryId(c.id)}>
                        {c.name}
                    </button>
                ))}
            </div>

            <div className="foh-grid" data-loading={loading ? '1' : '0'}>
                {products.map((p) => {
                    const is86 = out.has(String(p.id));
                    return (
                        <button
                            key={p.id}
                            type="button"
                            className="foh-tile"
                            data-out={is86 ? '1' : '0'}
                            disabled={disabled || is86}
                            onClick={() => onPick(p)}
                            title={is86 ? 'Out of stock (86)' : p.name}
                        >
                            <span className="foh-tile-n">{p.name}</span>
                            <span className="foh-tile-p vq-num">{money(p.price)}</span>
                            {is86 && <span className="foh-tile-tag">86</span>}
                        </button>
                    );
                })}
                {!loading && products.length === 0 && <p className="foh-empty">Nothing matches.</p>}
            </div>
        </section>
    );
}
