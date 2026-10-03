import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  // Controlled input states initialized empty
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      const userData = response.data;
      setCurrentUser(userData);

      // Restore where user left off last time or default to dashboard
      const nextPath =
        userData.lastVisitedPath && userData.lastVisitedPath !== "/login"
          ? userData.lastVisitedPath
          : "/dashboard";
      navigate(nextPath);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError(err.response.data?.message || "Invalid username or password.");
        } else if (err.response.status === 429) {
          setError(
            err.response.data?.message ||
              "Too many failed login attempts. Please wait a few minutes before trying again."
          );
        } else {
          setError(err.response.data?.message || "Authentication failed. Please verify your credentials.");
        }
      } else {
        setError("Unable to connect to authentication server. Please check your network or backend service.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box-card">
        {/* Platform Header */}
        <div className="login-title-section">
          <div className="login-app-logo">
            <span className="logo-letter">O</span>
          </div>
          <h1>ORCHESTRIX</h1>
          <p className="login-app-tagline">CI/CD Pipeline Orchestration & Cloud Platform</p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fef2f2",
              border: "1.5px solid #ef4444",
              color: "#b91c1c",
              padding: "12px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 18,
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: "#dc2626" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="login-form-body">
          <div className="form-row">
            <label htmlFor="username">Username / ID</label>
            <div className="input-group" style={{ position: "relative" }}>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or ID"
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div className="input-group" style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: 42 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <span className="spinner-dot"></span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="login-card-foot" style={{ marginTop: 24 }}>
          <span>Enterprise DevOps Control System • Microsoft Azure & JFrog Artifactory</span>
        </div>
      </div>
    </div>
  );
}

export default Login;