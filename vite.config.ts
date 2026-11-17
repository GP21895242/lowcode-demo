import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vitejs.dev/config/
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.dom.test.ts"],
        },
      },
      {
        test: {
          name: "dom",
          environment: "happy-dom",
          include: ["src/**/*.test.tsx", "src/**/*.dom.test.ts"],
        },
      },
    ],
  },
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: lazyPlugins(() => [react()]),
  build: {
    outDir: "docs",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:7001",
        rewrite(path) {
          return path.replace(/^\/api/, "");
        },
      },
    },
  },
});
