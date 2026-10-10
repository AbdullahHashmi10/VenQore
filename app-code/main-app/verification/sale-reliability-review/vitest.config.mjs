import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
    resolve: { alias: { '@': fileURLToPath(new URL('../../resources/js', import.meta.url)) } },
    test: { environment: 'jsdom', include: ['verification/sale-reliability-review/*.test.{js,jsx}'] },
});
