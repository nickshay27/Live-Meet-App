import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-xs font-bold">
            RM
          </div>
          <span className="font-semibold tracking-tight text-sm sm:text-base">
            Realtime Meet
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-xs sm:text-sm">
          {user && (
            <>
              <Link
                to="/"
                className={
                  "px-3 py-1 rounded-full " +
                  (location.pathname === "/"
                    ? "bg-brand text-white"
                    : "hover:bg-slate-800")
                }
              >
                Dashboard
              </Link>
              <Link
                to="/create"
                className={
                  "px-3 py-1 rounded-full " +
                  (location.pathname === "/create"
                    ? "bg-brand text-white"
                    : "hover:bg-slate-800")
                }
              >
                New Meeting
              </Link>
              <Link
                to="/join"
                className={
                  "px-3 py-1 rounded-full " +
                  (location.pathname === "/join"
                    ? "bg-brand text-white"
                    : "hover:bg-slate-800")
                }
              >
                Join
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-400">Signed in as</span>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1 rounded-full border border-slate-700 text-xs sm:text-sm hover:bg-slate-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1 rounded-full border border-slate-700 text-xs sm:text-sm hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1 rounded-full bg-brand text-xs sm:text-sm rounded-full hover:bg-brand-dark"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
