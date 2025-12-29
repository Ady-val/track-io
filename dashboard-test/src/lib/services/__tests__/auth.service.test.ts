import { AxiosError, type AxiosResponse } from "axios";

import { createMockUser } from "@/test-utils/mock-data";

import apiClient from "../../api";
import AuthService, { type LoginDto } from "../auth.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const credentials: LoginDto = {
        username: "testuser",
        password: "password123",
      };

      const mockUser = createMockUser();
      const mockResponse = {
        access_token: "mock-token-123",
        user: mockUser,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{
        access_token: string;
        user: ReturnType<typeof createMockUser>;
      }>);

      const result = await AuthService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/auth/login",
        credentials
      );
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe("mock-token-123");
      expect(result.user.username).toBe("testuser");
    });

    it("should throw error with invalid credentials", async () => {
      const credentials: LoginDto = {
        username: "invalid",
        password: "wrong",
      };

      const error = new AxiosError("Invalid credentials");
      error.response = {
        status: 401,
        data: { message: "Invalid credentials" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        "Invalid credentials"
      );
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/auth/login",
        credentials
      );
    });

    it("should handle network errors", async () => {
      const credentials: LoginDto = {
        username: "testuser",
        password: "password123",
      };

      const error = new Error("Network error");

      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.login(credentials)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      const token = "mock-token-123";

      mockApiClient.post.mockResolvedValue({
        data: {},
      } as AxiosResponse<{ message?: string }>);

      await AuthService.logout(token);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });

    it("should handle logout errors", async () => {
      const token = "invalid-token";

      const error = new AxiosError("Unauthorized");
      error.response = {
        status: 401,
        data: { message: "Unauthorized" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(AuthService.logout(token)).rejects.toThrow("Unauthorized");
    });
  });

  describe("logoutAll", () => {
    it("should logout all sessions successfully", async () => {
      const token = "mock-token-123";

      mockApiClient.delete.mockResolvedValue({
        data: {},
      } as AxiosResponse<{ message?: string }>);

      await AuthService.logoutAll(token);

      expect(mockApiClient.delete).toHaveBeenCalledWith("/auth/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    });

    it("should handle errors when logging out all sessions", async () => {
      const token = "invalid-token";

      const error = new AxiosError("Unauthorized");
      error.response = {
        status: 401,
        data: { message: "Unauthorized" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(AuthService.logoutAll(token)).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("logoutAllExceptCurrent", () => {
    it("should logout all other sessions successfully", async () => {
      const token = "mock-token-123";

      mockApiClient.delete.mockResolvedValue({
        data: {},
      } as AxiosResponse<{ message?: string }>);

      await AuthService.logoutAllExceptCurrent(token);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/auth/sessions/others",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });

    it("should handle errors when logging out other sessions", async () => {
      const token = "invalid-token";

      const error = new AxiosError("Unauthorized");
      error.response = {
        status: 401,
        data: { message: "Unauthorized" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(AuthService.logoutAllExceptCurrent(token)).rejects.toThrow(
        "Unauthorized"
      );
    });
  });
});
