import { Button } from "@heroui/button";

import { useAuth } from "@/contexts/AuthContext";

export default function AccessDeniedPage() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-slate-800 p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-white">Acceso denegado</h1>
          <p className="mt-3 text-slate-400">
            Tu usuario no tiene acceso a Virtual Device. Contacta al administrador.
          </p>
          <Button className="mt-6 w-full" color="primary" onPress={() => void logout()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
