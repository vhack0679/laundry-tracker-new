import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This sets the target browser environment for the build.
    // 'esnext' allows the use of modern JavaScript features like 'import.meta',
    // which resolves the build errors you were encountering on Render.
    target: 'esnext'
  }
})
