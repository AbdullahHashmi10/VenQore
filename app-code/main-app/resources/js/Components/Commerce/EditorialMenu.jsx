import React from 'react';
import { Search, Plus, Minus, UtensilsCrossed, X } from 'lucide-react';
import { Pager } from './shop';
import { money } from '@/lib/commerce';
import '../../../css/catalogue-editorial.css';

/** A restaurant composition using the existing catalogue and cart contracts. */
export default function EditorialMenu({ store, items, categories, filters, pagination, search, setSearch, goCatalogue, showImages, pick, renderOptions, cart, add, setQty, canAdd, onDetail, maxQty }) {
    const groups = new Map();
    items.forEach((raw) => {
        const category = raw.category || 'From the menu';
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(raw);
    });
    return (
        <section className="vqe-menu" aria-label="Restaurant menu">
            <header className="vqe-masthead">
                <div className="vqe-ornament" aria-hidden="true"><span /><UtensilsCrossed size={22} strokeWidth={1} /><span /></div>
                <p className="vqe-invitation">A seat at our table</p>
                <h2>À la carte</h2>
                <p className="vqe-intro">Take your time. Find something to savour.</p>
                <div className="vqe-menu-signature"><span />{store.name}<span /></div>
            </header>
            <div className="vqe-browse">
                {categories.length > 0 && <nav className="vqe-categories" aria-label="Menu sections">
                    <button type="button" aria-pressed={!filters.category} onClick={() => goCatalogue({ category: undefined, page: undefined })}>Full menu</button>
                    {categories.map((category) => <button key={category.id} type="button" aria-pressed={String(filters.category) === String(category.id)} onClick={() => goCatalogue({ category: category.id, page: undefined })}>{category.name}</button>)}
                </nav>}
                <search className="vqe-search"><form onSubmit={(event) => { event.preventDefault(); goCatalogue({ q: search.trim() || undefined, page: undefined }); }}>
                    <Search size={16} aria-hidden="true" /><input type="search" aria-label="Search the menu" placeholder="Find something on the menu…" value={search} maxLength={60} onChange={(event) => setSearch(event.target.value)} /><button type="submit">Find</button>
                </form></search>
            </div>
            {(filters.q || filters.category) && <div className="vqe-filter-status"><span>{pagination.total ?? items.length} matching {(pagination.total ?? items.length) === 1 ? 'item' : 'items'}{filters.q ? ` for “${filters.q}”` : ''}</span><button type="button" onClick={() => { setSearch(''); goCatalogue({ q: undefined, category: undefined, page: undefined }); }}>Full menu <X size={12} /></button></div>}
            {[...groups].map(([category, entries]) => <section className="vqe-course" key={category} aria-label={category}>
                <header className="vqe-course-heading"><h3>{category}</h3><span aria-hidden="true" className="vqe-course-rule" /><span>{entries.length} {entries.length === 1 ? 'selection' : 'selections'}</span></header>
                <ul className="vqe-dishes">{entries.map((raw) => {
                    const item = pick(raw);
                    const quantity = cart.lines.find((line) => line.item_id === item.id)?.quantity || 0;
                    const hasPhoto = showImages && Boolean(item.image_url);
                    return <li key={raw.id} className={`vqe-dish ${hasPhoto ? 'vqe-dish--pictured' : 'vqe-dish--type'} ${item.stock === 'out' ? 'vqe-dish--unavailable' : ''}`}>
                        {hasPhoto && <button type="button" className="vqe-dish-photo" aria-label={`View ${item.name}`} onClick={() => onDetail(item)}><img src={item.image_url} alt="" loading="lazy" /><span>Take a closer look</span></button>}
                        <div className="vqe-dish-copy">
                            {(item.featured || item.was_price || item.stock === 'out' || item.stock === 'low') && <div className="vqe-dish-notes">{item.stock === 'out' ? 'Currently unavailable' : item.stock === 'low' ? `${item.left} remaining` : item.featured ? 'Featured selection' : 'Special price'}</div>}
                            <div className="vqe-dish-title"><h4><button type="button" onClick={() => onDetail(item)}>{item.name}</button></h4><span className="vqe-leader" aria-hidden="true" /><div className="vqe-dish-price">{item.was_price && <s>{money(item.was_price, store.currency_symbol)}</s>}<span>{money(item.price, store.currency_symbol)}</span>{item.unit && !/^(pcs|piece|pieces|each|unit)$/i.test(item.unit) && <small>per {item.unit}</small>}</div></div>
                            {item.description && <p className="vqe-description">{item.description}</p>}
                            {renderOptions(item)}
                            <div className="vqe-dish-actions"><button type="button" className="vqe-details" onClick={() => onDetail(item)}>{item.options?.length > 1 ? 'Options & details' : 'View details'}</button>
                                {quantity > 0 ? <div className="vqe-quantity"><button type="button" aria-label={`Remove one ${item.name}`} onClick={() => setQty(item.id, quantity - 1)}><Minus size={14} /></button><span aria-live="polite">{quantity}</span><button type="button" aria-label={`Add one ${item.name}`} disabled={!canAdd || item.stock === 'out' || quantity >= maxQty} onClick={() => add(item)}><Plus size={14} /></button></div> : <button type="button" className="vqe-add" disabled={!canAdd || item.stock === 'out'} aria-label={`Add ${item.name} to order`} onClick={() => add(item)}><Plus size={14} />{item.stock === 'out' ? 'Unavailable' : 'Add to order'}</button>}
                            </div>
                        </div>
                    </li>;
                })}</ul>
            </section>)}
            {items.length === 0 && <div className="vqe-empty"><UtensilsCrossed size={30} strokeWidth={1} /><h3>{filters.q || filters.category ? 'Nothing on this page matches.' : 'The menu is being prepared.'}</h3><p>{filters.q || filters.category ? 'Try another search or return to the full menu.' : 'Please ask a member of our team for today’s selections.'}</p></div>}
            <Pager current={pagination.current} last={pagination.last} onGo={(page) => goCatalogue({ page })} />
            <footer className="vqe-menu-end"><span aria-hidden="true">✦</span><p>Something you would like to know?</p><span>Ask our team about ingredients and dietary requirements before ordering.</span></footer>
        </section>
    );
}
