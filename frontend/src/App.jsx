import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import SignupPage from "./pages/SignupPage";

const App = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-app-bg text-primary">
      {token && <Navbar />}
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/" replace /> : <SignupPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
