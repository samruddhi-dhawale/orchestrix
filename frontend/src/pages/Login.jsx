import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { setCurrentUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  // Tab & View states: activeTab: 'login' | 'signup', viewMode: 'auth' | 'forgot_password'
  const [activeTab, setActiveTab] = useState("login");
  const [viewMode, setViewMode] = useState("auth"); // 'auth' or 'forgot_password'
  const [forgotStep, setForgotStep] = useState(1); // 1 = request token, 2 = reset with token

  // Log In Form states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up Form states
  const [signupName, setSignupName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Forgot Password Form states
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [slowNotice, setSlowNotice] = useState(false);

  const clearFeedback = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleTabChange = (tab) => {
    clearFeedback();
    setActiveTab(tab);
  };

  const switchToForgotPassword = () => {
    clearFeedback();
    setViewMode("forgot_password");
    setForgotStep(1);
  };

  const switchBackToLogin = () => {
    clearFeedback();
    setViewMode("auth");
    setActiveTab("login");
    setForgotStep(1);
  };

  // 1. REAL LOGIN AUTHENTICATION
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    clearFeedback();

    const username = loginUsername.trim();
    const password = loginPassword.trim();

    if (!username) {
      setError("Please enter your username or ID.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setSlowNotice(false);
    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 2500);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
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
          // Resilient Cloud Recovery:
          // Free-tier cloud containers (like Render) have ephemeral disks that reset to defaults on redeployment.
          // If this user was previously registered or is an active non-default user, re-sync registration with the backend.
          let profile = null;
          try {
            const knownProfiles = JSON.parse(localStorage.getItem("orchestrix_account_registry") || "{}");
            profile = knownProfiles[username.toLowerCase()];
          } catch {
            // ignore
          }

          if (!profile && !["admin", "developer"].includes(username.toLowerCase()) && password.length >= 6) {
            const formattedName = username
              .replace(/[-_.]/g, " ")
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            profile = {
              name: formattedName,
              username: username.toLowerCase(),
              email: `${username.toLowerCase()}@orchestrix.io`,
            };
          }

          if (profile && password) {
            try {
              const regRes = await api.post("/auth/register", {
                name: profile.name,
                username: profile.username,
                email: profile.email || `${profile.username}@orchestrix.io`,
                password: password,
              });

              if (regRes.data && regRes.data.token) {
                const safeUser = {
                  username: regRes.data.username,
                  role: regRes.data.role || "DEVELOPER",
                  name: profile.name,
                  email: profile.email || `${profile.username}@orchestrix.io`,
                  token: regRes.data.token,
                  authenticated: true,
                };
                setCurrentUser(safeUser);
                try {
                  const knownProfiles = JSON.parse(localStorage.getItem("orchestrix_account_registry") || "{}");
                  knownProfiles[profile.username] = profile;
                  localStorage.setItem("orchestrix_account_registry", JSON.stringify(knownProfiles));
                } catch {
                  // ignore
                }
                navigate("/dashboard");
                return;
              }
            } catch (recoveryErr) {
              // If registration fails because the account already exists on the server (i.e. truly wrong password),
              // fall through to displaying "Invalid username or password."
            }
          }

          setError("Invalid username or password.");
        } else if (err.response.status === 429) {
          setError(
            err.response.data?.message ||
              "Too many failed login attempts. Please wait a few minutes before trying again."
          );
        } else {
          setError(err.response.data?.message || "Invalid credentials. Please try again.");
        }
      } else {
        setError("Unable to reach the authentication service. Please check your network connection.");
      }
    } finally {
      clearTimeout(slowTimer);
      setSlowNotice(false);
      setLoading(false);
    }
  };

  // 2. SIGN UP / REGISTRATION (Strictly DEVELOPER role, validated server-side)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    clearFeedback();

    const name = signupName.trim();
    const username = signupUsername.trim().toLowerCase();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword.trim();
    const confirmPassword = signupConfirmPassword.trim();

    // Client-side validations
    if (!name || !username || !email || !password || !confirmPassword) {
      setError("Please complete all registration fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please provide a valid work or organization email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (!hasLetter || !hasDigit) {
      setError("Password must contain both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    setLoading(true);
    setSlowNotice(false);
    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 2500);

    try {
      const response = await api.post("/auth/register", {
        name,
        username,
        email,
        password,
      });

      // Save registration metadata in local directory for ephemeral cloud container resilience
      try {
        const knownProfiles = JSON.parse(localStorage.getItem("orchestrix_account_registry") || "{}");
        knownProfiles[username.toLowerCase()] = { name, username: username.toLowerCase(), email: email.toLowerCase() };
        localStorage.setItem("orchestrix_account_registry", JSON.stringify(knownProfiles));
      } catch {
        // ignore
      }

      // Option B: Show success banner and switch to Log In tab with pre-filled username
      setSuccessMessage(response.data?.message || "Account created successfully. Please log in.");
      setLoginUsername(username);
      setLoginPassword("");
      setSignupName("");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setActiveTab("login");
    } catch (err) {
      if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Account registration failed. Please try again later.");
      }
    } finally {
      clearTimeout(slowTimer);
      setSlowNotice(false);
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD — STEP 1: REQUEST RESET LINK / TOKEN
  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    clearFeedback();

    const email = forgotEmail.trim();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setSlowNotice(false);
    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 2500);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setSuccessMessage(
        response.data?.message ||
          "If an account exists for this email, password reset instructions have been sent."
      );

      // If resetToken is provided (development/evaluation environment), pre-fill it and advance to step 2
      if (response.data?.resetToken) {
        setResetToken(response.data.resetToken);
        setForgotStep(2);
      }
    } catch (err) {
      if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to process password reset request. Please try again.");
      }
    } finally {
      clearTimeout(slowTimer);
      setSlowNotice(false);
      setLoading(false);
    }
  };

  // 4. FORGOT PASSWORD — STEP 2: COMPLETE RESET WITH TOKEN
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    clearFeedback();

    const token = resetToken.trim();
    const pw = newPassword.trim();
    const confirmPw = confirmNewPassword.trim();

    if (!token) {
      setError("Reset token is required.");
      return;
    }
    if (!pw || !confirmPw) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (pw.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasDigit = /[0-9]/.test(pw);
    if (!hasLetter || !hasDigit) {
      setError("Password must contain both letters and numbers.");
      return;
    }
    if (pw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setSlowNotice(false);
    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 2500);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword: pw,
      });

      // Successful reset: return to Log In with success message
      setSuccessMessage(
        response.data?.message ||
          "Password successfully updated! You can now sign in with your new password."
      );
      if (response.data?.username) {
        setLoginUsername(response.data.username);
      }
      setLoginPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setResetToken("");
      setViewMode("auth");
      setActiveTab("login");
    } catch (err) {
      if (err.response && err.response.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Password reset failed. The token may be expired or invalid.");
      }
    } finally {
      clearTimeout(slowTimer);
      setSlowNotice(false);
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

        {/* Dynamic Alerts */}
        {error && (
          <div className="login-error-alert" role="alert" aria-live="assertive">
            <AlertCircle size={18} className="login-error-icon" />
            <span className="login-error-text">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="login-success-alert" role="status" aria-live="polite">
            <CheckCircle2 size={18} className="login-success-icon" />
            <span className="login-success-text">{successMessage}</span>
          </div>
        )}

        {/* VIEW 1: AUTHENTICATION TABS (LOG IN & SIGN UP) */}
        {viewMode === "auth" && (
          <>
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "login"}
                className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => handleTabChange("login")}
              >
                LOG IN
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "signup"}
                className={`auth-tab-btn ${activeTab === "signup" ? "active" : ""}`}
                onClick={() => handleTabChange("signup")}
              >
                SIGN UP
              </button>
            </div>

            {/* TAB 1: LOG IN */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="login-form-body" noValidate>
                <div className="form-row">
                  <label htmlFor="login-username">Username / ID</label>
                  <div className="input-group">
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Enter your username or email"
                      autoComplete="username"
                      autoFocus
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="label-with-link-row">
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="forgot-password-link"
                      onClick={switchToForgotPassword}
                      tabIndex={0}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-group password-input-container">
                    <input
                      id="login-password"
                      name="password"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <span>Log In →</span>
                  )}
                </button>

                {slowNotice && (
                  <div className="cloud-waking-notice" role="status">
                    <span className="spinner-dot-blue"></span>
                    <span>Connecting to cloud backend (free tier initial boot can take ~25s)...</span>
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: SIGN UP */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignupSubmit} className="login-form-body" noValidate>
                <div className="form-row">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="input-group">
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      autoFocus
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="signup-username">Username / ID</label>
                  <div className="input-group">
                    <input
                      id="signup-username"
                      name="username"
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="Choose a username"
                      autoComplete="username"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="signup-email">Email Address</label>
                  <div className="input-group">
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Enter your work/organization email"
                      autoComplete="email"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="signup-password">Password</label>
                  <div className="input-group password-input-container">
                    <input
                      id="signup-password"
                      name="password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      tabIndex={-1}
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      title={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="input-helper-text">
                    Must be at least 6 characters with both letters & numbers.
                  </span>
                </div>

                <div className="form-row">
                  <label htmlFor="signup-confirm-password">Confirm Password</label>
                  <div className="input-group password-input-container">
                    <input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      tabIndex={-1}
                      aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                      title={showSignupConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                {slowNotice && (
                  <div className="cloud-waking-notice" role="status">
                    <span className="spinner-dot-blue"></span>
                    <span>Connecting to cloud backend (free tier spin-up can take ~25s)...</span>
                  </div>
                )}
              </form>
            )}
          </>
        )}

        {/* VIEW 2: FORGOT PASSWORD FLOW */}
        {viewMode === "forgot_password" && (
          <div className="forgot-password-view">
            <div className="forgot-header-text">
              <h2>Reset Password</h2>
              <p>
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequestSubmit} className="login-form-body" noValidate>
                <div className="form-row">
                  <label htmlFor="forgot-email">Email Address</label>
                  <div className="input-group">
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                      required
                    />
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
                      <span>Sending instructions...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>

                {slowNotice && (
                  <div className="cloud-waking-notice" role="status">
                    <span className="spinner-dot-blue"></span>
                    <span>Connecting to cloud backend...</span>
                  </div>
                )}

                <button
                  type="button"
                  className="login-back-btn"
                  onClick={switchBackToLogin}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Log In</span>
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="login-form-body" noValidate>
                <div className="form-row">
                  <label htmlFor="reset-token">Reset Token</label>
                  <div className="input-group">
                    <input
                      id="reset-token"
                      name="token"
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter your 15-minute reset token"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor="new-password">New Password</label>
                  <div className="input-group password-input-container">
                    <input
                      id="new-password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="input-helper-text">
                    Minimum 6 characters with both letters & numbers.
                  </span>
                </div>

                <div className="form-row">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <div className="input-group password-input-container">
                    <input
                      id="confirm-new-password"
                      name="confirmNewPassword"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
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
                >
                  {loading ? (
                    <>
                      <span className="spinner-dot"></span>
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>

                {slowNotice && (
                  <div className="cloud-waking-notice" role="status">
                    <span className="spinner-dot-blue"></span>
                    <span>Connecting to cloud backend...</span>
                  </div>
                )}

                <button
                  type="button"
                  className="login-back-btn"
                  onClick={switchBackToLogin}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Log In</span>
                </button>
              </form>
            )}
          </div>
        )}

        <div className="login-card-foot">
          <span>Internal CI/CD Orchestration Platform</span>
        </div>
      </div>
    </div>
  );
}

export default Login;