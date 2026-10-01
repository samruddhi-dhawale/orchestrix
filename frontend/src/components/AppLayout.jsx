import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Header />

        <main className="app-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© 2026 Orchestrix</span>

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
