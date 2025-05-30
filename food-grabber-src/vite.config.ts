import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isDebugBuild = mode === "debug";

  return {
    base: "./",
    build: {
      outDir: "../food-grabber",
      minify: isDebugBuild ? false : "esbuild", // Disable minify for debug mode
    },
  };
});
