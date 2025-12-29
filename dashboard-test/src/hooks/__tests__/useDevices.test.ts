import { QueryClient } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";

import deviceService from "@/lib/services/device.service";
import { createMockDevice } from "@/test-utils/mock-data";
import { renderHookWithQuery } from "@/test-utils/render-hook-with-query";
import type { DevicesResponse } from "@/types/device";

import { useDevices } from "../useDevices";

// Mock del servicio
jest.mock("@/lib/services/device.service", () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
  },
}));

const mockDeviceService = deviceService as jest.Mocked<typeof deviceService>;

describe("useDevices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Limpiar cualquier QueryClient que pueda tener timers activos
    const queryClient = new QueryClient();

    await queryClient.clear();
  });

  describe("carga inicial", () => {
    it("should fetch devices successfully on initial load", async () => {
      const mockDevices = [createMockDevice()];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 50,
          offset: 0,
          total: 1,
        },
      };

      mockDeviceService.getAll.mockResolvedValue(mockResponse);

      const { result } = renderHookWithQuery(() => useDevices());

      // Verificar estado inicial (loading)
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Esperar a que la query se complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificar datos
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0]).toEqual(mockDevices[0]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should call deviceService.getAll with default limit when no filters provided", async () => {
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: [],
        total: 0,
        pagination: {
          limit: 50,
          offset: 0,
          total: 0,
        },
      };

      mockDeviceService.getAll.mockResolvedValue(mockResponse);

      const { result } = renderHookWithQuery(() => useDevices());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificar que se llamó con el filtro por defecto (limit: 50)
      expect(mockDeviceService.getAll).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe("filtros", () => {
    it("should fetch devices with filters", async () => {
      const mockDevices = [createMockDevice({ name: "Filtered Device" })];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockDeviceService.getAll.mockResolvedValue(mockResponse);

      const filters = { name: "Filtered Device", limit: 10 };

      const { result } = renderHookWithQuery(() => useDevices(filters));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDeviceService.getAll).toHaveBeenCalledWith(filters);
      expect(result.current.data?.data[0]?.name).toBe("Filtered Device");
    });

    it("should refetch when filters change", async () => {
      const mockResponse1: DevicesResponse = {
        message: "Devices retrieved",
        data: [createMockDevice({ name: "Device 1" })],
        total: 1,
        pagination: { limit: 10, offset: 0, total: 1 },
      };

      const mockResponse2: DevicesResponse = {
        message: "Devices retrieved",
        data: [createMockDevice({ name: "Device 2" })],
        total: 1,
        pagination: { limit: 10, offset: 0, total: 1 },
      };

      mockDeviceService.getAll
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result, rerender } = renderHookWithQuery(
        ({ filters }) => useDevices(filters),
        {
          initialProps: { filters: { name: "Device 1" } },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]?.name).toBe("Device 1");

      // Cambiar filtros
      rerender({ filters: { name: "Device 2" } });

      await waitFor(() => {
        expect(result.current.data?.data[0]?.name).toBe("Device 2");
      });

      expect(mockDeviceService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe("manejo de errores", () => {
    it("should handle errors when fetching devices fails", async () => {
      const error = new Error("Network error");

      mockDeviceService.getAll.mockRejectedValue(error);

      const { result } = renderHookWithQuery(() => useDevices());

      // Esperar a que la query falle
      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it("should call service when error occurs", async () => {
      const error = new Error("Network error");

      mockDeviceService.getAll.mockRejectedValue(error);

      renderHookWithQuery(() => useDevices());

      await waitFor(
        () => {
          expect(mockDeviceService.getAll).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Verificar que se intentó llamar al servicio
      expect(mockDeviceService.getAll).toHaveBeenCalledWith({ limit: 50 });
    });
  });

  describe("refetch automático", () => {
    it("should fetch data when hook is called", async () => {
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: [],
        total: 0,
        pagination: { limit: 50, offset: 0, total: 0 },
      };

      mockDeviceService.getAll.mockResolvedValue(mockResponse);

      const { result } = renderHookWithQuery(() => useDevices());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificar que se llamó al servicio
      expect(mockDeviceService.getAll).toHaveBeenCalledWith({ limit: 50 });
      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
