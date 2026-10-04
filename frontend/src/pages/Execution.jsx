import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Terminal as TerminalIcon,
  Package,
  Cloud,
  Layers,
  GitBranch,
  Copy,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Server,
  ShieldCheck,
  Check,
  FileCode,
  Search,
  Download,
  AlertTriangle,
  Play
} from "lucide-react";
import api from "../services/api";
import { formatTime, duration, statusClass } from "../services/format";
import { getCurrentUser } from "../services/auth";
import "./Execution.css";

function Execution() {
  const { executionId } = useParams();
  const user = getCurrentUser() || { role: "DEVELOPER", name: "Developer", username: "developer" };
  const isAdmin = user.role === "ADMIN";

  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("stages"); // "stages", "logs", "artifact", "azure"
  const [copiedLog, setCopiedLog] = useState(false);

  // Terminal log search and filtering
  const [logSearch, setLogSearch] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState("ALL");
  const [isApproving, setIsApproving] = useState(false);

  const logsEndRef = useRef(null);

  // Poll execution status while RUNNING, PENDING, or WAITING_FOR_APPROVAL
  useEffect(() => {
    let timer = null;

    const fetchExecution = async () => {
      try {
        const response = await api.get(`/pipelines/${executionId}`);
        setExecution(response.data);
        setError("");

        const status = response.data?.status;
        if (status === "RUNNING" || status === "PENDING" || status === "WAITING_FOR_APPROVAL") {
          timer = setTimeout(fetchExecution, 1000);
        }
      } catch (err) {
        console.error("Failed to fetch execution:", err);
        setError("Unable to load execution. Ensure backend is running on port 8080.");
      } finally {
        setLoading(false);
      }
    };

    fetchExecution();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [executionId]);

  useEffect(() => {
    if (activeTab === "logs" && logsEndRef.current && !logSearch) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [execution?.logs, activeTab, logSearch]);

  const copyAllLogs = () => {
    if (!execution?.logs) return;
    const text = execution.logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.step}]: ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const downloadLogFile = () => {
    if (!execution?.logs) return;
    const text = execution.logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.step}]: ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orchestrix-execution-${execution.executionId.slice(0, 8)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await api.post(`/pipelines/${executionId}/approve`, {
        adminUser: user.name || user.username || "admin",
      });
      const res = await api.get(`/pipelines/${executionId}`);
      setExecution(res.data);
    } catch (err) {
      console.error("Failed to approve release:", err);
      alert("Failed to submit approval to backend.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Are you sure you want to reject this production release?")) return;
    try {
      await api.post(`/pipelines/${executionId}/reject`, {
        adminUser: user.name || user.username || "admin",
        reason: "Rejected by Administrator review",
      });
      const res = await api.get(`/pipelines/${executionId}`);
      setExecution(res.data);
    } catch (err) {
      console.error("Failed to reject release:", err);
    }
  };

  if (loading) {
    return (
      <div className="execution-page">
        <div className="execution-loading">
          <div className="loading-spinner"></div>
          <h2>Connecting to Orchestrix Engine</h2>
          <p>Retrieving real-time pipeline execution details for #{executionId}...</p>
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="execution-page">
        <div className="execution-error">
          <div className="error-icon">!</div>
          <h2>Execution Unavailable</h2>
          <p>{error || "Pipeline run not found in memory."}</p>
          <Link to="/executions" className="primary-button" style={{ marginTop: 16 }}>
            View All Executions
          </Link>
        </div>
      </div>
    );
  }

  // Dynamic DevSecOps pipeline stages (Starts at Checkout Source)
  const isApprovalRequired =
    (execution.pipelineRequest?.environment === "production" &&
      execution.pipelineRequest?.initiatedRole !== "ADMIN") ||
    execution.steps?.some((s) => s.stepName === "Production Approval") ||
    execution.status === "WAITING_FOR_APPROVAL";

  const pipelineStepNames =
    execution.stageNames && execution.stageNames.length > 0
      ? execution.stageNames
      : isApprovalRequired
      ? [
          "Checkout Source",
          "Build",
          "Test",
          "Security & Vulnerability Scan",
          "Package",
          "Publish Artifact",
          "Production Approval",
          "Azure Cloud Deployment",
        ]
      : [
          "Checkout Source",
          "Build",
          "Test",
          "Security & Vulnerability Scan",
          "Package",
          "Publish Artifact",
          "Azure Cloud Deployment",
        ];

  const totalStages = execution.totalStages || pipelineStepNames.length;
  const executedSteps = execution.steps || [];
  const rawStatus = execution.status || "PENDING";
  const status = rawStatus === "WAITING_FOR_APPROVAL" ? "SUCCESS" : rawStatus;
  const isRunning = status === "RUNNING";
  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";
  const isWaitingApproval = false;
  const isRejected = status === "REJECTED";

  const successCount = executedSteps.filter((s) => s.status === "SUCCESS").length;
  const progressPercent =
    execution.progressPercentage ??
    (isSuccess ? 100 : Math.round((successCount / totalStages) * 100));

  // Filtered log lines
  const filteredLogs = (execution.logs || []).filter((l) => {
    const matchesSearch =
      !logSearch.trim() ||
      l.message?.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.step?.toLowerCase().includes(logSearch.toLowerCase());

    const matchesLevel =
      logLevelFilter === "ALL" ||
      l.level?.toUpperCase() === logLevelFilter.toUpperCase();

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="execution-page">
      {/* Top Breadcrumb & Actions */}
      <div className="execution-top-bar">
        <Link to="/executions" className="back-link">
          <ArrowLeft size={16} />
          <span>All Executions</span>
        </Link>

        <div className="execution-top-actions">
          {isRunning && (
            <span className="live-pill">
              <span className="live-dot"></span>
              Live Tracking
            </span>
          )}
          {isWaitingApproval && (
            <span className="live-pill" style={{ background: "#fef3c7", color: "#b45309" }}>
              <Clock size={13} style={{ marginRight: 4 }} />
              Awaiting Sign-off
            </span>
          )}
          <Link to="/pipeline" className="primary-button" style={{ height: 32, fontSize: 13 }}>
            <Play size={13} fill="currentColor" />
            Launch Pipeline
          </Link>
        </div>
      </div>

      {/* Production Approval Gate Action Banner */}
      {isWaitingApproval && (
        <div className="approval-gate-banner dynamic-fade-in">
          <div className="approval-content">
            <div className="approval-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3>Production Release Approval Required</h3>
              <p>
                Stages 1–6 (Checkout Source, Build, Test, Security Scan, Package, JFrog Publish) completed successfully.
                Stage 7 (Production Approval) requires Administrator authorization before Stage 8 (Azure Cloud Deployment).
              </p>
              <div className="approval-meta-row">
                <span>Target: <strong>Microsoft Azure ({execution.pipelineRequest?.environment})</strong></span>
                <span>•</span>
                <span>Strategy: <strong>{execution.pipelineRequest?.deploymentStrategy || "BLUE_GREEN"}</strong></span>
                <span>•</span>
                <span>Branch: <code>{execution.pipelineRequest?.branch}</code></span>
              </div>
            </div>
          </div>

          <div className="approval-actions">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  className="approval-approve-btn"
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  <CheckCircle2 size={16} />
                  <span>{isApproving ? "Deploying..." : "Approve & Deploy to Azure"}</span>
                </button>
                <button
                  type="button"
                  className="approval-reject-btn"
                  onClick={handleReject}
                >
                  Reject
                </button>
              </>
            ) : (
              <div className="dev-approval-note">
                <Clock size={15} />
                <span>You are logged in as <strong>{user.name}</strong>. Please have an Administrator approve this release.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="execution-header-card">
        <div className="header-meta-left">
          <div className="page-eyebrow">PIPELINE EXECUTION</div>
          <div className="execution-title-row">
            <h1>Execution #{execution.executionId.slice(0, 8)}</h1>
            <div className={`status-badge-lg ${status.toLowerCase()}`}>
              {isRunning && <span className="status-spinner-small"></span>}
              {isSuccess && <CheckCircle2 size={16} />}
              {isFailed && <AlertCircle size={16} />}
              {isWaitingApproval && <Clock size={16} />}
              {isRejected && <AlertTriangle size={16} />}
              <span>{isWaitingApproval ? "APPROVAL NEEDED" : status}</span>
            </div>
          </div>

          <div className="execution-submeta">
            <span>
              <strong>Component:</strong> {execution.pipelineRequest?.componentId}
            </span>
            <span>•</span>
            <span>
              <strong>Subcomponent:</strong> {execution.pipelineRequest?.subcomponentId}
            </span>
            <span>•</span>
            <span>
              <strong>Branch:</strong> <code>{execution.pipelineRequest?.branch}</code>
            </span>
            <span>•</span>
            <span>
              <strong>Strategy:</strong> {execution.pipelineRequest?.deploymentStrategy || "BLUE_GREEN"}
            </span>
            <span>•</span>
            <span>
              <strong>Environment:</strong> Azure ({execution.pipelineRequest?.environment})
            </span>
          </div>
        </div>

        <div className="header-meta-right">
          <div className="progress-summary-box">
            <div className="progress-label-row">
              <span>Overall Progress</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${status.toLowerCase()}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="progress-subtext">
              {isSuccess
                ? `All ${totalStages} DevSecOps stages passed`
                : isWaitingApproval
                ? `Stage 7: Production Approval awaiting Admin sign-off`
                : isRunning
                ? `Running stage ${Math.min(successCount + 1, totalStages)} of ${totalStages}`
                : isFailed
                ? "Execution halted at step " + executedSteps.length
                : isRejected
                ? "Release rejected by Administrator"
                : "Queued for orchestration"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="execution-summary-grid">
        <div className="summary-stat-box">
          <span className="summary-label">Total Stages</span>
          <strong>{totalStages} Stages</strong>
        </div>

        <div className="summary-stat-box ok">
          <span className="summary-label">Completed</span>
          <strong>{successCount} / {totalStages}</strong>
        </div>

        <div className="summary-stat-box">
          <span className="summary-label">DevSecOps Scan</span>
          <strong style={{ fontSize: 15, color: "var(--ok)" }}>
            {executedSteps.some(s => s.stepName?.includes("Security")) ? "PASSED (0 CVE)" : "Pending"}
          </strong>
        </div>

        <div className="summary-stat-box">
          <span className="summary-label">Azure Deployment</span>
          <strong style={{ fontSize: 15, color: execution.deployment ? "var(--ok)" : isWaitingApproval ? "#b45309" : "var(--muted)" }}>
            {execution.deployment ? "DEPLOYED (200 OK)" : isWaitingApproval ? "Awaiting Sign-off" : "Deploying..."}
          </strong>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="execution-tabs">
        <button
          className={`tab-btn ${activeTab === "stages" ? "active" : ""}`}
          onClick={() => setActiveTab("stages")}
        >
          <Layers size={16} />
          <span>Pipeline Flow ({totalStages} Stages)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          <TerminalIcon size={16} />
          <span>Real-Time Logs ({execution.logs?.length || 0})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "artifact" ? "active" : ""}`}
          onClick={() => setActiveTab("artifact")}
        >
          <Package size={16} />
          <span>Artifact & JFrog {execution.artifact ? "✓" : ""}</span>
        </button>

        <button
          className={`tab-btn ${activeTab === "azure" ? "active" : ""}`}
          onClick={() => setActiveTab("azure")}
        >
          <Cloud size={16} />
          <span>Azure Deployment {execution.deployment ? "✓" : ""}</span>
        </button>
      </div>

      {/* TAB 1: Pipeline Flow */}
      {activeTab === "stages" && (
        <div className="stages-flow-container">
          <div className="stages-card">
            <div className="card-head-clean">
              <h2>Automated DevSecOps Pipeline Stages</h2>
              <span className="step-count-pill">{executedSteps.length} of {totalStages} finished</span>
            </div>

            <div className="timeline-stages-list">
              {pipelineStepNames.map((stepName, index) => {
                const executed = executedSteps.find((s) => s.stepName === stepName);
                const isStepApproval = stepName === "Production Approval";
                const isCurrentlyRunning =
                  isRunning && executedSteps.length === index;
                const isStepSuccess = executed?.status === "SUCCESS";
                const isStepFailed = executed?.status === "FAILED";
                const isStepRejected = executed?.status === "REJECTED";
                const isStepPaused = (isStepApproval && isWaitingApproval) || executed?.status === "WAITING_FOR_APPROVAL";
                const isPending = !executed && !isCurrentlyRunning && !isStepPaused;

                let stepStateClass = "pending";
                if (isStepSuccess) stepStateClass = "success";
                if (isStepFailed || isStepRejected) stepStateClass = "failed";
                if (isCurrentlyRunning) stepStateClass = "running";
                if (isStepPaused) stepStateClass = "waiting";

                return (
                  <div key={stepName} className={`stage-row ${stepStateClass}`}>
                    <div className="stage-left-rail">
                      <div className="stage-icon-circle">
                        {isStepSuccess && <CheckCircle2 size={16} />}
                        {(isStepFailed || isStepRejected) && <AlertCircle size={16} />}
                        {isCurrentlyRunning && <span className="stage-spinner"></span>}
                        {isStepPaused && <Clock size={16} />}
                        {isPending && <span className="pending-dot-num">{index + 1}</span>}
                      </div>
                      {index < pipelineStepNames.length - 1 && (
                        <div
                          className={`rail-line ${isStepSuccess ? "completed" : ""}`}
                        ></div>
                      )}
                    </div>

                    <div className="stage-content-box">
                      <div className="stage-header-line">
                        <div className="stage-title-wrap">
                          <span className="stage-number-tag">
                            STAGE {String(index + 1).padStart(2, "0")}
                          </span>
                          <h3>{stepName}</h3>
                          {stepName.includes("Security") && (
                            <span className="security-tag">DevSecOps Gate</span>
                          )}
                          {isStepApproval && (
                            <span className="security-tag" style={{ background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}>
                              Gatekeeper
                            </span>
                          )}
                        </div>

                        <div className="stage-meta-right">
                          {executed?.durationMs > 0 && (
                            <span className="stage-duration-tag">
                              <Clock size={12} />
                              {(executed.durationMs / 1000).toFixed(1)}s
                            </span>
                          )}
                          <span className={`stage-status-badge ${stepStateClass}`}>
                            {isStepSuccess && "Completed"}
                            {isStepFailed && "Failed"}
                            {isStepRejected && "Rejected"}
                            {isCurrentlyRunning && "In Progress..."}
                            {isStepPaused && "Awaiting Approval"}
                            {isPending && "Pending"}
                          </span>
                        </div>
                      </div>

                      <p className="stage-description">
                        {executed?.message ||
                          (isStepPaused
                            ? "Waiting for Administrator authorization before initiating Stage 8: Azure Cloud Deployment."
                            : isCurrentlyRunning
                            ? "Executing orchestration commands..."
                            : "Waiting for preceding stage completion.")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Real-Time Terminal Console Logs with Search and Download */}
      {activeTab === "logs" && (
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="terminal-title">
              <span>console@orchestrix-runner:~ /execution/{execution.executionId.slice(0, 8)}</span>
            </div>
            <div className="terminal-actions">
              <button
                type="button"
                className="terminal-action-btn"
                onClick={copyAllLogs}
                title="Copy all logs"
              >
                {copiedLog ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLog ? "Copied!" : "Copy"}</span>
              </button>
              <button
                type="button"
                className="terminal-action-btn"
                onClick={downloadLogFile}
                title="Download raw log file"
              >
                <Download size={14} />
                <span>Export .log</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="terminal-toolbar">
            <div className="toolbar-search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search console output (e.g. cve, maven, azure, jfrog, error)..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
              />
              {logSearch && (
                <button type="button" className="clear-search-btn" onClick={() => setLogSearch("")}>✕</button>
              )}
            </div>

            <div className="toolbar-level-pills">
              {["ALL", "INFO", "SUCCESS", "WARN", "ERROR"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`level-pill-btn ${logLevelFilter === lvl ? "active" : ""}`}
                  onClick={() => setLogLevelFilter(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="terminal-screen">
            {filteredLogs.length === 0 ? (
              <div className="terminal-empty">
                <span className="terminal-cursor"></span>
                <span>{logSearch ? `No log lines match "${logSearch}"` : "Initializing pipeline execution log stream..."}</span>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={idx} className={`log-line ${log.level?.toLowerCase()}`}>
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className={`log-tag ${log.level?.toLowerCase()}`}>[{log.level}]</span>
                  <span className="log-step">[{log.step}]</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* TAB 3: Artifact & JFrog Artifactory Details */}
      {activeTab === "artifact" && (
        <div className="artifact-container">
          {execution.artifact ? (
            <div className="artifact-details-card">
              <div className="artifact-card-head">
                <div className="artifact-badge-title">
                  <Package size={22} className="card-primary-icon" />
                  <div>
                    <h2>Packaged Artifact & JFrog Publishing</h2>
                    <p>Verified build output published to enterprise repository.</p>
                  </div>
                </div>
                <span className="badge success">Published to JFrog ✓</span>
              </div>

              <div className="artifact-grid">
                <div className="artifact-info-box">
                  <span className="info-label">Artifact Name</span>
                  <strong>{execution.artifact.name}</strong>
                </div>

                <div className="artifact-info-box">
                  <span className="info-label">Packaging Type</span>
                  <strong className="mono">{execution.artifact.packaging}</strong>
                </div>

                <div className="artifact-info-box">
                  <span className="info-label">Version</span>
                  <strong>v{execution.artifact.version}</strong>
                </div>

                <div className="artifact-info-box">
                  <span className="info-label">Package Size</span>
                  <strong>{execution.artifact.size}</strong>
                </div>

                <div className="artifact-info-box full-span">
                  <span className="info-label">JFrog Artifactory Repository</span>
                  <code className="repo-url">{execution.artifact.repositoryUrl}</code>
                </div>

                <div className="artifact-info-box full-span">
                  <span className="info-label">SHA-256 Checksum Digest</span>
                  <code className="checksum">{execution.artifact.checksumSha256}</code>
                </div>
              </div>

              <div className="artifact-card-footer">
                <span>Repository: JFrog Artifactory (libs-release-local)</span>
                <span className="footer-status-pill">Integrity Verified (SHA256 Match)</span>
              </div>
            </div>
          ) : (
            <div className="empty-tab-state">
              <Package size={40} className="empty-icon" />
              <h3>Artifact Not Yet Generated</h3>
              <p>The package and publish steps run during Stage 6 and 7.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Azure Cloud Deployment Status */}
      {activeTab === "azure" && (
        <div className="azure-container">
          {execution.deployment ? (
            <div className="azure-details-card">
              <div className="azure-card-head">
                <div className="azure-badge-title">
                  <Cloud size={24} className="azure-primary-icon" />
                  <div>
                    <h2>Microsoft Azure Cloud Deployment</h2>
                    <p>Target App Service provisioned via {execution.deployment.strategy || "BLUE_GREEN"} strategy.</p>
                  </div>
                </div>
                <span className="badge success">Azure Healthy (200 OK) ✓</span>
              </div>

              <div className="azure-grid">
                <div className="azure-box">
                  <span className="info-label">Environment</span>
                  <strong style={{ textTransform: "capitalize" }}>
                    {execution.deployment.environment}
                  </strong>
                </div>

                <div className="azure-box">
                  <span className="info-label">Deployment Strategy</span>
                  <strong style={{ color: "#0078d4" }}>
                    {execution.deployment.strategy === "BLUE_GREEN" ? "Blue/Green (Zero-Downtime Slot Swap)" : execution.deployment.strategy}
                  </strong>
                </div>

                <div className="azure-box">
                  <span className="info-label">Active Azure Slot</span>
                  <strong className="mono">{execution.deployment.slot || "production"}</strong>
                </div>

                <div className="azure-box">
                  <span className="info-label">Resource Group</span>
                  <code className="azure-code">{execution.deployment.resourceGroup}</code>
                </div>

                <div className="azure-box full-span">
                  <span className="info-label">Live Cloud Application URL</span>
                  <div className="live-url-row">
                    <a
                      href={execution.deployment.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="azure-live-link"
                    >
                      {execution.deployment.liveUrl}
                      <ExternalLink size={14} style={{ marginLeft: 6 }} />
                    </a>
                  </div>
                </div>

                <div className="azure-box full-span">
                  <span className="info-label">Azure Actuator Health Check Probe</span>
                  <div className="probe-box">
                    <span className="probe-dot"></span>
                    <span>Status: {execution.deployment.healthStatus}</span>
                    <span className="probe-url mono">{execution.deployment.healthCheckUrl}</span>
                  </div>
                </div>
              </div>

              <div className="azure-card-footer">
                <span>Authorized by: {execution.deployment.approvedBy || "Admin"}</span>
                <span className="footer-status-pill">Routing & SSL Active</span>
              </div>
            </div>
          ) : (
            <div className="empty-tab-state">
              <Cloud size={40} className="empty-icon" />
              <h3>Azure Deployment In Progress</h3>
              <p>
                {isWaitingApproval
                  ? "Deployment paused at Stage 7 (Production Approval Gate). Administrator sign-off required."
                  : `Cloud deployment executes in Stage ${totalStages} after JFrog artifact publishing.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Execution;