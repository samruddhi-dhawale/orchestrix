import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Search, Filter, RefreshCw, CheckCircle2, Clock, AlertCircle, Play } from "lucide-react";
import api from "../services/api";
import RunsTable from "../components/RunsTable";

function Executions() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState(() => {
    try {
      const cached = localStorage.getItem("orchestrix_cached_runs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadExecutions = () => {
    setLoading(true);
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
          setError("Unable to connect to Orchestrix backend. Is Spring Boot running on port 8080?");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExecutions();
  }, []);

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      r.executionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pipelineRequest?.componentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pipelineRequest?.subcomponentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pipelineRequest?.branch?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEnv =
      envFilter === "all" ||
      r.pipelineRequest?.environment?.toLowerCase() === envFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      r.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesEnv && matchesStatus;
  });

  return (
    <div className="executions-history-page">
      <div className="page-header">
        <div>
          <h1>Pipeline Executions History</h1>
          <p>Complete historical log of all CI/CD pipeline runs and deployment outcomes.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="secondary-button" onClick={loadExecutions} title="Refresh runs">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="primary-button" onClick={() => navigate("/pipeline")}>
            <Play size={15} fill="currentColor" />
            Launch Pipeline
          </button>
        </div>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Search & Filter Bar */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search by Execution ID, Component, or Branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="high-contrast-input execution-search-input"
            />
            <Search size={16} className="execution-search-icon" />
          </div>

          <div>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="high-contrast-input"
            >
              <option value="all">All Environments</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="high-contrast-input"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Execution Records ({filteredRuns.length})</h2>
            <p>Sorted by start time (newest first)</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: "0 auto 16px" }}></div>
            <p>Loading executions from memory...</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="empty-state">
            <h3>No executions match the criteria</h3>
            <p>Try clearing your search filters or start a new pipeline run.</p>
            <button className="primary-button" onClick={() => navigate("/pipeline")}>
              Launch Pipeline
            </button>
          </div>
        ) : (
          <RunsTable runs={filteredRuns} />
        )}
      </section>
    </div>
  );
}

export default Executions;
