import { renderHook, waitFor, act } from "@testing-library/react";

import { useStatusDuration } from "../useStatusDuration";

// Mock de timers
jest.useFakeTimers();

describe("useStatusDuration", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it("should return 00:00:00 when isOn is false", () => {
    const { result } = renderHook(() =>
      useStatusDuration("2024-01-01T10:00:00Z", false)
    );

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should return 00:00:00 when isOn is null", () => {
    const { result } = renderHook(() =>
      useStatusDuration("2024-01-01T10:00:00Z", null)
    );

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should return 00:00:00 when isOn is undefined", () => {
    const { result } = renderHook(() =>
      useStatusDuration("2024-01-01T10:00:00Z", undefined)
    );

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should return 00:00:00 when onStartTime is undefined", () => {
    const { result } = renderHook(() => useStatusDuration(undefined, true));

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should return 00:00:00 when onStartTime is empty string", () => {
    const { result } = renderHook(() => useStatusDuration("", true));

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should calculate duration correctly when isOn is true", () => {
    const startTime = "2024-01-01T10:00:00Z";
    const { result } = renderHook(() => useStatusDuration(startTime, true));

    // 2 hours difference (10:00 to 12:00)
    expect(result.current.duration).toBe("02:00:00");
    expect(result.current.isActive).toBe(true);
  });

  it("should update duration every second", async () => {
    const startTime = "2024-01-01T11:59:55Z";
    const { result } = renderHook(() => useStatusDuration(startTime, true));

    // Initial: 5 seconds difference
    expect(result.current.duration).toBe("00:00:05");

    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.duration).toBe("00:00:06");
    });

    // Advance 1 more second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.duration).toBe("00:00:07");
    });
  });

  it("should handle minutes correctly", () => {
    const startTime = "2024-01-01T11:30:00Z";
    const { result } = renderHook(() => useStatusDuration(startTime, true));

    // 30 minutes difference
    expect(result.current.duration).toBe("00:30:00");
    expect(result.current.isActive).toBe(true);
  });

  it("should handle hours correctly", () => {
    const startTime = "2024-01-01T09:00:00Z";
    const { result } = renderHook(() => useStatusDuration(startTime, true));

    // 3 hours difference
    expect(result.current.duration).toBe("03:00:00");
    expect(result.current.isActive).toBe(true);
  });

  it("should show 00:00:00 but stay active when onStartTime is in the future", () => {
    // VERSION 2.0: si el backend dice que está activo, se confía aunque el
    // startTime sea futuro; la duración se muestra 00:00:00 hasta que el reloj
    // del cliente alcance el startTime.
    const futureTime = "2024-01-01T13:00:00Z"; // 1 hour in the future
    const { result } = renderHook(() => useStatusDuration(futureTime, true));

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(true);
  });

  it("should return 00:00:00 when onStartTime is invalid date string", () => {
    const { result } = renderHook(() =>
      useStatusDuration("invalid-date", true)
    );

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);
  });

  it("should stop updating when isOn changes to false", async () => {
    const startTime = "2024-01-01T11:59:55Z";
    const { result, rerender } = renderHook(
      ({ isOn }) => useStatusDuration(startTime, isOn),
      {
        initialProps: { isOn: true },
      }
    );

    expect(result.current.duration).toBe("00:00:05");
    expect(result.current.isActive).toBe(true);

    // Change to false
    rerender({ isOn: false });

    expect(result.current.duration).toBe("00:00:00");
    expect(result.current.isActive).toBe(false);

    // Advance time - should not update
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.duration).toBe("00:00:00");
    });
  });

  it("should format duration with leading zeros", () => {
    const startTime = "2024-01-01T11:59:59Z";
    const { result } = renderHook(() => useStatusDuration(startTime, true));

    // 1 second difference
    expect(result.current.duration).toBe("00:00:01");
  });
});
