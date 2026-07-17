import { Navigate, Route, Routes } from "react-router-dom";

import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { PermissionProtectedRoute } from "@/components/auth/PermissionProtectedRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Module, Action } from "@/constants/permissions";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

import { RedirectToModuleTypeRoute } from "./components/auth/RedirectToModuleTypeRoute";
import { ModuleType } from "./contexts/PermissionsContext";
import { AreaDowntimesPage } from "./pages/AreaDowntimesPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { DevicesPage } from "./pages/DevicesPage";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";
import RawSignalsPage from "./pages/rawSignals";
import { ReportsPage } from "./pages/ReportsPage";
import { RolesPage } from "./pages/RolesPage";
import { UsersPage } from "./pages/UsersPage";

function App() {
  return (
    <ErrorBoundary>
      <div className="min-w-[1280px] min-h-[768px] h-screen w-full overflow-auto">
        <Routes>
          <Route
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
            path="/login"
          />
          <Route
            element={
              <ProtectedRoute>
                <Navigate replace to="/dashboard" />
              </ProtectedRoute>
            }
            path="/"
          />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
            path="/dashboard"
          >
            <Route index element={<RedirectToModuleTypeRoute />} />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.MEASUREMENT_ALERTS}
                  moduleType={ModuleType.MEASUREMENTS}
                >
                  <IndexPage />
                </PermissionProtectedRoute>
              }
              path="alerts"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.MEASUREMENTS}
                  moduleType={ModuleType.MEASUREMENTS}
                >
                  <DashboardMeasurementsPage />
                </PermissionProtectedRoute>
              }
              path="measurements"
            />
            <Route
              element={
                <AdminProtectedRoute>
                  <RawSignalsPage />
                </AdminProtectedRoute>
              }
              path="signals"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.DASHBOARD}
                  moduleType={ModuleType.SIGNALS}
                >
                  <IndustrialDashboard />
                </PermissionProtectedRoute>
              }
              path="industrial"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.AREA_DOWNTIME}
                  moduleType={ModuleType.SIGNALS}
                >
                  <AreaDowntimesPage />
                </PermissionProtectedRoute>
              }
              path="downtimes"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.REPORTS}
                  moduleType={ModuleType.SIGNALS}
                >
                  <ReportsPage />
                </PermissionProtectedRoute>
              }
              path="reportes"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.DEVICES}
                  moduleType={ModuleType.SIGNALS}
                >
                  <DevicesPage />
                </PermissionProtectedRoute>
              }
              path="devices"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.CATALOGS}
                >
                  <CatalogsPage />
                </PermissionProtectedRoute>
              }
              path="catalogs"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.USERS}
                >
                  <UsersPage />
                </PermissionProtectedRoute>
              }
              path="users"
            />
            <Route
              element={
                <PermissionProtectedRoute
                  action={Action.READ}
                  module={Module.ROLES_AND_PERMISSIONS}
                >
                  <RolesPage />
                </PermissionProtectedRoute>
              }
              path="roles"
            />
          </Route>
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
