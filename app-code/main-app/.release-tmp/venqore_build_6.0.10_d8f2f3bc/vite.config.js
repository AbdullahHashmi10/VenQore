import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx', 'resources/css/app.css'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Rely on default chunking logic
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy/dist/index.esm.js'),
        },
        dedupe: ['react', 'react-dom'],
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
