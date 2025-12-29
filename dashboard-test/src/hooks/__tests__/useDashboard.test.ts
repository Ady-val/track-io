import { waitFor, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import DashboardService from "@/lib/services/dashboard.service";
import type {
  DashboardResponse,
  EventsResponse,
  DashboardStatus,
} from "@/types/dashboard";

import { useDashboard } from "../useDashboard";

// Mock del servicio
jest.mock("@/lib/services/dashboard.service", () => ({
  __esModule: true,
  default: {
    getAreasData: jest.fn(),
    getOpenEvents: jest.fn(),
    getInProgressEvents: jest.fn(),
    getClosedEvents: jest.fn(),
    getRecentClosedEvents: jest.fn(),
    getAllEvents: jest.fn(),
    getEventsByArea: jest.fn(),
    getDashboardStatus: jest.fn(),
  },
}));

const mockDashboardService = DashboardService as jest.Mocked<
  typeof DashboardService
>;

// Mock de timers para los intervals
jest.useFakeTimers();

describe("useDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe("carga inicial", () => {
    it("should load dashboard data on mount", async () => {
      const mockAreasData: DashboardResponse = {
        success: true,
        data: [],
        headers: [],
      };

      const mockOpenEvents: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      const mockInProgressEvents: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      const mockClosedEvents: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      const mockStatus: DashboardStatus = {
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      };

      mockDashboardService.getAreasData.mockResolvedValue(mockAreasData);
      mockDashboardService.getOpenEvents.mockResolvedValue(mockOpenEvents);
      mockDashboardService.getInProgressEvents.mockResolvedValue(
        mockInProgressEvents
      );
      mockDashboardService.getRecentClosedEvents.mockResolvedValue(
        mockClosedEvents
      );
      mockDashboardService.getDashboardStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useDashboard());

      // Verificar estado inicial (loading)
      expect(result.current.loading).toBe(true);

      // Avanzar timers y esperar
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verificar que se llamaron todos los servicios
      expect(mockDashboardService.getAreasData).toHaveBeenCalled();
      expect(mockDashboardService.getOpenEvents).toHaveBeenCalled();
      expect(mockDashboardService.getInProgressEvents).toHaveBeenCalled();
      expect(mockDashboardService.getRecentClosedEvents).toHaveBeenCalled();
      expect(mockDashboardService.getDashboardStatus).toHaveBeenCalled();
    });

    it("should set error when fetching fails", async () => {
      mockDashboardService.getAreasData.mockRejectedValue(
        new Error("Network error")
      );
      mockDashboardService.getOpenEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getInProgressEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getRecentClosedEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getDashboardStatus.mockResolvedValue({
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      });

      const { result } = renderHook(() => useDashboard());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("refreshAll", () => {
    it("should refresh all data when called", async () => {
      const mockAreasData: DashboardResponse = {
        success: true,
        data: [],
        headers: [],
      };

      mockDashboardService.getAreasData.mockResolvedValue(mockAreasData);
      mockDashboardService.getOpenEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getInProgressEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getRecentClosedEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getDashboardStatus.mockResolvedValue({
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      });

      const { result } = renderHook(() => useDashboard());

      // Esperar carga inicial
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );

      const initialCallCount =
        mockDashboardService.getAreasData.mock.calls.length;

      // Llamar refreshAll
      act(() => {
        result.current.refreshAll();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verificar que se llamó de nuevo
      expect(
        mockDashboardService.getAreasData.mock.calls.length
      ).toBeGreaterThan(initialCallCount);
    });
  });

  describe("getAreaEventStatus", () => {
    it("should return ok status when no active events", () => {
      const mockAreasData: DashboardResponse = {
        success: true,
        data: [],
        headers: [],
      };

      mockDashboardService.getAreasData.mockResolvedValue(mockAreasData);
      mockDashboardService.getOpenEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getInProgressEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getRecentClosedEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getDashboardStatus.mockResolvedValue({
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      });

      const { result } = renderHook(() => useDashboard());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      const status = result.current.getAreaEventStatus("Test Area");

      expect(status.status).toBe("ok");
      expect(status.hasOpenEvents).toBe(false);
    });
  });

  describe("fetch methods", () => {
    it("should fetch areas data independently", async () => {
      const mockAreasData: DashboardResponse = {
        success: true,
        data: [{ area: "Test Area", eventsTime: "0h 0m 0s" }],
        headers: ["Area"],
      };

      mockDashboardService.getAreasData.mockResolvedValue(mockAreasData);
      mockDashboardService.getOpenEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getInProgressEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getRecentClosedEvents.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });
      mockDashboardService.getDashboardStatus.mockResolvedValue({
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      });

      const { result } = renderHook(() => useDashboard());

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );

      // Llamar fetchAreasData
      act(() => {
        result.current.fetchAreasData();
      });

      await waitFor(() => {
        expect(mockDashboardService.getAreasData).toHaveBeenCalled();
      });
    });
  });
});
