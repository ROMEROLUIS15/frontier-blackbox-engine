import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const bffUrl = process.env.CONSOLE_BFF_URL ?? "http://127.0.0.1:8781";

export default defineConfig({
  root: "web",
  plugins: [react(), tailwindcss()],
  server: {
    fs: { allow: [repositoryRoot] },
    proxy: { "/api": bffUrl },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    root: ".",
    environment: "jsdom",
    include: ["specs/**/*.spec.{ts,tsx}", "web/**/*.spec.{ts,tsx}", "server/**/*.spec.ts"],
  },
});
