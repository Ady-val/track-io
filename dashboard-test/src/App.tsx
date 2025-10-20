import { Route, Routes } from "react-router-dom";

import { WebSocketProvider } from "@/contexts/WebSocketContext";
import IndexPage from "@/pages/index";
import RawSignalsPage from "./pages/rawSignals";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";

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
      </Routes>
    </WebSocketProvider>
  );
}

export default App;
