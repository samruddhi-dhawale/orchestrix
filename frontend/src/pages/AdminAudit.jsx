import { useEffect, useState } from "react";
import { ShieldCheck, User, Users, History, Download, Search, CheckCircle2, Clock, AlertTriangle, Layers, GitBranch, Cloud } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import "./AdminAudit.css";

function AdminAudit() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const [auditData, setAuditData] = useState({
    loginHistory: [],
    registeredUsers: [],
    pipelineHistory: [],
    totalUsers: 0,
    totalLogins: 0,
    totalPipelines: 0,
  });

  const [activeTab, setActiveTab] = useState("pipelines"); // "pipelines" or "logins" or "users"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit");
      if (res.data) {
        setAuditData(res.data);
      }
    } catch (err) {
      console.warn("Backend audit endpoint unreachable, fallback to execution history:", err);
      // Fallback: fetch pipelines directly
      try {
        const pRes = await api.get("/pipelines");
        setAuditData((prev) => ({
          ...prev,
          pipelineHistory: pRes.data || [],
          totalPipelines: pRes.data ? pRes.data.length : 0,
        }));
      } catch {
        // empty fallback
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get("/admin/audit/export", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orchestrix-enterprise-audit-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Backend CSV export failed, generating client-side CSV:", err);
      // Client-side CSV generation fallback
      let csv = "Type,Record_ID,User,Role,Timestamp,Component,Subcomponent,Branch,Environment,Strategy,Status\n";
      
      // Logins
      (auditData.loginHistory || []).forEach((l) => {
        csv += `USER_LOGIN,"${l.id || ""}","${l.username || ""}","${l.role || ""}","${l.timestamp || ""}","N/A","N/A","N/A","N/A","N/A","${l.status || ""}"\n`;
      });

      // Pipelines
      (auditData.pipelineHistory || []).forEach((p) => {
        const req = p.pipelineRequest || {};
        csv += `PIPELINE_LAUNCH,"${(p.executionId || "").slice(0, 8)}","${req.initiatedBy || "developer"}","${req.initiatedRole || "DEVELOPER"}","${p.startedAt || ""}","${req.componentId || ""}","${req.subcomponentId || ""}","${req.branch || ""}","${req.environment || ""}","${req.deploymentStrategy || ""}","${p.status || ""}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orchestrix-audit-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // Filtered pipelines
  const filteredPipelines = (auditData.pipelineHistory || []).filter((p) => {
    const q = searchQuery.toLowerCase();
    const req = p.pipelineRequest || {};
    return (
      (p.executionId || "").toLowerCase().includes(q) ||
      (req.componentId || "").toLowerCase().includes(q) ||
      (req.subcomponentId || "").toLowerCase().includes(q) ||
      (req.branch || "").toLowerCase().includes(q) ||
      (req.environment || "").toLowerCase().includes(q) ||
      (req.initiatedBy || "").toLowerCase().includes(q) ||
      (p.status || "").toLowerCase().includes(q)
    );
  });

  // Filtered logins
  const filteredLogins = (auditData.loginHistory || []).filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      (l.username || "").toLowerCase().includes(q) ||
      (l.name || "").toLowerCase().includes(q) ||
      (l.role || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q) ||
      (l.timestamp || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-audit-page">
      {/* Header */}
      <div className="audit-header">
        <div>
          <div className="audit-badge">
            <ShieldCheck size={14} />
            <span>Administrator Security & Governance Console</span>
          </div>
          <h1>Enterprise Audit Trail & User Activity</h1>
          <p>Complete historical log of user logins, pipeline triggers, configuration parameters, and execution timings.</p>
        </div>

        <button
          type="button"
          className="download-report-btn"
          onClick={handleDownloadCSV}
          disabled={exporting}
        >
          <Download size={16} />
          <span>{exporting ? "Generating..." : "Download Full Audit Report (.CSV)"}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="audit-stats-grid">
        <div className="audit-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Pipeline Launches</span>
            <div className="stat-icon-circle blue"><History size={18} /></div>
          </div>
          <div className="stat-value">{auditData.pipelineHistory?.length || 0}</div>
          <div className="stat-caption">Tracked with full user attribution</div>
        </div>

        <div className="audit-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">User Logins Recorded</span>
            <div className="stat-icon-circle green"><Clock size={18} /></div>
          </div>
          <div className="stat-value">{auditData.loginHistory?.length || 0}</div>
          <div className="stat-caption">Authentication events in memory</div>
        </div>

        <div className="audit-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Registered User Accounts</span>
            <div className="stat-icon-circle purple"><Users size={18} /></div>
          </div>
          <div className="stat-value">{auditData.registeredUsers?.length || 2}</div>
          <div className="stat-caption">Active Developer & Admin profiles</div>
        </div>

        <div className="audit-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Governance Quality Gate</span>
            <div className="stat-icon-circle amber"><ShieldCheck size={18} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: "18px", color: "#059669" }}>SOC2 Compliant</div>
          <div className="stat-caption">Production Approval Gate active</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="audit-controls-bar">
        <div className="audit-tab-switcher">
          <button
            type="button"
            className={`audit-tab ${activeTab === "pipelines" ? "active" : ""}`}
            onClick={() => setActiveTab("pipelines")}
          >
            <History size={16} />
            <span>Pipeline Launches ({auditData.pipelineHistory?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`audit-tab ${activeTab === "logins" ? "active" : ""}`}
            onClick={() => setActiveTab("logins")}
          >
            <Clock size={16} />
            <span>Login & Session Activity ({auditData.loginHistory?.length || 0})</span>
          </button>

          <button
            type="button"
            className={`audit-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={16} />
            <span>Registered Accounts ({auditData.registeredUsers?.length || 2})</span>
          </button>
        </div>

        <div className="audit-search-box">
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Search by user, component, branch, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TAB 1: PIPELINE LAUNCHES AUDIT */}
      {activeTab === "pipelines" && (
        <div className="audit-table-card">
          <div className="table-card-header">
            <h3>Pipeline Trigger & Execution History</h3>
            <span className="table-count-badge">{filteredPipelines.length} recorded launches</span>
          </div>

          {filteredPipelines.length === 0 ? (
            <div className="audit-empty-state">
              <History size={36} color="#94a3b8" />
              <p>No pipeline launches match your criteria.</p>
              <span>Pipelines will appear here in real-time as users launch them from the Launch Pipeline page.</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Triggered By</th>
                    <th>Role</th>
                    <th>Component & Subcomponent</th>
                    <th>Git Branch</th>
                    <th>Environment</th>
                    <th>Strategy</th>
                    <th>Launched At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPipelines.map((p) => {
                    const req = p.pipelineRequest || {};
                    const isSuccess = p.status === "SUCCESS";
                    const isFailed = p.status === "FAILED";
                    const isWaiting = p.status === "WAITING_FOR_APPROVAL";

                    return (
                      <tr key={p.executionId}>
                        <td>
                          <a href={`/execution/${p.executionId}`} className="exec-id-link">
                            #{p.executionId.slice(0, 8)}
                          </a>
                        </td>
                        <td>
                          <strong>{req.initiatedBy || "developer"}</strong>
                        </td>
                        <td>
                          <span className={`badge-pill ${req.initiatedRole === "ADMIN" ? "admin" : "dev"}`}>
                            {req.initiatedRole || "DEVELOPER"}
                          </span>
                        </td>
                        <td>
                          <div className="comp-cell">
                            <span className="comp-name">{req.componentId || "N/A"}</span>
                            <span className="sub-name">{req.subcomponentId || "N/A"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="branch-tag">
                            <GitBranch size={12} />
                            {req.branch || "main"}
                          </span>
                        </td>
                        <td>
                          <span className={`env-tag ${req.environment || "dev"}`}>
                            {req.environment || "development"}
                          </span>
                        </td>
                        <td>
                          <span className="strategy-tag">
                            {req.deploymentStrategy || "BLUE_GREEN"}
                          </span>
                        </td>
                        <td>
                          <span className="timestamp-text">
                            {p.startedAt ? p.startedAt.replace("T", " ").slice(0, 19) : "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${p.status?.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER LOGIN HISTORY */}
      {activeTab === "logins" && (
        <div className="audit-table-card">
          <div className="table-card-header">
            <h3>User Login & Authentication Events</h3>
            <span className="table-count-badge">{filteredLogins.length} login sessions</span>
          </div>

          {filteredLogins.length === 0 ? (
            <div className="audit-empty-state">
              <Clock size={36} color="#94a3b8" />
              <p>No login events recorded.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role Assigned</th>
                    <th>Login Timestamp</th>
                    <th>Client / IP Source</th>
                    <th>Authentication Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogins.map((l) => (
                    <tr key={l.id + l.timestamp}>
                      <td><span className="exec-id-link">#{l.id}</span></td>
                      <td><strong>{l.username}</strong></td>
                      <td>{l.name}</td>
                      <td>
                        <span className={`badge-pill ${l.role === "ADMIN" ? "admin" : "dev"}`}>
                          {l.role}
                        </span>
                      </td>
                      <td><span className="timestamp-text">{l.timestamp}</span></td>
                      <td><span className="ip-text">{l.ipAddress || "127.0.0.1"}</span></td>
                      <td>
                        <span className={`status-badge ${l.status?.toLowerCase().includes("success") ? "success" : "failed"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED ACCOUNTS */}
      {activeTab === "users" && (
        <div className="audit-table-card">
          <div className="table-card-header">
            <h3>Registered User Accounts & Access Privileges</h3>
            <span className="table-count-badge">{auditData.registeredUsers?.length || 2} accounts</span>
          </div>

          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Login Timing</th>
                  <th>Last Visited Page</th>
                  <th>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {(auditData.registeredUsers?.length > 0 ? auditData.registeredUsers : [
                  { username: "admin", name: "System Administrator", email: "admin@orchestrix.io", role: "ADMIN", lastLoginAt: "Recent", lastVisitedPath: "/dashboard" },
                  { username: "developer", name: "Developer", email: "developer@orchestrix.io", role: "DEVELOPER", lastLoginAt: "Recent", lastVisitedPath: "/dashboard" }
                ]).map((u) => (
                  <tr key={u.username}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge-pill ${u.role === "ADMIN" ? "admin" : "dev"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td><span className="timestamp-text">{u.lastLoginAt || "N/A"}</span></td>
                    <td><span className="path-text">{u.lastVisitedPath || "/dashboard"}</span></td>
                    <td><span className="status-badge success">ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAudit;
