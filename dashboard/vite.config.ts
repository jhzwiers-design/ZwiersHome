import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Content-Security-Policy for production builds.
 * Only the dashboard's own code, styles, fonts and images are allowed.
 * `connect-src` will gain the Home Assistant origin in Milestone 2.
 * (Not applied in dev: Vite's hot-reload injects an inline script.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function cspOnBuild(): Plugin {
  return {
    name: 'zwiers-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), cspOnBuild()],
  define: {
    // true in production builds (the public site): personal details are replaced
    // with generic ones and the real names never enter the bundle.
    __PUBLIC__: JSON.stringify(command === 'build'),
  },
  build: {
    // Transpile modern syntax for older iPhones/iPads (Safari 15+).
    target: ['es2020', 'safari15', 'chrome100', 'firefox100'],
  },
  preview: {
    // Serves the production build for testing on phones/iPads at home.
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}));
