import { Cloud, ShieldCheck, User, LogOut } from "lucide-react";
import { getCurrentUser, logout } from "../services/auth";
import "./Header.css";

function Header() {
  const user = getCurrentUser() || { name: "Developer", role: "DEVELOPER" };
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-page-title">
          Orchestrix Platform
        </div>
        <span className="header-subtitle-tag">Production CI/CD</span>
      </div>

      <div className="header-right">
        <div className="environment-badge">
          <Cloud size={14} style={{ marginRight: 6 }} color="#0078d4" />
          <span>Azure Cloud (East US)</span>
        </div>

        <div className="header-divider"></div>

        <div className="user-menu-block">
          <div className="user-avatar-circle">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="user-info-text">
            <span className="user-name">{user.name}</span>
            <span className={`role-pill ${isAdmin ? "admin" : "dev"}`}>
              {isAdmin ? "👑 Admin" : "💻 Developer"}
            </span>
          </div>

          <button
            type="button"
            className="header-logout-button"
            onClick={logout}
            title="Log out of session"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;