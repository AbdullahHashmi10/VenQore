import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['resources/js/tests/**/*.test.{js,ts,jsx,tsx}'],
        coverage: {
            provider: 'v8',
            include: ['resources/js/Utils/**'],
            reporter: ['text', 'html'],
        },
    },
    server: {
        host: '127.0.0.1',
        cors: true,
        watch: {
            ignored: [
                '**/Tester/**',
                '**/AMD_POS_Update_v3.2.5/**',
                '**/vendor/**',
                '**/node_modules/**',
                '**/storage/**',
                '**/.git/**',
            ],
        },
    },
});
