import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Check, ChevronRight, Layers, GitBranch, Cloud, Box, RefreshCw } from "lucide-react";
import api from "../services/api";
import { getCurrentUser } from "../services/auth";
import "./LaunchPipeline.css";

function LaunchPipeline() {
  const navigate = useNavigate();
  const user = getCurrentUser() || { role: "DEVELOPER", name: "Samruddhi D.", username: "developer" };
  const isAdmin = user.role === "ADMIN";

  // Progressive dropdown selections
  const [component, setComponent] = useState("");
  const [subcomponent, setSubcomponent] = useState("");
  const [branch, setBranch] = useState("");
  const [customBranch, setCustomBranch] = useState("");
  const [environment, setEnvironment] = useState("");
  const [strategy, setStrategy] = useState("BLUE_GREEN");

  // Data lists
  const [components, setComponents] = useState([]);
  const [subcomponents, setSubcomponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [loadingSubcomponents, setLoadingSubcomponents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fallbackComponents = [
    { id: "component-a", name: "Component A (Core Platform)" },
    { id: "component-b", name: "Component B (API Services)" },
    { id: "component-c", name: "Component C (Data Engine)" },
    { id: "payment-gateway", name: "Payment Gateway Service" },
    { id: "auth-service", name: "Identity & Access Hub" },
  ];

  const fallbackSubcomponents = {
    "component-a": [
      { id: "sub-a1", name: "Subcomponent A1 (Kernel Worker)" },
      { id: "sub-a2", name: "Subcomponent A2 (Event Dispatcher)" },
      { id: "sub-a3", name: "Subcomponent A3 (Edge Gateway)" },
    ],
    "component-b": [
      { id: "sub-b1", name: "Subcomponent B1 (REST API)" },
      { id: "sub-b2", name: "Subcomponent B2 (GraphQL Gateway)" },
    ],
    "component-c": [
      { id: "sub-c1", name: "Subcomponent C1 (ETL Pipeline)" },
      { id: "sub-c2", name: "Subcomponent C2 (Cache Invalidator)" },
    ],
    "payment-gateway": [
      { id: "sub-pay-core", name: "Payment Transaction Processor" },
      { id: "sub-pay-webhooks", name: "Stripe & Razorpay Webhooks" },
    ],
    "auth-service": [
      { id: "sub-auth-oauth", name: "OAuth 2.0 / OIDC Server" },
      { id: "sub-auth-tokens", name: "JWT Session Manager" },
    ],
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
      errors.component = "Please select an application component.";
    }

    if (!subcomponent) {
      errors.subcomponent = "Please select a target subcomponent.";
    }

    if (!effectiveBranch) {
      errors.branch = "Please select or enter a Git branch / tag.";
    } else if (effectiveBranch.includes(" ") || effectiveBranch.includes("..")) {
      errors.branch = "Branch name cannot contain spaces or '..'";
    }

    if (!environment) {
      errors.environment = "Please select a target deployment environment.";
    }

    if (!strategy) {
      errors.strategy = "Please select an Azure deployment strategy.";
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
        initiatedBy: user.name || user.username || "Samruddhi D.",
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

  const strategyNames = {
    BLUE_GREEN: "Blue/Green (Zero-Downtime Slot Swap)",
    CANARY: "Canary Release (10% Traffic Ramp)",
    ROLLING: "Rolling Update (Cluster Node Rotation)",
  };

  const completedStepsCount = [
    Boolean(component),
    Boolean(subcomponent),
    Boolean(effectiveBranch),
    Boolean(environment),
    Boolean(strategy),
  ].filter(Boolean).length;

  return (
    <div className="launch-pipeline-container">
      <div className="page-header">
        <div>
          <h1>Launch Pipeline</h1>
          <p>Progressively configure parameters to trigger an automated CI/CD release workflow.</p>
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
        <div className="form-card-title">
          <div className="title-left">
            <h2>Pipeline Parameters</h2>
            <p>Select options in sequence to configure your deployment pipeline.</p>
          </div>
          <span className="step-count-badge">
            {environment && strategy ? "Review Ready" : `Step ${[component, subcomponent, effectiveBranch, environment].filter(Boolean).length + 1} of 5`}
          </span>
        </div>

        <form onSubmit={handleLaunchPipeline} className="progressive-fields-stack">
          {/* STEP 1: Application Component Dropdown (Always visible) */}
          <div className="progressive-field-group">
            <div className="field-meta">
              <span className={`step-tag ${component ? "completed" : ""}`}>
                {component ? "✓ Step 1" : "Step 1"}
              </span>
              <label htmlFor="component-select">
                Application Component <span>*</span>
              </label>
            </div>

            <select
              id="component-select"
              value={component}
              onChange={handleComponentChange}
              className="progressive-select"
              required
            >
              <option value="">-- Select Application Component --</option>
              {components.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {fieldErrors.component && <span className="field-error-text">{fieldErrors.component}</span>}
            <span className="field-hint">Defines the root service repository to orchestrate.</span>
          </div>

          {/* STEP 2: Target Subcomponent Dropdown (Appears ONLY after Component is selected) */}
          {component && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${subcomponent ? "completed" : ""}`}>
                  {subcomponent ? "✓ Step 2" : "Step 2"}
                </span>
                <label htmlFor="subcomponent-select">
                  Target Subcomponent <span>*</span>
                </label>
              </div>

              {loadingSubcomponents ? (
                <div className="field-loading-state">Loading subcomponents for {compLabel}...</div>
              ) : (
                <select
                  id="subcomponent-select"
                  value={subcomponent}
                  onChange={handleSubcomponentChange}
                  className="progressive-select"
                  required
                >
                  <option value="">-- Select Subcomponent --</option>
                  {subcomponents.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.subcomponent && <span className="field-error-text">{fieldErrors.subcomponent}</span>}
              <span className="field-hint">Dynamic module belonging to {compLabel}.</span>
            </div>
          )}

          {/* STEP 3: Git Branch / Tag Dropdown (Appears ONLY after Subcomponent is selected) */}
          {subcomponent && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${effectiveBranch ? "completed" : ""}`}>
                  {effectiveBranch ? "✓ Step 3" : "Step 3"}
                </span>
                <label htmlFor="branch-select">
                  Git Branch / Tag <span>*</span>
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
                <option value="main">main (Production Stable Branch)</option>
                <option value="develop">develop (Active Integration Branch)</option>
                <option value="feature/login">feature/login (Feature Branch)</option>
                <option value="release/v1.0">release/v1.0 (Release Candidate)</option>
                <option value="feature/broken-test">feature/broken-test (Simulate Test Failure Demo)</option>
                <option value="custom">Custom Branch / Tag Name...</option>
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
              <span className="field-hint">The source revision to checkout, compile, test, scan, and deploy.</span>
            </div>
          )}

          {/* STEP 4: Target Deployment Environment (Appears ONLY after Branch is selected) */}
          {subcomponent && effectiveBranch && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${environment ? "completed" : ""}`}>
                  {environment ? "✓ Step 4" : "Step 4"}
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
                <option value="development">Development (Azure App Service - East US)</option>
                <option value="staging">Testing / Staging (Azure App Service - East US Staging Slot)</option>
                <option value="production">Production (Azure App Service - High Availability Pair)</option>
              </select>
              {fieldErrors.environment && <span className="field-error-text">{fieldErrors.environment}</span>}
              <span className="field-hint">Determines Azure resource group and cloud deployment target.</span>

              {/* RBAC Notice for Production */}
              {environment === "production" && (
                <div className="rbac-notice-banner dynamic-fade-in">
                  {isAdmin ? (
                    <span>👑 <strong>Admin Authorized:</strong> You have full administrator credentials to execute production deployments directly.</span>
                  ) : (
                    <span>🛡️ <strong>Production Approval Gate:</strong> You are logged in as <strong>{user.name}</strong>. Production deployment will pause after build, test, scan, package, and JFrog publish for Administrator approval before deploying to Azure.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Azure Deployment Strategy (Appears ONLY after Environment is selected) */}
          {subcomponent && effectiveBranch && environment && (
            <div className="progressive-field-group dynamic-fade-in">
              <div className="field-meta">
                <span className={`step-tag ${strategy ? "completed" : ""}`}>
                  {strategy ? "✓ Step 5" : "Step 5"}
                </span>
                <label htmlFor="strategy-select">
                  Azure Deployment Strategy <span>*</span>
                </label>
              </div>

              <select
                id="strategy-select"
                value={strategy}
                onChange={(e) => {
                  setStrategy(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, strategy: "" }));
                }}
                className="progressive-select"
                required
              >
                <option value="BLUE_GREEN">Blue/Green Deployment (Zero-Downtime Azure Slot Swap - Recommended)</option>
                <option value="CANARY">Canary Release (10% Traffic Ramp → 50% → 100%)</option>
                <option value="ROLLING">Rolling Update (Incremental Node Rotation)</option>
              </select>
              {fieldErrors.strategy && <span className="field-error-text">{fieldErrors.strategy}</span>}
              <span className="field-hint">Zero-downtime routing policy applied during Azure cloud provisioning.</span>
            </div>
          )}

          {/* Configuration Review Summary & Confirmation */}
          {component && subcomponent && effectiveBranch && environment && strategy && (
            <div className="progressive-review-card dynamic-fade-in">
              <div className="review-title-row">
                <div className="review-heading">
                  <CheckCircle2 size={18} color="var(--ok)" />
                  <h3>Pipeline Configuration Summary</h3>
                </div>
                <span className="manifest-ready-tag">READY TO LAUNCH</span>
              </div>

              <table className="review-summary-table">
                <tbody>
                  <tr>
                    <td className="summary-field-name">Application Component:</td>
                    <td className="summary-field-val"><strong>{compLabel}</strong> <code className="sub-code">{component}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Target Subcomponent:</td>
                    <td className="summary-field-val"><strong>{subLabel}</strong> <code className="sub-code">{subcomponent}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Git Source Branch:</td>
                    <td className="summary-field-val"><code className="branch-code">refs/heads/{effectiveBranch}</code></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Deployment Environment:</td>
                    <td className="summary-field-val">
                      <span className={`badge ${environment === "production" ? "running" : "success"}`} style={{ textTransform: "capitalize" }}>
                        {environment}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Deployment Strategy:</td>
                    <td className="summary-field-val"><strong>{strategyNames[strategy]}</strong></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">DevSecOps Security Gate:</td>
                    <td className="summary-field-val"><span className="badge success">Enabled (SAST & CVE Scan)</span></td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Target Cloud Provider:</td>
                    <td className="summary-field-val">Microsoft Azure App Service (rg-orchestrix-{environment})</td>
                  </tr>
                  <tr>
                    <td className="summary-field-name">Operator Role:</td>
                    <td className="summary-field-val">
                      <strong>{user.name}</strong> ({isAdmin ? "👑 Administrator" : "💻 Developer"})
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
