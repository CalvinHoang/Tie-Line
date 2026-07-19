import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // GitHub Pages serves project sites from /<repository>/.
  base: command === "build" ? "/Tie-Line/" : "/",
  plugins: [react()],
}));
