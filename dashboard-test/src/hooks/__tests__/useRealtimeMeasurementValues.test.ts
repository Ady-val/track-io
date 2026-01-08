import { renderHook, waitFor, act } from "@testing-library/react";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useRealtimeMeasurementValues } from "../useRealtimeMeasurementValues";

// Mock del contexto WebSocket
jest.mock("@/contexts/WebSocketContext", () => ({
  useWebSocket: jest.fn(),
}));

const mockUseWebSocket = useWebSocket as jest.MockedFunction<
  typeof useWebSocket
>;

describe("useRealtimeMeasurementValues", () => {
  let mockSocket: {
    on: jest.Mock;
    off: jest.Mock;
  };

  beforeEach(() => {
    mockSocket = {
      on: jest.fn(),
      off: jest.fn(),
    };

    mockUseWebSocket.mockReturnValue({
      socket: mockSocket as any,
      isConnected: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty values", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    expect(result.current.values).toEqual({});
    expect(result.current.history).toEqual({});
  });

  it("should subscribe to new_measurement_value event", () => {
    renderHook(() => useRealtimeMeasurementValues());

    expect(mockSocket.on).toHaveBeenCalledWith(
      "new_measurement_value",
      expect.any(Function)
    );
  });

  it("should unsubscribe from new_measurement_value event on unmount", () => {
    const { unmount } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith(
      "new_measurement_value",
      handler
    );
  });

  it("should handle numeric measurement values", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "25.5",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getValue(1)).toBe(25.5);
    expect(result.current.getTimestamp(1)).toBe("2024-01-01T10:00:00Z");
    expect(result.current.getHistory(1)).toEqual([25.5]);
  });

  it("should handle boolean true values", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getValue(1)).toBe(true);
    expect(result.current.getTimestamp(1)).toBe("2024-01-01T10:00:00Z");
    expect(result.current.getHistory(1)).toEqual([]); // Boolean values don't go to history
  });

  it("should handle boolean false values", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "false",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getValue(1)).toBe(false);
    expect(result.current.getTimestamp(1)).toBe("2024-01-01T10:00:00Z");
  });

  it("should handle numeric 1 as true", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: 1,
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getValue(1)).toBe(true);
  });

  it("should handle numeric 0 as false", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: 0,
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getValue(1)).toBe(false);
  });

  it("should set onStartTime when status changes from OFF to ON", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    // First: OFF
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "false",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.getOnStartTime(1)).toBeUndefined();

    // Then: ON
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:05:00Z",
        },
      });
    });

    expect(result.current.getOnStartTime(1)).toBe("2024-01-01T10:05:00Z");
  });

  it("should clear onStartTime when status changes from ON to OFF", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    // First: ON
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    // Set onStartTime manually by transitioning from null to true
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:05:00Z",
        },
      });
    });

    // Then: OFF
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "false",
          createdAt: "2024-01-01T10:10:00Z",
        },
      });
    });

    expect(result.current.getOnStartTime(1)).toBeUndefined();
  });

  it("should not reset onStartTime when status is already ON and receives another ON signal", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    // First: ON
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    // Set onStartTime by transitioning from null to true
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:05:00Z",
        },
      });
    });

    const firstOnStartTime = result.current.getOnStartTime(1);

    // Another ON signal
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "true",
          createdAt: "2024-01-01T10:10:00Z",
        },
      });
    });

    // onStartTime should remain the same
    expect(result.current.getOnStartTime(1)).toBe(firstOnStartTime);
  });

  it("should initialize value from backend", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    act(() => {
      result.current.initializeValue(
        1,
        "25.5",
        "2024-01-01T10:00:00Z",
        undefined
      );
    });

    expect(result.current.getValue(1)).toBe(25.5);
    expect(result.current.getTimestamp(1)).toBe("2024-01-01T10:00:00Z");
    expect(result.current.getHistory(1)).toEqual([25.5]);
  });

  it("should initialize boolean value from backend", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    act(() => {
      result.current.initializeValue(
        1,
        "true",
        "2024-01-01T10:00:00Z",
        "2024-01-01T09:00:00Z"
      );
    });

    expect(result.current.getValue(1)).toBe(true);
    expect(result.current.getOnStartTime(1)).toBe("2024-01-01T09:00:00Z");
  });

  it("should not overwrite existing value when initializing", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    // Set value via WebSocket
    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "30.0",
          createdAt: "2024-01-01T10:05:00Z",
        },
      });
    });

    // Try to initialize with older value
    act(() => {
      result.current.initializeValue(
        1,
        "25.5",
        "2024-01-01T10:00:00Z",
        undefined
      );
    });

    // Should keep the WebSocket value
    expect(result.current.getValue(1)).toBe(30.0);
    expect(result.current.getTimestamp(1)).toBe("2024-01-01T10:05:00Z");
  });

  it("should maintain history for numeric values", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "10",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "20",
          createdAt: "2024-01-01T10:01:00Z",
        },
      });
    });

    act(() => {
      handler({
        data: {
          measurementId: 1,
          value: "30",
          createdAt: "2024-01-01T10:02:00Z",
        },
      });
    });

    expect(result.current.getHistory(1)).toEqual([10, 20, 30]);
  });

  it("should limit history to 25 items", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    // Add 27 values (starting from 2 to avoid boolean interpretation of 0 and 1)
    // This will test that only the last 25 are kept
    for (let i = 2; i < 29; i++) {
      act(() => {
        handler({
          data: {
            measurementId: 1,
            value: String(i),
            createdAt: `2024-01-01T10:${String(i).padStart(2, "0")}:00Z`,
          },
        });
      });
    }

    const history = result.current.getHistory(1);
    expect(history).toHaveLength(25);
    // First two values (2 and 3) should be removed, leaving 4-28 (25 items)
    expect(history[0]).toBe(4); // First item should be 4
    expect(history[24]).toBe(28); // Last should be 28
  });

  it("should handle message with nested data structure", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          data: {
            measurementId: 1,
            value: "25.5",
            createdAt: "2024-01-01T10:00:00Z",
          },
        },
      });
    });

    expect(result.current.getValue(1)).toBe(25.5);
  });

  it("should ignore messages without measurementId", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          value: "25.5",
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.values).toEqual({});
  });

  it("should ignore messages without value", () => {
    const { result } = renderHook(() => useRealtimeMeasurementValues());

    const handler = mockSocket.on.mock.calls[0][1];

    act(() => {
      handler({
        data: {
          measurementId: 1,
          createdAt: "2024-01-01T10:00:00Z",
        },
      });
    });

    expect(result.current.values).toEqual({});
  });

  it("should handle when socket is null", () => {
    mockUseWebSocket.mockReturnValue({
      socket: null,
      isConnected: false,
    });

    const { result } = renderHook(() => useRealtimeMeasurementValues());

    expect(result.current.values).toEqual({});
    expect(mockSocket.on).not.toHaveBeenCalled();
  });
});
