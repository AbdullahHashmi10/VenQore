/** Start a guided tour from anywhere (the engine listens for this). */
export const startTour = (id) => window.dispatchEvent(new CustomEvent('vq-tour-start', { detail: id }));
