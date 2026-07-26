// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      target: "es2022",
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (
                id.includes("pdfjs-dist") ||
                id.includes("docx-preview") ||
                id.includes("mammoth") ||
                id.includes("tesseract.js")
              ) {
                return "doc-viewers-vendor";
              }
              if (id.includes("recharts")) {
                return "charts-vendor";
              }
              if (id.includes("framer-motion")) {
                return "motion-vendor";
              }
              if (id.includes("lucide-react")) {
                return "icons-vendor";
              }
              if (id.includes("@radix-ui")) {
                return "radix-vendor";
              }
              if (id.includes("@supabase")) {
                return "supabase-vendor";
              }
              if (id.includes("@tanstack")) {
                return "tanstack-vendor";
              }
            }
          },
        },
      },
    },
  },
});
