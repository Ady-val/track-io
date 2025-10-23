export const departmentColors: Record<string, string> = {
  Ingeniería: "#3B82F6", // Blue
  Mantenimiento: "#F59E0B", // Amber
  Calidad: "#EF4444", // Red
  Producción: "#10B981", // Green
  Logística: "#8B5CF6", // Purple
  Seguridad: "#F97316", // Orange
  Administración: "#6B7280", // Gray
  Finanzas: "#059669", // Emerald
  "Recursos Humanos": "#EC4899", // Pink
  Material: "#8B5CF6", // Purple
  Materiales: "#8B5CF6", // Purple
  "Unknown Department": "#6B7280", // Gray
};

export const getDepartmentColor = (department: string): string => {
  return departmentColors[department] ?? "#6B7280";
};

export const availabilityColors = {
  high: "from-green-500 to-green-600", // >90%
  medium: "from-yellow-500 to-yellow-600", // 70-90%
  low: "from-red-500 to-red-600", // <70%
};

export const getAvailabilityColor = (availability: number): string => {
  if (availability >= 90) return availabilityColors.high;
  if (availability >= 70) return availabilityColors.medium;

  return availabilityColors.low;
};

export const statusColors: Record<string, string> = {
  ok: "bg-green-500",
  alert: "bg-red-500", // Rojo para eventos abiertos
  warning: "bg-yellow-500", // Amarillo para eventos en progreso
  critical: "bg-red-600", // Rojo más oscuro para crítico
  NA: "bg-gray-500",
};

export const getStatusColor = (status: string): string => {
  return statusColors[status] ?? "bg-gray-500";
};

export const getStatusTextColor = (status: string): string => {
  switch (status) {
    case "ok":
      return "text-white bg-green-500";
    case "alert":
      return "text-white bg-red-500"; // Rojo para eventos abiertos
    case "warning":
      return "text-white bg-yellow-500"; // Amarillo para eventos en progreso
    case "critical":
      return "text-white bg-red-600"; // Rojo más oscuro para crítico
    default:
      return "text-white bg-gray-500";
  }
};

export const getEventStatusColor = (eventStatus: string): string => {
  switch (eventStatus) {
    case "open":
      return "#EF4444"; // Rojo para eventos abiertos
    case "in-progress":
      return "#F59E0B"; // Amarillo para eventos en progreso
    case "closed":
      return "#10B981"; // Verde para eventos cerrados
    default:
      return "#6B7280"; // Gris por defecto
  }
};
