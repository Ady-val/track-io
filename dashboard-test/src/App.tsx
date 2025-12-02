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

import { AreaDowntimesPage } from "./pages/AreaDowntimesPage";
import { CatalogsPage } from "./pages/CatalogsPage";
import DashboardMeasurementsPage from "./pages/dashboardMeasurements";
import { DevicesPage } from "./pages/DevicesPage";
import { IndustrialDashboard } from "./pages/IndustrialDashboard";
import RawSignalsPage from "./pages/rawSignals";
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
              <Navigate replace to="/dashboard/industrial" />
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
          <Route
            index
            element={<Navigate replace to="/dashboard/industrial" />}
          />
          <Route
            element={
              <PermissionProtectedRoute
                action={Action.READ}
                module={Module.MEASUREMENT_ALERTS}
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
          <Route element={<IndustrialDashboard />} path="industrial" />
          <Route
            element={
              <PermissionProtectedRoute
                action={Action.READ}
                module={Module.AREA_DOWNTIME}
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
                module={Module.DEVICES}
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
