import { type ModuleType, usePermissions } from "@/contexts/PermissionsContext";

export function useActiveModule(module?: ModuleType): boolean {
  const { hasModule } = usePermissions();

  if (!module) return true;

  return hasModule(module);
}
