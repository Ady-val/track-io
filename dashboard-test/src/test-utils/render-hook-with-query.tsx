import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";

/**
 * Helper para renderizar hooks que usan React Query en tests
 *
 * Crea un QueryClient con configuración optimizada para tests:
 * - retry: false (evita reintentos en tests)
 * - cacheTime: 0 (limpia cache inmediatamente)
 *
 * Uso:
 * ```typescript
 * import { renderHookWithQuery } from "@/test-utils/render-hook-with-query";
 * import { useDevices } from "@/hooks/useDevices";
 *
 * const { result } = renderHookWithQuery(() => useDevices());
 * ```
 */
export const renderHookWithQuery = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper">
) => {
  // Crear un nuevo QueryClient para cada test para evitar estado compartido
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Limpia cache inmediatamente después de unmount (cacheTime deprecated en v5)
        refetchOnWindowFocus: false, // Evita refetch automático en tests
        refetchOnMount: false, // Evita refetch automático en tests
        refetchInterval: false, // Deshabilita refetch automático por intervalos en tests
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const result = renderHook(hook, { ...options, wrapper });

  // Retornar también el queryClient para poder limpiarlo si es necesario
  return {
    ...result,
    queryClient,
  };
};
