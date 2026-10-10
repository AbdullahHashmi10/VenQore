import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Opt-in audit suite: ordinary assertions deliberately expose unfixed defects.
// No Laravel boot, live browser, database, or network is used.
export default defineConfig({
    resolve: { alias: { '@': fileURLToPath(new URL('../../resources/js', import.meta.url)) } },
    test: {
        environment: 'jsdom',
        include: ['verification/sale-reliability/*.test.{js,jsx}'],
        clearMocks: true,
    },
});
