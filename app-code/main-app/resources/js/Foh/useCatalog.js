/**
 * The menu a FOH operator rings from: categories, the featured/search grid and
 * the lookups a tap needs (variants, add-ons). Server-driven, not pre-loaded:
 * a 2,000-item menu is a payload nobody reads three items of.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const asArray = (d) => (Array.isArray(d) ? d : (d && Array.isArray(d.data) ? d.data : []));

export default function useCatalog({ storeSlug }) {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState(null);
    const modifierCache = useRef({});
    const variantCache = useRef({});
    const r = useCallback((name) => route(name, { store_slug: storeSlug }), [storeSlug]);

    useEffect(() => {
        let alive = true;
        axios.get(r('store.pos.categories')).then(({ data }) => { if (alive) setCategories(asArray(data)); }).catch(() => {});
        return () => { alive = false; };
    }, [r]);

    useEffect(() => {
        let alive = true;
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = (query.trim() || categoryId)
                    ? await axios.get(r('store.pos.search'), { params: { q: query.trim(), category_id: categoryId || undefined } })
                    : await axios.get(r('store.pos.featured'));
                if (alive) setProducts(asArray(data));
            } catch (_) {
                if (alive) setProducts([]);
            } finally {
                if (alive) setLoading(false);
            }
        }, query ? 250 : 0);
        return () => { alive = false; clearTimeout(t); };
    }, [r, query, categoryId]);

    /** Add-on groups for a product (own groups + its category's). Cached per product. */
    const modifierGroups = useCallback(async (product) => {
        if (modifierCache.current[product.id]) return modifierCache.current[product.id];
        try {
            const { data } = await axios.get(r('store.pos.modifiers'), { params: { product_id: product.id } });
            const groups = Array.isArray(data?.groups) ? data.groups : [];
            modifierCache.current[product.id] = groups;
            return groups;
        } catch (_) {
            return []; // a missing options list must never stop a dish being sold
        }
    }, [r]);

    /** Variants (sizes/flavours) for a product that has them. Cached per product. */
    const variantsOf = useCallback(async (product) => {
        if (Array.isArray(product.variants) && product.variants.length) return product.variants;
        if (!product.has_variants) return [];
        if (variantCache.current[product.id]) return variantCache.current[product.id];
        try {
            const { data } = await axios.get(r('store.pos.variants'), { params: { product_id: product.id } });
            const list = Array.isArray(data?.variants) ? data.variants : [];
            variantCache.current[product.id] = list;
            return list;
        } catch (_) {
            return [];
        }
    }, [r]);

    return { categories, products, loading, query, setQuery, categoryId, setCategoryId, modifierGroups, variantsOf };
}
