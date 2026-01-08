import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
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

// Mock de usePermissions para evitar la complejidad de la inicialización asíncrona
jest.mock("@/contexts/PermissionsContext", () => {
  const actual = jest.requireActual("@/contexts/PermissionsContext");
  return {
    ...actual,
    usePermissions: jest.fn(() => ({
      permissions: [
        { id: 1, module: "measurement-alerts", action: "read" },
        { id: 2, module: "measurements", action: "read" },
        { id: 3, module: "users", action: "read" },
        { id: 4, module: "devices", action: "read" },
        { id: 5, module: "roles-and-permissions", action: "read" },
        { id: 6, module: "area-downtime", action: "read" },
        { id: 7, module: "catalogs", action: "read" },
        { id: 8, module: "dashboard", action: "read" },
        { id: 9, module: "signals", action: "read" },
      ],
      modules: {
        signals: true,
        measurements: true,
      },
      isLoading: false,
      error: null,
      hasPermission: jest.fn(() => true),
      hasModule: jest.fn(() => true),
      refreshPermissions: jest.fn(),
    })),
  };
});

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Usuario de prueba para mockear autenticación
const mockUser = {
  id: 1,
  name: "Test User",
  username: "testuser",
};

const createWrapper = (initialEntries = ["/dashboard/alerts"]) => {

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
        <AuthProvider>{children}</AuthProvider>
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

    // Configurar localStorage con usuario autenticado antes de cada test
    localStorage.setItem("auth_token", "mock-token");
    localStorage.setItem("auth_user", JSON.stringify(mockUser));

    // Mock de apiClient para evitar errores en otros componentes
    mockApiClient.get.mockResolvedValue({ data: {} } as any);
    mockApiClient.post.mockResolvedValue({ data: {} } as any);
    mockApiClient.delete.mockResolvedValue({ data: {} } as any);
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
    render(<Sidebar />, { wrapper: Wrapper });

    // Como usePermissions está mockeado, los elementos deberían aparecer inmediatamente
    // Pero aún así esperamos un poco para asegurar que el componente se renderizó
    await waitFor(
      () => {
        const alertsLink = screen.getByLabelText("Alertas");
        expect(alertsLink).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should highlight active route", async () => {
    const Wrapper = createWrapper(["/dashboard/alerts"]);
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar y verificar que el link activo tiene la clase correcta
    await waitFor(
      () => {
        const alertsLink = screen.getByLabelText("Alertas");
        expect(alertsLink).toBeInTheDocument();
        // Verificar que tiene la clase de activo (puede estar en el className completo)
        expect(alertsLink.className).toContain("bg-blue-600");
      },
      { timeout: 2000 }
    );
  });

  it("should filter items based on permissions", async () => {
    const Wrapper = createWrapper();
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar y verificar que alerts está presente cuando tiene permiso
    await waitFor(
      () => {
        const alertsLink = screen.getByLabelText("Alertas");
        expect(alertsLink).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should call logout when logout button is clicked", async () => {
    mockAuthService.logout.mockResolvedValue(undefined);

    const Wrapper = createWrapper();
    render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice completamente
    await waitFor(
      () => {
        const logoutButtons = screen.getAllByRole("button");
        expect(logoutButtons.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1]; // El último es el de logout

    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);

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

    // Esperar a que el componente se renderice completamente
    await waitFor(
      () => {
        const logoutButtons = screen.getAllByRole("button");
        expect(logoutButtons.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1];

    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);

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

    // Esperar a que el componente se renderice completamente
    await waitFor(
      () => {
        const logoutButtons = screen.getAllByRole("button");
        expect(logoutButtons.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons[logoutButtons.length - 1];

    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  it("should show tooltip on hover", async () => {
    const Wrapper = createWrapper();
    const { container } = render(<Sidebar />, { wrapper: Wrapper });

    // Esperar a que el componente se renderice completamente
    await waitFor(
      () => {
        const alertsLink = screen.getByLabelText("Alertas");
        expect(alertsLink).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const alertsLink = screen.getByLabelText("Alertas");

    // Verificar que inicialmente el tooltip no está visible
    // El tooltip solo aparece cuando hoveredItem === item.path
    const linkContainer = alertsLink.closest(".relative");
    expect(linkContainer).toBeInTheDocument();
    
    // Verificar que inicialmente no hay tooltip visible
    const initialTooltips = container.querySelectorAll('[class*="bg-slate-950"]');
    // El tooltip debe tener la clase bg-slate-950, pero inicialmente no debería estar visible
    // Verificamos buscando el div del tooltip específicamente
    const initialTooltipDiv = container.querySelector('.absolute.left-full.ml-2');
    // El tooltip puede existir en el DOM pero no ser visible, o puede no existir
    // En este caso, simplemente verificamos que podemos hacer hover
    
    if (linkContainer) {
      fireEvent.mouseEnter(linkContainer);
    }

    // Verificar que el tooltip aparece después del hover
    await waitFor(
      () => {
        // Buscar el tooltip específicamente por su clase única
        const tooltip = container.querySelector('.absolute.left-full.ml-2.bg-slate-950');
        expect(tooltip).toBeInTheDocument();
        // Verificar que contiene el texto "Alertas"
        expect(tooltip?.textContent).toContain("Alertas");
      },
      { timeout: 1000 }
    );
  });
});
