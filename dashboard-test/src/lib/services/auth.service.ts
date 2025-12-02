import type { User } from "@/contexts/AuthContext";

import apiClient from "../api";

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

class AuthService {
  static async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );

    return response.data;
  }

  static async logout(token: string): Promise<void> {
    await apiClient.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  static async logoutAll(token: string): Promise<void> {
    await apiClient.delete("/auth/sessions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static async logoutAllExceptCurrent(token: string): Promise<void> {
    await apiClient.delete("/auth/sessions/others", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default AuthService;
