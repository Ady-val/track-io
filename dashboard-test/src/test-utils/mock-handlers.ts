import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Base URL para las APIs (sin /api ya que apiClient ya lo incluye)
const API_BASE = "http://localhost:3000";

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      access_token: "mock-token",
      user: { id: 1, name: "Test User", username: "testuser" },
    });
  }),
  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ message: "Logged out successfully" });
  }),
  http.delete(`${API_BASE}/auth/sessions`, () => {
    return HttpResponse.json({ message: "All sessions closed" });
  }),
  http.delete(`${API_BASE}/auth/sessions/others`, () => {
    return HttpResponse.json({ message: "Other sessions closed" });
  }),

  // Device endpoints
  http.get(`${API_BASE}/devices`, () => {
    return HttpResponse.json({
      data: [],
      total: 0,
    });
  }),
  http.get(`${API_BASE}/devices/:id`, () => {
    return HttpResponse.json({
      message: "Device found",
      data: {
        id: 1,
        name: "Test Device",
        externalId: "DEV-001",
        areaId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.get(`${API_BASE}/devices/count`, () => {
    return HttpResponse.json({
      message: "Count retrieved",
      count: 0,
    });
  }),
  http.post(`${API_BASE}/devices`, () => {
    return HttpResponse.json({
      message: "Device created",
      data: {
        id: 1,
        name: "New Device",
        externalId: "DEV-002",
        areaId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.patch(`${API_BASE}/devices/:id`, () => {
    return HttpResponse.json({
      message: "Device updated",
      data: {
        id: 1,
        name: "Updated Device",
        externalId: "DEV-001",
        areaId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.delete(`${API_BASE}/devices/:id`, () => {
    return HttpResponse.json({ message: "Device deleted" });
  }),
  http.patch(`${API_BASE}/devices/:id/restore`, () => {
    return HttpResponse.json({
      message: "Device restored",
      data: {
        id: 1,
        name: "Restored Device",
        externalId: "DEV-001",
        areaId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),

  // Measurement endpoints
  http.get(`${API_BASE}/measurements`, () => {
    return HttpResponse.json({
      message: "Measurements retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/measurements/:id`, () => {
    return HttpResponse.json({
      message: "Measurement found",
      data: {
        id: 1,
        name: "Test Measurement",
        externalId: "MEAS-001",
        deviceId: 1,
        signalId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
  http.post(`${API_BASE}/measurements`, () => {
    return HttpResponse.json({
      message: "Measurement created",
      data: {
        id: 1,
        name: "New Measurement",
        externalId: "MEAS-002",
        deviceId: 1,
        signalId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // Alert Rule endpoints
  http.get(`${API_BASE}/alert-rules`, () => {
    return HttpResponse.json({
      message: "Alert rules retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/alert-rules/:id`, () => {
    return HttpResponse.json({
      message: "Alert rule found",
      data: {
        id: "1",
        name: "Test Alert Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
  http.post(`${API_BASE}/alert-rules`, () => {
    return HttpResponse.json({
      message: "Alert rule created",
      data: {
        id: "1",
        name: "New Alert Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
  http.put(`${API_BASE}/alert-rules/:id`, () => {
    return HttpResponse.json({
      message: "Alert rule updated",
      data: {
        id: "1",
        name: "Updated Alert Rule",
        measurementId: 1,
        mode: "window",
        operator: "<",
        setpoint: 50,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
  http.patch(`${API_BASE}/alert-rules/:id/toggle`, () => {
    return HttpResponse.json({
      message: "Alert rule toggled",
      data: {
        id: "1",
        name: "Test Alert Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
        isEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
  http.delete(`${API_BASE}/alert-rules/:id`, () => {
    return HttpResponse.json({ message: "Alert rule deleted" });
  }),

  // Area endpoints
  http.get(`${API_BASE}/areas`, () => {
    return HttpResponse.json({
      message: "Areas retrieved",
      data: [],
      total: 0,
    });
  }),
  http.get(`${API_BASE}/areas/:id`, () => {
    return HttpResponse.json({
      message: "Area found",
      data: {
        id: 1,
        name: "Test Area",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.get(`${API_BASE}/areas/count`, () => {
    return HttpResponse.json({
      message: "Count retrieved",
      count: 0,
    });
  }),
  http.post(`${API_BASE}/areas`, () => {
    return HttpResponse.json({
      message: "Area created",
      data: {
        id: 1,
        name: "New Area",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.patch(`${API_BASE}/areas/:id`, () => {
    return HttpResponse.json({
      message: "Area updated",
      data: {
        id: 1,
        name: "Updated Area",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),
  http.delete(`${API_BASE}/areas/:id`, () => {
    return HttpResponse.json({ message: "Area deleted" });
  }),
  http.patch(`${API_BASE}/areas/:id/restore`, () => {
    return HttpResponse.json({
      message: "Area restored",
      data: {
        id: 1,
        name: "Restored Area",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    });
  }),

  // Dashboard endpoints
  http.get(`${API_BASE}/api/dashboard/areas-data`, () => {
    return HttpResponse.json({
      message: "Dashboard data retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/open`, () => {
    return HttpResponse.json({
      message: "Open events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/in-progress`, () => {
    return HttpResponse.json({
      message: "In progress events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/closed`, () => {
    return HttpResponse.json({
      message: "Closed events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/closed/recent`, () => {
    return HttpResponse.json({
      message: "Recent closed events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/all`, () => {
    return HttpResponse.json({
      message: "All events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/events/area/:areaId`, () => {
    return HttpResponse.json({
      message: "Area events retrieved",
      data: [],
    });
  }),
  http.get(`${API_BASE}/api/dashboard/status`, () => {
    return HttpResponse.json({
      message: "Dashboard status retrieved",
      status: "ok",
    });
  }),
];

export const server = setupServer(...handlers);
