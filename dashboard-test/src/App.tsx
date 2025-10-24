import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import IndexPage from "@/pages/index";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { AreaDowntimesPage } from "./pages/AreaDowntimesPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { DevicesPage } from "./pages/DevicesPage";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";
import RawSignalsPage from "./pages/rawSignals";

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          element={<Navigate replace to="/dashboard/industrial" />}
          path="/"
        />
        <Route element={<DashboardLayout />} path="/dashboard">
          <Route
            index
            element={<Navigate replace to="/dashboard/industrial" />}
          />
          <Route element={<IndexPage />} path="alerts" />
          <Route element={<DashboardMeasurementsPage />} path="measurements" />
          <Route element={<RawSignalsPage />} path="signals" />
          <Route element={<IndustrialDashboard />} path="industrial" />
          <Route element={<AreaDowntimesPage />} path="downtimes" />
          <Route element={<DevicesPage />} path="devices" />
          <Route element={<CatalogsPage />} path="catalogs" />
        </Route>
        {/* 404 Route */}
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
