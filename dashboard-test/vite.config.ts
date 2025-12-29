import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Determinar la URL de la API basada en el modo y variables de entorno
  // En modo test o cuando VITE_API_URL apunta al puerto 3001, usar backend de testing
  const apiUrl =
    process.env.VITE_API_URL ||
    (mode === "test" ? "http://localhost:3001" : "http://localhost:3000");

  return {
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
    },
    // Las variables de entorno que empiezan con VITE_ se exponen automáticamente
    // Pero aseguramos que esté disponible
    envPrefix: ["VITE_"],
  };
});
