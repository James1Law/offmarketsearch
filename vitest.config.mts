import { defineConfig } from "vitest/config"
import path from "node:path"

const alias = { "@": path.resolve(import.meta.dirname, "src") }

// Two projects rather than one: the pure logic — schemas, the share-link codec,
// the document renderer — runs in node and stays fast, while component tests
// pay for a jsdom environment only where they need one.
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: { alias },
        test: {
          name: "components",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
})
