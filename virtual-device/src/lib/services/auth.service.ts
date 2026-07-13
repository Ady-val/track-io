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

export interface MeResponse {
  message: string;
  data: {
    user: User;
    permissions: Array<{
      id: number;
      module: string;
      action: string;
      description?: string;
    }>;
  };
}

class AuthService {
  static async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
    return response.data;
  }

  static async me(): Promise<MeResponse> {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.post("/auth/logout", {});
  }
}

export default AuthService;
