import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Toda vez que chamarmos /proxy-opensky, o Vite disfarça e manda pra lá
      "/proxy-opensky": {
        target: "https://opensky-network.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-opensky/, ""),
      },
    },
  },
});
