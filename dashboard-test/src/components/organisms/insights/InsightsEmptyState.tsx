import { FaMagnifyingGlassChart } from "react-icons/fa6";

import { Text } from "../../atoms";

export function InsightsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <FaMagnifyingGlassChart className="text-4xl text-slate-500" />
      <Text className="text-slate-300 font-medium">
        No se encontraron patrones relevantes en este periodo.
      </Text>
      <Text className="text-slate-500 text-sm max-w-sm">
        Prueba con un rango más amplio o revisa un área específica con más
        eventos registrados.
      </Text>
    </div>
  );
}
