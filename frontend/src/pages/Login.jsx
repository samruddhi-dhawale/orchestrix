import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserCheck, Lock, User, ArrowRight, KeyRound, AlertCircle, Eye, EyeOff, UserPlus, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("SIGN_IN"); // "SIGN_IN" or "REGISTER"
  const [activeRole, setActiveRole] = useState("DEVELOPER"); // "DEVELOPER" or "ADMIN"
  
  // Sign In State
  const [username, setUsername] = useState("developer");
  const [password, setPassword] = useState("dev123");
  const [showPassword, setShowPassword] = useState(false);

  // Register State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("DEVELOPER");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRoleTab = (role) => {
    setActiveRole(role);
    setError("");
    if (role === "ADMIN") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("developer");
      setPassword("dev123");
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      const userData = response.data;
      setCurrentUser(userData);
      
      // Restore where user left off last time or default to dashboard
      const nextPath = userData.lastVisitedPath && userData.lastVisitedPath !== "/login" 
        ? userData.lastVisitedPath 
        : "/dashboard";
      navigate(nextPath);
    } catch (err) {
      console.warn("Backend authentication error:", err);
      if (err.response && err.response.status === 401) {
        setError("Account not found or incorrect password. Please check your credentials or click 'Create Account / Register' to sign up.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        // Fallback for offline mode: ONLY allow exact verified demo accounts
        const u = username.trim().toLowerCase();
        const p = password.trim();
        if ((u === "developer" && p === "dev123") || (u === "admin" && p === "admin123")) {
          const fallbackRole = u === "admin" ? "ADMIN" : "DEVELOPER";
          const fallbackUser = {
            username: u,
            role: fallbackRole,
            name: fallbackRole === "ADMIN" ? "System Administrator" : "Samruddhi D. (Lead Developer)",
            email: `${u}@orchestrix.io`,
            permissions: fallbackRole === "ADMIN"
              ? ["LAUNCH_ALL", "DEPLOY_PRODUCTION", "MANAGE_CLOUD"]
              : ["LAUNCH_DEV_STAGING", "VIEW_LOGS"],
            token: "session-" + Date.now(),
            lastVisitedPath: "/dashboard"
          };
          setCurrentUser(fallbackUser);
          navigate("/dashboard");
        } else {
          setError("Account not found or incorrect password. Please check your credentials or click 'Create Account / Register' to sign up.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!regUsername.trim() || !regPassword.trim() || !regName.trim()) {
      setError("Full Name, Username, and Password are required to register.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        username: regUsername.trim(),
        password: regPassword.trim(),
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
      });

      // Auto sign-in with newly registered credentials
      const loginRes = await api.post("/auth/login", {
        username: regUsername.trim(),
        password: regPassword.trim(),
      });

      setCurrentUser(loginRes.data);
      navigate("/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create account. Please check inputs.";
      setError(message);
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

        {/* Mode Switcher: Sign In vs Register */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: authMode === "SIGN_IN" ? "2px solid #2563eb" : "2px solid transparent",
              color: authMode === "SIGN_IN" ? "#2563eb" : "#64748b",
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
            }}
            onClick={() => { setAuthMode("SIGN_IN"); setError(""); setSuccessMsg(""); }}
          >
            Sign In
          </button>

          <button
            type="button"
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: authMode === "REGISTER" ? "2px solid #2563eb" : "2px solid transparent",
              color: authMode === "REGISTER" ? "#2563eb" : "#64748b",
              fontWeight: 600,
              fontSize: 13.5,
              cursor: "pointer",
            }}
            onClick={() => { setAuthMode("REGISTER"); setError(""); setSuccessMsg(""); }}
          >
            Create Account / Register
          </button>
        </div>

        {error && (
          <div style={{
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
            marginBottom: 16,
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: "#dc2626" }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ecfdf5", color: "#065f46", padding: "10px 12px", borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= MODE 1: SIGN IN ================= */}
        {authMode === "SIGN_IN" && (
          <>
            {/* Role Control Switcher */}
            <div className="role-switch-container">
              <button
                type="button"
                className={`role-tab-btn ${activeRole === "DEVELOPER" ? "active" : ""}`}
                onClick={() => handleRoleTab("DEVELOPER")}
              >
                <UserCheck size={16} />
                <span>Developer Account</span>
              </button>

              <button
                type="button"
                className={`role-tab-btn ${activeRole === "ADMIN" ? "active" : ""}`}
                onClick={() => handleRoleTab("ADMIN")}
              >
                <ShieldCheck size={16} />
                <span>Admin Account</span>
              </button>
            </div>

            <div className="role-description-banner">
              {activeRole === "ADMIN" ? (
                <span>👑 <strong>Administrator Mode:</strong> Access to Production approval gate, Azure deploy, & User Audit logs.</span>
              ) : (
                <span>💻 <strong>Developer Mode:</strong> Standard pipeline release operator for Development and Staging releases.</span>
              )}
            </div>

            <form onSubmit={handleSignIn} className="login-form-body">
              <div className="form-row">
                <label htmlFor="username">Username / ID</label>
                <div className="input-group">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
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
                    placeholder="Enter password"
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
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn-primary" disabled={loading}>
                {loading ? (
                  <span className="spinner-dot"></span>
                ) : (
                  <>
                    <span>Sign In as {activeRole === "ADMIN" ? "Administrator" : "Developer"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper Chips */}
            <div className="login-quick-helper">
              <span className="helper-label">Quick 1-Click Fill:</span>
              <div className="helper-chips-row">
                <button
                  type="button"
                  className="chip-action"
                  onClick={() => handleRoleTab("DEVELOPER")}
                >
                  Developer (dev123)
                </button>
                <button
                  type="button"
                  className="chip-action"
                  onClick={() => handleRoleTab("ADMIN")}
                >
                  Admin (admin123)
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= MODE 2: REGISTER ================= */}
        {authMode === "REGISTER" && (
          <form onSubmit={handleRegister} className="login-form-body">
            <div className="form-row">
              <label htmlFor="regName">Full Name</label>
              <div className="input-group">
                <input
                  id="regName"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Samruddhi Dhawale"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regUsername">Choose Username / ID</label>
              <div className="input-group">
                <input
                  id="regUsername"
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. samruddhi"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regEmail">Email Address</label>
              <div className="input-group">
                <input
                  id="regEmail"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. samruddhi@orchestrix.io"
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regPassword">Password</label>
              <div className="input-group" style={{ position: "relative" }}>
                <input
                  id="regPassword"
                  type={showRegPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a secure password"
                  style={{ paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
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
                  }}
                  title={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regRole">Account Role Privilege</label>
              <div className="input-group">
                <select
                  id="regRole"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={{
                    width: "100%",
                    height: 42,
                    padding: "0 12px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: 13.5,
                  }}
                >
                  <option value="DEVELOPER">DEVELOPER (Standard Pipeline Launcher)</option>
                  <option value="ADMIN">ADMINISTRATOR (Production Approver & Cloud Manager)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="login-btn-primary" disabled={loading} style={{ marginTop: 10 }}>
              {loading ? (
                <span className="spinner-dot"></span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="login-card-foot">
          <span>Enterprise DevOps Control System • Microsoft Azure & JFrog Artifactory</span>
        </div>
      </div>
    </div>
  );
}

export default Login;