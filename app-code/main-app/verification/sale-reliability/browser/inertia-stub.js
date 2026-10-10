// Stands in for @inertiajs/react in the browser harness: the page props
// come from window.__PAGE__ (store and signed-in user).
export const usePage = () => ({ props: window.__PAGE__ });
