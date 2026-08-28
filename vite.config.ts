import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Default to Vercel preset for Vercel deployments unless specified otherwise
process.env.NITRO_PRESET = process.env.NITRO_PRESET || "vercel";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

