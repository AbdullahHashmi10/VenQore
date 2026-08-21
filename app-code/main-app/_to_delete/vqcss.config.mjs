/* Temporary — CSS-only build, to verify the token/card stylesheets compile. */
import { defineConfig } from 'vite';
export default defineConfig({
  logLevel: 'info',
  build: {
    write: false,
    rollupOptions: { input: 'resources/css/app.css' },
  },
});
