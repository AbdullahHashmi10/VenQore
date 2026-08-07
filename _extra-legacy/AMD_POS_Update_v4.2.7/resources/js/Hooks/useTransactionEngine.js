import { useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';

/**
 * useTransactionEngine - The Brain for Transaction Listing Pages
 * 
 * Handles searching, sorting, filtering, and pagination logic for 
 * index pages like Sales, Purchases, Expenses, etc.
 * 
 * @param {Object} config
 * @param {Array} config.defaultData - Initial data from server props
 * @param {Object} config.defaultFilters - Initial filters from server props
 * @param {String} config.endpoint - Route name for server-side actions (e.g. 'sales.index')
 * @param {Array} config.searchKeys - Keys to search in client-side mode (e.g. ['reference_number', 'customer.name'])
 */
export function useTransactionEngine({
    defaultData = [],
    defaultFilters = {},
    endpoint = 'sales.index',
    searchKeys = ['reference_number', 'customer.name', 'party.name', 'total']
}) {
    // ==========================================
    // STATE
    // ==========================================
    const [data, setData] = useState(defaultData?.data || defaultData || []);
    const [searchTerm, setSearchTerm] = useState(defaultFilters?.search || '');

    // Safely extract 'filter' property, avoiding collision with Array.prototype.filter if defaultFilters is []
    const initialFilter = (defaultFilters && !Array.isArray(defaultFilters) && defaultFilters.filter) ? defaultFilters.filter : 'all';
    const [activeFilter, setActiveFilter] = useState(initialFilter);
    const [dateRange, setDateRange] = useState({
        from: defaultFilters.from_date || '',
        to: defaultFilters.to_date || ''
    });
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

    // Sync state with props when they change (e.g. after server refresh)
    useEffect(() => {
        setData(defaultData?.data || defaultData || []);
    }, [defaultData]);

    // ==========================================
    // CLIENT-SIDE LOGIC (Immediate Feedback)
    // ==========================================
    const processedData = useMemo(() => {
        let processed = [...(data || [])];

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processed = processed.filter(item => {
                // Check all defined keys
                return searchKeys.some(key => {
                    const keys = key.split('.');
                    let val = item;
                    // Traverse object path (e.g. customer.name)
                    for (const k of keys) {
                        val = val?.[k];
                        if (val === undefined || val === null) break;
                    }
                    return String(val || '').toLowerCase().includes(lowerTerm);
                });
            });
        }

        // 2. Sort
        if (sortConfig.key) {
            processed.sort((a, b) => {
                // Resolving values for sorting
                const resolve = (obj, path) => {
                    // Custom Resolvers for common keys
                    if (path === 'date' || path === 'created_at') return new Date(obj.created_at || obj.date).getTime();

                    const keys = path.split('.');
                    let val = obj;
                    for (const k of keys) {
                        val = val?.[k];
                        if (val === undefined || val === null) return '';
                    }
                    return val;
                };

                // Handle numbers properly
                let valA = resolve(a, sortConfig.key);
                let valB = resolve(b, sortConfig.key);

                if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                } else {
                    valA = String(valA).toLowerCase();
                    valB = String(valB).toLowerCase();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, searchTerm, sortConfig, searchKeys]);

    // ==========================================
    // SERVER-SIDE ACTIONS
    // ==========================================
    const applyServerFilters = useCallback((overrides = {}) => {
        const params = {
            search: overrides.search ?? searchTerm,
            filter: overrides.filter ?? activeFilter,
            from_date: overrides.dateRange?.from ?? dateRange.from,
            to_date: overrides.dateRange?.to ?? dateRange.to
        };

        router.get(route(endpoint), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true // Use replace to prevent history stack buildup
        });
    }, [endpoint, searchTerm, activeFilter, dateRange]);

    // ==========================================
    // HANDLERS
    // ==========================================
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyServerFilters({ search: searchTerm });
        }
    };

    const handleFilterChange = (filterType) => {
        setActiveFilter(filterType);
        applyServerFilters({ filter: filterType });
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        const newRange = { ...dateRange, [name]: value };
        setDateRange(newRange);

        // Auto-fetch if both dates are valid
        if (newRange.from && newRange.to) {
            applyServerFilters({ dateRange: newRange });
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const refresh = () => {
        router.reload({ preserveState: true, preserveScroll: true });
    };

    return {
        // State
        data: processedData, // The displayed data (filtered/sorted)
        unfilteredData: data, // The raw data
        searchTerm,
        activeFilter,
        dateRange,
        sortConfig,

        // Actions
        setSearchTerm,
        handleSearch,
        handleServerSearch,
        handleFilterChange,
        handleFilterType: handleFilterChange, // Alias for Template compatibility
        handleDateChange,
        handleSort,
        refresh,
        applyServerFilters
    };
}
