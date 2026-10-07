import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import api from "../services/api";
import RunsTable from "../components/RunsTable";

function Dashboard() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState(() => {
    try {
      const cached = localStorage.getItem("orchestrix_cached_runs");
      if (cached && !cached.includes("exec-prod-7891")) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("orchestrix_cached_runs");
      if (cached && cached.includes("exec-prod-7891")) {
        localStorage.removeItem("orchestrix_cached_runs");
      }
    } catch {
      // ignore
    }

    api.get("/pipelines")
      .then((res) => {
        if (Array.isArray(res.data)) {
          if (res.data.length > 0) {
            setRuns(res.data);
            try {
              localStorage.setItem("orchestrix_cached_runs", JSON.stringify(res.data));
            } catch {
              // ignore
            }
          } else {
            // Keep cached runs if available, else empty
            try {
              const cached = localStorage.getItem("orchestrix_cached_runs");
              if (cached && !cached.includes("exec-prod-7891")) {
                const parsed = JSON.parse(cached);
                if (parsed.length > 0) {
                  setRuns(parsed);
                } else {
                  setRuns([]);
                }
              } else {
                setRuns([]);
              }
            } catch {
              setRuns([]);
            }
          }
        }
        setError("");
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem("orchestrix_cached_runs");
          if (cached && !cached.includes("exec-prod-7891")) {
            setRuns(JSON.parse(cached));
          }
        } catch {
          // ignore
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
          <p>Automated CI/CD orchestration platform for managing, triggering, and monitoring end-to-end release pipelines.</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/pipeline")}>
          <Play size={15} fill="currentColor" />
          Launch Pipeline
        </button>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Company-Wide Platform Greeting Banner */}
      <div className="user-role-greeting-banner">
        <div className="greeting-text">
          <div className="greeting-title-row">
            <strong>Welcome to Pipeline Platform</strong>
          </div>
          <span className="greeting-subtitle">
            Enterprise release management & deployment pipeline orchestration
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

        <div className="stat-card bad">
          <span>Failed Executions</span>
          <strong>{failedCount}</strong>
        </div>
      </section>

      {/* Platform Pipeline History Table */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Pipeline Execution History</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Overall history of pipelines executed across all users and environments.
            </p>
          </div>
          <button
            onClick={() => navigate("/pipeline")}
            className="secondary-button"
            style={{ fontSize: 13 }}
          >
            Launch Pipeline →
          </button>
        </div>

        {runs.length === 0 ? (
          <div className="empty-state">
            <h3>No pipeline executions yet</h3>
            <p>Launch your first pipeline to see live orchestration logs and metrics.</p>
          </div>
        ) : (
          <RunsTable runs={runs} />
        )}
      </section>
    </div>
  );
}

export default Dashboard;
