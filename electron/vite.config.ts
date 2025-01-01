import { builtinModules } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const { default: pkg } = await import('./package.json');

  return {
    build: {
      target: 'esnext',
      lib: {
        entry: {
          main: path.resolve(import.meta.dirname, 'src/main.ts'),
          preload: path.resolve(import.meta.dirname, 'src/preload.ts'),
        },
        formats: ['es'] as ['es'],
      },
      rollupOptions: {
        external: [
          'electron',
          ...builtinModules.flatMap((v) => [`node:${v}`, v]),
        ],
      },
    },
    define: {
      PKG_REPOSITORY: JSON.stringify(pkg.homepage),
    },
  };
});
