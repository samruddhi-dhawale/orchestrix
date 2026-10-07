import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Check, ChevronRight, Layers, GitBranch, Cloud, Box, RefreshCw } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import "./LaunchPipeline.css";

function LaunchPipeline() {
  const navigate = useNavigate();
  const rawUser = getCurrentUser() || { role: "DEVELOPER", name: "Developer", username: "developer" };
  const user = {
    ...rawUser,
    name: rawUser.name && rawUser.name.includes("Lead") ? "Developer" : (rawUser.name || "Developer"),
  };
  const isAdmin = user.role === "ADMIN";

  // Progressive dropdown selections
  const [component, setComponent] = useState("");
  const [subcomponent, setSubcomponent] = useState("");
  const [branch, setBranch] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [environment, setEnvironment] = useState("");
  const [strategy, setStrategy] = useState("BLUE_GREEN");
  const [workItemId, setWorkItemId] = useState("");

  // Data lists
  const [components, setComponents] = useState([]);
  const [subcomponents, setSubcomponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [loadingSubcomponents, setLoadingSubcomponents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fallbackComponents = [
    { id: "Ent_Jio_Inventory_System", name: "Ent_Jio_Inventory_System" },
    { id: "Ent_Jio_Orchestrator", name: "Ent_Jio_Orchestrator" },
    { id: "Ent_MF_OO", name: "Ent_MF_OO (operations Orchestration)" },
  ];

  const commonSubcomponents = [
    { id: "JIMS_O2A_ServiceProvisioning_ETH", name: "JIMS_O2A_ServiceProvisioning_ETH" },
    { id: "Enterprise_JIMS_O2AWebservices_And_Tools_Camunda", name: "Enterprise_JIMS_O2AWebservices_And_Tools_Camunda" },
    { id: "JIMS_Ent_Webservices_and_Tools_ILL", name: "JIMS_Ent_Webservices_and_Tools_ILL" },
    { id: "JIMS_O2A_ServiceProvisioning", name: "JIMS_O2A_ServiceProvisioning" },
  ];

  const fallbackSubcomponents = {
    "Ent_Jio_Inventory_System": commonSubcomponents,
    "Ent_Jio_Orchestrator": commonSubcomponents,
    "Ent_MF_OO": commonSubcomponents,
  };

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await api.get("/components");
        if (res.data && res.data.length > 0) {
          setComponents(res.data);
        } else {
          setComponents(fallbackComponents);
        }
      } catch (err) {
        console.warn("Backend components API unreachable, using presets:", err);
        setComponents(fallbackComponents);
      } finally {
        setLoadingComponents(false);
      }
    };
    fetchComponents();
  }, []);

  useEffect(() => {
    if (!component) {
      setSubcomponents([]);
      return;
    }

    const fetchSubcomponents = async () => {
      setLoadingSubcomponents(true);
      try {
        const res = await api.get(`/components/${component}/subcomponents`);
        if (res.data && res.data.length > 0) {
          setSubcomponents(res.data);
        } else {
          setSubcomponents(fallbackSubcomponents[component] || []);
        }
      } catch {
        setSubcomponents(fallbackSubcomponents[component] || []);
      } finally {
        setLoadingSubcomponents(false);
      }
    };

    fetchSubcomponents();
  }, [component]);

  // Step 1 change: clear all dependent downstream state automatically
  const handleComponentChange = (e) => {
    const val = e.target.value;
    setComponent(val);
    setSubcomponent("");
    setBranch("");
    setCustomBranch("");
    setEnvironment("");
    setStrategy("BLUE_GREEN");
    setErrorMsg("");
    setFieldErrors({});
  };

  // Step 2 change: clear downstream state
  const handleSubcomponentChange = (e) => {
    const val = e.target.value;
    setSubcomponent(val);
    setBranch("");
    setCustomBranch("");
    setEnvironment("");
    setFieldErrors((prev) => ({ ...prev, subcomponent: "" }));
  };

  // Step 3 change: clear downstream state
  const handleBranchChange = (e) => {
    const val = e.target.value;
    setBranch(val);
    if (val !== "custom") {
      setCustomBranch("");
    }
    setEnvironment("");
    setFieldErrors((prev) => ({ ...prev, branch: "" }));
  };

  // Step 4 change
  const handleEnvironmentChange = (e) => {
    const val = e.target.value;
    setEnvironment(val);
    setFieldErrors((prev) => ({ ...prev, environment: "" }));
  };

  // Reset Selections: reliably reset ALL configuration state
  const handleReset = () => {
    setComponent("");
    setSubcomponent("");
    setBranch("");
    setCustomBranch("");
    setEnvironment("");
    setWorkItemId("");
    setStrategy("BLUE_GREEN");
    setErrorMsg("");
    setFieldErrors({});
  };

  const effectiveBranch = branch === "custom" ? customBranch.trim() : branch;

  // Pre-Execution Validation & Submission
  const handleLaunchPipeline = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const errors = {};

    if (!component) {
      errors.component = "Please select a system.";
    }

    if (!subcomponent) {
      errors.subcomponent = "Please select a component.";
    }

    if (!effectiveBranch) {
      errors.branch = "Please select or enter a Git branch.";
    } else if (effectiveBranch.includes(" ") || effectiveBranch.includes("..")) {
      errors.branch = "Branch name cannot contain spaces or '..'";
    }

    if (!environment) {
      errors.environment = "Please select a target deployment environment.";
    }

    if (workItemId && !/^\d+$/.test(workItemId.trim())) {
      errors.workItemId = "Work Item ID must contain only numbers.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Configuration validation failed. Please address the highlighted fields below.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        componentId: component,
        subcomponentId: subcomponent,
        branch: effectiveBranch,
        environment: environment,
        deploymentStrategy: strategy,
        variables: "",
        workItemId: workItemId.trim(),
        initiatedBy: user.name || user.username || "Developer",
        initiatedUsername: user.username || "developer",
        initiatedRole: user.role || "DEVELOPER",
      };

      const res = await api.post("/pipelines", payload);
      const executionId = res.data?.executionId;

      if (res.data) {
        try {
          const cached = localStorage.getItem("orchestrix_cached_runs");
          const runsList = cached ? JSON.parse(cached) : [];
          runsList.unshift(res.data);
          localStorage.setItem("orchestrix_cached_runs", JSON.stringify(runsList));
        } catch {
          // ignore
        }
      }

      if (executionId) {
        navigate(`/execution/${executionId}`);
      } else {
        navigate("/executions");
      }
    } catch (err) {
      console.error("Pipeline launch pre-check or submission failed:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      if (serverMsg) {
        setErrorMsg(serverMsg);
      } else {
        setErrorMsg("Failed to connect to backend on port 8080. Please ensure Spring Boot is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const compLabel = components.find((c) => c.id === component)?.name || component;
  const subLabel = subcomponents.find((s) => s.id === subcomponent)?.name || subcomponent;


  const completedStepsCount = [
    Boolean(component),
    Boolean(subcomponent),
    Boolean(effectiveBranch),
    Boolean(environment),
  ].filter(Boolean).length;

  return (
    <div className="launch-pipeline-container">
      <div className="page-header">
        <div>
          <h1>Launch Pipeline</h1>
        </div>
        {(component || subcomponent || branch || environment) && (
          <button type="button" className="secondary-button" onClick={handleReset}>
            <RotateCcw size={15} />
            Reset Selections
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="form-error-banner dynamic-fade-in">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="progressive-form-card">
        <div className="form-card-title" style={{ justifyContent: "flex-end", padding: "14px 28px" }}>
          <span className="step-count-badge">
            {environment ? "Review Ready" : `Step ${!component ? 1 : !subcomponent ? 2 : !effectiveBranch ? 3 : workItemId ? 5 : 4} of 5`}
          </span>
        </div>

        <form onSubmit={handleLaunchPipeline} className="progressive-fields-stack">
          {/* STEP 1: System Dropdown (Always visible) */}
          <div className="progressive-field-group">
            <div className="field-meta">
              <span className={`step-tag ${component ? "completed" : ""}`}>
                {component ? "✓ Step 1" : "Step 1"}
              </span>
              <label htmlFor="component-select">
                System <span>*</span>
              </label>
            </div>

            <select
              id="component-select"
              value={component}
              onChange={handleComponentChange}
              className="progressive-select"
              required
            >
              <option value="">-- Select System --</option>
              {components.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {fieldErrors.component && <span className="field-error-text">{fieldErrors.component}</span>}
            <span className="field-hint">Defines the primary system to orchestrate.</span>
          </div>

          {/* STEP 2: Component Dropdown (Appears ONLY after System is selected) */}
          {component && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${subcomponent ? "completed" : ""}`}>
                  {subcomponent ? "✓ Step 2" : "Step 2"}
                </span>
                <label htmlFor="subcomponent-select">
                  Component <span>*</span>
                </label>
              </div>

              {loadingSubcomponents ? (
                <div className="field-loading-state">Loading components for {compLabel}...</div>
              ) : (
                <select
                  id="subcomponent-select"
                  value={subcomponent}
                  onChange={handleSubcomponentChange}
                  className="progressive-select"
                  required
                >
                  <option value="">-- Select Component --</option>
                  {subcomponents.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.subcomponent && <span className="field-error-text">{fieldErrors.subcomponent}</span>}
              <span className="field-hint">Specific component module belonging to {compLabel}.</span>
            </div>
          )}

          {/* STEP 3: Git Branch Dropdown (Appears ONLY after Subcomponent is selected) */}
          {subcomponent && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${effectiveBranch ? "completed" : ""}`}>
                  {effectiveBranch ? "✓ Step 3" : "Step 3"}
                </span>
                <label htmlFor="branch-select">
                  Git Branch <span>*</span>
                </label>
              </div>

              <select
                id="branch-select"
                value={branch}
                onChange={handleBranchChange}
                className="progressive-select"
                required
              >
                <option value="">-- Select Git Branch --</option>
                <option value="ENT_JIMS4_SPRINT1">ENT_JIMS4_SPRINT1</option>
                <option value="ENT_JIMS4_SPRINT2">ENT_JIMS4_SPRINT2</option>
                <option value="MK_LOG4J">MK_LOG4J</option>
                <option value="PROD_FibrePON_HPOO">PROD_FibrePON_HPOO</option>
                <option value="REPLICA_FibrePON_HPOO">REPLICA_FibrePON_HPOO</option>
                <option value="custom">Custom Branch Name</option>
              </select>

              {branch === "custom" && (
                <div className="custom-branch-input-wrapper dynamic-fade-in" style={{ marginTop: 10 }}>
                  <input
                    type="text"
                    placeholder="Enter custom branch name (e.g. bugfix/auth-token)"
                    value={customBranch}
                    onChange={(e) => {
                      setCustomBranch(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, branch: "" }));
                    }}
                    className="progressive-input"
                    required
                  />
                </div>
              )}
              {fieldErrors.branch && <span className="field-error-text">{fieldErrors.branch}</span>}
              <span className="field-hint">The source revision to checkout, test, compile, scan, and deploy.</span>
            </div>
          )}

          {/* STEP 4: Work Item ID */}
          {subcomponent && effectiveBranch && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${workItemId ? "completed" : ""}`}>
                  {workItemId ? "✓ Step 4" : "Step 4"}
                </span>
                <label htmlFor="workitem-input">
                  Work Item ID
                </label>
              </div>

              <input
                id="workitem-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter numbers only (e.g. 1042)"
                value={workItemId}
                onChange={(e) => {
                  const nums = e.target.value.replace(/\D/g, "");
                  setWorkItemId(nums);
                  setFieldErrors((prev) => ({ ...prev, workItemId: "" }));
                }}
                className="progressive-input"
              />
              {fieldErrors.workItemId && <span className="field-error-text">{fieldErrors.workItemId}</span>}
              <span className="field-hint">Numeric work item tracking ID (numbers only).</span>
            </div>
          )}

          {/* STEP 5: Target Deployment Environment */}
          {subcomponent && effectiveBranch && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${environment ? "completed" : ""}`}>
                  {environment ? "✓ Step 5" : "Step 5"}
                </span>
                <label htmlFor="environment-select">
                  Target Deployment Environment <span>*</span>
                </label>
              </div>

              <select
                id="environment-select"
                value={environment}
                onChange={handleEnvironmentChange}
                className="progressive-select"
                required
              >
                <option value="">-- Select Deployment Environment --</option>
                <option value="mut">MUT</option>
                <option value="sit">SIT</option>
                <option value="replica">Replica</option>
              </select>
              {fieldErrors.environment && <span className="field-error-text">{fieldErrors.environment}</span>}
              <span className="field-hint">Determines the target runtime deployment environment.</span>

              {/* RBAC Notice for Replica / Production */}
              {(environment === "replica" || environment === "production") && (
                <div className="rbac-notice-banner dynamic-fade-in">
                  {isAdmin ? (
                    <span>👑 <strong>Admin Authorized:</strong> You have full administrator credentials to execute {environment.toUpperCase()} deployments directly.</span>
                  ) : (
                    <span>🛡️ <strong>Replica Approval Gate:</strong> You are logged in as <strong>{user.name}</strong>. Replica deployment will pause after build, test, and artifact generation for Administrator approval before deploying.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Configuration Review Summary & Confirmation */}
          {component && subcomponent && effectiveBranch && environment && (
            <div className="progressive-review-card dynamic-fade-in">
              <div className="review-title-row">
                <div className="review-heading">
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <h3>Deployment Summary</h3>
                </div>
                <span className="manifest-ready-tag">READY TO LAUNCH</span>
              </div>

              <table className="review-summary-table">
                <tbody>
                  <tr>
                    <td className="summary-field-name">System:</td>
                    <td className="summary-field-val"><strong>{compLabel}</strong> <code className="sub-code">{component}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Component:</td>
                    <td className="summary-field-val"><strong>{subLabel}</strong> <code className="sub-code">{subcomponent}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Git Branch:</td>
                    <td className="summary-field-val"><code className="sub-code">{effectiveBranch}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Work Item ID:</td>
                    <td className="summary-field-val">
                      {workItemId ? <strong>{workItemId}</strong> : <span style={{ color: "var(--muted)" }}>None (Not specified)</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Deployment Environment:</td>
                    <td className="summary-field-val">
                      <span className={`badge ${environment === "replica" || environment === "production" ? "running" : "success"}`} style={{ textTransform: "uppercase" }}>
                        {environment}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="launch-action-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>

                <button
                  type="submit"
                  className="launch-pipeline-primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      <span>Initiating Orchestrator...</span>
                    </>
                  ) : (
                    <>
                      <Play size={17} fill="currentColor" />
                      <span>Launch Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LaunchPipeline;
