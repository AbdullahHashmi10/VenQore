import React, { useEffect, useRef } from 'react';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '&copy; OpenStreetMap contributors';

async function makeMap(el, center, zoom) {
    const L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');
    const map = L.map(el, { scrollWheelZoom: false }).setView(center, zoom);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTR }).addTo(map);
    return { L, map };
}

/** Tap/drag to choose a point. onPick({lat,lng}) fires on every change. */
export function LocationPicker({ center, point, onPick }) {
    const el = useRef(null);
    useEffect(() => {
        let map; let marker; let dead = false;
        (async () => {
            const start = point || center || [30.3753, 69.3451];
            const m = await makeMap(el.current, [start.lat ?? start[0], start.lng ?? start[1]], point ? 14 : (center ? 11 : 5));
            if (dead) { m.map.remove(); return; }
            map = m.map;
            const icon = m.L.divIcon({ className: '', html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0BAA8F;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>', iconSize: [22, 22], iconAnchor: [11, 22] });
            const set = (ll) => { if (marker) marker.setLatLng(ll); else { marker = m.L.marker(ll, { icon, draggable: true }).addTo(map); marker.on('dragend', () => { const p = marker.getLatLng(); onPick({ lat: p.lat, lng: p.lng }); }); } };
            if (point) set([point.lat, point.lng]);
            map.on('click', (e) => { set(e.latlng); onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); });
            setTimeout(() => map && map.invalidateSize(), 150);
        })();
        return () => { dead = true; if (map) map.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div ref={el} className="mp-pick" role="application" aria-label="Map: tap to choose your location" />;
}

/** All shops as pins; opens a popup with a link. */
export function ShopsMap({ points, me, center }) {
    const el = useRef(null);
    useEffect(() => {
        let map; let dead = false;
        (async () => {
            const c = me ? [me.lat, me.lng] : (points[0] ? [points[0].lat, points[0].lng] : (center || [30.3753, 69.3451]));
            const m = await makeMap(el.current, c, 12);
            if (dead) { m.map.remove(); return; }
            map = m.map;
            const bounds = [];
            points.forEach((p) => {
                const color = p.open === true ? '#16A34A' : '#64748B';
                const mk = m.L.circleMarker([p.lat, p.lng], { radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
                const box = document.createElement('div');
                const a = document.createElement('a'); a.href = p.url; a.textContent = p.name; a.style.fontWeight = '700';
                box.appendChild(a);
                mk.bindPopup(box);
                bounds.push([p.lat, p.lng]);
            });
            if (me) {
                m.L.circleMarker([me.lat, me.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(map).bindTooltip('You');
                bounds.push([me.lat, me.lng]);
            }
            if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
            setTimeout(() => map && map.invalidateSize(), 150);
        })();
        return () => { dead = true; if (map) map.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(points), me?.lat, me?.lng]);
    return <div ref={el} className="mp-map" role="application" aria-label="Map of shops" />;
}
