import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('lucide-react')) {
                            return 'vendor-lucide';
                        }
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                            return 'vendor-react-core';
                        }
                        return 'vendor-core';
                    }
                    if (id.includes('resources/js/Pages/Marketing/')) {
                        return 'marketing-pages';
                    }
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy/dist/index.esm.js'),
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
