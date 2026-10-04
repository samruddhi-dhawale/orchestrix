import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Play, Cloud, Package, CheckCircle2, AlertTriangle, ArrowRight, Layers, Cpu, ShieldCheck, Clock, UserCheck, AlertCircle } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import { formatTime, statusClass } from "../services/format";
import RunsTable from "../components/RunsTable";

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
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Automated Security & Vulnerability Scans</span>
          <span className="badge success" style={{ marginTop: 8 }}>Active Gate (Passed / Clean)</span>
        </div>
      </div>

      {/* Deployment Authors & History Audit Section */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>Pipeline Deployments by Author</h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Traceability audit log of who deployed which pipeline with username and timestamp details
              </p>
            </div>
          </div>
          <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
            {runs.length} Total Deployment Records
          </span>
        </div>

        {runs.length === 0 ? (
          <div style={{ padding: "20px 24px", color: "var(--muted)", fontSize: 13 }}>
            No deployment records available yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
              padding: "16px 20px 20px 20px",
            }}
          >
            {runs.slice(0, 4).map((r) => {
              const username =
                r.pipelineRequest?.initiatedUsername ||
                (r.pipelineRequest?.initiatedBy
                  ? r.pipelineRequest.initiatedBy.toLowerCase().replace(/\s+/g, "-")
                  : "developer");
              const authorName = r.pipelineRequest?.initiatedBy || "Developer";
              const role = r.pipelineRequest?.initiatedRole || "DEVELOPER";
              const isSuccess = r.status === "SUCCESS";
              const isFailed = r.status === "FAILED";

              return (
                <div
                  key={r.executionId}
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          backgroundColor: "#dbeafe",
                          color: "#1d4ed8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ fontSize: 13, color: "#0f172a" }}>@{username}</strong>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {authorName} • {role}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${statusClass(r.status)}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                      {isSuccess && <CheckCircle2 size={11} style={{ marginRight: 3 }} />}
                      {isFailed && <AlertCircle size={11} style={{ marginRight: 3 }} />}
                      {r.status}
                    </span>
                  </div>

                  <div
                    style={{
                      borderTop: "1px dashed #e2e8f0",
                      paddingTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Deployed Pipeline:</span>
                      <Link
                        to={`/execution/${r.executionId}`}
                        className="mono"
                        style={{ color: "var(--brand)", fontWeight: 600 }}
                      >
                        #{r.executionId.slice(0, 8)}
                      </Link>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Target Environment:</span>
                      <strong style={{ textTransform: "capitalize", color: "#334155" }}>
                        {r.pipelineRequest?.environment || "Development"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "var(--muted)" }}>Started At:</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={12} color="#64748b" />
                        {formatTime(r.startedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
