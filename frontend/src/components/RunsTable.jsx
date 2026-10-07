import { Link } from "react-router-dom";
import { formatTime, duration, statusClass } from "../services/format";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

function RunsTable({ runs }) {
  return (
    <div className="table-scroll">
      <table className="runs-table">
        <thead>
          <tr>
            <th>Execution ID</th>
            <th>System / Component</th>
            <th>Git Branch</th>
            <th>Environment</th>
            <th>Deployed By</th>
            <th>Status</th>
            <th>Started At</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const isSuccess = r.status === "SUCCESS";
            const isFailed = r.status === "FAILED";
            const isRunning = r.status === "RUNNING";

            return (
              <tr key={r.executionId}>
                <td>
                  <Link to={`/execution/${r.executionId}`} className="mono" style={{ fontWeight: 600, color: "var(--brand)" }}>
                    #{r.executionId.slice(0, 8)}
                  </Link>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{r.pipelineRequest?.componentId}</strong>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {r.pipelineRequest?.subcomponentId}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="mono" style={{ background: "#edf2f7", padding: "2px 6px", borderRadius: 4 }}>
                    {r.pipelineRequest?.branch}
                  </span>
                </td>
                <td>
                  <span style={{ textTransform: "uppercase" }}>
                    {r.pipelineRequest?.environment}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {(r.pipelineRequest?.initiatedUsername || r.pipelineRequest?.initiatedBy || "D").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                      <strong style={{ fontSize: 13, color: "var(--text)" }}>
                        @{r.pipelineRequest?.initiatedUsername || (r.pipelineRequest?.initiatedBy ? r.pipelineRequest.initiatedBy.toLowerCase().replace(/\s+/g, "-") : "developer")}
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>
                        {r.pipelineRequest?.initiatedBy && r.pipelineRequest.initiatedBy !== r.pipelineRequest.initiatedUsername
                          ? r.pipelineRequest.initiatedBy
                          : (r.pipelineRequest?.initiatedRole || "DEVELOPER")}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${statusClass(r.status)}`}>
                    {isSuccess && <CheckCircle2 size={12} style={{ marginRight: 3 }} />}
                    {isFailed && <AlertCircle size={12} style={{ marginRight: 3 }} />}
                    {isRunning && <span className="status-spinner-micro"></span>}
                    {r.status}
                  </span>
                </td>
                <td>{formatTime(r.startedAt)}</td>
                <td>
                  <span className="mono">
                    {duration(r.startedAt, r.completedAt, r.totalDurationMs)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RunsTable;
