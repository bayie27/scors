import "./App.css";
import LoginPage from "./pages/login-page";
import { CalendarPage } from "./pages/calendar-page";
import { useAuth } from "./lib/useAuth";
import { RoleAccessProvider } from "./lib/useRoleAccess.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";


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
      <BrowserRouter>
        <Routes>
          {/* Main calendar page handles all internal navigation */}
          <Route path="/*" element={<CalendarPage user={user} onSignOut={signOut} />} />
        </Routes>
      </BrowserRouter>
    </RoleAccessProvider>
  );
};

export default App;
