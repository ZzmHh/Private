import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = env.PORT || "8787";
  const apiTarget = `http://127.0.0.1:${apiPort}`;

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), "index.html"),
          enterprise: path.resolve(process.cwd(), "enterprise.html"),
        },
      },
    },
    server: {
      proxy: {
        "/api": apiTarget,
        "/payment": apiTarget,
        "/sitemap.xml": apiTarget,
        "/robots.txt": apiTarget,
      },
    },
  };
});
