import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // three.js (~520 kB) is split into its own chunk and only loads for the character creator and avatar.
  build: { chunkSizeWarningLimit: 600 },
});
