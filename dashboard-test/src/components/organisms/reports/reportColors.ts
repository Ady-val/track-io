// Colores con significado, consistentes en toda la pantalla (§8.4).
export const REPORT_COLORS = {
  scheduled: "#898781", // paro programado — esperado, no es un problema
  unplanned: "#e34948", // paro no programado — lo que hay que reducir
  run: "#008300", // tiempo corriendo — lo bueno
  response: "#f5a524", // atención — cuánto tardaron en llegar
  resolution: "#e34948", // solución — cuánto tardaron en arreglar
  cumulative: "#3b82f6", // línea de acumulado del Pareto
} as const;
