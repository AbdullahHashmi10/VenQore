import { usePage } from '@inertiajs/react';

export function useTerms() {
    const map = usePage().props.terms ?? {};
    
    const t = (key, fallback) => {
        return map[key]?.singular ?? fallback ?? key;
    };
    
    const tp = (key, fallback) => {
        return map[key]?.plural ?? fallback ?? key;
    };
    
    return { t, tp };
}
