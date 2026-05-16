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
    server: {
        host: '127.0.0.1',
        cors: true,
    },
    resolve: {
        alias: {
            'react-dom/server': path.resolve(__dirname, 'node_modules/react-dom/server.browser.js'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            'react': path.resolve(__dirname, 'node_modules/react'),
        },
        conditions: ['browser', 'import', 'module', 'default'],
    },
});
