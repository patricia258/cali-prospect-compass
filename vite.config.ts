// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// A base oficial migrada é o projeto jslzdfhldkjlvdfrvfmf. A plataforma injeta as
// variáveis antigas (vamx...) no processo com prioridade sobre o .env, então
// sobrescrevemos aqui. Chaves publicáveis — seguras no código. Sem service role.
process.env.VITE_SUPABASE_PROJECT_ID = "jslzdfhldkjlvdfrvfmf";
process.env.VITE_SUPABASE_URL = "https://jslzdfhldkjlvdfrvfmf.supabase.co";
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SMm9PhS5idqVSdBWJ3qbnQ_lC-9kHc9";
process.env.VITE_SUPABASE_ANON_KEY = "sb_publishable_SMm9PhS5idqVSdBWJ3qbnQ_lC-9kHc9";
process.env.SUPABASE_PROJECT_ID = "jslzdfhldkjlvdfrvfmf";
process.env.SUPABASE_URL = "https://jslzdfhldkjlvdfrvfmf.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SMm9PhS5idqVSdBWJ3qbnQ_lC-9kHc9";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
