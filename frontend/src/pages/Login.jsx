import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle, Eye, EyeOff, UserPlus, CheckCircle2, KeyRound, ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  // Mode: "LOGIN" | "SIGNUP" | "FORGOT_PASSWORD"
  const [authMode, setAuthMode] = useState("LOGIN");

  // Sign In State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up State
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState("DEVELOPER");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password / Change Password State
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccessMsg("");
    setSlowNotice(false);
  };

  // 1. Handle Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearMessages();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => setSlowNotice(true), 3500);

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
        setError(
          "Unable to connect to authentication server. If the cloud backend was sleeping, it may take 30–60 seconds to wake up. Please wait a moment and try again."
        );
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowNotice(false);
    }
  };

  // 2. Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearMessages();

    const name = regName.trim();
    const uname = regUsername.trim();
    const email = regEmail.trim();
    const pass = regPassword.trim();
    const confirmPass = regConfirmPassword.trim();

    if (!name || !uname || !pass) {
      setError("Please fill in your full name, username, and password.");
      return;
    }

    if (pass.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    if (pass !== confirmPass) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => setSlowNotice(true), 3500);

    try {
      const response = await api.post("/auth/register", {
        name,
        username: uname,
        email: email || `${uname}@orchestrix.io`,
        password: pass,
        role: regRole,
      });

      const userData = response.data;
      setCurrentUser(userData);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please check your details.";
      setError(msg);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowNotice(false);
    }
  };

  // 3. Handle Forgot Password / Change Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    const uname = resetUsername.trim();
    const nPass = newPassword.trim();
    const cPass = confirmNewPassword.trim();

    if (!uname || !nPass) {
      setError("Please enter your username/ID and a new password.");
      return;
    }

    if (nPass.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }

    if (nPass !== cPass) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => setSlowNotice(true), 3500);

    try {
      const response = await api.post("/auth/reset-password", {
        username: uname,
        newPassword: nPass,
      });

      setSuccessMsg(response.data?.message || "Password updated successfully! Please sign in.");
      setUsername(uname);
      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setAuthMode("LOGIN");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password. Please check your username.";
      setError(msg);
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowNotice(false);
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

        {/* Top Mode Tabs: Log In vs Sign Up (hidden when in forgot password) */}
        {authMode !== "FORGOT_PASSWORD" && (
          <div
            style={{
              display: "flex",
              borderBottom: "1.5px solid #e2e8f0",
              marginBottom: 20,
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                padding: "10px 0",
                background: "none",
                border: "none",
                borderBottom: authMode === "LOGIN" ? "2.5px solid #2563eb" : "2.5px solid transparent",
                color: authMode === "LOGIN" ? "#2563eb" : "#64748b",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setAuthMode("LOGIN");
                clearMessages();
              }}
            >
              Log In
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "10px 0",
                background: "none",
                border: "none",
                borderBottom: authMode === "SIGNUP" ? "2.5px solid #2563eb" : "2.5px solid transparent",
                color: authMode === "SIGNUP" ? "#2563eb" : "#64748b",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setAuthMode("SIGNUP");
                clearMessages();
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fef2f2",
              border: "1.5px solid #ef4444",
              color: "#b91c1c",
              padding: "11px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: "#dc2626" }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#ecfdf5",
              border: "1.5px solid #10b981",
              color: "#065f46",
              padding: "11px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, color: "#059669" }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cloud Cold Start Helper Notice */}
        {slowNotice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              marginBottom: 16,
              lineHeight: 1.4,
            }}
          >
            <span
              className="spinner-dot"
              style={{
                borderColor: "rgba(37,99,235,0.3)",
                borderTopColor: "#2563eb",
                flexShrink: 0,
                width: 14,
                height: 14,
              }}
            ></span>
            <span>Connecting to cloud server... Cloud instance is waking up from idle (takes ~30–50s on first request).</span>
          </div>
        )}

        {/* ================= VIEW 1: LOG IN ================= */}
        {authMode === "LOGIN" && (
          <form onSubmit={handleSignIn} className="login-form-body">
            <div className="form-row">
              <label htmlFor="username">Username / ID</label>
              <div className="input-group">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. developer or admin)"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="password" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("FORGOT_PASSWORD");
                    setResetUsername(username);
                    clearMessages();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-group" style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
        )}

        {/* ================= VIEW 2: SIGN UP ================= */}
        {authMode === "SIGNUP" && (
          <form onSubmit={handleSignUp} className="login-form-body">
            <div className="form-row">
              <label htmlFor="regName">Full Name</label>
              <div className="input-group">
                <input
                  id="regName"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Samruddhi Dhawale"
                  disabled={loading}
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
                  autoComplete="username"
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regRole">Account Privilege Level</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 2 }}>
                <button
                  type="button"
                  onClick={() => setRegRole("DEVELOPER")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "9px 10px",
                    borderRadius: 6,
                    border: regRole === "DEVELOPER" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: regRole === "DEVELOPER" ? "#eff6ff" : "#ffffff",
                    color: regRole === "DEVELOPER" ? "#1d4ed8" : "#475569",
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  <UserCheck size={15} />
                  <span>Developer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole("ADMIN")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "9px 10px",
                    borderRadius: 6,
                    border: regRole === "ADMIN" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: regRole === "ADMIN" ? "#eff6ff" : "#ffffff",
                    color: regRole === "ADMIN" ? "#1d4ed8" : "#475569",
                    fontWeight: 600,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Administrator</span>
                </button>
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
                  placeholder="Min. 4 characters"
                  disabled={loading}
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
                    padding: 4,
                  }}
                  tabIndex={-1}
                  aria-label={showRegPassword ? "Hide password" : "Show password"}
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <label htmlFor="regConfirmPassword">Confirm Password</label>
              <div className="input-group" style={{ position: "relative" }}>
                <input
                  id="regConfirmPassword"
                  type={showRegConfirmPassword ? "text" : "password"}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={loading}
                  style={{ paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
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
                  aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              {loading ? (
                <>
                  <span className="spinner-dot"></span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= VIEW 3: FORGOT / RESET PASSWORD ================= */}
        {authMode === "FORGOT_PASSWORD" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("LOGIN");
                  clearMessages();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                  marginBottom: 10,
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Log In</span>
              </button>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                Reset & Change Password
              </h2>
              <p style={{ fontSize: 12.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Enter your Username / ID or email and create a new secure password.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="login-form-body">
              <div className="form-row">
                <label htmlFor="resetUsername">Username / ID or Email</label>
                <div className="input-group">
                  <input
                    id="resetUsername"
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="e.g. developer or admin"
                    autoFocus
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-group" style={{ position: "relative" }}>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 characters)"
                    disabled={loading}
                    style={{ paddingRight: 42 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
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
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <div className="input-group" style={{ position: "relative" }}>
                  <input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={loading}
                    style={{ paddingRight: 42 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
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
                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Change Password & Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="login-card-foot" style={{ marginTop: 24 }}>
          <span>Enterprise DevOps Control System • Microsoft Azure & JFrog Artifactory</span>
        </div>
      </div>
    </div>
  );
}

export default Login;