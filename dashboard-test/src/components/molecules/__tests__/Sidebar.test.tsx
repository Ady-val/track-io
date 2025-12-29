import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import apiClient from "@/lib/api";
import AuthService from "@/lib/services/auth.service";

import Sidebar from "../Sidebar";

// Mock de AuthService
jest.mock("@/lib/services/auth.service", () => ({
  __esModule: true,
  default: {
    logout: jest.fn(),
  },
}));

// Mock de apiClient para evitar llamadas reales
jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock de useHasPermission - retorna un booleano directamente
jest.mock("@/hooks/useHasPermission", () => ({
  useHasPermission: jest.fn(() => true),
}));

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Usuario de prueba para mockear autenticación
const mockUser = {
  id: 1,
  name: "Test User",
  username: "testuser",
};

const createWrapper = (initialEntries = ["/dashboard/alerts"]) => {
  // Configurar localStorage con usuario autenticado
  localStorage.setItem("auth_token", "mock-token");
  localStorage.setItem("auth_user", JSON.stringify(mockUser));

  // Mock de la respuesta de /auth/me para PermissionsProvider
  mockApiClient.get.mockResolvedValue({
    data: {
      message: "Success",
      data: {
        user: mockUser,
        permissions: [
          { id: 1, module: "MEASUREMENT_ALERTS", action: "READ" },
          { id: 2, module: "MEASUREMENTS", action: "READ" },
          { id: 3, module: "USERS", action: "READ" },
          { id: 4, module: "DEVICES", action: "READ" },
          { id: 5, module: "ROLES_AND_PERMISSIONS", action: "READ" },
          { id: 6, module: "AREA_DOWNTIME", action: "READ" },
          { id: 7, module: "CATALOGS", action: "READ" },
        ],
      },
    },
  } as unknown as {
    user: {
      id: number;
      email: string;
      permissions: Array<{ id: number; module: string; action: string }>;
    };
  });

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchInterval: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PermissionsProvider>{children}</PermissionsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
};

// Importar el mock para poder controlarlo
const mockUseHasPermission = require("@/hooks/useHasPermission")
  .useHasPermission as jest.Mock;

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseHasPermission.mockReturnValue(true);
    mockAuthService.logout.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    localStorage.clear();
    // Limpiar cualquier QueryClient que pueda tener timers activos
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchInterval: false,
        },
      },
    });

    await queryClient.clear();
    queryClient.removeQueries();
  });

  it("should render sidebar items", async () => {
    const Wrapper = createWrapper();
    const { container } = render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice completamente
    await waitFor(() => {
      const alertsLink = container.querySelector('a[href="/dashboard/alerts"]');

      expect(alertsLink).toBeInTheDocument();
    });
  });

  it("should highlight active route", async () => {
    const Wrapper = createWrapper(["/dashboard/alerts"]);
    const { container } = render(<Sidebar />, { wrapper: Wrapper });

    // Esperar y verificar que el link activo tiene la clase correcta
    await waitFor(() => {
      const alertsLink = container.querySelector('a[href="/dashboard/alerts"]');

      expect(alertsLink).toBeInTheDocument();
      // Verificar que tiene la clase de activo (puede estar en el className completo)
      expect(alertsLink?.className).toContain("bg-blue-600");
    });
  });

  it("should filter items based on permissions", async () => {
    // Configurar mocks para diferentes permisos
    mockUseHasPermission.mockReturnValue(true);

    const Wrapper = createWrapper();
    const { container } = render(<Sidebar />, { wrapper: Wrapper });

    // Esperar y verificar que alerts está presente cuando tiene permiso
    await waitFor(() => {
      const alertsLink = container.querySelector('a[href="/dashboard/alerts"]');

      expect(alertsLink).toBeInTheDocument();
    });
  });

  it("should call logout when logout button is clicked", async () => {
    mockAuthService.logout.mockResolvedValue(undefined);

    const Wrapper = createWrapper();
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice y luego buscar el botón de logout
    await waitFor(() => {
      const logoutButtons = screen.getAllByRole("button");

      expect(logoutButtons.length).toBeGreaterThan(0);
    });

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1]; // El último es el de logout

    if (logoutButton) {
      fireEvent.click(logoutButton);
    }

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  it("should disable logout button while logging out", async () => {
    mockAuthService.logout.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const Wrapper = createWrapper();
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice
    await waitFor(() => {
      const logoutButtons = screen.getAllByRole("button");

      expect(logoutButtons.length).toBeGreaterThan(0);
    });

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1];

    if (logoutButton) {
      fireEvent.click(logoutButton);
    }

    // Verificar que se llamó al servicio y el botón se deshabilita
    await waitFor(
      () => {
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(logoutButton).toBeDisabled();
      },
      { timeout: 2000 }
    );
  });

  it("should handle logout error gracefully", async () => {
    mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));

    const Wrapper = createWrapper();
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice
    await waitFor(() => {
      const logoutButtons = screen.getAllByRole("button");

      expect(logoutButtons.length).toBeGreaterThan(0);
    });

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1];

    if (logoutButton) {
      fireEvent.click(logoutButton);
    }

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });
});
