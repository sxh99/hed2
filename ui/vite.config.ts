import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '18' }]],
      },
    }),
  ],
  clearScreen: false,
  server: {
    port: 4000,
    strictPort: true,
    host: false,
    hmr: {
      protocol: 'ws',
      port: 4001,
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(import.meta.dirname, 'src'),
    },
  },
}));
