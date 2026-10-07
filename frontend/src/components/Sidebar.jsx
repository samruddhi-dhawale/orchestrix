import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Play, GitFork, History, User, LogOut, ShieldCheck, UserCheck, X } from "lucide-react";
import { getCurrentUser, logout } from "../services/auth";
import "./Sidebar.css";

function Sidebar({ isOpen = false, onClose }) {
  const navigate = useNavigate();
  const rawUser = getCurrentUser() || { name: "User", role: "DEVELOPER" };
  const user = {
    ...rawUser,
    name: rawUser.name && rawUser.name.includes("Lead") ? "User" : (rawUser.name || "User"),
  };
  const isAdmin = user.role === "ADMIN";

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`app-sidebar ${isOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-identity-group">
          <div className="brand-mark">
            C
          </div>

          <div className="brand-content">
            <span className="brand-name">CI/CD PLATFORM</span>
            <span className="brand-subtitle">DevOps Orchestration</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-navigation">
        <div className="navigation-section">
          <span className="navigation-label">PIPELINE ENGINE</span>

          <NavLink
            to="/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) => `navigation-item ${isActive ? "active" : ""}`}
          >
            <span className="navigation-icon"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/pipeline"
            onClick={handleNavClick}
            className={({ isActive }) => `navigation-item ${isActive ? "active" : ""}`}
          >
            <span className="navigation-icon"><Play size={18} /></span>
            <span>Launch Pipeline</span>
          </NavLink>

          <NavLink
            to="/executions"
            onClick={handleNavClick}
            className={({ isActive }) => `navigation-item ${isActive ? "active" : ""}`}
          >
            <span className="navigation-icon"><History size={18} /></span>
            <span>Executions</span>
          </NavLink>
        </div>

        <div className="navigation-section">
          <span className="navigation-label">PREFERENCES</span>

          <NavLink
            to="/settings"
            onClick={handleNavClick}
            className={({ isActive }) => `navigation-item ${isActive ? "active" : ""}`}
          >
            <span className="navigation-icon"><User size={18} /></span>
            <span>User Profile</span>
          </NavLink>
        </div>

        {isAdmin && (
          <div className="navigation-section">
            <span className="navigation-label">ADMINISTRATION</span>

            <NavLink
              to="/admin/audit"
              onClick={handleNavClick}
              className={({ isActive }) => `navigation-item ${isActive ? "active" : ""}`}
            >
              <span className="navigation-icon"><ShieldCheck size={18} /></span>
              <span>User & Launch Audit</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user-card">
          <div className="user-card-top">
            <div className="user-avatar-small">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-text-meta">
              <span className="user-full-name">{user.name}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Sign out of CI/CD Platform"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="platform-status-mini">
          <span className="platform-status-dot"></span>
          <span>Pipeline Engine Active</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;