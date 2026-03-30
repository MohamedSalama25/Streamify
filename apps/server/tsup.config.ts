import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"], // Changed to cjs to avoid ESM runtime resolution issues on some platforms
  clean: true,
  dts: false,
  target: "node22",
  bundle: true,
  noExternal: ["@streamify/shared"],
});
