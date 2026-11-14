import {fileURLToPath, URL} from 'node:url';
import react from '@vitejs/plugin-react';
import {defineConfig, type Plugin} from 'vite';

/**
 * DSH memuat panel lewat `window.__ModuleLoader__.load({ id, factory })`, bukan
 * ESM biasa. Plugin ini membungkus hasil build CJS supaya kontrak itu tetap utuh
 * dan `require("react")` diselesaikan oleh host (React tidak ikut di-bundle).
 */
function moduleLoaderWrapper(): Plugin {
  return {
    name: 'dsh-module-loader',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const body = chunk.code
          .split('\n')
          .map((line) => (line.length > 0 ? `\t\t${line}` : line))
          .join('\n');
        chunk.code = [
          'window.__ModuleLoader__.load({',
          '\tid: "dsh-video-studio",',
          '\tfactory: (require) => {',
          '\t\tvar module = { exports: {} };',
          '\t\tvar exports = module.exports;',
          body,
          '\t\treturn module.exports;',
          '\t},',
          '});',
          '',
        ].join('\n');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), moduleLoaderWrapper()],
  // Host tidak menyediakan `process`; RTK Query memakai process.env.NODE_ENV.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/main.tsx', import.meta.url)),
      formats: ['cjs'],
      fileName: () => 'client.js',
    },
    outDir: 'lib',
    emptyOutDir: false,
    cssCodeSplit: false,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        exports: 'named',
      },
    },
  },
});
