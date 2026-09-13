/**
 * useOfflineCatalog.js
 *
 * Handles searching products, matching barcodes, and fetching categories
 * from the offline Dexie storage (db) or online API fallback.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { db, isOnline } from '@/Utils/db';

export function useOfflineCatalog(storeSlug) {
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    const performSearch = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            if (isOnline()) {
                const response = await axios.get(route('store.pos.search', { store_slug: storeSlug }), { params: { q: query } });
                setSearchResults(response.data.data || response.data || []);
            } else {
                const lowerQuery = query.toLowerCase();
                const results = await db.products
                    .filter(p => 
                        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                        (p.sku && p.sku.toLowerCase().includes(lowerQuery)) ||
                        (p.barcode && p.barcode.includes(query))
                    )
                    .limit(50)
                    .toArray();
                setSearchResults(results);
            }
        } catch (error) {
            console.error("Search error, falling back to local:", error);
            try {
                const lowerQuery = query.toLowerCase();
                const results = await db.products
                    .filter(p => 
                        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
                        (p.sku && p.sku.toLowerCase().includes(lowerQuery)) ||
                        (p.barcode && p.barcode.includes(query))
                    )
                    .limit(50)
                    .toArray();
                setSearchResults(results);
            } catch (localError) {
                console.error("Local search failed:", localError);
            }
        } finally {
            setIsSearching(false);
        }
    }, [storeSlug]);

    const loadCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            if (isOnline()) {
                const response = await axios.get(route('store.api.categories', { store_slug: storeSlug }));
                setCategories(response.data || []);
            } else {
                // If offline, extract categories from local products
                const products = await db.products.toArray();
                const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
                setCategories(cats.map((c, i) => ({ id: i, name: c })));
            }
        } catch (error) {
            console.error("Failed to load categories:", error);
        } finally {
            setLoadingCategories(false);
        }
    }, [storeSlug]);

    return {
        searchResults,
        isSearching,
        performSearch,
        categories,
        loadingCategories,
        loadCategories
    };
}
