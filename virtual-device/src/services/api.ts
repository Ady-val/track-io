import { API_CONFIG } from "../config/api";

export interface ApiResponse<T> {
  message: string;
  data: T;
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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
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

  // Get all virtual devices
  async getVirtualDevices(): Promise<ApiResponse<Device[]>> {
    return this.request<ApiResponse<Device[]>>("/devices?isVirtualDevice=true");
  }

  // Get device by ID
  async getDevice(id: number): Promise<ApiResponse<Device>> {
    return this.request<ApiResponse<Device>>(`/devices/${id}`);
  }

  // Send signal data
  async sendSignal(
    _deviceId: number,
    device: Device,
    deviceSignal: DeviceSignal
  ): Promise<ApiResponse<any>> {
    const signalData: SignalData = {
      id: device.externalId, // externalId del device
      value: deviceSignal.externalValueId, // externalValueId del signalDevice
    };

    return this.request<ApiResponse<any>>("/signals", {
      method: "POST",
      body: JSON.stringify(signalData),
    });
  }

  // Send virtual device signal data
  async sendVirtualDeviceSignal(
    reason: string,
    device: Device,
    deviceSignal: DeviceSignal,
    comment?: string
  ): Promise<ApiResponse<any>> {
    const signalData: VirtualDeviceSignalData = {
      id: device.externalId,
      value: deviceSignal.externalValueId,
      reason,
      ...(comment && { comment }),
    };

    return this.request<ApiResponse<any>>("/signals/virtual-device", {
      method: "POST",
      body: JSON.stringify(signalData),
    });
  }

  // Get departments
  async getDepartments(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>("/departments");
  }
}

export const apiService = new ApiService();
