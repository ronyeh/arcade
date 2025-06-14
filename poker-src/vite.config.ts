import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Important for deployment to a subdirectory
  build: {
    outDir: '../poker', // Output to the sibling poker/ directory
    emptyOutDir: true, // Default is true, but explicitly set for clarity
    sourcemap: true, // Optional: generate sourcemaps for easier debugging of built files
  },
  server: { // Optional: configure dev server
    open: true // Automatically open in browser on `npm run dev`
  }
});
