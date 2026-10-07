import { Cloud, ShieldCheck, User, LogOut, Menu } from "lucide-react";
import { getCurrentUser, logout } from "../services/auth";
import "./Header.css";

function Header({ onToggleMenu }) {
  const rawUser = getCurrentUser() || { name: "User", role: "DEVELOPER" };
  const user = {
    ...rawUser,
    name: rawUser.name && rawUser.name.includes("Lead") ? "User" : (rawUser.name || "User"),
  };
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMenu}
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-page-title">
          CI/CD Platform
        </div>
        <span className="header-subtitle-tag">DevOps Engine</span>
      </div>

      <div className="header-right">
        <div className="user-menu-block">
          <div className="user-avatar-circle">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="user-info-text">
            <span className="user-name">{user.name}</span>
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