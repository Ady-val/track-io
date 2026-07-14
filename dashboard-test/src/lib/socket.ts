import { io, type Socket } from "socket.io-client";

// Sin VITE_API_URL nos conectamos al MISMO origen que sirvió el frontend
// (nginx proxea "/socket.io/" al backend). En dev, el proxy de Vite hace lo
// mismo contra localhost:3000. VITE_API_URL solo como override explícito.
const URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

const socket: Socket = io(URL, {
  path: "/socket.io",
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
