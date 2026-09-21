import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import manifest from "./manifest.build.json" with { type: "json" };

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        "polaris-home": "polaris-home.html"
      },
      output: {
        chunkFileNames: "assets/[name]",
        entryFileNames: "assets/[name].js"
      }
    }
  },
  plugins: [crx({ manifest })]
});
