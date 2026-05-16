import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  outDir: "dist",
  sourcemap: true,
  clean: true,
  target: "es2022",
  format: ["esm", "cjs"],
  dts: true,
});
