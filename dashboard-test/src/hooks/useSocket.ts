import { useEffect, useState } from "react";

import socket from "../lib/socket";

export function useSocket(
  eventName: string,
  callback: (...args: unknown[]) => void
) {
  useEffect(() => {
    socket.connect();
    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback]);
}

export function useIsConnected() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return connected;
}
