import "./App.css";
import LoginPage from "./pages/login-page";
import { CalendarPage } from "./pages/calendar-page";
import { useAuth } from "./lib/useAuth";
import { RoleAccessProvider, useRoleAccess } from "./lib/useRoleAccess.jsx";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UsersPage } from "./pages/users-page";
import { VenuesPage } from "./pages/venues-page";
import { EquipmentPage } from "./pages/equipment-page";
import { PendingApprovalsPage } from "./pages/PendingApprovalsPage";
import HelpPage from "./pages/HelpPage";




const App = () => {
  const { user, isAuthorized, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return <LoginPage />;
  }

  return (
    <RoleAccessProvider user={user}>
      <AppRoutes user={user} signOut={signOut} />
    </RoleAccessProvider>
  );
};

// Component for routes - now inside RoleAccessProvider
const AppRoutes = ({ user, signOut }) => {
  const { canManageUsers } = useRoleAccess();
  
  // Auth-protected route component
  const ProtectedRoute = ({ children, requiredPermission = false }) => {
    // Check admin permission
    if (requiredPermission === 'admin' && !canManageUsers()) {
      return <Navigate to="/" replace />
    }
    
    return children;
  };

  // Main layout with sidebar and content
  const MainLayout = () => {
    const location = useLocation();
    // Extract view from pathname
    const view = location.pathname.split('/')[1] || 'calendar';
    
    // Check if the view requires admin permissions
    const requiresAdmin = ['users', 'approvals'].includes(view);
    
    // If the view requires admin but user doesn't have permission, redirect to home
    if (requiresAdmin && !canManageUsers()) {
      return <Navigate to="/" replace />;
    }
    
    return (
      <CalendarPage user={user} onSignOut={signOut} view={view} />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
