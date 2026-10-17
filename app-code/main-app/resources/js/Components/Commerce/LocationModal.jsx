import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Navigation } from 'lucide-react';
import { LocationPicker } from '@/Components/Commerce/MarketMap';
import '../../../css/vq-app.css';

/** "Pin your delivery location" — use GPS, tap the map to drop a pin, or pick a city. Full-screen step before the directory. */
export default function LocationModal({ cities, country, current, onChoose, onClose, required, shopCount }) {
    const [point, setPoint] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const center = (cities.find((c) => c.slug === current?.slug && c.lat) || cities.find((c) => c.lat));

    useEffect(() => {
        const k = (e) => { if (e.key === 'Escape' && !required) onClose(); };
        window.addEventListener('keydown', k);
        const prev = document.documentElement.style.overflowY;
        document.documentElement.style.overflowY = 'hidden';
        return () => { window.removeEventListener('keydown', k); document.documentElement.style.overflowY = prev || 'auto'; };
    }, [required, onClose]);

    const locate = () => {
        if (!navigator.geolocation) { setErr('Your device cannot share location. Pick a city or tap the map.'); return; }
        setBusy(true); setErr('');
        navigator.geolocation.getCurrentPosition(
            (p) => { setBusy(false); onChoose({ lat: p.coords.latitude, lng: p.coords.longitude }); },
            () => { setBusy(false); setErr('We could not get your location. Pick a city or tap the map instead.'); },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    };

    const zone = point ? `Pinned at ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : (current?.name ? `${current.name}${country?.name ? `, ${country.name}` : ''}` : 'Tap the map to move the pin');

    return (
        <div className="vqa vqa-loc vqa-rise" role="dialog" aria-modal="true" aria-labelledby="vqa-loc-title">
            <div className="vqa-bar vqa-bar--solid">
                {!required ? <button type="button" className="vqa-iconbtn vqa-spring" onClick={onClose} aria-label="Back"><ArrowLeft size={16} /></button> : <span style={{ width: 32 }} />}
                <div className="vqa-title">
                    <h1 id="vqa-loc-title" className="vqa-display">Pin Your Delivery Location</h1>
                    <p>Tap the map to move the pin or use live GPS</p>
                </div>
                {shopCount != null ? <span className="vqa-badge vqa-badge--accent">{shopCount} shops</span> : <span style={{ width: 32 }} />}
            </div>

            <div className="vqa-loc-map">
                <LocationPicker center={center ? [center.lat, center.lng] : null} point={point} onPick={setPoint} />
            </div>

            <div className="vqa-loc-sheet">
                <button type="button" className="vqa-btn vqa-btn--soft vqa-spring" onClick={locate} disabled={busy}>
                    <Navigation size={14} className={busy ? 'animate-spin' : ''} />{busy ? 'Finding your location…' : 'Use my current GPS location'}
                </button>
                {err && <p className="vqa-err" role="alert">{err}</p>}

                {cities.length > 0 && (
                    <div className="vqa-chips vqa-noscroll" role="group" aria-label="Cities">
                        {cities.map((c) => {
                            const on = current?.slug === c.slug;
                            return (
                                <button key={c.id} type="button" className="vqa-chip vqa-spring" aria-pressed={on}
                                    onClick={() => onChoose({ city: c.slug, lat: c.lat ?? undefined, lng: c.lng ?? undefined, cityOnly: true })}>
                                    {on && <Check size={12} strokeWidth={2.6} />}{c.name}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="vqa-zone">
                    <MapPin size={16} style={{ color: 'var(--vq-accent-text)', flex: 'none' }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="vqa-eyebrow">Selected delivery zone</span>
                        <b>{zone}</b>
                    </div>
                </div>

                <button type="button" className="vqa-btn vqa-spring" disabled={!point} style={!point ? { opacity: 0.5, boxShadow: 'none' } : undefined} onClick={() => onChoose({ lat: point.lat, lng: point.lng })}>
                    Show shops around here<ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
