export const departmentColors = {
  'Ingeniería': '#3B82F6',      // Blue
  'Mantenimiento': '#F59E0B',   // Amber
  'Calidad': '#EF4444',         // Red
  'Producción': '#10B981',      // Green
  'Logística': '#8B5CF6',       // Purple
  'Seguridad': '#F97316',       // Orange
  'Administración': '#6B7280',  // Gray
  'Finanzas': '#059669',        // Emerald
  'Recursos Humanos': '#EC4899' // Pink
};

export const getDepartmentColor = (department) => {
  return departmentColors[department] || '#6B7280';
};

export const availabilityColors = {
  high: 'from-green-500 to-green-600',    // >90%
  medium: 'from-yellow-500 to-yellow-600', // 70-90%
  low: 'from-red-500 to-red-600'          // <70%
};

export const getAvailabilityColor = (availability) => {
  if (availability >= 90) return availabilityColors.high;
  if (availability >= 70) return availabilityColors.medium;
  return availabilityColors.low;
};
