import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()], logLevel: 'warn',
    build: { outDir: '.vqscope/dist', emptyOutDir: true, minify: false, write: false,
        rollupOptions: { input: path.resolve(__dirname, '.vqscope/entry.jsx'),
            external: [/^react($|\/)/, /^react-dom($|\/)/, '@inertiajs/react', 'axios', 'lucide-react', 'dexie', 'ziggy-js'],
            output: { format: 'es' } } },
    resolve: { alias: { '@': path.resolve(__dirname, 'resources/js'),
        'ziggy-js': path.resolve(__dirname, 'vendor/tightenco/ziggy/dist/index.esm.js') }, dedupe: ['react','react-dom'] },
});
