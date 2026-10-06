import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Cloud, Package } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";

function Dashboard() {
  const navigate = useNavigate();
  const rawUser = getCurrentUser() || { name: "Developer", role: "DEVELOPER" };
  const user = {
    ...rawUser,
    name: rawUser.name && rawUser.name.includes("Lead") ? "Developer" : (rawUser.name || "Developer"),
  };
  const isAdmin = user.role === "ADMIN";

  const [runs, setRuns] = useState(() => {
    try {
      const cached = localStorage.getItem("orchestrix_cached_runs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/pipelines")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRuns(res.data);
          try {
            localStorage.setItem("orchestrix_cached_runs", JSON.stringify(res.data));
          } catch {
            // ignore
          }
        }
        setError("");
      })
      .catch(() => {
        const cached = localStorage.getItem("orchestrix_cached_runs");
        if (!cached) {
          setError("Unable to connect to backend on port 8080. Check if Spring Boot is running.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const count = (status) => runs.filter((r) => r.status === status).length;
  const successCount = count("SUCCESS");
  const runningCount = count("RUNNING");
  const failedCount = count("FAILED");
  const pendingApprovals = runs.filter((r) => r.status === "WAITING_FOR_APPROVAL");

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>DevOps Orchestration Dashboard</h1>
          <p>Real-time telemetry, DevSecOps gates, and multi-cloud deployment pipelines.</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/pipeline")}>
          <Play size={15} fill="currentColor" />
          Launch Pipeline
        </button>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Role Banner */}
      <div className="user-role-greeting-banner">
        <div className="greeting-text">
          <div className="greeting-title-row">
            <strong>Welcome back, {user.name}</strong>
            <span className="role-tag-pill">{user.role}</span>
          </div>
          <span className="greeting-subtitle">
            {isAdmin
              ? "Administrator access enabled • Production release authorization active"
              : "Developer workspace • Ready to launch and monitor deployment pipelines"}
          </span>
        </div>
        <button
          className="greeting-action-link"
          onClick={() => navigate("/pipeline")}
        >
          Launch New Run →
        </button>
      </div>

      {/* Stats KPI Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Executions</span>
          <strong>{runs.length}</strong>
        </div>

        <div className="stat-card ok">
          <span>Successful Releases</span>
          <strong>{successCount}</strong>
        </div>

        <div className="stat-card">
          <span>Running</span>
          <strong>{runningCount}</strong>
        </div>

        <div className="stat-card bad">
          <span>Failed Executions</span>
          <strong>{failedCount}</strong>
        </div>
      </section>

      {/* Cloud & Platform Status Grid */}
      <div className="platform-integrations-bar" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Cloud size={18} color="#0078d4" />
            <strong style={{ fontSize: 14 }}>Microsoft Azure Cloud</strong>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Blue/Green & Canary Slot Routing</span>
          <span className="badge success" style={{ marginTop: 8 }}>Connected</span>
        </div>

        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Package size={18} color="#40be46" />
            <strong style={{ fontSize: 14 }}>JFrog Artifactory</strong>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>libs-release-local (SHA-256 Verified)</span>
          <span className="badge success" style={{ marginTop: 8 }}>Verified</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
