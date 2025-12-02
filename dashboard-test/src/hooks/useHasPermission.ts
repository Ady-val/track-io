import { type Module, type Action } from "@/constants/permissions";
import { usePermissions } from "@/contexts/PermissionsContext";

export function useHasPermission(
  module: Module | string,
  action: Action | string
): boolean {
  const { hasPermission } = usePermissions();

  return hasPermission(module, action);
}
