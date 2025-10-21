import React, { useState } from "react";

import { FaChartLine, FaGaugeHigh, FaIndustry, FaClock } from "react-icons/fa6";
import { PiWaveSineBold } from "react-icons/pi";
import { Link, useLocation } from "react-router-dom";

interface SidebarItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  {
    path: "/",
    icon: FaChartLine,
    label: "Alertas",
  },
  {
    path: "/dashboard-measurements",
    icon: FaGaugeHigh,
    label: "Mediciones",
  },
  {
    path: "/raw-signals",
    icon: PiWaveSineBold,
    label: "Señales",
  },
  {
    path: "/industrial-dashboard",
    icon: FaIndustry,
    label: "Dashboard Industrial",
  },
  {
    path: "/area-downtimes",
    icon: FaClock,
    label: "Tiempos de Paro",
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-slate-800 flex flex-col items-center py-6 px-2 z-50">
      <div className="flex flex-col gap-3 w-full">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                className={`
                  flex items-center justify-center w-full h-12 rounded-lg
                  transition-all duration-200 ease-in-out
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }
                `}
                to={item.path}
              >
                <Icon className="w-6 h-6" />
              </Link>

              {/* Tooltip */}
              {hoveredItem === item.path && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-950 text-white text-sm rounded-md whitespace-nowrap shadow-lg border border-slate-700 z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-950" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
