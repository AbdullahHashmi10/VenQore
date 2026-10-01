const getStoreSlug = () => {
    if (typeof window === 'undefined') return 'global';
    // 1. Try URL path /s/{slug}
    const parts = window.location.pathname.split('/');
    if (parts[1] === 's' && parts[2]) return parts[2];
    // 2. Try window.amdSettings
    if (window.amdSettings?.store_slug) return window.amdSettings.store_slug;
    if (window.amdSettings?.slug) return window.amdSettings.slug;
    // 3. Try Inertia page props in #app
    try {
        const appEl = document.getElementById('app');
        if (appEl?.dataset?.page) {
            const pd = JSON.parse(appEl.dataset.page);
            if (pd?.props?.store?.slug) return pd.props.store.slug;
        }
    } catch (_) {}
    return 'global';
};

const key = () => {
    const store = getStoreSlug();
    return `venqore:${store}:default-print-type`;
};

export function rememberPrintType(type) {
    if (typeof window === 'undefined' || !['thermal', 'regular', 'b2b'].includes(type)) return;
    try {
        window.localStorage.setItem(key(), type);
        window.localStorage.setItem('active_printer_subtab', type);
    } catch (_) { /* storage can be disabled */ }
    window.amdSettings = { ...(window.amdSettings || {}), default_print_type: type };
}

export function rememberedPrintType() {
    if (typeof window === 'undefined') return null;
    try {
        const storeKey = key();
        const value = window.localStorage.getItem(storeKey);
        return ['thermal', 'regular', 'b2b'].includes(value) ? value : null;
    } catch (_) {
        return null;
    }
}
