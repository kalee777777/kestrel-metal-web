import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  appType: 'mpa',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        products: resolve(import.meta.dirname, 'products.html'),
        resources: resolve(import.meta.dirname, 'resources.html'),
      },
    },
  },
})
