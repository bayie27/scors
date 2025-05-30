import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable the new JSX transform
      jsxImportSource: 'react',
      babel: {
        plugins: [
          // Add any additional Babel plugins here if needed
        ],
      },
    }),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add this to ensure React's new JSX transform is used
  esbuild: {
    jsx: 'automatic',
  },
})
