import { Route, Routes } from "react-router-dom";

import { WebSocketProvider } from "@/contexts/WebSocketContext";
import IndexPage from "@/pages/index";
import RawSignalsPage from "./pages/rawSignals";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";
import { AreaDowntimesPage } from "./pages/AreaDowntimesPage";

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
      </Routes>
    </WebSocketProvider>
  );
}

export default App;
