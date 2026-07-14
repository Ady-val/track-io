import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Destino del backend SOLO para el proxy del dev server. El cliente usa
  // rutas relativas ("/api"); en producción nginx proxea "/api" al backend.
  const apiTarget = process.env.VITE_API_URL || "http://localhost:3000";

  return {
    base: "/virtual-device/",
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});
