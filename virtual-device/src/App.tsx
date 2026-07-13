import { VirtualDeviceApp } from "@/components/VirtualDeviceApp";
import { useAuth } from "@/contexts/AuthContext";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import LoginPage from "@/pages/LoginPage";

function App() {
  const { isAuthenticated, hasVirtualDeviceAccess } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!hasVirtualDeviceAccess) {
    return <AccessDeniedPage />;
  }

  return <VirtualDeviceApp />;
}

export default App;
