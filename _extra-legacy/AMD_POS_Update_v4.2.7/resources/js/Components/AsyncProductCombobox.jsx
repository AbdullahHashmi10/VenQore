import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import SmartCombobox from '@/Components/SmartCombobox';

/**
 * AsyncProductCombobox
 *
 * Wraps SmartCombobox with server-side product search.
 * Pre-loads all products on mount so the dropdown is visible immediately
 * when the user clicks/focuses — exactly like the Sales (CreateInvoice) page.
 * Refines results as the user types.
 */
export default function AsyncProductCombobox({
    selectedItem,
    onSelect,
    onQueryChange,
    onCreateNew,
    onEdit,
    placeholder = "Search Products...",
    defaultOptions = [],
    ...props
}) {
    const { store } = usePage().props;
    const isControlled = props.value !== undefined;
    const [internalQuery, setInternalQuery] = useState('');
    const query = isControlled ? props.value : internalQuery;
    const setQuery = (val) => {
        if (!isControlled) setInternalQuery(val);
    };

    const [debouncedQuery] = useDebounce(query, 300);
    const [items, setItems] = useState(defaultOptions);
    const [loading, setLoading] = useState(false);

    const fetchProducts = (searchTerm = '') => {
        setLoading(true);
        axios.get(route('store.inventory.search', { store_slug: store?.slug }), { params: { query: searchTerm } })
            .then(res => {
                const mapped = (res.data || []).map(p => ({
                    ...p,
                    cost: p.cost || p.cost_price,
                }));
                setItems(mapped);
            })
            .catch(err => console.error("AsyncProductCombobox fetch failed", err))
            .finally(() => setLoading(false));
    };

    // Global Sync Listener
    useEffect(() => {
        const handleSync = () => fetchProducts(debouncedQuery || '');
        window.addEventListener('amd:product-updated', handleSync);
        
        // Cross-tab sync support
        const handleStorage = (e) => {
            if (e.key === 'amd_product_latest_change') handleSync();
        };
        window.addEventListener('storage', handleStorage);
        
        return () => {
            window.removeEventListener('amd:product-updated', handleSync);
            window.removeEventListener('storage', handleStorage);
        };
    }, [debouncedQuery]);

    // Keep selectedItem available in the list
    useEffect(() => {
        if (selectedItem) {
            setItems(prev => {
                const exists = prev.find(i => i.id === selectedItem.id);
                return exists ? prev : [selectedItem, ...prev];
            });
        }
    }, [selectedItem]);

    // Pre-load full product list on mount (empty query = show all)
    // If parent already provided defaultOptions, use those instead
    useEffect(() => {
        if (defaultOptions.length > 0) {
            setItems(defaultOptions);
            return;
        }
        fetchProducts('');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Refine results as user types
    useEffect(() => {
        if (!debouncedQuery) {
            // No query — restore the pre-loaded full list
            if (defaultOptions.length > 0) {
                setItems(defaultOptions);
            } else {
                fetchProducts('');
            }
            return;
        }

        fetchProducts(debouncedQuery);
    }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <SmartCombobox
            items={items}
            selectedItem={selectedItem}
            onSelect={onSelect}
            onQueryChange={(val) => {
                setQuery(val);
                if (onQueryChange) onQueryChange(val);
            }}
            loading={loading}
            placeholder={placeholder}
            displayKey="name"
            filterKey="name"
            disableLocalFiltering={true}
            onAddNew={onCreateNew}
            onEdit={onEdit}
            {...props}
        />
    );
}
