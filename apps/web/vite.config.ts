import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Disable sourcemaps for production
    sourcemap: false,
  },
  // Ensure env vars prefixed with VITE_ are available
  envPrefix: "VITE_",
});
