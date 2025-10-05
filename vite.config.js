import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This define block is the key to fixing the build error.
  // It makes the environment variables available during the build process.
  define: {
    'import.meta.env.VITE_FIREBASE_CONFIG': `"${process.env.VITE_FIREBASE_CONFIG}"`
  }
})
