import type { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Helper para crear mocks de apiClient en tests de servicios
 *
 * Uso:
 * ```typescript
 * jest.mock("@/lib/api");
 * import apiClient from "@/lib/api";
 *
 * // En el test:
 * const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
 * mockApiClient.get.mockResolvedValue({ data: {...} });
 * ```
 */

export const createMockApiResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {} as InternalAxiosRequestConfig,
});

export const createMockApiError = (
  status: number,
  message: string
): AxiosError<{ message: string }> => {
  const error = new Error(message) as AxiosError<{ message: string }>;

  error.response = {
    status,
    statusText: "Error",
    data: { message },
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };

  return error;
};
