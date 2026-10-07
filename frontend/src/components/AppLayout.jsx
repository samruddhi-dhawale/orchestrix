import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="app-main">
        <Header onToggleMenu={() => setMobileMenuOpen((prev) => !prev)} />

        <main className="app-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© 2026 CI/CD Platform</span>

          <span className="footer-status">
            <span className="footer-status-dot"></span>
            Platform operational
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
