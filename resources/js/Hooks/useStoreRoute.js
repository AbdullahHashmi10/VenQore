import { usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export function useStoreRoute() {
  const { store } = usePage().props;

  const storeRoute = (name, params = {}) => {
    if (!store?.slug) {
      console.error(`useStoreRoute: store.slug is undefined for route "${name}"`);
      return '#';
    }
    return route(name, { store_slug: store.slug, ...params });
  };

  const storeVisit = (name, params = {}) => {
    if (!store?.slug) {
      console.error(`useStoreRoute: store.slug is undefined for route "${name}"`);
      return;
    }
    router.visit(route(name, { store_slug: store.slug, ...params }));
  };

  return { storeRoute, storeVisit, store };
}
