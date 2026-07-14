import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Destino del backend SOLO para el proxy del dev server. El cliente usa rutas
  // relativas ("/api", "/socket.io") y en runtime resuelve el origen desde el
  // navegador; aquí únicamente decimos a dónde reenvía Vite en desarrollo.
  const apiTarget =
    process.env.VITE_API_URL ||
    (mode === "test" ? "http://localhost:3001" : "http://localhost:3000");

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        // Peticiones HTTP: /api/* -> backend (se elimina el prefijo /api,
        // igual que hace nginx en producción).
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        // WebSocket (socket.io) al mismo origen.
        "/socket.io": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    // Las variables de entorno que empiezan con VITE_ se exponen automáticamente
    envPrefix: ["VITE_"],
  };
});
