import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { type Socket } from "socket.io-client";

import socket from "@/lib/socket";

interface WebSocketContextType {
  isConnected: boolean;
  socket: Socket | null;
  emit: (event: string, data: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }

  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket>(socket);

  useEffect(() => {
    const currentSocket = socketRef.current;

    const onConnect = () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error("[WebSocket] Connection error:", error);
    };

    currentSocket.on("connect", onConnect);
    currentSocket.on("disconnect", onDisconnect);
    currentSocket.on("connect_error", onConnectError);

    currentSocket.connect();

    return () => {
      currentSocket.off("connect", onConnect);
      currentSocket.off("disconnect", onDisconnect);
      currentSocket.off("connect_error", onConnectError);
      currentSocket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current.emit(event, data);
  }, []);

  const on = useCallback(
    (event: string, callback: (...args: unknown[]) => void) => {
      socketRef.current.on(event, callback);
    },
    []
  );

  const off = useCallback(
    (event: string, callback: (...args: unknown[]) => void) => {
      socketRef.current.off(event, callback);
    },
    []
  );

  const value: WebSocketContextType = {
    isConnected,
    socket: socketRef.current,
    emit,
    on,
    off,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
