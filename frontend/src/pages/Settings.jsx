import { useState, useEffect } from "react";
import { User, ShieldCheck, Cloud, Package, Cpu, CheckCircle2, Server, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "developer",
    name: "Samruddhi D.",
    role: "Lead DevOps Engineer",
    email: "developer@orchestrix.io",
    organization: "Orchestrix Core Platform",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("orchestrix_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setUser(parsed);
      }
    } catch {
      // fallback
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings & Cloud Integrations</h1>
          <p>System configuration, enterprise cloud connectors, and user profile.</p>
        </div>
        <button className="secondary-button" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* User Profile Card */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--brand-soft)",
                color: "var(--brand)",
                display: "grid",
                placeItems: "center",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>{user.name}</h2>
              <span className="badge success" style={{ marginTop: 4 }}>
                {user.role}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>
                USERNAME
              </span>
              <strong style={{ fontSize: 14 }}>{user.username}</strong>
            </div>

            <div>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>
                EMAIL
              </span>
              <strong style={{ fontSize: 14 }}>{user.email || `${user.username}@orchestrix.io`}</strong>
            </div>

            <div>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)", display: "block" }}>
                ORGANIZATION
              </span>
              <strong style={{ fontSize: 14 }}>{user.organization || "Orchestrix Cloud Platform"}</strong>
            </div>
          </div>
        </div>

        {/* In-Memory Stateless Architecture Notice */}
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Cpu size={24} color="var(--brand)" />
            <div>
              <h2 style={{ fontSize: 16, margin: 0 }}>Stateless In-Memory Architecture</h2>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Zero Database Footprint Guarantee</p>
            </div>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)" }}>
            Orchestrix operates on high-speed, thread-safe in-memory state machines using{" "}
            <code>ConcurrentHashMap</code> and asynchronous Java <code>CompletableFuture</code> workers.
            This decouples CI/CD runner execution from relational database overhead (no MySQL, Postgres, or MongoDB required).
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <span className="badge success">Thread-Safe</span>
            <span className="badge success">Sub-Millisecond Read Latency</span>
            <span className="badge">Zero DB Overhead</span>
          </div>
        </div>
      </div>

      {/* Cloud Integrations Status */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Enterprise Cloud Connectors</h2>
            <p>Active infrastructure providers orchestrated by the platform</p>
          </div>
        </div>

        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Azure Cloud Connector */}
          <div
            style={{
              padding: 18,
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              background: "#fafbfc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Cloud size={20} color="#0078d4" />
                <strong style={{ fontSize: 15 }}>Microsoft Azure Cloud</strong>
              </div>
              <span className="badge success">
                <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                Connected
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Target provider for containerized application deployments and App Service hosting.
            </p>
            <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <div><strong>Subscription:</strong> <code>orchestrix-demo-sub-01 (Azure Cloud Provider)</code></div>
              <div><strong>Target Resource Groups:</strong> <code>rg-orchestrix-[environment]</code></div>
              <div><strong>Default Region:</strong> East US / East US 2 (High Availability Slot Pair)</div>
              <div><strong>App Service Plan:</strong> Standard S1 (Linux Container Runtime)</div>
            </div>
          </div>

          {/* JFrog Artifactory Connector */}
          <div
            style={{
              padding: 18,
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              background: "#fafbfc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Package size={20} color="#40be46" />
                <strong style={{ fontSize: 15 }}>JFrog Artifactory</strong>
              </div>
              <span className="badge success">
                <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                Connected
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px" }}>
              Enterprise artifact repository management for generated JAR, WAR, and EAR archives.
            </p>
            <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <div><strong>Target Repo:</strong> <code>libs-release-local</code></div>
              <div><strong>Registry URL:</strong> <code>https://jfrog.orchestrix.io/artifactory</code></div>
              <div><strong>Integrity Verification:</strong> SHA-256 Checksum Validation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
