import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LaunchPipeline from "./pages/LaunchPipeline";
import Pipelines from "./pages/Pipelines";
import Executions from "./pages/Executions";
import Execution from "./pages/Execution";
import Settings from "./pages/Settings";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { isAuthenticated } from "./services/auth";

function RootRedirect() {
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Application Routes (Requires Login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<LaunchPipeline />} />
            <Route path="/launch-pipeline" element={<LaunchPipeline />} />
            <Route path="/pipelines" element={<Pipelines />} />
            <Route path="/executions" element={<Executions />} />
            <Route path="/execution/:executionId" element={<Execution />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
