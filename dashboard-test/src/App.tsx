import { Route, Routes } from "react-router-dom";

import { WebSocketProvider } from "@/contexts/WebSocketContext";
import IndexPage from "@/pages/index";

import { AreaDowntimesPage } from "./pages/AreaDowntimesPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { DevicesPage } from "./pages/DevicesPage";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";
import RawSignalsPage from "./pages/rawSignals";

function App() {
  return (
    <WebSocketProvider>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<RawSignalsPage />} path="/raw-signals" />
        <Route
          element={<DashboardMeasurementsPage />}
          path="/dashboard-measurements"
        />
        <Route element={<IndustrialDashboard />} path="/industrial-dashboard" />
        <Route element={<AreaDowntimesPage />} path="/area-downtimes" />
        <Route element={<DevicesPage />} path="/devices" />
        <Route element={<CatalogsPage />} path="/catalogs" />
      </Routes>
    </WebSocketProvider>
  );
}

export default App;
