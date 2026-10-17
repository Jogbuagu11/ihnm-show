import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// Standalone config. This replaced @lovable.dev/vite-tanstack-config, which
// bundled these same plugins but defaulted the nitro build to Cloudflare;
// Vercel needs its own preset.
// The Supabase project URL already comes from the environment everywhere
// else; the proxy target is built from it rather than hard-coded. Vite does
// not put .env into process.env for the config file itself, so load it.
const ENV = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const SUPABASE_FUNCTIONS = `${(ENV["SUPABASE_URL"] ?? ENV["VITE_SUPABASE_URL"] ?? "").replace(
  /\/+$/,
  "",
)}/functions/v1`;

export default defineConfig({
  server: { port: 8080 },
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Routes SSR through src/server.ts, which wraps errors into a real page.
    tanstackStart({ server: { entry: "server" } }),
    nitro({
      preset: "vercel",
      // The signed-in area sets ssr:false, so a per-route noindex meta tag never
      // reaches a crawler. Send the header at the edge instead; robots.txt
      // disallows the same paths.
      routeRules: {
        ...Object.fromEntries(
          [
            "/crew",
            "/finance",
            "/account",
            "/bookings",
            "/checkin",
            "/volunteer",
            "/confirm/**",
            "/release/**",
          ].map((route) => [route, { headers: { "x-robots-tag": "noindex, nofollow" } }]),
        ),
        // Click tracking for email. Proxied at the edge rather than rendered
        // by the app: a redirect should not wait on a cold SSR start, and the
        // destination lives in the database the function already talks to.
        "/r/**": {
          proxy: `${SUPABASE_FUNCTIONS}/track/**`,
          headers: { "x-robots-tag": "noindex, nofollow" },
        },
      },
    }),
    viteReact(),
  ],
});
