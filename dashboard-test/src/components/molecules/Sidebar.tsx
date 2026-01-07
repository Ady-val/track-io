import { useState } from "react";

import { FaRightFromBracket } from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Action, ADMIN_USERNAME } from "@/constants/permissions";
import { SidebarItems } from "@/constants/sidebarItems";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import AuthService from "@/lib/services/auth.service";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, modules } = usePermissions();
  const { logout: logoutContext, token, user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user?.username === ADMIN_USERNAME;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (token) {
        try {
          await AuthService.logout(token);
        } catch {
          void 0;
        }
      }
      logoutContext();
      navigate("/login");
    } catch (_error) {
      logoutContext();
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const visibleSidebarItems = SidebarItems.filter((item) => {
    if (item.isAdminOnly) {
      return isAdmin;
    }

    const hasReadPermission = isAdmin
      ? true
      : permissions.some(
          (permission) =>
            permission.module === item.module &&
            permission.action === Action.READ
        );
    const isActiveModule = item.moduleType ? modules[item.moduleType] : true;

    return hasReadPermission && isActiveModule;
  });

  return (
    <div className="h-full w-16 bg-slate-800 flex flex-col items-center py-6 px-2 z-50 border-2">
      <div className="flex flex-col gap-3 w-full flex-1">
        {visibleSidebarItems.map((item) => {
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
                aria-label={item.label}
                className={`
                  flex items-center justify-center w-full h-12 rounded-lg
                  transition-all duration-200 ease-in-out
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }
                `}
                data-cy={`sidebar-link-${item.path.replace(/\//g, "-").replace(/^-/, "")}`}
                to={item.path}
              >
                <Icon className="w-6 h-6" />
              </Link>

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

      <div
        className="relative mt-auto w-full"
        onMouseEnter={() => setHoveredItem("logout")}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <button
          className={`
            flex items-center justify-center w-full h-12 rounded-lg
            transition-all duration-200 ease-in-out
            text-slate-400 hover:text-white hover:bg-red-600/20 hover:border-red-500/50
            border border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={isLoggingOut}
          type="button"
          onClick={handleLogout}
        >
          <FaRightFromBracket className="w-6 h-6" />
        </button>

        {hoveredItem === "logout" && (
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-950 text-white text-sm rounded-md whitespace-nowrap shadow-lg border border-slate-700 z-50">
            Cerrar Sesión
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-950" />
          </div>
        )}
      </div>
    </div>
  );
}
