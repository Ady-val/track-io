import type { ReactElement, ReactNode } from "react";

import { HeroUIProvider } from "@heroui/system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { BrowserRouter, useHref, useNavigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

// Variable global para almacenar QueryClient de cada test
let testQueryClient: QueryClient | null = null;

const HeroUIProviderWrapper = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  return (
    <HeroUIProvider disableRipple navigate={navigate} useHref={useHref}>
      {children}
    </HeroUIProvider>
  );
};

const AllTheProviders = ({ children }: { children: ReactNode }) => {
  // Crear un nuevo QueryClient para cada render
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Limpia cache inmediatamente
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={testQueryClient}>
        <HeroUIProviderWrapper>
          <AuthProvider>
            <PermissionsProvider>{children}</PermissionsProvider>
          </AuthProvider>
        </HeroUIProviderWrapper>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Exportar función para limpiar QueryClient
export const cleanupQueryClient = () => {
  if (testQueryClient) {
    testQueryClient.clear();
    testQueryClient.removeQueries();
    testQueryClient = null;
  }
};

export * from "@testing-library/react";
export { customRender as render };
