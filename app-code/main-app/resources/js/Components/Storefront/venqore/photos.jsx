import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { ImagePlus, Loader2, X } from 'lucide-react';

/*
 * Photo spots on the public pages. Each spot (hero, story, delivery, dine in…) shows the owner's own
 * photos when they have added some, and falls back to the page's built-in look otherwise.
 * In "edit photos" mode every spot gets an Add photo button and a strip of thumbnails to remove.
 */
const Ctx = createContext({ editing: false, images: {}, upload: async () => {}, remove: async () => {}, busy: null, error: null });

export function PhotosProvider({ images: initial = {}, edit = null, children }) {
    const [images, setImages] = useState(initial || {});
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { setImages(initial || {}); }, [JSON.stringify(initial || {})]); // eslint-disable-line react-hooks/exhaustive-deps

    const upload = async (slot, file) => {
        if (!edit || !file) return;
        setBusy(slot); setError(null);
        const fd = new FormData(); fd.append('slot', slot); fd.append('image', file);
        try { const r = await axios.post(edit.upload, fd); setImages(r.data.images || {}); router.reload({ preserveScroll: true, preserveState: true }); }
        catch (e) { setError(e.response?.data?.message || e.response?.data?.errors?.image?.[0] || 'Could not upload that photo. Use a JPG, PNG or WebP under 4 MB.'); }
        finally { setBusy(null); }
    };
    const remove = async (slot, index) => {
        if (!edit) return;
        setBusy(slot); setError(null);
        try { const r = await axios.post(edit.remove, { slot, index }); setImages(r.data.images || {}); router.reload({ preserveScroll: true, preserveState: true }); }
        catch (e) { setError(e.response?.data?.message || 'Could not remove that photo.'); }
        finally { setBusy(null); }
    };
    return <Ctx.Provider value={{ editing: !!edit, edit, images, upload, remove, busy, error, clearError: () => setError(null) }}>{children}</Ctx.Provider>;
}

export const usePhotos = () => useContext(Ctx);
/** The owner's photos for one spot (array of URLs, may be empty). */
export const useSlot = (slot) => usePhotos().images?.[slot] || [];

/**
 * Edit overlay for one spot. Put it inside a position:relative box. Renders nothing for shoppers.
 * `max` is how many photos the spot holds (more than one = slideshow).
 */
export function PhotoSlot({ slot, max = 1, label, place = 'tl', slideshow = max > 1 }) {
    const { editing, images, upload, remove, busy } = usePhotos();
    const input = useRef(null);
    if (!editing) return null;
    const list = images?.[slot] || [];
    const full = list.length >= max;
    return (
        <div className={`vqsf-pslot vqsf-pslot--${place}`} onClick={(e) => { e.stopPropagation(); if (e.target.tagName !== 'INPUT') e.preventDefault(); }}>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(slot, f); }} />
            <div className="hd">
                <b>{label}</b>
                <small>{max > 1 ? `${list.length}/${max}${slideshow ? ' · slideshow' : ''}` : list.length ? 'Your photo' : 'Default look'}</small>
            </div>
            {list.length > 0 && (
                <div className="th">
                    {list.map((u, i) => (
                        <span key={u + i}><img src={u} alt="" /><button type="button" aria-label="Remove photo" onClick={(e) => { e.preventDefault(); remove(slot, i); }}><X size={12} strokeWidth={2.6} /></button></span>
                    ))}
                </div>
            )}
            {!full && (
                <button type="button" className="add" disabled={busy === slot} onClick={(e) => { e.preventDefault(); input.current?.click(); }}>
                    {busy === slot ? <Loader2 size={14} className="spin" /> : <ImagePlus size={14} />}{busy === slot ? 'Uploading…' : list.length ? 'Add another' : 'Add photo'}
                </button>
            )}
        </div>
    );
}

/** Cross-fading slideshow of photos; a single photo just shows. */
export function Slideshow({ images = [], interval = 6000, alt = '', className = '', eager = false }) {
    const [i, setI] = useState(0);
    const n = images.length;
    useEffect(() => {
        if (n < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        const t = setInterval(() => setI((x) => (x + 1) % n), interval);
        return () => clearInterval(t);
    }, [n, interval]);
    useEffect(() => { if (i >= n) setI(0); }, [n, i]);
    if (!n) return null;
    return (
        <div className={`vqsf-show ${className}`}>
            {images.map((src, k) => <img key={src + k} src={src} alt={k === i ? alt : ''} className={k === i ? 'on' : ''} loading={eager && k === 0 ? 'eager' : 'lazy'} />)}
            {n > 1 && (
                <div className="dots" role="tablist" aria-label="Photos">
                    {images.map((_, k) => <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Photo ${k + 1}`} className={k === i ? 'on' : ''} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setI(k); }} />)}
                </div>
            )}
        </div>
    );
}

/** Top bar shown while editing photos: what to do, any error, and the way back. */
export function EditPhotosBar() {
    const { editing, edit, error, clearError } = usePhotos();
    if (!editing) return null;
    return (
        <div className="vqsf-editbar" role="status">
            <span className="ic"><ImagePlus size={15} /></span>
            <span className="tx"><b>Editing photos.</b> Use <i>Add photo</i> on any spot — photos save straight away. Spots with several photos play as a slideshow.</span>
            {error && <span className="err">{error}<button type="button" onClick={clearError} aria-label="Dismiss"><X size={12} /></button></span>}
            {edit?.back && <a href={edit.back} className="done">Done</a>}
        </div>
    );
}

/** Render-prop: the owner's photos for a spot, or the fallback list. `own` says which one you got. */
export function SlotShow({ slot, fallback = [], children }) {
    const imgs = useSlot(slot);
    return children(imgs.length ? imgs : (fallback || []), imgs.length > 0);
}
