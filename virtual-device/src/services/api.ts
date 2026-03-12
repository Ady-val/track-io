import { API_CONFIG } from "../config/api";
import { VD_TOKEN_KEY } from "../lib/api";

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface EventItem {
  id: number;
  status: "open" | "in-progress" | "closed";
  createdAt?: string;
}

export interface Device {
  id: number;
  name: string;
  areaId: number;
  areaName: string;
  externalId: string;
  isVirtualDevice: boolean;
  deviceSignals?: DeviceSignal[];
}

export interface DeviceSignal {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  externalValueId: string;
}

export interface SignalData {
  id: string;
  value: string;
}

export interface VirtualDeviceSignalData {
  id: string;
  value: string;
  reason: string;
  comment?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResult {
  access_token: string;
  user: {
    id: number;
    name: string;
    username: string;
  };
}

export interface MeResult {
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      username: string;
    };
    permissions: Array<{
      id: number;
      module: string;
      action: string;
      description?: string;
    }>;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem(VD_TOKEN_KEY)
          ? { Authorization: `Bearer ${localStorage.getItem(VD_TOKEN_KEY)}` }
          : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT,
      );

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error("Request timeout");
        }
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error("Unknown error occurred");
    }
  }

  async getVirtualDevices(): Promise<ApiResponse<Device[]>> {
    return this.request<ApiResponse<Device[]>>("/virtual-device/devices?limit=1000");
  }

  async login(payload: LoginPayload): Promise<LoginResult> {
    return this.request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getMe(): Promise<MeResult> {
    return this.request<MeResult>("/auth/me");
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  }

  async getDevice(id: number): Promise<ApiResponse<Device>> {
    return this.request<ApiResponse<Device>>(`/virtual-device/devices/${id}`);
  }

  async sendSignal(
    _deviceId: number,
    device: Device,
    deviceSignal: DeviceSignal,
  ): Promise<ApiResponse<any>> {
    const signalData: SignalData = {
      id: device.externalId,
      value: deviceSignal.externalValueId,
    };

    return this.request<ApiResponse<any>>("/virtual-device/signals", {
      method: "POST",
      body: JSON.stringify(signalData),
    });
  }

  async sendVirtualDeviceSignal(
    reason: string,
    device: Device,
    deviceSignal: DeviceSignal,
    comment?: string,
  ): Promise<ApiResponse<any>> {
    const signalData: VirtualDeviceSignalData = {
      id: device.externalId,
      value: deviceSignal.externalValueId,
      reason,
      ...(comment && { comment }),
    };

    return this.request<ApiResponse<any>>("/virtual-device/signals", {
      method: "POST",
      body: JSON.stringify(signalData),
    });
  }

  async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>("/virtual-device/departments");
  }

  async getActiveEvent(
    deviceId: number,
    deviceSignalId: number,
  ): Promise<EventItem | null> {
    const response = await this.request<EventItem[] | ApiResponse<EventItem[]>>(
      `/virtual-device/events?deviceId=${deviceId}&deviceSignalId=${deviceSignalId}&status=open,in-progress`,
    );

    const eventsArray = Array.isArray(response) ? response : (response.data ?? []);

    return eventsArray.length > 0 ? eventsArray[0] : null;
  }

  async getLineStopForArea(
    areaId: number,
  ): Promise<ApiResponse<{ startAt: string | null }>> {
    return this.request<ApiResponse<{ startAt: string | null }>>(
      `/virtual-device/line-stop/${areaId}`,
    );
  }
}

export const apiService = new ApiService();
