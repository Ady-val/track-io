import type { NavigateOptions } from "react-router-dom";

import type React from "react";

import { HeroUIProvider } from "@heroui/system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHref, useNavigate } from "react-router-dom";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

interface ProviderProps {
  children: React.ReactNode;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is always considered stale by default
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

export function Provider({ children }: ProviderProps) {
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        {children}
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
