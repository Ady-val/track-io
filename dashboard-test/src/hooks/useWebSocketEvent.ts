import { useEffect, useRef, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";

export function useWebSocketEvent<T = unknown>(
  eventName: string,
  callback: (data: T) => void
) {
  const { on, off, isConnected } = useWebSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (...args: unknown[]) => {
      const [data] = args as [T];

      callbackRef.current(data);
    };

    on(eventName, handler);

    return () => {
      off(eventName, handler);
    };
  }, [eventName, on, off]);

  return { isConnected };
}

export function useWebSocketEmit() {
  const { emit, isConnected } = useWebSocket();

  const emitEvent = useCallback(
    (eventName: string, data: unknown) => {
      emit(eventName, data);
    },
    [emit]
  );

  return { emitEvent, isConnected };
}
