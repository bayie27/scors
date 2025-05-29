import "./App.css";
import LoginPage from "./pages/login-page";
import { useAuth } from "./lib/useAuth";

const App = () => {
const { user, isAuthorized, loading, signOut } = useAuth()

  if (loading) return <p className="text-center mt-10">Checking authentication...</p>

  if (!user || !isAuthorized) return <LoginPage />

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <span>Welcome, {user.email}</span>
        <button onClick={signOut} className="text-sm text-red-500 underline">Sign out</button>
      </div>
    </div>
  )
};

export default App;
