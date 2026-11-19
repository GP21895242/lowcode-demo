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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/editor/page-store/**/*.{ts,tsx}",
        "src/editor/data-source/**/*.{ts,tsx}",
        "src/editor/search/**/*.{ts,tsx}",
        "src/editor/card-template/**/*.{ts,tsx}",
        "src/editor/utils/**/*.{ts,tsx}",
        "src/editor/stores/**/*.{ts,tsx}",
        "src/lib/**/*.ts",
      ],
      exclude: ["**/*.test.*", "**/*.dom.test.*"],
      thresholds: {
        statements: 53,
        branches: 41,
        functions: 46,
        lines: 55,
      },
    },
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
          setupFiles: ["./src/test/setup-dom.ts"],
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
