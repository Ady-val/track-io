import type React from "react";

import {
  FaChartLine,
  FaChartColumn,
  FaGaugeHigh,
  FaIndustry,
  FaClock,
  FaDatabase,
  FaMicrochip,
  FaUsers,
  FaShieldHalved,
} from "react-icons/fa6";
import { PiWaveSineBold } from "react-icons/pi";

import { ModuleType } from "@/contexts/PermissionsContext";

import { Module } from "./permissions";

export interface SidebarItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  module: Module;
  moduleType?: ModuleType;
  isAdminOnly?: boolean;
}

export const SidebarItems: SidebarItem[] = [
  {
    path: "/dashboard/alerts",
    icon: FaChartLine,
    label: "Alertas",
    module: Module.MEASUREMENT_ALERTS,
    moduleType: ModuleType.MEASUREMENTS,
  },
  {
    path: "/dashboard/measurements",
    icon: FaGaugeHigh,
    label: "Mediciones",
    module: Module.MEASUREMENTS,
    moduleType: ModuleType.MEASUREMENTS,
  },
  {
    path: "/dashboard/signals",
    icon: PiWaveSineBold,
    label: "Señales",
    module: Module.SIGNALS,
    isAdminOnly: true,
  },
  {
    path: "/dashboard/industrial",
    icon: FaIndustry,
    label: "Dashboard Industrial",
    module: Module.DASHBOARD,
    moduleType: ModuleType.SIGNALS,
  },
  {
    path: "/dashboard/downtimes",
    icon: FaClock,
    label: "Tiempos de Paro",
    module: Module.AREA_DOWNTIME,
    moduleType: ModuleType.SIGNALS,
  },
  {
    path: "/dashboard/reportes",
    icon: FaChartColumn,
    label: "Reportes de Paros",
    module: Module.REPORTS,
    moduleType: ModuleType.SIGNALS,
  },
  {
    path: "/dashboard/devices",
    icon: FaMicrochip,
    label: "Dispositivos",
    module: Module.DEVICES,
    moduleType: ModuleType.SIGNALS,
  },
  {
    path: "/dashboard/catalogs",
    icon: FaDatabase,
    label: "Catálogos",
    module: Module.CATALOGS,
  },
  {
    path: "/dashboard/users",
    icon: FaUsers,
    label: "Usuarios",
    module: Module.USERS,
  },
  {
    path: "/dashboard/roles",
    icon: FaShieldHalved,
    label: "Roles y Permisos",
    module: Module.ROLES_AND_PERMISSIONS,
  },
];
