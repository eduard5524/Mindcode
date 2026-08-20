import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // When hosting on GitHub Pages under /Mindcode/, set base to "/Mindcode/".
  // Locally we keep root-relative paths so dev/preview work as-is.
  base: "./",
});
