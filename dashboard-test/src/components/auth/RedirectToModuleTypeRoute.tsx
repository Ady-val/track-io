import { Navigate } from "react-router-dom";

import { ModuleType, usePermissions } from "@/contexts/PermissionsContext";

export function RedirectToModuleTypeRoute() {
  const { modules } = usePermissions();

  if (modules[ModuleType.SIGNALS]) {
    return <Navigate replace to="/dashboard/industrial" />;
  }

  if (modules[ModuleType.MEASUREMENTS]) {
    return <Navigate replace to="/dashboard/measurements" />;
  }

  return <Navigate replace to="/dashboard/catalogs" />;
}
