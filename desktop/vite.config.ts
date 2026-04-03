import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // On garde le renderer dans `src/renderer` pour isoler la partie Electron (main)
  root: 'src/renderer',
  plugins: [react()],
  base: './',
  build: {
    // Sortie utilisée par Electron en production
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})

