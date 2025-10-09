import { io, type Socket } from "socket.io-client";

const URL = "http://localhost:3000";

const socket: Socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
