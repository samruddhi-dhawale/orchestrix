import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "user",
    name: "User",
    email: "user@ril.com",
    organization: "JIIMS",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("orchestrix_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          if (parsed.name.includes("Lead")) {
            parsed.name = "User";
          }
          setUser(parsed);
        }
      }
    } catch {
      // fallback
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p>User profile and account credentials.</p>
        </div>
        <button className="secondary-button" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: 640 }}>
        {/* User Profile Card */}
        <div className="panel" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--brand-soft)",
                color: "var(--brand)",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>{user.name}</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, letterSpacing: "0.04em" }}>
                USERNAME
              </span>
              <strong style={{ fontSize: 14 }}>{user.username}</strong>
            </div>

            <div>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, letterSpacing: "0.04em" }}>
                EMAIL
              </span>
              <strong style={{ fontSize: 14 }}>{user.email || `${user.username}@ril.com`}</strong>
            </div>

            <div>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, letterSpacing: "0.04em" }}>
                ORGANIZATION
              </span>
              <strong style={{ fontSize: 14 }}>JIIMS</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
