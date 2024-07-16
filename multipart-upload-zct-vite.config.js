import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'worker/dist', 
    lib: {
      entry: './worker/workerDispatch.ts', 
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