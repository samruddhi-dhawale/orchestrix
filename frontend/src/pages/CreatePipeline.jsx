import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  GitBranch,
  Cloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  RotateCcw,
  Sparkles,
  Server,
  FileCode2,
  Box
} from "lucide-react";
import api from "../services/api";

function CreatePipeline() {
  const navigate = useNavigate();

  // Wizard current active step: 1 (Component), 2 (Subcomponent), 3 (Branch), 4 (Environment), 5 (Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form values
  const [component, setComponent] = useState("");
  const [subcomponent, setSubcomponent] = useState("");
  const [branch, setBranch] = useState("ENT_JIMS4_SPRINT1");
  const [environment, setEnvironment] = useState("development");

  // Dynamic API options
  const [components, setComponents] = useState([]);
  const [subcomponents, setSubcomponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback data in case backend is starting
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

  // Fetch components on load
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await api.get("/components");
        if (response.data && response.data.length > 0) {
          setComponents(response.data);
        } else {
          setComponents(fallbackComponents);
        }
      } catch (err) {
        console.warn("Using offline components fallback:", err);
        setComponents(fallbackComponents);
      } finally {
        setLoadingComponents(false);
      }
    };

    fetchComponents();
  }, []);

  // Fetch dynamic subcomponents when component changes
  useEffect(() => {
    if (!component) {
      setSubcomponents([]);
      return;
    }

    const fetchSubcomponents = async () => {
      try {
        const response = await api.get(`/components/${component}/subcomponents`);
        if (response.data && response.data.length > 0) {
          setSubcomponents(response.data);
        } else {
          setSubcomponents(fallbackSubcomponents[component] || []);
        }
      } catch {
        setSubcomponents(fallbackSubcomponents[component] || []);
      }
    };

    fetchSubcomponents();
  }, [component]);

  // Step 1: Select Component handler
  const handleSelectComponent = (compVal) => {
    setComponent(compVal);
    setSubcomponent("");
    // Automatically advance to Step 2
    setCurrentStep(2);
  };

  // Step 2: Select Subcomponent handler
  const handleSelectSubcomponent = (subVal) => {
    setSubcomponent(subVal);
    // Advance to Step 3 (Branch)
    setCurrentStep(3);
  };

  // Step 3: Select Branch handler
  const handleSelectBranch = (branchVal) => {
    setBranch(branchVal);
  };

  const handleNextFromBranch = (e) => {
    if (e) e.preventDefault();
    if (branch.trim()) {
      setCurrentStep(4);
    }
  };

  // Step 4: Select Environment handler
  const handleSelectEnvironment = (envVal) => {
    setEnvironment(envVal);
    // Advance to Step 5 (Review)
    setCurrentStep(5);
  };

  // Step 5: Final Launch Pipeline handler
  const handleLaunchPipeline = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        componentId: component,
        subcomponentId: subcomponent,
        branch: branch.trim(),
        environment: environment,
      };

      const response = await api.post("/pipelines", payload);
      const executionId = response.data?.executionId;

      if (executionId) {
        navigate(`/execution/${executionId}`);
      } else {
        navigate("/executions");
      }
    } catch (err) {
      console.error("Failed to launch pipeline:", err);
      alert("Failed to submit pipeline to backend. Please check if Spring Boot is running on port 8080.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedComponentName =
    components.find((c) => c.id === component)?.name || component;
  const selectedSubcomponentName =
    subcomponents.find((s) => s.id === subcomponent)?.name || subcomponent;

  const branchPresets = [
    "ENT_JIMS4_SPRINT1",
    "ENT_JIMS4_SPRINT2",
    "MK_LOG4J",
    "PROD_FibrePON_HPOO",
    "REPLICA_FibrePON_HPOO"
  ];

  return (
    <div className="create-pipeline-page">
      <div className="page-header">
        <div>
          <h1>Create & Launch Pipeline</h1>
          <p>Configure a multi-stage deployment pipeline with progressive parameters.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => {
            setComponent("");
            setSubcomponent("");
            setBranch("main");
            setEnvironment("development");
            setCurrentStep(1);
          }}
        >
          <RotateCcw size={15} />
          Reset Form
        </button>
      </div>

      {/* Progressive Step Stepper / Breadcrumbs */}
      <div className="wizard-stepper">
        <div
          className={`step-indicator ${currentStep >= 1 ? "active" : ""} ${component ? "done" : ""}`}
          onClick={() => setCurrentStep(1)}
        >
          <div className="step-badge">{component ? <CheckCircle2 size={16} /> : "1"}</div>
          <div className="step-text">
            <span className="step-title">Component</span>
            <span className="step-sub">{component ? selectedComponentName : "Select"}</span>
          </div>
        </div>

        <div className="stepper-connector"></div>

        <div
          className={`step-indicator ${currentStep >= 2 ? "active" : ""} ${subcomponent ? "done" : ""} ${!component ? "disabled" : ""}`}
          onClick={() => component && setCurrentStep(2)}
        >
          <div className="step-badge">{subcomponent ? <CheckCircle2 size={16} /> : "2"}</div>
          <div className="step-text">
            <span className="step-title">Subcomponent</span>
            <span className="step-sub">{subcomponent ? selectedSubcomponentName : "Select"}</span>
          </div>
        </div>

        <div className="stepper-connector"></div>

        <div
          className={`step-indicator ${currentStep >= 3 ? "active" : ""} ${branch ? "done" : ""} ${!subcomponent ? "disabled" : ""}`}
          onClick={() => subcomponent && setCurrentStep(3)}
        >
          <div className="step-badge">{branch && currentStep > 3 ? <CheckCircle2 size={16} /> : "3"}</div>
          <div className="step-text">
            <span className="step-title">Git Branch</span>
            <span className="step-sub">{branch || "Specify"}</span>
          </div>
        </div>

        <div className="stepper-connector"></div>

        <div
          className={`step-indicator ${currentStep >= 4 ? "active" : ""} ${environment ? "done" : ""} ${!branch ? "disabled" : ""}`}
          onClick={() => branch && setCurrentStep(4)}
        >
          <div className="step-badge">{environment && currentStep > 4 ? <CheckCircle2 size={16} /> : "4"}</div>
          <div className="step-text">
            <span className="step-title">Environment</span>
            <span className="step-sub">{environment || "Target"}</span>
          </div>
        </div>

        <div className="stepper-connector"></div>

        <div
          className={`step-indicator ${currentStep === 5 ? "active" : ""} ${!environment ? "disabled" : ""}`}
          onClick={() => environment && setCurrentStep(5)}
        >
          <div className="step-badge">5</div>
          <div className="step-text">
            <span className="step-title">Review & Run</span>
            <span className="step-sub">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="wizard-card">
        {/* STEP 1: Component Selection */}
        {currentStep === 1 && (
          <div className="wizard-section animate-fade">
            <div className="section-head">
              <div className="section-icon-badge">
                <Layers size={20} />
              </div>
              <div>
                <h2>Step 1: Select Application Component</h2>
                <p>Choose the target service or module to orchestrate.</p>
              </div>
            </div>

            <div className="selection-grid">
              {components.map((item) => {
                const isSelected = component === item.id;
                return (
                  <div
                    key={item.id}
                    className={`selection-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectComponent(item.id)}
                  >
                    <div className="card-top">
                      <span className="card-pill">Module</span>
                      {isSelected && <CheckCircle2 size={18} className="check-icon" />}
                    </div>
                    <h3>{item.name}</h3>
                    <p className="card-desc">
                      ID: <code>{item.id}</code>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Subcomponent Selection (Appears only after Step 1) */}
        {currentStep === 2 && (
          <div className="wizard-section animate-fade">
            <div className="section-head">
              <div className="section-icon-badge">
                <Box size={20} />
              </div>
              <div>
                <h2>Step 2: Select Subcomponent</h2>
                <p>
                  Showing dynamic subcomponents for <strong>{selectedComponentName}</strong>.
                </p>
              </div>
            </div>

            <div className="selection-grid">
              {subcomponents.map((sub) => {
                const isSelected = subcomponent === sub.id;
                return (
                  <div
                    key={sub.id}
                    className={`selection-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectSubcomponent(sub.id)}
                  >
                    <div className="card-top">
                      <span className="card-pill">Subcomponent</span>
                      {isSelected && <CheckCircle2 size={18} className="check-icon" />}
                    </div>
                    <h3>{sub.name}</h3>
                    <p className="card-desc">
                      Artifact ID: <code>{sub.id}</code>
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="wizard-nav-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={16} />
                Back to Components
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Branch Selection (Appears only after Step 2) */}
        {currentStep === 3 && (
          <div className="wizard-section animate-fade">
            <div className="section-head">
              <div className="section-icon-badge">
                <GitBranch size={20} />
              </div>
              <div>
                <h2>Step 3: Select Git Branch</h2>
                <p>Specify which branch or revision to check out and build.</p>
              </div>
            </div>

            <div className="branch-section-box">
              <label className="field-label">Quick Preset Branches</label>
              <div className="preset-chips">
                {branchPresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`chip-button ${branch === b ? "active" : ""}`}
                    onClick={() => handleSelectBranch(b)}
                  >
                    <GitBranch size={14} />
                    <span>{b}</span>
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: 20 }}>
                <label htmlFor="branchInput" className="field-label">
                  Or enter custom branch:
                </label>
                <input
                  id="branchInput"
                  type="text"
                  className="high-contrast-input"
                  placeholder="e.g. main, develop, feature/login"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="wizard-nav-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={!branch.trim()}
                onClick={handleNextFromBranch}
              >
                <span>Continue to Environment</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Environment Selection (Appears only after Step 3) */}
        {currentStep === 4 && (
          <div className="wizard-section animate-fade">
            <div className="section-head">
              <div className="section-icon-badge">
                <Cloud size={20} />
              </div>
              <div>
                <h2>Step 4: Select Target Environment</h2>
                <p>Choose the target Azure cloud deployment environment.</p>
              </div>
            </div>

            <div className="selection-grid">
              <div
                className={`selection-card ${environment === "development" ? "selected" : ""}`}
                onClick={() => handleSelectEnvironment("development")}
              >
                <div className="card-top">
                  <span className="card-pill dev">Development</span>
                  {environment === "development" && <CheckCircle2 size={18} className="check-icon" />}
                </div>
                <h3>Development</h3>
                <p className="card-desc">Target: Development Runtime Cluster</p>
              </div>

              <div
                className={`selection-card ${environment === "staging" ? "selected" : ""}`}
                onClick={() => handleSelectEnvironment("staging")}
              >
                <div className="card-top">
                  <span className="card-pill staging">Staging</span>
                  {environment === "staging" && <CheckCircle2 size={18} className="check-icon" />}
                </div>
                <h3>Staging</h3>
                <p className="card-desc">Target: Staging Runtime Cluster</p>
              </div>

              <div
                className={`selection-card ${environment === "production" ? "selected" : ""}`}
                onClick={() => handleSelectEnvironment("production")}
              >
                <div className="card-top">
                  <span className="card-pill prod">Production</span>
                  {environment === "production" && <CheckCircle2 size={18} className="check-icon" />}
                </div>
                <h3>Production</h3>
                <p className="card-desc">Target: Production High-Availability Cluster</p>
              </div>
            </div>

            <div className="wizard-nav-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Pipeline Review & Confirmation (User can review before executing) */}
        {currentStep === 5 && (
          <div className="wizard-section animate-fade">
            <div className="section-head">
              <div className="section-icon-badge">
                <Sparkles size={20} />
              </div>
              <div>
                <h2>Step 5: Review & Confirm Pipeline Run</h2>
                <p>Please review the pipeline configuration before triggering execution.</p>
              </div>
            </div>

            <div className="review-box">
              <div className="review-header">
                <h3>Pipeline Execution Manifest</h3>
                <span className="badge running">Ready to Launch</span>
              </div>

              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Component</span>
                  <strong className="review-val">{selectedComponentName}</strong>
                  <span className="review-code"><code>{component}</code></span>
                </div>

                <div className="review-item">
                  <span className="review-label">Subcomponent</span>
                  <strong className="review-val">{selectedSubcomponentName}</strong>
                  <span className="review-code"><code>{subcomponent}</code></span>
                </div>

                <div className="review-item">
                  <span className="review-label">Git Branch</span>
                  <strong className="review-val"><code>refs/heads/{branch}</code></strong>
                  <span className="review-code">Git Checkout Stage</span>
                </div>

                <div className="review-item">
                  <span className="review-label">Target Environment</span>
                  <strong className="review-val" style={{ textTransform: "capitalize" }}>
                    {environment}
                  </strong>
                  <span className="review-code">Azure Cloud</span>
                </div>

                <div className="review-item">
                  <span className="review-label">Artifact Packaging</span>
                  <strong className="review-val">JAR (Java Archive)</strong>
                  <span className="review-code">JFrog Artifactory: libs-release-local</span>
                </div>

                <div className="review-item">
                  <span className="review-label">Azure Resource Group</span>
                  <strong className="review-val"><code>rg-orchestrix-{environment}</code></strong>
                  <span className="review-code">App Service Provisioning</span>
                </div>
              </div>

              <div className="pipeline-flow-preview">
                <span className="preview-flow-label">Planned Execution Sequence:</span>
                <div className="preview-sequence">
                  <span>1. Checkout Source</span> →
                  <span>2. Unit & Integration Tests</span> →
                  <span>3. Maven Build</span> →
                  <span>4. Generate Artifact</span> →
                  <span>5. Azure Cloud Deployment</span>
                </div>
              </div>
            </div>

            <div className="wizard-nav-actions" style={{ justifyContent: "space-between" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCurrentStep(4)}
              >
                <ArrowLeft size={16} />
                Modify Configuration
              </button>

              <button
                type="button"
                className="primary-button launch-btn"
                disabled={isSubmitting}
                onClick={handleLaunchPipeline}
              >
                {isSubmitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Starting Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Run Pipeline Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatePipeline;