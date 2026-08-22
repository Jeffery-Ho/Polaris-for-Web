import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.build.json" with { type: "json" };

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: "assets/[name]",
        entryFileNames: "assets/[name]"
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest })
  ]
});
