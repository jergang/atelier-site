import { defineConfig } from 'vite';
// Relative base so the build runs from any path (Vercel, GitHub Pages, a preview link).
export default defineConfig({ base: './', build: { target: 'es2020' } });
