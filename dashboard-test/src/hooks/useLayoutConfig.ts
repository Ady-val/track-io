import { useLocation } from "react-router-dom";

export function useLayoutConfig() {
  const location = useLocation();
  const compactPaddingRoutes = ["/dashboard/industrial"];
  const needsCompactPadding = compactPaddingRoutes.includes(location.pathname);

  return {
    compactPadding: needsCompactPadding,
    currentPath: location.pathname,
  };
}
