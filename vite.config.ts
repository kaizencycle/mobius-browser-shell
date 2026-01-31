import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Mobius Browser Shell - Beta Release Configuration
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
      },
      preview: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__MOBIUS_VERSION__': JSON.stringify(MOBIUS_VERSION),
        '__MOBIUS_RELEASE_STAGE__': JSON.stringify(MOBIUS_RELEASE_STAGE),
        '__MOBIUS_RELEASE_DATE__': JSON.stringify(MOBIUS_RELEASE_DATE),
        '__DEV__': JSON.stringify(!isProduction),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: !isProduction,
        minify: isProduction ? 'esbuild' : false,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['lucide-react'],
              'graph-vendor': ['react-force-graph-2d'],
            }
          }
        }
      },
      // Production optimizations
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
      }
    };
});
