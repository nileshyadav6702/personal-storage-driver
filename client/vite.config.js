import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    // Ensure proper MIME types
    fs: {
      strict: false
    }
  },
  // If deploying to a subdirectory
  base: './'
})
