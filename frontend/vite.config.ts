import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE lets the GitHub Pages workflow build under /readiness-control-tower/.
// Local dev and docker builds keep the default root base.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: {
    port: 5173
  }
});
