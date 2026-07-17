import { useLocation } from "react-router-dom";

export function useLayoutConfig() {
  const location = useLocation();
  // Rutas que ocupan todo el ancho disponible en lugar de centrarse en un
  // contenedor de max-w-6xl: pantallas densas (dashboards, reportes) donde
  // limitar el ancho desperdicia espacio y aprieta gráficas y tablas.
  const compactPaddingRoutes = [
    "/dashboard/industrial",
    "/dashboard/measurements",
    "/dashboard/reportes",
  ];
  const needsCompactPadding = compactPaddingRoutes.includes(location.pathname);

  return {
    compactPadding: needsCompactPadding,
    currentPath: location.pathname,
  };
}
