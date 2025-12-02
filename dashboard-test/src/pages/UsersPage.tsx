import { UsersCatalog } from "@/components/organisms/users/UsersCatalog";

export function UsersPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
        <p className="mt-2 text-slate-400">
          Administra los usuarios del sistema
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <UsersCatalog />
      </div>
    </div>
  );
}
