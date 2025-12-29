import { renderHook } from "@testing-library/react";

import { useWebSocketEvent, useWebSocketEmit } from "../useWebSocketEvent";

// Mock del contexto de WebSocket
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockEmit = jest.fn();
const mockIsConnected = true;

jest.mock("@/contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    on: mockOn,
    off: mockOff,
    emit: mockEmit,
    isConnected: mockIsConnected,
  }),
}));

describe("useWebSocketEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useWebSocketEvent", () => {
    it("should subscribe to websocket event on mount", () => {
      const callback = jest.fn();

      renderHook(() => useWebSocketEvent("test-event", callback));

      expect(mockOn).toHaveBeenCalledWith("test-event", expect.any(Function));
    });

    it("should call callback when event is received", () => {
      const callback = jest.fn();
      let eventHandler: ((...args: unknown[]) => void) | undefined;

      mockOn.mockImplementation((_event, handler) => {
        eventHandler = handler;
      });

      renderHook(() => useWebSocketEvent("test-event", callback));

      // Simular recepción de evento
      if (eventHandler) {
        eventHandler({ data: "test-data" });
      }

      expect(callback).toHaveBeenCalledWith({ data: "test-data" });
    });

    it("should unsubscribe from event on unmount", () => {
      const callback = jest.fn();
      let eventHandler: ((...args: unknown[]) => void) | undefined;

      mockOn.mockImplementation((_event, handler) => {
        eventHandler = handler;

        return handler; // Retornar handler para poder hacer off
      });

      const { unmount } = renderHook(() =>
        useWebSocketEvent("test-event", callback)
      );

      expect(mockOn).toHaveBeenCalledWith("test-event", expect.any(Function));

      unmount();

      expect(mockOff).toHaveBeenCalledWith("test-event", eventHandler);
    });

    it("should update callback when it changes", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      let eventHandler: ((...args: unknown[]) => void) | undefined;

      mockOn.mockImplementation((_event, handler) => {
        eventHandler = handler;
      });

      const { rerender } = renderHook(
        ({ callback }) => useWebSocketEvent("test-event", callback),
        {
          initialProps: { callback: callback1 },
        }
      );

      // Cambiar callback
      rerender({ callback: callback2 });

      // Simular evento
      if (eventHandler) {
        eventHandler({ data: "test" });
      }

      // El nuevo callback debería ser llamado
      expect(callback2).toHaveBeenCalledWith({ data: "test" });
      expect(callback1).not.toHaveBeenCalled();
    });

    it("should return isConnected status", () => {
      const callback = jest.fn();

      const { result } = renderHook(() =>
        useWebSocketEvent("test-event", callback)
      );

      expect(result.current.isConnected).toBe(mockIsConnected);
    });
  });

  describe("useWebSocketEmit", () => {
    it("should provide emitEvent function", () => {
      const { result } = renderHook(() => useWebSocketEmit());

      expect(result.current.emitEvent).toBeDefined();
      expect(typeof result.current.emitEvent).toBe("function");
    });

    it("should emit event when emitEvent is called", () => {
      const { result } = renderHook(() => useWebSocketEmit());

      result.current.emitEvent("test-event", { data: "test-data" });

      expect(mockEmit).toHaveBeenCalledWith("test-event", {
        data: "test-data",
      });
    });

    it("should return isConnected status", () => {
      const { result } = renderHook(() => useWebSocketEmit());

      expect(result.current.isConnected).toBe(mockIsConnected);
    });
  });
});
