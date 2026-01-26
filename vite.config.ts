import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { webcrypto as nodeCrypto } from 'crypto';

export default defineConfig(({ mode }) => {
    // Polyfill for crypto.getRandomValues in Node.js (for Vite dev server)
    if (typeof globalThis.crypto === 'undefined') {
        globalThis.crypto = {} as Crypto;
    }
    if (typeof globalThis.crypto.getRandomValues === 'undefined') {
        // @ts-expect-error: Node.js and browser getRandomValues signatures differ
        globalThis.crypto.getRandomValues = nodeCrypto.getRandomValues;
    }

    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
