import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'worker/dispatch',
    lib: {
      entry: './worker/dispatch.ts',
      name: 'multipart-upload-zct',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].[format].js',
        chunkFileNames: '[name].[format].js',
        format: 'es',
      },
    },
  },
  worker: {
    format: 'es',
  }
})