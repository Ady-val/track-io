import type React from "react";

import {
  FaChartLine,
  FaGaugeHigh,
  FaIndustry,
  FaClock,
  FaDatabase,
  FaMicrochip,
} from "react-icons/fa6";
import { PiWaveSineBold } from "react-icons/pi";

import { AreaDowntimesPage } from "@/pages/AreaDowntimesPage";
import { CatalogsPage } from "@/pages/CatalogsPage";
import DashboardMeasurementsPage from "@/pages/dashboardMeasurements";
import { DevicesPage } from "@/pages/DevicesPage";
import IndexPage from "@/pages/index";
import { IndustrialDashboard } from "@/pages/IndustrialDashboard";
import RawSignalsPage from "@/pages/rawSignals";

export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: RouteConfig[];
  isProtected?: boolean;
  showInSidebar?: boolean;
}

export const routesConfig: RouteConfig[] = [
  {
    path: "/",
    element: IndexPage,
    title: "Dashboard Principal",
    isProtected: false,
    showInSidebar: false,
  },
  {
    path: "/dashboard",
    element: () => null, // Layout component will handle this
    title: "Dashboard",
    icon: FaChartLine,
    isProtected: true,
    showInSidebar: true,
    children: [
      {
        path: "alerts",
        element: IndexPage,
        title: "Alertas y Monitoreo",
        icon: FaChartLine,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "measurements",
        element: DashboardMeasurementsPage,
        title: "Mediciones",
        icon: FaGaugeHigh,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "signals",
        element: RawSignalsPage,
        title: "Señales en Tiempo Real",
        icon: PiWaveSineBold,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "industrial",
        element: IndustrialDashboard,
        title: "Dashboard Industrial",
        icon: FaIndustry,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "downtimes",
        element: AreaDowntimesPage,
        title: "Tiempos de Paro",
        icon: FaClock,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "devices",
        element: DevicesPage,
        title: "Gestión de Dispositivos",
        icon: FaMicrochip,
        isProtected: true,
        showInSidebar: true,
      },
      {
        path: "catalogs",
        element: CatalogsPage,
        title: "Catálogos del Sistema",
        icon: FaDatabase,
        isProtected: true,
        showInSidebar: true,
      },
    ],
  },
];

// Helper function to get all sidebar routes
export const getSidebarRoutes = (): RouteConfig[] => {
  const sidebarRoutes: RouteConfig[] = [];

  const extractSidebarRoutes = (routes: RouteConfig[]) => {
    routes.forEach((route) => {
      if (route.showInSidebar) {
        sidebarRoutes.push(route);
      }
      if (route.children) {
        extractSidebarRoutes(route.children);
      }
    });
  };

  extractSidebarRoutes(routesConfig);

  return sidebarRoutes;
};

// Helper function to find route by path
export const findRouteByPath = (path: string): RouteConfig | null => {
  const findRoute = (routes: RouteConfig[]): RouteConfig | null => {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }
      if (route.children) {
        const found = findRoute(route.children);

        if (found) return found;
      }
    }

    return null;
  };

  return findRoute(routesConfig);
};

// Helper function to get breadcrumbs
export const getBreadcrumbs = (
  pathname: string
): Array<{ title: string; path: string }> => {
  const breadcrumbs: Array<{ title: string; path: string }> = [];

  if (pathname === "/") {
    breadcrumbs.push({ title: "Dashboard Principal", path: "/" });

    return breadcrumbs;
  }

  if (pathname.startsWith("/dashboard")) {
    breadcrumbs.push({ title: "Dashboard", path: "/dashboard" });

    const currentRoute = findRouteByPath(pathname);

    if (currentRoute) {
      breadcrumbs.push({ title: currentRoute.title, path: pathname });
    }
  }

  return breadcrumbs;
};
