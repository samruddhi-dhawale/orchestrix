import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Play, Cloud, Package, CheckCircle2, AlertTriangle, ArrowRight, Layers, Cpu, ShieldCheck, Clock } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import RunsTable from "../components/RunsTable";

function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser() || { name: "Developer", role: "DEVELOPER" };
  const isAdmin = user.role === "ADMIN";

  const [runs, setRuns] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/pipelines")
      .then((res) => {
        setRuns(res.data || []);
        setError("");
      })
      .catch(() => {
        setError("Unable to connect to backend on port 8080. Check if Spring Boot is running.");
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

      {/* Admin Action Alert for Pending Production Approvals */}
      {isAdmin && pendingApprovals.length > 0 && (
        <div className="approval-gate-banner dynamic-fade-in" style={{ marginBottom: 20 }}>
          <div className="approval-content">
            <div className="approval-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3>{pendingApprovals.length} Production Release Awaiting Your Approval</h3>
              <p>
                Developers have submitted releases for Production. As Administrator, you can review the DevSecOps scan and authorize Azure deployment.
              </p>
            </div>
          </div>
          <div className="approval-actions">
            <Link
              to={`/execution/${pendingApprovals[0].executionId}`}
              className="approval-approve-btn"
              style={{ textDecoration: "none" }}
            >
              Review Run #{pendingApprovals[0].executionId.slice(0, 8)} →
            </Link>
          </div>
        </div>
      )}

      {/* Role Banner */}
      <div className="user-role-greeting-banner">
        <div className="greeting-text">
          <strong>Welcome back, {user.name}</strong>
          <span>
            Logged in as <code>{user.role}</code>.{" "}
            {isAdmin
              ? "You have full administrator privileges: Production authorization, cloud provisioning, and security gates."
              : "You have developer privileges: Launch development/staging pipelines and view DevSecOps telemetry."}
          </span>
        </div>
        <button
          className="text-button"
          onClick={() => navigate("/pipeline")}
          style={{ fontSize: 13, fontWeight: 600 }}
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
          <span>In-Flight / Running</span>
          <strong>{runningCount}</strong>
        </div>

        <div className="stat-card bad">
          <span>Failed Executions</span>
          <strong>{failedCount}</strong>
        </div>
      </section>

      {/* Cloud & Platform Status Grid */}
      <div className="platform-integrations-bar" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Cloud size={18} color="#0078d4" />
            <strong style={{ fontSize: 14 }}>Microsoft Azure Cloud</strong>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Blue/Green & Canary Slot Routing</span>
          <span className="badge success" style={{ marginTop: 8 }}>Connected (East US)</span>
        </div>

        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Package size={18} color="#40be46" />
            <strong style={{ fontSize: 14 }}>JFrog Artifactory</strong>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>libs-release-local (SHA-256 Verified)</span>
          <span className="badge success" style={{ marginTop: 8 }}>Verified</span>
        </div>

        <div className="stat-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <ShieldCheck size={18} color="#0f7b4b" />
            <strong style={{ fontSize: 14 }}>DevSecOps Quality Gate</strong>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>SAST & CVE Vulnerability Checks</span>
          <span className="badge success" style={{ marginTop: 8 }}>Active Gate (0 CVEs)</span>
        </div>
      </div>

      {/* Recent Executions Section */}
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent Pipeline Executions</h2>
            <p>Live status across environments (newest first)</p>
          </div>
          <button className="text-button" onClick={() => navigate("/executions")}>
            View all executions →
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: "0 auto 16px" }}></div>
            <p>Fetching active telemetry...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="empty-state">
            <h3>No pipeline executions yet</h3>
            <p>Configure and launch your first pipeline to see live stages.</p>
            <button className="primary-button" onClick={() => navigate("/pipeline")}>
              <Play size={14} fill="currentColor" />
              Launch Pipeline
            </button>
          </div>
        ) : (
          <RunsTable runs={runs.slice(0, 6)} />
        )}
      </section>
    </div>
  );
}

export default Dashboard;
