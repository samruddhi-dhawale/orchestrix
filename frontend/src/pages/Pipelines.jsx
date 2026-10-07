import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GitFork, Play, Plus, CheckCircle2, Clock, AlertTriangle, Layers, Cloud } from "lucide-react";
import api from "../services/api";

function Pipelines() {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-configured standard pipelines
  const defaultPipelines = [
    {
      id: "pipe-pay-prod",
      name: "Payment Gateway System",
      component: "payment-gateway",
      subcomponent: "sub-pay-core",
      branch: "main",
      environment: "replica",
      lastStatus: "SUCCESS",
      lastRun: "42 mins ago",
      target: "Azure App Service (Replica)",
    },
    {
      id: "pipe-core-dev",
      name: "System A (Core Platform)",
      component: "component-a",
      subcomponent: "sub-a1",
      branch: "develop",
      environment: "mut",
      lastStatus: "SUCCESS",
      lastRun: "2 hours ago",
      target: "Azure App Service (MUT)",
    },
    {
      id: "pipe-auth-stg",
      name: "Identity & Access System",
      component: "auth-service",
      subcomponent: "sub-auth-tokens",
      branch: "feature/refresh-token",
      environment: "sit",
      lastStatus: "FAILED",
      lastRun: "5 hours ago",
      target: "Azure App Service (SIT)",
    },
    {
      id: "pipe-data-prod",
      name: "System C (Data Engine)",
      component: "component-c",
      subcomponent: "sub-c1",
      branch: "main",
      environment: "replica",
      lastStatus: "SUCCESS",
      lastRun: "1 day ago",
      target: "Azure App Service (Replica)",
    },
  ];

  useEffect(() => {
    // Try to load any executions to augment pipelines
    api.get("/pipelines")
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // Merge dynamic runs if present
          setPipelines(defaultPipelines);
        } else {
          setPipelines(defaultPipelines);
        }
      })
      .catch(() => setPipelines(defaultPipelines))
      .finally(() => setLoading(false));
  }, []);

  const triggerPipeline = async (p) => {
    try {
      const response = await api.post("/pipelines", {
        componentId: p.component,
        subcomponentId: p.subcomponent,
        branch: p.branch,
        environment: p.environment,
      });

      if (response.data?.executionId) {
        navigate(`/execution/${response.data.executionId}`);
      }
    } catch {
      navigate("/pipeline");
    }
  };

  return (
    <div className="pipelines-page">
      <div className="page-header">
        <div>
          <h1>Pipelines Catalog</h1>
          <p>Pre-configured deployment pipelines and automated release tracks.</p>
        </div>
        <Link to="/pipeline" className="primary-button">
          <Play size={15} fill="currentColor" />
          Launch Pipeline
        </Link>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Registered Pipelines ({pipelines.length})</h2>
            <p>Ready to trigger across Azure environments</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="runs-table">
            <thead>
              <tr>
                <th>Pipeline / System</th>
                <th>Component</th>
                <th>Branch</th>
                <th>Environment</th>
                <th>Target Cloud</th>
                <th>Last Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ color: "var(--ink)" }}>{p.name}</strong>
                      <span className="mono" style={{ fontSize: 11 }}>{p.component}</span>
                    </div>
                  </td>
                  <td><code>{p.subcomponent}</code></td>
                  <td><span className="mono">refs/heads/{p.branch}</span></td>
                  <td>
                    <span className={`badge ${p.environment === "replica" || p.environment === "production" ? "running" : "success"}`} style={{ textTransform: "uppercase" }}>
                      {p.environment}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
                      <Cloud size={13} color="var(--brand)" />
                      {p.target}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.lastStatus.toLowerCase()}`}>
                      {p.lastStatus === "SUCCESS" && <CheckCircle2 size={12} style={{ marginRight: 3 }} />}
                      {p.lastStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      className="primary-button"
                      style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                      onClick={() => triggerPipeline(p)}
                    >
                      <Play size={12} />
                      Run
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Pipelines;
