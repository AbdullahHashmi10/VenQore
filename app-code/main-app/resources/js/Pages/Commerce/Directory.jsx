import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ShieldCheck, Truck, Store as StoreIcon } from 'lucide-react';
import PublicShell from '@/Components/Commerce/PublicShell';
import { Badge, Icon, Pager, initials, tone } from '@/Components/Commerce/shop';

const go = (params) => router.get('/shop', params, { preserveScroll: true });

export default function Directory({ countries, country, cities, city, stores }) {
    const open = stores?.data?.filter((s) => s.open_now === true).length || 0;

    return (
        <PublicShell>
            <Head title="Find a business near you">
                <meta name="description" content="Browse local businesses and order directly from them." />
            </Head>

            <section className="vqs-hero">
              <div className="vqs-herogrid">
                <div>
                <div className="vqs-eyebrow">{city ? `${city.name}${country ? ` · ${country.name}` : ''}${stores ? ` · ${open} open now` : ''}` : 'VenQore Shops'}</div>
                <h1 className="vqs-h1" style={{ marginTop: 14, maxWidth: '14ch' }}>Shop local. <em>Order in a minute.</em></h1>
                <p className="vqs-lede">Browse real businesses in your city, fill a cart, and pay on delivery or at pickup. No account needed.</p>
                <div className="vqs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 24, maxWidth: 520 }}>
                    <select aria-label="Country" className="vqs-select" value={country?.code || ''} onChange={(e) => go(e.target.value ? { country: e.target.value } : {})}>
                        <option value="">Select a country</option>
                        {countries.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
                    </select>
                    <select aria-label="City" className="vqs-select" value={city?.slug || ''} disabled={!country}
                        onChange={(e) => go(e.target.value ? { country: country.code, city: e.target.value } : { country: country.code })}>
                        <option value="">{country ? 'Select a city' : 'Choose a country first'}</option>
                        {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    </select>
                </div>
                <ol className="vqs-row" style={{ listStyle: 'none', padding: 0, margin: '22px 0 0', gap: 22, fontSize: 14, color: 'rgb(255 255 255 / .85)' }}>
                    {['Pick a shop', 'Add to cart', 'Pay when it arrives'].map((t, i) => (
                        <li key={t} className="vqs-row" style={{ gap: 8 }}>
                            <span className="vqs-num" style={{ width: 24, height: 24, borderRadius: 99, background: 'rgb(255 255 255 / .16)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{i + 1}</span>{t}
                        </li>
                    ))}
                </ol>
                </div>
                <div className="vqs-stack vqs-herofeats" style={{ gap: 12 }}>
                    {[[StoreIcon, 'Real local businesses', 'Every shop is run by an independent business in your city.'], [Truck, 'Delivery or pickup', 'Each shop sets its own areas, fees and prep time, shown before you order.'], [ShieldCheck, 'No account needed', 'Order as a guest. The business confirms your order before it is accepted.']].map(([I, h, t], i) => (
                        <div key={h} className="vqs-feat vqs-rise" style={{ '--i': i + 2 }}><span className="ic"><I size={20} /></span><div><b>{h}</b><span className="t">{t}</span></div></div>
                    ))}
                </div>
              </div>
            </section>

            <div style={{ marginTop: 32 }}>
                {!city && (
                    <div className="vqs-card vqs-empty">
                        <span className="ic" aria-hidden="true">⌖</span>
                        <span className="vqs-h2" style={{ fontSize: 20 }}>Choose your city</span>
                        <span className="vqs-muted" style={{ fontSize: 14 }}>Select a country and city to see the businesses taking online orders there.</span>
                    </div>
                )}

                {city && stores && stores.data.length === 0 && (
                    <div className="vqs-card vqs-empty">
                        <span className="ic" aria-hidden="true">⌂</span>
                        <span className="vqs-h2" style={{ fontSize: 20 }}>No businesses are live in {city.name} yet</span>
                        <span className="vqs-muted" style={{ fontSize: 14 }}>Check back soon, or try another city.</span>
                    </div>
                )}

                {city && stores && stores.data.length > 0 && (
                    <>
                        <div className="vqs-between" style={{ marginBottom: 16, alignItems: 'baseline' }}>
                            <h2 className="vqs-h2">Shops in {city.name}</h2>
                            <span className="vqs-eyebrow">{stores.total} business{stores.total === 1 ? '' : 'es'}</span>
                        </div>
                        <ul className="vqs-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', listStyle: 'none', padding: 0, margin: 0 }}>
                            {stores.data.map((s, idx) => {
                                const t = tone(s.slug);
                                return (
                                    <li key={s.slug} className="vqs-rise" style={{ '--i': Math.min(idx, 11) }}>
                                        <Link href={`/shop/${s.slug}`} className="vqs-card vqs-shopcard" style={{ height: '100%' }}>
                                            <div className="vqs-cover" style={{ background: t.bg }}>
                                                {s.open_now === true && <Badge kind="ok">Open now</Badge>}
                                                {s.open_now === false && <Badge>Closed now</Badge>}
                                            </div>
                                            <div className="vqs-shopbody">
                                                <span className="vqs-mark" style={{ color: t.fg }}>{s.logo_url ? <img src={s.logo_url} alt="" loading="lazy" /> : initials(s.name)}</span>
                                                <div className="vqs-stack" style={{ gap: 4 }}>
                                                    <span className="vqs-shopname">{s.name}</span>
                                                    <span className="vqs-muted" style={{ fontSize: 13 }}>{s.address}</span>
                                                </div>
                                                <div className="vqs-shopfoot">
                                                    {s.delivery && <span className="vqs-row" style={{ gap: 6 }}>{Icon.truck}Delivery</span>}
                                                    {s.pickup && <span className="vqs-row" style={{ gap: 6 }}>{Icon.bag}Pickup</span>}
                                                    <span className="go">Open store →</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                        <Pager current={stores.current} last={stores.last} onGo={(p) => go({ country: country.code, city: city.slug, page: p })} />
                    </>
                )}
            </div>
        </PublicShell>
    );
}
