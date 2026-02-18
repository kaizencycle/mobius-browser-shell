import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Mobius Browser Shell - Beta Release Configuration
// EPICON: GEMINI_API_KEY removed from define — now server-side only via /api/ai proxy
const MOBIUS_VERSION = '1.0.0-beta.1';
const MOBIUS_RELEASE_STAGE = 'beta';
const MOBIUS_RELEASE_DATE = '2026-01-31';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // In dev, proxy /api/ai to Vercel dev server (run vercel dev) or target
        '/api/ai': {
          target: env.VITE_AI_PROXY_TARGET ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    define: {
      '__MOBIUS_VERSION__': JSON.stringify(MOBIUS_VERSION),
      '__MOBIUS_RELEASE_STAGE__': JSON.stringify(MOBIUS_RELEASE_STAGE),
      '__MOBIUS_RELEASE_DATE__': JSON.stringify(MOBIUS_RELEASE_DATE),
      '__DEV__': JSON.stringify(!isProduction),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      // Only generate source maps for staging/preview — not production
      sourcemap: process.env.VERCEL_ENV === 'production' ? false : !isProduction,
      minify: isProduction ? 'esbuild' : false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react'],
            'graph-vendor': ['react-force-graph-2d'],
          },
        },
      },
    },
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
  };
});
