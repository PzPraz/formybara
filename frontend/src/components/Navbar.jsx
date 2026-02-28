import { Link, useLocation, useNavigate } from "react-router-dom";
import { getToken, clearToken } from "../lib/api.js";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!getToken();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <div className="nav-icon">
            <img src="/logo.png" alt="" />
          </div>
          <div>
            <div className="nav-logo">Formybara</div>
          </div>
        </Link>

        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={location.pathname === "/register" ? "active" : ""}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
