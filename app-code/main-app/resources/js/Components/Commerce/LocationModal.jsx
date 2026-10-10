import React, { useEffect, useState } from 'react';
import { Check, LocateFixed, MapPin, X } from 'lucide-react';
import { LocationPicker } from '@/Components/Commerce/MarketMap';

/** "Where are you?" — use my location, pick a city, or drop a pin on the map. Styled by venqore-storefront.css. */
export default function LocationModal({ cities, country, current, onChoose, onClose, required }) {
    const [point, setPoint] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [shown, setShown] = useState(false);
    const center = (cities.find((c) => c.slug === current?.slug && c.lat) || cities.find((c) => c.lat));

    useEffect(() => {
        const t = requestAnimationFrame(() => setShown(true));
        const k = (e) => { if (e.key === 'Escape' && !required) onClose(); };
        window.addEventListener('keydown', k);
        const prev = document.documentElement.style.overflowY;
        document.documentElement.style.overflowY = 'hidden';
        return () => { cancelAnimationFrame(t); window.removeEventListener('keydown', k); document.documentElement.style.overflowY = prev || 'auto'; };
    }, [required, onClose]);

    const locate = () => {
        if (!navigator.geolocation) { setErr('Your browser cannot share location. Pick a city or tap the map.'); return; }
        setBusy(true); setErr('');
        navigator.geolocation.getCurrentPosition(
            (p) => { setBusy(false); onChoose({ lat: p.coords.latitude, lng: p.coords.longitude }); },
            () => { setBusy(false); setErr('We could not get your location. Pick a city or tap the map instead.'); },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    };

    return (
        <div className={`vqsf-modal ${shown ? 'on' : ''}`} role="dialog" aria-modal="true" aria-labelledby="vqsf-loc-title" onMouseDown={(e) => { if (e.target === e.currentTarget && !required) onClose(); }}>
            <div className="vqsf-modal-panel">
                <div className="vqsf-modal-head">
                    <div>
                        <div className="vqsf-eyebrow vqsf-eyebrow--accent" style={{ marginBottom: 10 }}>Your location</div>
                        <h2 id="vqsf-loc-title">Where should <span className="serif">we look?</span></h2>
                        <p>Share your location to see shops near you, or choose a city{country?.name ? ` in ${country.name}` : ''}.</p>
                    </div>
                    {!required && <button type="button" className="vqsf-ib" onClick={onClose} aria-label="Close"><X size={17} strokeWidth={1.9} /></button>}
                </div>

                <button type="button" className="vqsf-btn vqsf-btn--accent vqsf-btn--block" onClick={locate} disabled={busy}>
                    <LocateFixed size={17} strokeWidth={2} />{busy ? 'Finding you…' : 'Use my current location'}
                </button>
                {err && <p className="vqsf-err" role="alert" style={{ marginTop: 10 }}>{err}</p>}

                {cities.length > 0 && (
                    <>
                        <div className="vqsf-modal-or"><span>or choose a city</span></div>
                        <div className="vqsf-catchips vqsf-modal-cities" role="group" aria-label="Cities">
                            {cities.map((c) => {
                                const on = current?.slug === c.slug;
                                return (
                                    <button key={c.id} type="button" className={`vqsf-catchip ${on ? 'on' : ''}`} aria-pressed={on}
                                        onClick={() => onChoose({ city: c.slug, lat: c.lat ?? undefined, lng: c.lng ?? undefined, cityOnly: true })}>
                                        {on && <Check size={13} strokeWidth={2.4} />}{c.name}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="vqsf-modal-or"><span>or tap the map to drop a pin</span></div>
                <div className="vqsf-modal-map">
                    <LocationPicker center={center ? [center.lat, center.lng] : null} point={point} onPick={setPoint} />
                    <span className={`vqsf-modal-pin ${point ? 'on' : ''}`}><MapPin size={13} />{point ? `Pin at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : 'No pin yet — tap anywhere'}</span>
                </div>

                <div className="vqsf-modal-foot">
                    {!required && <button type="button" className="vqsf-btn vqsf-btn--md vqsf-btn--line" onClick={onClose}>Cancel</button>}
                    <button type="button" className="vqsf-btn vqsf-btn--md" disabled={!point} onClick={() => onChoose({ lat: point.lat, lng: point.lng })}>Show shops near this pin</button>
                </div>
            </div>
        </div>
    );
}
