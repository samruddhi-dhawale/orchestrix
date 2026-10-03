import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple simultaneous login requests

    setError("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setError("Please enter your username or ID.");
      return;
    }

    if (!trimmedPassword) {
      setError("Please enter your password.");
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

      const nextPath =
        userData.lastVisitedPath && userData.lastVisitedPath !== "/login"
          ? userData.lastVisitedPath
          : "/dashboard";
      navigate(nextPath);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid username or password.");
        } else if (err.response.status === 429) {
          setError(
            err.response.data?.message ||
              "Too many failed login attempts. Please wait a few minutes before trying again."
          );
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Unable to reach the authentication service. Please try again.");
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

        {/* Responsive Error Alert */}
        {error && (
          <div
            className="login-error-alert"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle size={18} className="login-error-icon" />
            <span className="login-error-text">{error}</span>
          </div>
        )}

        {/* Clean Sign In Form */}
        <form onSubmit={handleSignIn} className="login-form-body" noValidate>
          <div className="form-row">
            <label htmlFor="username">Username / ID</label>
            <div className="input-group">
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div className="input-group password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
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
          >
            {loading ? (
              <>
                <span className="spinner-dot"></span>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In →</span>
            )}
          </button>
        </form>

        <div className="login-card-foot">
          <span>Internal CI/CD Platform • Microsoft Azure & JFrog Artifactory</span>
        </div>
      </div>
    </div>
  );
}

export default Login;