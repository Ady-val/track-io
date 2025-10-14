import { Route, Routes } from "react-router-dom";

import { WebSocketProvider } from "@/contexts/WebSocketContext";
import IndexPage from "@/pages/index";
import RawSignalsPage from "./pages/rawSignals";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";

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
      </Routes>
    </WebSocketProvider>
  );
}

export default App;
