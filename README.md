# 🚀 ORCHESTRIX — Enterprise CI/CD Pipeline Orchestrator

**Orchestrix** is an enterprise-grade CI/CD Pipeline Orchestration Platform built with **React.js** and **Java Spring Boot**. It provides developers and DevOps teams with a single pane of glass to configure, trigger, monitor, and deploy software releases across multi-cloud environments—without manual intervention and without requiring a traditional relational database.

---

## 🎯 Key Capabilities

- **Progressive Dynamic Configuration Wizard:** Replaces cluttered forms with a 5-step guided wizard:
  1. `Component Selection` (Core Platform, API Services, Payment Gateway, Auth Hub)
  2. `Subcomponent Selection` (Dynamically fetched based on selected component)
  3. `Git Branch Selection` (Preset chips + custom branch/tag input)
  4. `Target Environment` (Development, Staging, Production with Azure region indicator)
  5. `Pipeline Review & Confirmation` (Full configuration manifest preview before launch)
- **Asynchronous 7-Stage Pipeline Engine:**
  1. `Validate Configuration` (Parameter ACLs, branch integrity, env verification)
  2. `Checkout Source` (Git repository checkout, commit SHA resolution)
  3. `Build` (Maven clean compile, dependency resolution)
  4. `Test` (Automated unit & integration test suites, code coverage check)
  5. `Package` (Generates deployable `JAR`, `WAR`, or `EAR` artifact with SHA-256 checksum)
  6. `Publish Artifact` (Publishes to JFrog Artifactory repository: `libs-release-local`)
  7. `Azure Cloud Deployment` (Provisions target Azure Resource Group, deploys to Azure App Service, executes automated health probe)
- **Real-Time Terminal Console:** Embedded terminal stream displaying live execution logs with timestamps, log levels (`INFO`, `WARN`, `SUCCESS`, `ERROR`), auto-scroll, and one-click copy.
- **Zero-Database (In-Memory Stateless Storage):** High-speed, thread-safe state machine utilizing Java `ConcurrentHashMap` structures. Zero configuration overhead on target servers, sub-millisecond read latency, and decoupled from traditional DBMS schemas.
- **Polished DevOps UI:** High-contrast inputs, glowing status indicators, Lucide iconography, animated progress bars, and dedicated views for Artifact metadata and Azure deployment health.

---

## 🏗️ Architecture

```
                    ORCHESTRIX PLATFORM
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
     React Frontend                   Spring Boot Backend
   (Vite + React Router)             (Java 17 / In-Memory)
            │                                 │
     Progressive Wizard             POST /api/pipelines
   [Comp → Sub → Branch → Env]                │
            │                                 ▼
      Review Manifest                Pipeline Orchestrator
            │                      (Async CompletableFuture)
            ▼                                 │
     Execution View ◄── 1s Polling ───────────┤
   - 7-Stage Visual Graph                     ├── 1. Validate Configuration
   - Real-Time Terminal                       ├── 2. Git Checkout Source
   - JFrog Artifact Card                      ├── 3. Maven Build Step
   - Azure Cloud Status                       ├── 4. Automated Tests
                                              ├── 5. Package (JAR/WAR/EAR)
                                              ├── 6. JFrog Artifactory
                                              └── 7. Azure Cloud Deploy
```

---

## ⚡ Quick Start (Run in 1 Click)

### Option 1: Automatic Launcher
Double-click `start-orchestrix.bat` in the project root:
```cmd
start-orchestrix.bat
```
This automatically starts both the backend (Port 8080) and frontend (Port 5173), and opens your browser.

### Option 2: Manual Start

#### 1. Backend (Spring Boot):
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
*Backend runs at:* `http://localhost:8080/api/pipelines`

#### 2. Frontend (React + Vite):
```bash
cd frontend
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🔐 Demo Credentials

When opening `http://localhost:5173/login`:
- **Username:** `developer` (or click "Lead Engineer" chip)
- **Password:** `orchestrix2026`
- **Admin Option:** `admin` / `admin123`

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/components` | `GET` | List available application components |
| `/api/components/{id}/subcomponents` | `GET` | Get dynamic subcomponents for component |
| `/api/pipelines` | `POST` | Trigger asynchronous pipeline execution |
| `/api/pipelines` | `GET` | List all executions (newest first) |
| `/api/pipelines/{id}` | `GET` | Get execution status, 7 stages, artifact & Azure info |
| `/api/pipelines/{id}/logs` | `GET` | Get real-time terminal logs stream |
| `/api/pipelines/status/overview` | `GET` | Get platform health, JFrog, Azure & DB status |
| `/api/auth/login` | `POST` | Authenticate user session |

---

## 💡 Evaluator Presentation Talking Points

1. **Why No Database?**
   > *"Enterprise runners like GitHub Actions and GitLab Runners do not store live step execution telemetry in a heavy relational database. Orchestrix utilizes a high-concurrency, in-memory state machine using `ConcurrentHashMap`. This eliminates DB latency, ensures zero external infrastructure dependency, and allows immediate deployment on any server."*

2. **How does Asynchronous Execution work?**
   > *"When the user triggers a pipeline, the backend accepts the payload, generates a UUID, and immediately returns a `201 Created` with status `RUNNING`. A background worker thread executes each of the 7 stages asynchronously with realistic telemetry, streaming timestamped logs to the terminal while the React frontend polls the state in real-time."*

3. **Where is Azure Cloud involved?**
   > *"In Step 7, Orchestrix communicates with Microsoft Azure Cloud, allocating the target Resource Group (`rg-orchestrix-[env]`), deploying the packaged artifact to Azure App Service, and validating the live `/actuator/health` endpoint."*
