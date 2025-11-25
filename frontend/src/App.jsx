import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MeetingRoom from "./meeting/MeetingRoom.jsx";
import CreateMeeting from "./pages/CreateMeeting.jsx";
import JoinMeeting from "./pages/JoinMeeting.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <CreateMeeting />
              </PrivateRoute>
            }
          />
          <Route
            path="/join"
            element={
              <PrivateRoute>
                <JoinMeeting />
              </PrivateRoute>
            }
          />
          <Route
            path="/meet/:code"
            element={
              <PrivateRoute>
                <MeetingRoom />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
