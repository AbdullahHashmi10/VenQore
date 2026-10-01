import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import SmartCombobox from '@/Components/SmartCombobox';

/**
 * AsyncPartyCombobox
 * 
 * A wrapper around SmartCombobox that fetches customers/suppliers/parties 
 * from the server instead of filtering a local list.
 */
export default function AsyncPartyCombobox({
    selectedItem,
    onSelect,
    onQueryChange,
    onCreateNew,
    onEdit,
    placeholder = "Search Parties...",
    type = 'all', // 'customer', 'supplier', or 'all'
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
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sync selected item into the list so it always renders correctly
    useEffect(() => {
        if (selectedItem) {
            setItems(prev => {
                const exists = prev.find(i => i.id === (selectedItem.party_id || selectedItem.id));
                return exists ? prev : [selectedItem, ...prev];
            });
        }
    }, [selectedItem]);

    // Fetch all parties on mount + re-fetch when query or type changes.
    // Empty query returns the full pre-loaded list (like AsyncProductCombobox).
    useEffect(() => {
        setLoading(true);
        axios.get(route('store.parties.search', { store_slug: store?.slug }), {
            params: {
                query: debouncedQuery || '',
                type: type
            }
        })
            .then(res => {
                setItems(res.data || []);
            })
            .catch(err => console.error("Async Party Search failed", err))
            .finally(() => setLoading(false));
    }, [debouncedQuery, type]);

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
